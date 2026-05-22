use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri::Manager;

#[derive(Debug, Serialize)]
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

pub fn is_safe_path(app_handle: &AppHandle, path: &str) -> bool {
    let base = notes_dir(app_handle);
    let target = std::path::Path::new(path);

    let abs_target = if target.is_absolute() {
        target.to_path_buf()
    } else {
        base.join(target)
    };

    let mut normalized = std::path::PathBuf::new();
    for component in abs_target.components() {
        match component {
            std::path::Component::ParentDir => {
                normalized.pop();
            }
            std::path::Component::Normal(c) => {
                normalized.push(c);
            }
            std::path::Component::RootDir | std::path::Component::Prefix(_) => {
                normalized.push(component.as_os_str());
            }
            std::path::Component::CurDir => {}
        }
    }

    normalized.starts_with(&base)
}

pub fn delete_note(app_handle: &AppHandle, path: &str) -> Result<(), String> {
    if !is_safe_path(app_handle, path) {
        return Err("Access denied: path traversal detected".to_string());
    }
    fs::remove_file(path).map_err(|e| e.to_string())
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
    fs::write(path, content).map_err(|e| e.to_string())
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
                let relative = path
                    .strip_prefix(base)
                    .unwrap_or(&path)
                    .to_string_lossy()
                    .to_string();
                folders.push(FolderEntry {
                    name: path
                        .file_name()
                        .unwrap_or_default()
                        .to_string_lossy()
                        .to_string(),
                    path: relative,
                });
                list_folders_recursive(base, &path, folders);
            }
        }
    }
}

pub fn search_notes(app_handle: &AppHandle, query: &str) -> Vec<NoteEntry> {
    let dir = notes_dir(app_handle);
    let query_lower = query.to_lowercase();
    let mut results = Vec::new();
    search_notes_recursive(&dir, &query_lower, &mut results);
    results.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    results
}

fn search_notes_recursive(dir: &PathBuf, query: &str, results: &mut Vec<NoteEntry>) {
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                search_notes_recursive(&path, query, results);
            } else if path.extension().map_or(false, |ext| ext == "md") {
                let name = path
                    .file_stem()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string();

                if name.to_lowercase().contains(query) {
                    results.push(NoteEntry {
                        name,
                        path: path.to_string_lossy().to_string(),
                    });
                    continue;
                }

                if let Ok(content) = fs::read_to_string(&path) {
                    if content.to_lowercase().contains(query) {
                        results.push(NoteEntry {
                            name,
                            path: path.to_string_lossy().to_string(),
                        });
                    }
                }
            }
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
