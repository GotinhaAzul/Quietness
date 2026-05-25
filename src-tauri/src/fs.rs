use std::fs;
use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri::Manager;
use log;

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

#[derive(Debug, Serialize)]
pub struct HomeFolderStatus {
    pub configured_path: String,
    pub effective_path: String,
    pub is_fallback: bool,
}

// ── Home folder config ──

fn quietness_config_path(app_handle: &AppHandle) -> PathBuf {
    app_handle
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join("quietness_config.json")
}

fn load_home_folder(app_handle: &AppHandle) -> Option<String> {
    let path = quietness_config_path(app_handle);
    fs::read_to_string(path).ok().and_then(|content| {
        serde_json::from_str::<serde_json::Value>(&content)
            .ok()
            .and_then(|v| v.get("homeFolder")?.as_str().map(String::from))
    })
}

fn save_home_folder(app_handle: &AppHandle, path: &str) -> Result<(), String> {
    let config_path = quietness_config_path(app_handle);
    if let Some(parent) = config_path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let config = serde_json::json!({ "homeFolder": path });
    let json = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    fs::write(&config_path, &json).map_err(|e| e.to_string())
}

pub fn set_home_folder(app_handle: &AppHandle, path: &str) -> Result<(), String> {
    if path.is_empty() {
        return Err("Home folder path cannot be empty".to_string());
    }
    let p = PathBuf::from(path);
    if !p.is_absolute() {
        return Err("Home folder path must be an absolute path".to_string());
    }
    // Reject root directories (e.g., C:\ or /)
    if p.file_name().is_none() {
        return Err("Home folder cannot be a root directory".to_string());
    }
    let trimmed = p.to_string_lossy().trim_end_matches('\\').trim_end_matches('/').to_string();
    if trimmed.len() <= 3 && trimmed.ends_with(':') && !trimmed.contains('\\') && !trimmed.contains('/') {
        return Err("Home folder cannot be a bare drive letter (e.g. C:)".to_string());
    }
    if p.exists() && !p.is_dir() {
        return Err("Path exists but is not a directory".to_string());
    }
    fs::create_dir_all(&p).map_err(|e| format!("Cannot access home folder: {}", e))?;
    // Verify write access
    let test_file = p.join(".quietness_write_test");
    fs::write(&test_file, "").map_err(|_| "Home folder is not writable".to_string())?;
    let _ = fs::remove_file(&test_file);
    save_home_folder(app_handle, path)
}

pub fn reset_home_folder(app_handle: &AppHandle) -> Result<(), String> {
    let config_path = quietness_config_path(app_handle);
    if config_path.exists() {
        fs::remove_file(&config_path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub fn get_home_folder(app_handle: &AppHandle) -> String {
    load_home_folder(app_handle).unwrap_or_default()
}

pub fn get_home_folder_status(app_handle: &AppHandle) -> HomeFolderStatus {
    let configured = load_home_folder(app_handle).unwrap_or_default();
    let effective = notes_dir(app_handle).to_string_lossy().to_string();
    let is_fallback = if configured.is_empty() {
        false
    } else {
        let cp = PathBuf::from(&configured);
        !cp.is_dir()
    };
    HomeFolderStatus {
        configured_path: configured,
        effective_path: effective,
        is_fallback,
    }
}

pub fn notes_dir(app_handle: &AppHandle) -> PathBuf {
    if let Some(home) = load_home_folder(app_handle) {
        let dir = PathBuf::from(home);
        if !dir.exists() || dir.is_dir() {
            if fs::create_dir_all(&dir).is_ok() && dir.is_dir() {
                return dir;
            }
        }
        log::warn!(
            "Configured home folder '{:?}' is invalid; falling back to default",
            dir
        );
    }
    let dir = app_handle
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join("notes");
    let _ = fs::create_dir_all(&dir);
    dir
}

pub fn get_notes_dir(app_handle: &AppHandle) -> PathBuf {
    notes_dir(app_handle)
}

pub fn list_notes(app_handle: &AppHandle) -> Vec<NoteEntry> {
    let dir = notes_dir(app_handle);
    let mut notes = Vec::new();
    list_notes_recursive(&dir, &mut notes);
    notes.sort_by_cached_key(|a| a.name.to_lowercase());
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

fn resolve_path_under_base(base: &Path, path: &str) -> Result<PathBuf, String> {
    let target = Path::new(path);
    let abs_target = if target.is_absolute() {
        target.to_path_buf()
    } else {
        base.join(target)
    };

    let canon_base = resolve_canonical(base);
    let canon_target = resolve_canonical(&abs_target);

    if canon_target.starts_with(&canon_base) {
        Ok(abs_target)
    } else {
        Err("Access denied: path traversal detected".to_string())
    }
}

fn resolve_notes_path(app_handle: &AppHandle, path: &str) -> Result<PathBuf, String> {
    resolve_path_under_base(&notes_dir(app_handle), path)
}

pub fn delete_note(app_handle: &AppHandle, path: &str) -> Result<(), String> {
    let resolved = resolve_notes_path(app_handle, path)?;
    fs::remove_file(resolved).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn read_note(app_handle: &AppHandle, path: &str) -> Result<String, String> {
    let resolved = resolve_notes_path(app_handle, path)?;
    fs::read_to_string(resolved).map_err(|e| e.to_string())
}

pub fn write_note(app_handle: &AppHandle, path: &str, content: &str) -> Result<(), String> {
    let resolved = resolve_notes_path(app_handle, path)?;
    if let Some(parent) = resolved.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(resolved, content).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn create_folder(app_handle: &AppHandle, path: &str) -> Result<(), String> {
    if path.is_empty() {
        return Err("Folder name cannot be empty".to_string());
    }
    if path.contains("..") || path.starts_with('/') || path.starts_with('\\') {
        return Err("Invalid folder name".to_string());
    }
    for component in path.replace('\\', "/").split('/') {
        if component.starts_with('_') {
            return Err("Folder name cannot start with '_'".to_string());
        }
    }
    let full_path = resolve_notes_path(app_handle, path)?;
    if full_path.is_file() {
        return Err("A file with that name already exists".to_string());
    }
    fs::create_dir_all(&full_path).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn delete_folder(app_handle: &AppHandle, path: &str) -> Result<(), String> {
    if path.is_empty() {
        return Err("Folder path cannot be empty".to_string());
    }
    if path.contains("..") || path.starts_with('/') || path.starts_with('\\') {
        return Err("Invalid folder path".to_string());
    }
    let full_path = resolve_notes_path(app_handle, path)?;
    if !full_path.exists() {
        return Err("Folder not found".to_string());
    }
    if !full_path.is_dir() {
        return Err("Path is not a directory".to_string());
    }
    fs::remove_dir_all(&full_path).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn list_folders(app_handle: &AppHandle) -> Vec<FolderEntry> {
    let dir = notes_dir(app_handle);
    let mut folders = Vec::new();
    list_folders_recursive(&dir, &dir, &mut folders);
    folders.sort_by_cached_key(|a| a.name.to_lowercase());
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
                if name.starts_with('_') || name == ".trash" {
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
            let path_owned = match resolve_notes_path(app_handle, path) {
                Ok(p) => p.to_string_lossy().to_string(),
                Err(_) => return Vec::new(),
            };
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
                match resolve_path_under_base(&base, folder_path) {
                    Ok(path) => path,
                    Err(_) => return Vec::new(),
                }
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

                results.sort_by_cached_key(|a| a.name.to_lowercase());
                results
            })
            .await
            .unwrap_or_default()
        }
        _ => {
            let query_owned = query.to_string();
            let entries = list_notes(app_handle);

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

            results.sort_by_cached_key(|a| a.name.to_lowercase());
            results
        }
    }
}

pub fn list_notes_in_folder(app_handle: &AppHandle, folder_path: &str) -> Vec<NoteEntry> {
    let base = notes_dir(app_handle);
    let dir = if folder_path.is_empty() {
        base.clone()
    } else {
        match resolve_path_under_base(&base, folder_path) {
            Ok(path) => path,
            Err(_) => return Vec::new(),
        }
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
    notes.sort_by_cached_key(|a| a.name.to_lowercase());
    notes
}

// ── Rename note ──

pub fn rename_note(app_handle: &AppHandle, old_path: &str, new_name: &str) -> Result<(), String> {
    let old_path_buf = resolve_notes_path(app_handle, old_path)?;

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

    let empty = PathBuf::from("");
    let parent = old_path_buf.parent().unwrap_or(&empty);
    let new_path = parent.join(&new_filename);

    let new_path_str = new_path.to_string_lossy().to_string();
    resolve_notes_path(app_handle, &new_path_str)?;

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

    fs::rename(&old_path_buf, &new_path).map_err(|e| e.to_string())?;
    Ok(())
}

// ── Rename folder ──

pub fn rename_folder(app_handle: &AppHandle, old_path: &str, new_name: &str) -> Result<(), String> {
    if old_path.is_empty() {
        return Err("Folder path cannot be empty".to_string());
    }
    let old_full = resolve_notes_path(app_handle, old_path)?;

    if new_name.is_empty() {
        return Err("Folder name cannot be empty".to_string());
    }
    if new_name.contains('/') || new_name.contains('\\') || new_name.contains("..") {
        return Err("Invalid folder name".to_string());
    }
    if new_name.starts_with('_') {
        return Err("Folder name cannot start with '_'".to_string());
    }

    let empty = PathBuf::from("");
    let parent = old_full.parent().unwrap_or(&empty);
    let new_full = parent.join(new_name);

    let new_full_str = new_full.to_string_lossy().to_string();
    resolve_notes_path(app_handle, &new_full_str)?;

    if !old_full.exists() {
        return Err("Folder not found".to_string());
    }
    if !old_full.is_dir() {
        return Err("Path is not a directory".to_string());
    }

    if new_full != old_full {
        if new_full.exists() {
            return Err("A folder with that name already exists".to_string());
        }
    }

    fs::rename(&old_full, &new_full).map_err(|e| e.to_string())?;
    Ok(())
}

// ── Move note ──

pub fn move_note(app_handle: &AppHandle, path: &str, dest_folder: &str) -> Result<String, String> {
    let old_path = resolve_notes_path(app_handle, path)?;

    if !dest_folder.is_empty()
        && (dest_folder.contains("..") || dest_folder.starts_with('/') || dest_folder.starts_with('\\'))
    {
        return Err("Invalid destination folder".to_string());
    }

    if !old_path.exists() {
        return Err("Note not found".to_string());
    }
    if !old_path.is_file() {
        return Err("Path is not a file".to_string());
    }

    let filename = old_path
        .file_name()
        .ok_or_else(|| "Invalid path".to_string())?
        .to_string_lossy()
        .to_string();

    let base = notes_dir(app_handle);
    let dest_dir = if dest_folder.is_empty() {
        base
    } else {
        let d = resolve_path_under_base(&base, dest_folder)?;
        if !d.is_dir() {
            return Err("Destination folder not found".to_string());
        }
        d
    };

    let new_path = dest_dir.join(&filename);
    let new_path_str = new_path.to_string_lossy().to_string();

    resolve_notes_path(app_handle, &new_path_str)?;

    if new_path != old_path {
        if new_path.exists() {
            return Err("A note with that name already exists in the destination".to_string());
        }
    }

    fs::rename(&old_path, &new_path).map_err(|e| e.to_string())?;
    Ok(new_path_str)
}

// ── Move folder ──

pub fn move_folder(app_handle: &AppHandle, path: &str, dest_folder: &str) -> Result<String, String> {
    if path.is_empty() {
        return Err("Folder path cannot be empty".to_string());
    }
    if path.contains("..") || path.starts_with('/') || path.starts_with('\\') {
        return Err("Invalid folder path".to_string());
    }
    let base = notes_dir(app_handle);
    let old_full = resolve_path_under_base(&base, path)?;

    if !dest_folder.is_empty()
        && (dest_folder.contains("..") || dest_folder.starts_with('/') || dest_folder.starts_with('\\'))
    {
        return Err("Invalid destination folder".to_string());
    }

    if !old_full.exists() {
        return Err("Folder not found".to_string());
    }
    if !old_full.is_dir() {
        return Err("Path is not a directory".to_string());
    }

    let folder_name = old_full
        .file_name()
        .ok_or_else(|| "Invalid path".to_string())?
        .to_string_lossy()
        .to_string();

    let dest_dir = if dest_folder.is_empty() {
        base.clone()
    } else {
        let d = resolve_path_under_base(&base, dest_folder)?;
        if !d.is_dir() {
            return Err("Destination folder not found".to_string());
        }
        d
    };

    let new_full = dest_dir.join(&folder_name);
    let new_full_str = new_full.to_string_lossy().to_string();

    resolve_notes_path(app_handle, &new_full_str)?;

    // Prevent moving folder into itself or a subdirectory
    let canon_source = resolve_canonical(&old_full);
    let canon_dest = resolve_canonical(&new_full);
    if canon_dest.starts_with(&canon_source) {
        return Err("Cannot move a folder into itself or a subdirectory of itself".to_string());
    }

    if new_full != old_full {
        if new_full.exists() {
            return Err("A folder with that name already exists in the destination".to_string());
        }
    }

    fs::rename(&old_full, &new_full).map_err(|e| e.to_string())?;
    Ok(new_full_str)
}

// ── User themes ──

#[derive(Debug, Serialize)]
pub struct UserThemeEntry {
    pub id: String,
    pub name: String,
}

fn user_themes_dir(app_handle: &AppHandle) -> PathBuf {
    let dir = notes_dir(app_handle).join("_themes");
    let _ = fs::create_dir_all(&dir);
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
    themes.sort_by_cached_key(|a| a.name.to_lowercase());
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
pub struct PetColorPalette {
    pub core: String,
    pub inner: String,
    pub mid: String,
    pub outer: String,
    pub ember: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PetSettings {
    pub big_flame_enabled: bool,
    pub small_particle_enabled: bool,
    pub colors: PetColorPalette,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub theme: String,
    pub fonts: FontSettings,
    pub sizes: SizeSettings,
    pub editor: EditorSettings,
    pub pet: PetSettings,
    #[serde(rename = "trashRetentionDays")]
    pub trash_retention_days: u64,
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
        pet: PetSettings {
            big_flame_enabled: true,
            small_particle_enabled: true,
            colors: PetColorPalette {
                core: "#ffffff".to_string(),
                inner: "#c98aff".to_string(),
                mid: "#912eff".to_string(),
                outer: "#5a00c2".to_string(),
                ember: "#5a00c2".to_string(),
            },
        },
        trash_retention_days: 30,
    }
}

pub fn load_settings(app_handle: &AppHandle) -> Settings {
    let path = settings_path(app_handle);
    fs::read_to_string(&path)
        .ok()
        .and_then(|content| serde_json::from_str(&content).ok())
        .unwrap_or_else(default_settings)
}

pub fn save_settings(app_handle: &AppHandle, settings: &Settings) -> Result<(), String> {
    let path = settings_path(app_handle);
    let json = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    fs::write(&path, &json).map_err(|e| e.to_string())
}

// ── Migration ──

pub fn count_md_files(path: &str) -> u32 {
    let dir = PathBuf::from(path);
    if !dir.is_dir() {
        return 0;
    }
    let mut count = 0;
    if let Ok(entries) = fs::read_dir(&dir) {
        for entry in entries.flatten() {
            let p = entry.path();
            if p.is_dir() {
                count += count_md_files(&p.to_string_lossy());
            } else if p.extension().map_or(false, |ext| ext == "md") {
                count += 1;
            }
        }
    }
    count
}

pub fn migrate_content(from: &str, to: &str) -> Result<u32, String> {
    let from_path = PathBuf::from(from);
    let to_path = PathBuf::from(to);

    if !from_path.exists() {
        return Err("Source directory does not exist".to_string());
    }
    if !from_path.is_dir() {
        return Err("Source is not a directory".to_string());
    }

    if !to_path.exists() {
        fs::create_dir_all(&to_path).map_err(|e| format!("Cannot create destination: {}", e))?;
    }
    if !to_path.is_dir() {
        return Err("Destination is not a directory".to_string());
    }

    let canon_from = resolve_canonical(&from_path);
    let canon_to = resolve_canonical(&to_path);

    if canon_from == canon_to {
        return Err("Source and destination are the same directory".to_string());
    }

    if canon_to.starts_with(&canon_from) || canon_from.starts_with(&canon_to) {
        return Err("Source and destination cannot be nested".to_string());
    }

    let mut count = 0u32;
    migrate_dir(&from_path, &to_path, &mut count)?;
    Ok(count)
}

fn migrate_dir(from: &Path, to: &Path, count: &mut u32) -> Result<(), String> {
    if let Ok(entries) = fs::read_dir(from) {
        for entry in entries.flatten() {
            let path = entry.path();
            let filename = path.file_name().unwrap_or_default();
            let dest = to.join(filename);

            if path.is_dir() {
                fs::create_dir_all(&dest).map_err(|e| e.to_string())?;
                migrate_dir(&path, &dest, count)?;
            } else if path.extension().map_or(false, |ext| ext == "md") {
                if dest.exists() {
                    let stem = path
                        .file_stem()
                        .unwrap_or_default()
                        .to_string_lossy()
                        .to_string();
                    let mut counter = 1;
                    loop {
                        let alt = to.join(format!("{}-copy({}).md", stem, counter));
                        if !alt.exists() {
                            fs::copy(&path, &alt).map_err(|e| e.to_string())?;
                            break;
                        }
                        counter += 1;
                    }
                } else {
                    fs::copy(&path, &dest).map_err(|e| e.to_string())?;
                }
                *count += 1;
            }
        }
    }
    Ok(())
}

// ── Trash / Lixeira ──

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrashEntry {
    pub original_name: String,
    pub original_path: String,
    pub trashed_at: String,
    pub is_folder: bool,
    pub trash_name: String,
}

fn trash_timestamp() -> String {
    chrono::Local::now().format("%Y-%m-%dT%H%M%S").to_string()
}

fn trash_dir(app_handle: &AppHandle) -> PathBuf {
    notes_dir(app_handle).join(".trash")
}

fn trash_meta_path(app_handle: &AppHandle) -> PathBuf {
    trash_dir(app_handle).join("meta.json")
}

fn load_trash_meta(app_handle: &AppHandle) -> Vec<TrashEntry> {
    let path = trash_meta_path(app_handle);
    if !path.exists() {
        return Vec::new();
    }
    fs::read_to_string(&path)
        .ok()
        .and_then(|content| serde_json::from_str(&content).ok())
        .unwrap_or_default()
}

fn save_trash_meta(app_handle: &AppHandle, entries: &[TrashEntry]) -> Result<(), String> {
    let dir = trash_dir(app_handle);
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let json = serde_json::to_string_pretty(entries).map_err(|e| e.to_string())?;
    fs::write(trash_meta_path(app_handle), &json).map_err(|e| e.to_string())
}

pub fn trash_note(app_handle: &AppHandle, path: &str) -> Result<(), String> {
    let resolved = resolve_notes_path(app_handle, path)?;
    if !resolved.exists() {
        return Err("Note not found".to_string());
    }
    if !resolved.is_file() {
        return Err("Path is not a file".to_string());
    }

    let notes_base = notes_dir(app_handle);
    let original_path = resolved
        .strip_prefix(&notes_base)
        .unwrap_or(&resolved)
        .to_string_lossy()
        .to_string()
        .replace('\\', "/");

    let filename = resolved
        .file_name()
        .ok_or_else(|| "Invalid path".to_string())?
        .to_string_lossy()
        .to_string();

    let ts = trash_timestamp();
    let trash_name = format!("{}_{}", ts, filename);

    let dir = trash_dir(app_handle);
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let dest = dir.join(&trash_name);

    fs::rename(&resolved, &dest).map_err(|e| e.to_string())?;

    let original_name = resolved
        .file_stem()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    let mut meta = load_trash_meta(app_handle);
    meta.push(TrashEntry {
        original_name,
        original_path,
        trashed_at: ts,
        is_folder: false,
        trash_name,
    });
    save_trash_meta(app_handle, &meta)
}

pub fn trash_folder(app_handle: &AppHandle, path: &str) -> Result<(), String> {
    let resolved = resolve_notes_path(app_handle, path)?;
    if !resolved.exists() {
        return Err("Folder not found".to_string());
    }
    if !resolved.is_dir() {
        return Err("Path is not a directory".to_string());
    }

    let notes_base = notes_dir(app_handle);
    let original_path = resolved
        .strip_prefix(&notes_base)
        .unwrap_or(&resolved)
        .to_string_lossy()
        .to_string()
        .replace('\\', "/");

    let folder_name = resolved
        .file_name()
        .ok_or_else(|| "Invalid path".to_string())?
        .to_string_lossy()
        .to_string();

    let ts = trash_timestamp();
    let trash_name = format!("{}_{}", ts, folder_name);

    let dir = trash_dir(app_handle);
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let dest = dir.join(&trash_name);

    fs::rename(&resolved, &dest).map_err(|e| e.to_string())?;

    let mut meta = load_trash_meta(app_handle);
    meta.push(TrashEntry {
        original_name: folder_name,
        original_path,
        trashed_at: ts,
        is_folder: true,
        trash_name,
    });
    save_trash_meta(app_handle, &meta)
}

pub fn list_trash(app_handle: &AppHandle) -> Vec<TrashEntry> {
    load_trash_meta(app_handle)
}

fn restore_trash_entry_at(
    base: &Path,
    entries: &mut Vec<TrashEntry>,
    trash_name: &str,
) -> Result<(), String> {
    let index = entries
        .iter()
        .position(|entry| entry.trash_name == trash_name)
        .ok_or_else(|| "Trash item not found".to_string())?;
    let entry = entries[index].clone();

    let trash_path = base.join(".trash").join(&entry.trash_name);
    if !trash_path.exists() {
        return Err("Trash item is missing from disk".to_string());
    }

    let restore_path = resolve_path_under_base(base, &entry.original_path)?;
    if restore_path.exists() {
        return Err("Original location already contains an item with that name".to_string());
    }
    if let Some(parent) = restore_path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    fs::rename(&trash_path, &restore_path).map_err(|e| e.to_string())?;
    entries.remove(index);
    Ok(())
}

pub fn restore_trash_entry(app_handle: &AppHandle, trash_name: &str) -> Result<(), String> {
    let base = notes_dir(app_handle);
    let mut meta = load_trash_meta(app_handle);
    restore_trash_entry_at(&base, &mut meta, trash_name)?;
    save_trash_meta(app_handle, &meta)
}

fn permanently_delete_trash_entry_at(
    base: &Path,
    entries: &mut Vec<TrashEntry>,
    trash_name: &str,
) -> Result<(), String> {
    let index = entries
        .iter()
        .position(|entry| entry.trash_name == trash_name)
        .ok_or_else(|| "Trash item not found".to_string())?;
    let entry = entries[index].clone();

    let trash_path = base.join(".trash").join(&entry.trash_name);
    if trash_path.exists() {
        if entry.is_folder {
            fs::remove_dir_all(&trash_path).map_err(|e| e.to_string())?;
        } else {
            fs::remove_file(&trash_path).map_err(|e| e.to_string())?;
        }
    }

    entries.remove(index);
    Ok(())
}

pub fn permanently_delete_trash_entry(
    app_handle: &AppHandle,
    trash_name: &str,
) -> Result<(), String> {
    let base = notes_dir(app_handle);
    let mut meta = load_trash_meta(app_handle);
    permanently_delete_trash_entry_at(&base, &mut meta, trash_name)?;
    save_trash_meta(app_handle, &meta)
}

pub fn purge_trash(app_handle: &AppHandle, retention_days: u64) -> Result<u32, String> {
    let dir = trash_dir(app_handle);
    if !dir.exists() {
        return Ok(0);
    }

    let meta = load_trash_meta(app_handle);
    if meta.is_empty() {
        return Ok(0);
    }

    let now = chrono::Local::now().naive_local();
    let mut remaining = Vec::new();
    let mut purged = 0u32;
    for entry in &meta {
        let trashed = chrono::NaiveDateTime::parse_from_str(
            &entry.trashed_at,
            "%Y-%m-%dT%H%M%S",
        )
        .ok();

        let should_purge = trashed.map_or(false, |dt| {
            let age = now.signed_duration_since(dt);
            age.num_days() >= retention_days as i64
        });

        if should_purge {
            let trash_path = dir.join(&entry.trash_name);
            if trash_path.exists() {
                if entry.is_folder {
                    fs::remove_dir_all(&trash_path).map_err(|e| e.to_string())?;
                } else {
                    fs::remove_file(&trash_path).map_err(|e| e.to_string())?;
                }
                purged += 1;
            }
        } else {
            remaining.push(entry.clone());
        }
    }

    save_trash_meta(app_handle, &remaining)?;
    Ok(purged)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;

    #[test]
    fn resolves_relative_paths_under_configured_base() {
        let base = Path::new("C:/Quietness Notes");

        let resolved = resolve_path_under_base(base, "Projects/Plan.md").unwrap();

        assert_eq!(resolved, base.join("Projects/Plan.md"));
    }

    #[test]
    fn rejects_absolute_paths_outside_configured_base() {
        let base = Path::new("C:/Quietness Notes");

        let result = resolve_path_under_base(base, "D:/Other/Plan.md");

        assert!(result.is_err());
    }

    #[test]
    fn rejects_relative_traversal_outside_configured_base() {
        let base = Path::new("C:/Quietness Notes");

        let result = resolve_path_under_base(base, "../Other/Plan.md");

        assert!(result.is_err());
    }

    #[test]
    fn restores_trashed_note_to_original_path_and_removes_metadata() {
        let base = unique_test_dir("restore-note");
        let trash = base.join(".trash");
        fs::create_dir_all(&trash).unwrap();
        fs::create_dir_all(base.join("Projects")).unwrap();
        fs::write(trash.join("2026-05-25T120000_Plan.md"), "restored body").unwrap();

        let mut entries = vec![TrashEntry {
            original_name: "Plan".to_string(),
            original_path: "Projects/Plan.md".to_string(),
            trashed_at: "2026-05-25T120000".to_string(),
            is_folder: false,
            trash_name: "2026-05-25T120000_Plan.md".to_string(),
        }];

        restore_trash_entry_at(&base, &mut entries, "2026-05-25T120000_Plan.md").unwrap();

        assert_eq!(fs::read_to_string(base.join("Projects/Plan.md")).unwrap(), "restored body");
        assert!(!trash.join("2026-05-25T120000_Plan.md").exists());
        assert!(entries.is_empty());

        let _ = fs::remove_dir_all(base);
    }

    #[test]
    fn permanently_deletes_trashed_folder_and_removes_metadata() {
        let base = unique_test_dir("delete-folder");
        let trash = base.join(".trash").join("2026-05-25T120000_Archive");
        fs::create_dir_all(&trash).unwrap();
        fs::write(trash.join("Old.md"), "old body").unwrap();

        let mut entries = vec![TrashEntry {
            original_name: "Archive".to_string(),
            original_path: "Archive".to_string(),
            trashed_at: "2026-05-25T120000".to_string(),
            is_folder: true,
            trash_name: "2026-05-25T120000_Archive".to_string(),
        }];

        permanently_delete_trash_entry_at(&base, &mut entries, "2026-05-25T120000_Archive").unwrap();

        assert!(!trash.exists());
        assert!(entries.is_empty());

        let _ = fs::remove_dir_all(base);
    }

    fn unique_test_dir(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "quietness-trash-test-{}-{}",
            name,
            chrono::Local::now().timestamp_nanos_opt().unwrap_or_default()
        ));
        fs::create_dir_all(&dir).unwrap();
        dir
    }
}
