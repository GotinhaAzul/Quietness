use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::{Mutex, OnceLock};
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri::Manager;

#[derive(Debug, Clone, Serialize)]
pub struct NoteEntry {
    pub name: String,
    pub path: String,
}

#[derive(Debug, Serialize)]
pub struct FolderEntry {
    pub name: String,
    pub path: String,
}

pub fn notes_dir(app_handle: &AppHandle) -> PathBuf {
    let dir = app_handle
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join("notes");
    if !dir.exists() {
        let _ = fs::create_dir_all(&dir);
    }
    dir
}

pub fn get_notes_dir(app_handle: &AppHandle) -> PathBuf {
    notes_dir(app_handle)
}

pub fn list_notes(app_handle: &AppHandle) -> Vec<NoteEntry> {
    let dir = notes_dir(app_handle);
    let mut notes = Vec::new();
    list_notes_recursive(&dir, &mut notes);
    notes.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    notes
}

fn list_notes_recursive(dir: &PathBuf, notes: &mut Vec<NoteEntry>) {
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                list_notes_recursive(&path, notes);
            } else if path.extension().map_or(false, |ext| ext == "md") {
                notes.push(NoteEntry {
                    name: path
                        .file_stem()
                        .unwrap_or_default()
                        .to_string_lossy()
                        .to_string(),
                    path: path.to_string_lossy().to_string(),
                });
            }
        }
    }
}

fn resolve_canonical(path: &std::path::Path) -> std::path::PathBuf {
    match std::fs::canonicalize(path) {
        Ok(p) => p,
        Err(_) => {
            if let Some(parent) = path.parent() {
                let mut resolved = resolve_canonical(parent);
                if let Some(name) = path.file_name() {
                    resolved.push(name);
                }
                resolved
            } else {
                path.to_path_buf()
            }
        }
    }
}

pub fn is_safe_path(app_handle: &AppHandle, path: &str) -> bool {
    let base = notes_dir(app_handle);
    let target = std::path::Path::new(path);

    let abs_target = if target.is_absolute() {
        target.to_path_buf()
    } else {
        base.join(target)
    };

    let canon_base = std::fs::canonicalize(&base).unwrap_or_else(|_| base.clone());
    let canon_target = resolve_canonical(&abs_target);

    canon_target.starts_with(&canon_base)
}

pub fn delete_note(app_handle: &AppHandle, path: &str) -> Result<(), String> {
    if !is_safe_path(app_handle, path) {
        return Err("Access denied: path traversal detected".to_string());
    }
    fs::remove_file(path).map_err(|e| e.to_string())?;
    invalidate_cache();
    Ok(())
}

pub fn read_note(app_handle: &AppHandle, path: &str) -> Result<String, String> {
    if !is_safe_path(app_handle, path) {
        return Err("Access denied: path traversal detected".to_string());
    }
    fs::read_to_string(path).map_err(|e| e.to_string())
}

pub fn write_note(app_handle: &AppHandle, path: &str, content: &str) -> Result<(), String> {
    if !is_safe_path(app_handle, path) {
        return Err("Access denied: path traversal detected".to_string());
    }
    let p = PathBuf::from(path);
    if let Some(parent) = p.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }
    fs::write(path, content).map_err(|e| e.to_string())?;
    invalidate_cache();
    Ok(())
}

pub fn list_folders(app_handle: &AppHandle) -> Vec<FolderEntry> {
    let dir = notes_dir(app_handle);
    let mut folders = Vec::new();
    list_folders_recursive(&dir, &dir, &mut folders);
    folders.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    folders
}

fn list_folders_recursive(base: &PathBuf, current: &PathBuf, folders: &mut Vec<FolderEntry>) {
    if let Ok(entries) = fs::read_dir(current) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let name = path
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string();
                if name.starts_with('_') {
                    continue;
                }
                let relative = path
                    .strip_prefix(base)
                    .unwrap_or(&path)
                    .to_string_lossy()
                    .to_string();
                folders.push(FolderEntry {
                    name,
                    path: relative,
                });
                list_folders_recursive(base, &path, folders);
            }
        }
    }
}

static ENTRY_CACHE: OnceLock<Mutex<HashMap<String, NoteEntry>>> = OnceLock::new();

fn entry_cache() -> &'static Mutex<HashMap<String, NoteEntry>> {
    ENTRY_CACHE.get_or_init(|| Mutex::new(HashMap::new()))
}

fn ensure_cache(app_handle: &AppHandle) {
    let mut cache = entry_cache().lock().unwrap();
    if cache.is_empty() {
        let notes = list_notes(app_handle);
        for note in notes {
            cache.insert(note.path.clone(), note);
        }
    }
}

pub fn invalidate_cache() {
    if let Some(cache) = ENTRY_CACHE.get() {
        if let Ok(mut c) = cache.lock() {
            c.clear();
        }
    }
}

pub async fn search_notes(
    app_handle: &AppHandle,
    query: &str,
    scope: &str,
    scope_path: Option<&str>,
) -> Vec<NoteEntry> {
    let query_lower = query.to_lowercase();

    match scope {
        "current_note" => {
            let path = match scope_path {
                Some(p) => p,
                None => return Vec::new(),
            };
            if !is_safe_path(app_handle, path) {
                return Vec::new();
            }
            let path_owned = path.to_string();
            let query_owned = query.to_string();
            let result = tauri::async_runtime::spawn_blocking(move || {
                if let Ok(content) = fs::read_to_string(&path_owned) {
                    if content.to_lowercase().contains(&query_owned.to_lowercase()) {
                        let path_buf = PathBuf::from(&path_owned);
                        let name = path_buf
                            .file_stem()
                            .unwrap_or_default()
                            .to_string_lossy()
                            .to_string();
                        return Some(NoteEntry { name, path: path_owned });
                    }
                }
                None
            })
            .await
            .unwrap_or(None);
            result.into_iter().collect()
        }
        "current_folder" => {
            let folder_path = scope_path.unwrap_or("");
            let base = notes_dir(app_handle);
            let dir = if folder_path.is_empty() {
                base.clone()
            } else {
                base.join(folder_path)
            };
            let dir_owned = dir.to_string_lossy().to_string();
            let query_owned = query.to_string();

            tauri::async_runtime::spawn_blocking(move || {
                let mut results = Vec::new();
                let query_lower = query_owned.to_lowercase();
                let dir_path = PathBuf::from(&dir_owned);

                if let Ok(entries) = fs::read_dir(&dir_path) {
                    for entry in entries.flatten() {
                        let path = entry.path();
                        if path.is_file() && path.extension().map_or(false, |ext| ext == "md")
                        {
                            let name = path
                                .file_stem()
                                .unwrap_or_default()
                                .to_string_lossy()
                                .to_string();
                            let path_str = path.to_string_lossy().to_string();

                            if name.to_lowercase().contains(&query_lower) {
                                results.push(NoteEntry {
                                    name,
                                    path: path_str,
                                });
                                continue;
                            }

                            if let Ok(content) = fs::read_to_string(&path) {
                                if content.to_lowercase().contains(&query_lower) {
                                    results.push(NoteEntry {
                                        name,
                                        path: path_str,
                                    });
                                }
                            }
                        }
                    }
                }

                results.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
                results
            })
            .await
            .unwrap_or_default()
        }
        _ => {
            ensure_cache(app_handle);
            let query_owned = query.to_string();

            let entries: Vec<NoteEntry> = {
                let cache = entry_cache().lock().unwrap();
                cache.values().cloned().collect()
            };

            let mut results: Vec<NoteEntry> = entries
                .iter()
                .filter(|e| e.name.to_lowercase().contains(&query_lower))
                .cloned()
                .collect();

            let candidates: Vec<NoteEntry> = entries
                .into_iter()
                .filter(|e| !e.name.to_lowercase().contains(&query_lower))
                .collect();

            if !candidates.is_empty() {
                let content_matches = tauri::async_runtime::spawn_blocking(move || {
                    candidates
                        .into_iter()
                        .filter(|e| {
                            fs::read_to_string(&e.path).ok().map_or(false, |c| {
                                c.to_lowercase().contains(&query_owned.to_lowercase())
                            })
                        })
                        .collect::<Vec<NoteEntry>>()
                })
                .await
                .unwrap_or_default();
                results.extend(content_matches);
            }

            results.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
            results
        }
    }
}

pub fn list_notes_in_folder(app_handle: &AppHandle, folder_path: &str) -> Vec<NoteEntry> {
    let base = notes_dir(app_handle);
    let dir = if folder_path.is_empty() {
        base.clone()
    } else {
        base.join(folder_path)
    };
    let mut notes = Vec::new();
    if let Ok(entries) = fs::read_dir(&dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() && path.extension().map_or(false, |ext| ext == "md") {
                notes.push(NoteEntry {
                    name: path
                        .file_stem()
                        .unwrap_or_default()
                        .to_string_lossy()
                        .to_string(),
                    path: path.to_string_lossy().to_string(),
                });
            }
        }
    }
    notes.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    notes
}

// ── Rename note ──

pub fn rename_note(app_handle: &AppHandle, old_path: &str, new_name: &str) -> Result<(), String> {
    if !is_safe_path(app_handle, old_path) {
        return Err("Access denied: path traversal detected".to_string());
    }

    if new_name.is_empty()
        || new_name.contains('/')
        || new_name.contains('\\')
        || new_name.contains("..")
    {
        return Err("Invalid note name".to_string());
    }

    let new_filename = if new_name.ends_with(".md") {
        new_name.to_string()
    } else {
        format!("{}.md", new_name)
    };

    let old_path_buf = PathBuf::from(old_path);
    let empty = PathBuf::from("");
    let parent = old_path_buf.parent().unwrap_or(&empty);
    let new_path = parent.join(&new_filename);

    let new_path_str = new_path.to_string_lossy().to_string();
    if !is_safe_path(app_handle, &new_path_str) {
        return Err("Access denied: path traversal detected".to_string());
    }

    if new_path != old_path_buf {
        if new_path.exists() {
            let is_same = old_path_buf
                .canonicalize()
                .ok()
                .and_then(|o| new_path.canonicalize().ok().map(|n| o == n))
                .unwrap_or(false);
            if !is_same {
                return Err("A note with that name already exists".to_string());
            }
        }
    }

    fs::rename(old_path, &new_path).map_err(|e| e.to_string())?;
    invalidate_cache();
    Ok(())
}

// ── User themes ──

#[derive(Debug, Serialize)]
pub struct UserThemeEntry {
    pub id: String,
    pub name: String,
}

fn user_themes_dir(app_handle: &AppHandle) -> PathBuf {
    let dir = notes_dir(app_handle).join("_themes");
    if !dir.exists() {
        let _ = fs::create_dir_all(&dir);
    }
    dir
}

pub fn list_user_themes(app_handle: &AppHandle) -> Vec<UserThemeEntry> {
    let dir = user_themes_dir(app_handle);
    let mut themes = Vec::new();
    if let Ok(entries) = fs::read_dir(&dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() && path.extension().map_or(false, |ext| ext == "css") {
                let stem = path.file_stem().unwrap_or_default().to_string_lossy().to_string();
                themes.push(UserThemeEntry {
                    id: format!("user-{}", stem),
                    name: stem.replace('-', " ").replace('_', " "),
                });
            }
        }
    }
    themes.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    themes
}

pub fn read_user_theme_css(app_handle: &AppHandle, id: &str) -> Result<String, String> {
    let dir = user_themes_dir(app_handle);
    let name = id.strip_prefix("user-").unwrap_or(id);
    let path = dir.join(format!("{}.css", name));
    let canon_dir = std::fs::canonicalize(&dir).unwrap_or_else(|_| dir.clone());
    let canon_path = resolve_canonical(&path);
    if !canon_path.starts_with(&canon_dir) {
        return Err("Access denied".to_string());
    }
    fs::read_to_string(path).map_err(|e| e.to_string())
}

// ── Settings ──

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FontSettings {
    pub ui: String,
    pub editor: String,
    pub preview: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SizeSettings {
    pub ui: u32,
    pub editor: u32,
    pub preview: u32,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EditorSettings {
    pub line_numbers: bool,
    pub word_wrap: bool,
    pub tab_size: u32,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub theme: String,
    pub fonts: FontSettings,
    pub sizes: SizeSettings,
    pub editor: EditorSettings,
}

fn settings_path(app_handle: &AppHandle) -> PathBuf {
    notes_dir(app_handle).join("settings.json")
}

fn default_settings() -> Settings {
    Settings {
        theme: "quiet".to_string(),
        fonts: FontSettings {
            ui: "Inter".to_string(),
            editor: "JetBrains Mono".to_string(),
            preview: "Inter".to_string(),
        },
        sizes: SizeSettings {
            ui: 14,
            editor: 14,
            preview: 16,
        },
        editor: EditorSettings {
            line_numbers: true,
            word_wrap: false,
            tab_size: 4,
        },
    }
}

pub fn load_settings(app_handle: &AppHandle) -> Settings {
    let path = settings_path(app_handle);
    if path.exists() {
        fs::read_to_string(&path)
            .ok()
            .and_then(|content| serde_json::from_str(&content).ok())
            .unwrap_or_else(default_settings)
    } else {
        default_settings()
    }
}

pub fn save_settings(app_handle: &AppHandle, settings: &Settings) -> Result<(), String> {
    let path = settings_path(app_handle);
    let json = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    fs::write(&path, &json).map_err(|e| e.to_string())
}
