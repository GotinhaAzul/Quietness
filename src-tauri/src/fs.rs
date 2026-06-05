use log;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::RwLock;
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

#[derive(Debug, Serialize)]
pub struct LibrarySnapshot {
    pub notes: Vec<NoteEntry>,
    pub folders: Vec<FolderEntry>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HomeFolderStatus {
    pub configured_path: String,
    pub effective_path: String,
    pub is_fallback: bool,
}

#[derive(Default)]
pub struct HomeFolderState {
    cached_home_folder: RwLock<Option<Option<String>>>,
}

// ── Home folder config ──

fn quietness_config_path(app_handle: &AppHandle) -> PathBuf {
    app_handle
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join("quietness_config.json")
}

fn load_home_folder_from_disk(app_handle: &AppHandle) -> Option<String> {
    let path = quietness_config_path(app_handle);
    fs::read_to_string(path).ok().and_then(|content| {
        serde_json::from_str::<serde_json::Value>(&content)
            .ok()
            .and_then(|v| v.get("homeFolder")?.as_str().map(String::from))
    })
}

fn load_home_folder(app_handle: &AppHandle) -> Option<String> {
    let state = app_handle.state::<HomeFolderState>();
    if let Ok(cache) = state.cached_home_folder.read() {
        if let Some(cached) = cache.clone() {
            return cached;
        }
    }

    let loaded = load_home_folder_from_disk(app_handle);
    if let Ok(mut cache) = state.cached_home_folder.write() {
        *cache = Some(loaded.clone());
    }
    loaded
}

fn invalidate_home_folder_cache(app_handle: &AppHandle) {
    let state = app_handle.state::<HomeFolderState>();
    if let Ok(mut cache) = state.cached_home_folder.write() {
        *cache = None;
    };
}

fn save_home_folder(app_handle: &AppHandle, path: &str) -> Result<(), String> {
    let config_path = quietness_config_path(app_handle);
    if let Some(parent) = config_path.parent() {
        fs::create_dir_all(parent).map_err(|e| {
            format!(
                "Failed to create config directory {}: {}",
                parent.display(),
                e
            )
        })?;
    }
    let config = serde_json::json!({ "homeFolder": path });
    let json = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    fs::write(&config_path, &json)
        .map_err(|e| format!("Failed to write config at {}: {}", config_path.display(), e))
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
    let trimmed = p
        .to_string_lossy()
        .trim_end_matches('\\')
        .trim_end_matches('/')
        .to_string();
    if trimmed.len() <= 3
        && trimmed.ends_with(':')
        && !trimmed.contains('\\')
        && !trimmed.contains('/')
    {
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
    save_home_folder(app_handle, path)?;
    invalidate_home_folder_cache(app_handle);
    Ok(())
}

pub fn reset_home_folder(app_handle: &AppHandle) -> Result<(), String> {
    let config_path = quietness_config_path(app_handle);
    if config_path.exists() {
        fs::remove_file(&config_path).map_err(|e| {
            format!(
                "Failed to remove config at {}: {}",
                config_path.display(),
                e
            )
        })?;
    }
    invalidate_home_folder_cache(app_handle);
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

fn should_skip_directory_name(name: &str) -> bool {
    name.starts_with('_') || name == ".trash"
}

fn list_notes_recursive(dir: &PathBuf, notes: &mut Vec<NoteEntry>) {
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let name = path
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string();
                if should_skip_directory_name(&name) {
                    continue;
                }
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

fn delete_note_at(base: &Path, path: &str) -> Result<(), String> {
    let resolved = resolve_path_under_base(base, path)?;
    if !resolved.exists() {
        return Err("Note not found".to_string());
    }
    if !resolved.is_file() {
        return Err("Path is not a file".to_string());
    }
    fs::remove_file(&resolved)
        .map_err(|e| format!("Failed to delete {}: {}", resolved.display(), e))?;
    Ok(())
}

fn write_note_at(base: &Path, path: &str, content: &str) -> Result<(), String> {
    let resolved = resolve_path_under_base(base, path)?;
    if let Some(parent) = resolved.parent() {
        if parent.exists() && !parent.is_dir() {
            return Err("Cannot save note because a parent path is not a folder".to_string());
        }
        fs::create_dir_all(parent).map_err(|e| {
            format!(
                "Failed to create parent directory {}: {}",
                parent.display(),
                e
            )
        })?;
    }
    fs::write(&resolved, content)
        .map_err(|e| format!("Failed to write {}: {}", resolved.display(), e))?;
    Ok(())
}

pub fn delete_note(app_handle: &AppHandle, path: &str) -> Result<(), String> {
    delete_note_at(&notes_dir(app_handle), path)
}

pub fn read_note(app_handle: &AppHandle, path: &str) -> Result<String, String> {
    let resolved = resolve_notes_path(app_handle, path)?;
    fs::read_to_string(&resolved)
        .map_err(|e| format!("Failed to read {}: {}", resolved.display(), e))
}

pub fn write_note(app_handle: &AppHandle, path: &str, content: &str) -> Result<(), String> {
    write_note_at(&notes_dir(app_handle), path, content)
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
    fs::create_dir_all(&full_path)
        .map_err(|e| format!("Failed to create folder {}: {}", full_path.display(), e))?;
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
    fs::remove_dir_all(&full_path)
        .map_err(|e| format!("Failed to remove folder {}: {}", full_path.display(), e))?;
    Ok(())
}

pub fn list_folders(app_handle: &AppHandle) -> Vec<FolderEntry> {
    let dir = notes_dir(app_handle);
    let mut folders = Vec::new();
    list_folders_recursive(&dir, &dir, &mut folders);
    folders.sort_by_cached_key(|a| a.name.to_lowercase());
    folders
}

pub fn list_library_snapshot(app_handle: &AppHandle) -> LibrarySnapshot {
    let dir = notes_dir(app_handle);
    list_library_snapshot_at(&dir)
}

fn list_library_snapshot_at(base: &Path) -> LibrarySnapshot {
    let mut snapshot = LibrarySnapshot {
        notes: Vec::new(),
        folders: Vec::new(),
    };
    collect_library_snapshot_recursive(base, base, &mut snapshot);
    snapshot.notes.sort_by_cached_key(|a| a.name.to_lowercase());
    snapshot
        .folders
        .sort_by_cached_key(|a| a.name.to_lowercase());
    snapshot
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
                if should_skip_directory_name(&name) {
                    continue;
                }
                let relative = path
                    .strip_prefix(base)
                    .unwrap_or(&path)
                    .to_string_lossy()
                    .to_string()
                    .replace('\\', "/");
                folders.push(FolderEntry {
                    name,
                    path: relative,
                });
                list_folders_recursive(base, &path, folders);
            }
        }
    }
}

fn collect_library_snapshot_recursive(base: &Path, current: &Path, snapshot: &mut LibrarySnapshot) {
    if let Ok(entries) = fs::read_dir(current) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let name = path
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string();
                if should_skip_directory_name(&name) {
                    continue;
                }
                let relative = path
                    .strip_prefix(base)
                    .unwrap_or(&path)
                    .to_string_lossy()
                    .to_string()
                    .replace('\\', "/");
                snapshot.folders.push(FolderEntry {
                    name,
                    path: relative,
                });
                collect_library_snapshot_recursive(base, &path, snapshot);
            } else if path.extension().map_or(false, |ext| ext == "md") {
                snapshot.notes.push(NoteEntry {
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

pub async fn search_notes(
    app_handle: &AppHandle,
    query: &str,
    scope: &str,
    scope_path: Option<&str>,
) -> Vec<NoteEntry> {
    let query_lower = query.to_lowercase();

    match scope {
        "current-note" => {
            let path = match scope_path {
                Some(p) => p,
                None => return Vec::new(),
            };
            let path_owned = match resolve_notes_path(app_handle, path) {
                Ok(p) => p.to_string_lossy().to_string(),
                Err(_) => return Vec::new(),
            };
            let query_for_content = query_lower.clone();
            let result = tauri::async_runtime::spawn_blocking(move || {
                if let Ok(content) = fs::read_to_string(&path_owned) {
                    if content.to_lowercase().contains(&query_for_content) {
                        let path_buf = PathBuf::from(&path_owned);
                        let name = path_buf
                            .file_stem()
                            .unwrap_or_default()
                            .to_string_lossy()
                            .to_string();
                        return Some(NoteEntry {
                            name,
                            path: path_owned,
                        });
                    }
                }
                None
            })
            .await
            .unwrap_or(None);
            result.into_iter().collect()
        }
        "current-folder" => {
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
            let query_for_content = query_lower.clone();

            tauri::async_runtime::spawn_blocking(move || {
                let mut results = Vec::new();
                let dir_path = PathBuf::from(&dir_owned);

                if let Ok(entries) = fs::read_dir(&dir_path) {
                    for entry in entries.flatten() {
                        let path = entry.path();
                        if path.is_file() && path.extension().map_or(false, |ext| ext == "md") {
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
                                if content.to_lowercase().contains(&query_for_content) {
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
            let mut results: Vec<NoteEntry> = Vec::new();
            let mut candidates: Vec<NoteEntry> = Vec::new();
            for entry in list_notes(app_handle) {
                let name_lower = entry.name.to_lowercase();
                if name_lower.contains(&query_lower) {
                    results.push(entry);
                } else {
                    candidates.push(entry);
                }
            }

            if !candidates.is_empty() {
                let query_for_content = query_lower.clone();
                let content_matches = tauri::async_runtime::spawn_blocking(move || {
                    candidates
                        .into_iter()
                        .filter(|e| {
                            fs::read_to_string(&e.path)
                                .ok()
                                .map_or(false, |c| c.to_lowercase().contains(&query_for_content))
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

    let parent = old_path_buf
        .parent()
        .ok_or_else(|| "Invalid note path".to_string())?;
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

    fs::rename(&old_path_buf, &new_path).map_err(|e| {
        format!(
            "Failed to rename note from {} to {}: {}",
            old_path_buf.display(),
            new_path.display(),
            e
        )
    })?;
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

    let parent = old_full
        .parent()
        .ok_or_else(|| "Invalid folder path".to_string())?;
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

    fs::rename(&old_full, &new_full).map_err(|e| {
        format!(
            "Failed to rename folder from {} to {}: {}",
            old_full.display(),
            new_full.display(),
            e
        )
    })?;
    Ok(())
}

// ── Move note ──

pub fn move_note(app_handle: &AppHandle, path: &str, dest_folder: &str) -> Result<String, String> {
    let old_path = resolve_notes_path(app_handle, path)?;

    if !dest_folder.is_empty()
        && (dest_folder.contains("..")
            || dest_folder.starts_with('/')
            || dest_folder.starts_with('\\'))
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

    fs::rename(&old_path, &new_path).map_err(|e| {
        format!(
            "Failed to move note from {} to {}: {}",
            old_path.display(),
            new_path.display(),
            e
        )
    })?;
    Ok(new_path_str)
}

// ── Move folder ──

pub fn move_folder(
    app_handle: &AppHandle,
    path: &str,
    dest_folder: &str,
) -> Result<String, String> {
    if path.is_empty() {
        return Err("Folder path cannot be empty".to_string());
    }
    if path.contains("..") || path.starts_with('/') || path.starts_with('\\') {
        return Err("Invalid folder path".to_string());
    }
    let base = notes_dir(app_handle);
    let old_full = resolve_path_under_base(&base, path)?;

    if !dest_folder.is_empty()
        && (dest_folder.contains("..")
            || dest_folder.starts_with('/')
            || dest_folder.starts_with('\\'))
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

    fs::rename(&old_full, &new_full).map_err(|e| {
        format!(
            "Failed to move folder from {} to {}: {}",
            old_full.display(),
            new_full.display(),
            e
        )
    })?;
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
                let stem = path
                    .file_stem()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string();
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
    fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read user theme at {}: {}", path.display(), e))
}

// ── Note Templates ──

#[derive(Debug, Clone, Serialize)]
pub struct TemplateEntry {
    pub name: String,
}

fn templates_dir(app_handle: &AppHandle) -> PathBuf {
    let dir = notes_dir(app_handle).join("_templates");
    let _ = fs::create_dir_all(&dir);
    dir
}

fn validate_template_name(name: &str) -> Result<(), String> {
    if name.is_empty() {
        return Err("Template name cannot be empty".to_string());
    }
    if name.contains('/') || name.contains('\\') || name.contains("..") {
        return Err("Invalid template name".to_string());
    }
    Ok(())
}

fn list_templates_at(dir: &Path) -> Vec<TemplateEntry> {
    let mut templates = Vec::new();
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() && path.extension().map_or(false, |ext| ext == "md") {
                let name = path
                    .file_stem()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string();
                templates.push(TemplateEntry { name });
            }
        }
    }
    templates.sort_by_cached_key(|t| t.name.to_lowercase());
    templates
}

fn read_template_at(dir: &Path, name: &str) -> Result<String, String> {
    validate_template_name(name)?;
    let path = dir.join(format!("{}.md", name));
    let canon_dir = std::fs::canonicalize(dir).unwrap_or_else(|_| dir.to_path_buf());
    let canon_path = resolve_canonical(&path);
    if !canon_path.starts_with(&canon_dir) {
        return Err("Access denied".to_string());
    }
    fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read template at {}: {}", path.display(), e))
}

fn create_template_at(dir: &Path, name: &str, content: &str) -> Result<(), String> {
    validate_template_name(name)?;
    let path = dir.join(format!("{}.md", name));
    if path.exists() {
        return Err(format!("A template named '{}' already exists", name));
    }
    fs::write(&path, content)
        .map_err(|e| format!("Failed to create template at {}: {}", path.display(), e))
}

fn delete_template_at(dir: &Path, name: &str) -> Result<(), String> {
    validate_template_name(name)?;
    let path = dir.join(format!("{}.md", name));
    let canon_dir = std::fs::canonicalize(dir).unwrap_or_else(|_| dir.to_path_buf());
    let canon_path = resolve_canonical(&path);
    if !canon_path.starts_with(&canon_dir) {
        return Err("Access denied".to_string());
    }
    if !path.exists() {
        return Err(format!("Template '{}' not found", name));
    }
    fs::remove_file(&path)
        .map_err(|e| format!("Failed to delete template at {}: {}", path.display(), e))
}

pub fn list_templates(app_handle: &AppHandle) -> Vec<TemplateEntry> {
    let dir = templates_dir(app_handle);
    list_templates_at(&dir)
}

pub fn read_template(app_handle: &AppHandle, name: &str) -> Result<String, String> {
    let dir = templates_dir(app_handle);
    read_template_at(&dir, name)
}

pub fn create_template(app_handle: &AppHandle, name: &str, content: &str) -> Result<(), String> {
    let dir = templates_dir(app_handle);
    create_template_at(&dir, name, content)
}

pub fn delete_template(app_handle: &AppHandle, name: &str) -> Result<(), String> {
    let dir = templates_dir(app_handle);
    delete_template_at(&dir, name)
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
    pub ambient_particles_enabled: bool,
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
    pub trash_retention_days: u64,
    pub templates_enabled: bool,
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
            ambient_particles_enabled: true,
            colors: PetColorPalette {
                core: "#ffffff".to_string(),
                inner: "#c98aff".to_string(),
                mid: "#912eff".to_string(),
                outer: "#5a00c2".to_string(),
                ember: "#5a00c2".to_string(),
            },
        },
        trash_retention_days: 30,
        templates_enabled: true,
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
    let json = serde_json::to_string_pretty(settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;
    fs::write(&path, &json)
        .map_err(|e| format!("Failed to write settings at {}: {}", path.display(), e))
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
                fs::create_dir_all(&dest).map_err(|e| {
                    format!(
                        "Failed to create migration directory {}: {}",
                        dest.display(),
                        e
                    )
                })?;
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
                            fs::copy(&path, &alt).map_err(|e| {
                                format!(
                                    "Failed to copy {} to {}: {}",
                                    path.display(),
                                    alt.display(),
                                    e
                                )
                            })?;
                            break;
                        }
                        counter += 1;
                    }
                } else {
                    fs::copy(&path, &dest).map_err(|e| {
                        format!(
                            "Failed to copy {} to {}: {}",
                            path.display(),
                            dest.display(),
                            e
                        )
                    })?;
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
    let meta_path = trash_meta_path(app_handle);
    fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create trash directory {}: {}", dir.display(), e))?;
    let json = serde_json::to_string_pretty(entries)
        .map_err(|e| format!("Failed to serialize trash metadata: {}", e))?;
    fs::write(&meta_path, &json).map_err(|e| {
        format!(
            "Failed to write trash metadata at {}: {}",
            meta_path.display(),
            e
        )
    })
}

fn unique_trash_name(dir: &Path, ts: &str, name: &str) -> String {
    let mut index = 1usize;
    loop {
        let candidate = if index == 1 {
            format!("{}_{}", ts, name)
        } else {
            format!("{}_{}_{}", ts, index, name)
        };
        if !dir.join(&candidate).exists() {
            return candidate;
        }
        index += 1;
    }
}

fn trash_note_at(
    base: &Path,
    meta: &mut Vec<TrashEntry>,
    path: &str,
    ts: &str,
) -> Result<(), String> {
    let resolved = resolve_path_under_base(base, path)?;
    if !resolved.exists() {
        return Err("Note not found".to_string());
    }
    if !resolved.is_file() {
        return Err("Path is not a file".to_string());
    }

    let original_path = resolved
        .strip_prefix(base)
        .unwrap_or(&resolved)
        .to_string_lossy()
        .to_string()
        .replace('\\', "/");

    let filename = resolved
        .file_name()
        .ok_or_else(|| "Invalid path".to_string())?
        .to_string_lossy()
        .to_string();

    let dir = base.join(".trash");
    fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create trash directory {}: {}", dir.display(), e))?;
    let trash_name = unique_trash_name(&dir, ts, &filename);
    let dest = dir.join(&trash_name);

    fs::rename(&resolved, &dest).map_err(|e| {
        format!(
            "Failed to trash note from {} to {}: {}",
            resolved.display(),
            dest.display(),
            e
        )
    })?;

    let original_name = resolved
        .file_stem()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    meta.push(TrashEntry {
        original_name,
        original_path,
        trashed_at: ts.to_string(),
        is_folder: false,
        trash_name,
    });
    Ok(())
}

pub fn trash_note(app_handle: &AppHandle, path: &str) -> Result<(), String> {
    let mut meta = load_trash_meta(app_handle);
    let base = notes_dir(app_handle);
    let ts = trash_timestamp();
    trash_note_at(&base, &mut meta, path, &ts)?;
    save_trash_meta(app_handle, &meta)
}

fn trash_folder_at(
    base: &Path,
    meta: &mut Vec<TrashEntry>,
    path: &str,
    ts: &str,
) -> Result<(), String> {
    let resolved = resolve_path_under_base(base, path)?;
    if !resolved.exists() {
        return Err("Folder not found".to_string());
    }
    if !resolved.is_dir() {
        return Err("Path is not a directory".to_string());
    }

    let original_path = resolved
        .strip_prefix(base)
        .unwrap_or(&resolved)
        .to_string_lossy()
        .to_string()
        .replace('\\', "/");

    let folder_name = resolved
        .file_name()
        .ok_or_else(|| "Invalid path".to_string())?
        .to_string_lossy()
        .to_string();

    let dir = base.join(".trash");
    fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create trash directory {}: {}", dir.display(), e))?;
    let trash_name = unique_trash_name(&dir, ts, &folder_name);
    let dest = dir.join(&trash_name);

    fs::rename(&resolved, &dest).map_err(|e| {
        format!(
            "Failed to trash folder from {} to {}: {}",
            resolved.display(),
            dest.display(),
            e
        )
    })?;

    meta.push(TrashEntry {
        original_name: folder_name,
        original_path,
        trashed_at: ts.to_string(),
        is_folder: true,
        trash_name,
    });
    Ok(())
}

pub fn trash_folder(app_handle: &AppHandle, path: &str) -> Result<(), String> {
    let mut meta = load_trash_meta(app_handle);
    let base = notes_dir(app_handle);
    let ts = trash_timestamp();
    trash_folder_at(&base, &mut meta, path, &ts)?;
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
        fs::create_dir_all(parent).map_err(|e| {
            format!(
                "Failed to create parent directory {}: {}",
                parent.display(),
                e
            )
        })?;
    }

    fs::rename(&trash_path, &restore_path).map_err(|e| {
        format!(
            "Failed to restore trash entry from {} to {}: {}",
            trash_path.display(),
            restore_path.display(),
            e
        )
    })?;
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
            fs::remove_dir_all(&trash_path).map_err(|e| {
                format!(
                    "Failed to remove trash directory {}: {}",
                    trash_path.display(),
                    e
                )
            })?;
        } else {
            fs::remove_file(&trash_path).map_err(|e| {
                format!(
                    "Failed to remove trash file {}: {}",
                    trash_path.display(),
                    e
                )
            })?;
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
    for entry in meta {
        let trashed =
            chrono::NaiveDateTime::parse_from_str(&entry.trashed_at, "%Y-%m-%dT%H%M%S").ok();

        let should_purge = trashed.map_or(false, |dt| {
            let age = now.signed_duration_since(dt);
            age.num_days() >= retention_days as i64
        });

        if should_purge {
            let trash_path = dir.join(&entry.trash_name);
            if trash_path.exists() {
                if entry.is_folder {
                    fs::remove_dir_all(&trash_path).map_err(|e| {
                        format!(
                            "Failed to purge trash directory {}: {}",
                            trash_path.display(),
                            e
                        )
                    })?;
                } else {
                    fs::remove_file(&trash_path).map_err(|e| {
                        format!("Failed to purge trash file {}: {}", trash_path.display(), e)
                    })?;
                }
                purged += 1;
            }
        } else {
            remaining.push(entry);
        }
    }

    save_trash_meta(app_handle, &remaining)?;
    Ok(purged)
}

// ── Integrity repair ──

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IntegrityRepairReport {
    pub removed_trash_metadata: u32,
}

pub fn repair_trash_metadata_at(base: &Path, entries: &[TrashEntry]) -> Vec<TrashEntry> {
    let trash_dir = base.join(".trash");
    let mut remaining = Vec::new();
    for entry in entries {
        if entry.trash_name.contains('/')
            || entry.trash_name.contains('\\')
            || entry.trash_name.contains("..")
        {
            continue;
        }
        let target = trash_dir.join(&entry.trash_name);
        if target.exists() {
            remaining.push(entry.clone());
        }
    }
    remaining
}

pub fn repair_integrity(app_handle: &AppHandle) -> IntegrityRepairReport {
    let base = notes_dir(app_handle);
    let meta = load_trash_meta(app_handle);
    let original_count = meta.len() as u32;
    let repaired = repair_trash_metadata_at(&base, &meta);
    let removed = original_count.saturating_sub(repaired.len() as u32);
    if removed > 0 {
        let _ = save_trash_meta(app_handle, &repaired);
    }
    IntegrityRepairReport {
        removed_trash_metadata: removed,
    }
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

        assert_eq!(
            fs::read_to_string(base.join("Projects/Plan.md")).unwrap(),
            "restored body"
        );
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

        permanently_delete_trash_entry_at(&base, &mut entries, "2026-05-25T120000_Archive")
            .unwrap();

        assert!(!trash.exists());
        assert!(entries.is_empty());

        let _ = fs::remove_dir_all(base);
    }

    #[test]
    fn delete_note_at_reports_missing_note_as_recoverable_state() {
        let base = unique_test_dir("delete-missing-note");

        let result = delete_note_at(&base, "Missing.md");

        assert_eq!(result.unwrap_err(), "Note not found");

        let _ = fs::remove_dir_all(base);
    }

    #[test]
    fn write_note_at_reports_blocked_parent_path_clearly() {
        let base = unique_test_dir("write-blocked-parent");
        fs::write(base.join("Projects"), "not a directory").unwrap();

        let result = write_note_at(&base, "Projects/Plan.md", "body");

        assert_eq!(
            result.unwrap_err(),
            "Cannot save note because a parent path is not a folder"
        );

        let _ = fs::remove_dir_all(base);
    }

    #[test]
    fn trash_note_at_uses_unique_names_for_same_second_collisions() {
        let base = unique_test_dir("trash-name-collision");
        fs::create_dir_all(base.join("A")).unwrap();
        fs::create_dir_all(base.join("B")).unwrap();
        fs::write(base.join("A").join("Plan.md"), "first").unwrap();
        fs::write(base.join("B").join("Plan.md"), "second").unwrap();

        let ts = "2026-05-26T120000";
        let mut entries = Vec::new();

        trash_note_at(&base, &mut entries, "A/Plan.md", ts).unwrap();
        trash_note_at(&base, &mut entries, "B/Plan.md", ts).unwrap();

        assert_eq!(entries.len(), 2);
        assert_ne!(entries[0].trash_name, entries[1].trash_name);
        assert!(base.join(".trash").join(&entries[0].trash_name).exists());
        assert!(base.join(".trash").join(&entries[1].trash_name).exists());

        let _ = fs::remove_dir_all(base);
    }

    #[test]
    fn active_note_listing_excludes_files_inside_trash() {
        let base = unique_test_dir("listing-excludes-trash");
        fs::create_dir_all(base.join(".trash")).unwrap();
        fs::create_dir_all(base.join("Projects")).unwrap();
        fs::write(base.join("Projects").join("Active.md"), "active").unwrap();
        fs::write(base.join(".trash").join("Deleted.md"), "deleted").unwrap();

        let mut notes = Vec::new();
        list_notes_recursive(&base, &mut notes);

        assert_eq!(notes.len(), 1);
        assert_eq!(notes[0].name, "Active");

        let _ = fs::remove_dir_all(base);
    }

    #[test]
    fn active_note_listing_excludes_underscore_prefix_folders() {
        let base = unique_test_dir("listing-excludes-underscore");
        fs::create_dir_all(base.join("_themes")).unwrap();
        fs::write(base.join("_themes").join("Secret.md"), "hidden").unwrap();
        fs::write(base.join("Visible.md"), "visible").unwrap();

        let mut notes = Vec::new();
        list_notes_recursive(&base, &mut notes);

        assert_eq!(notes.len(), 1);
        assert_eq!(notes[0].name, "Visible");

        let _ = fs::remove_dir_all(base);
    }

    #[test]
    fn snapshot_collects_root_and_nested_markdown_notes() {
        let base = unique_test_dir("snapshot-notes");
        fs::create_dir_all(base.join("Projects").join("Nested")).unwrap();
        fs::write(base.join("Root.md"), "root").unwrap();
        fs::write(base.join("Projects").join("Plan.md"), "plan").unwrap();
        fs::write(base.join("Projects").join("Nested").join("Deep.md"), "deep").unwrap();

        let snapshot = list_library_snapshot_at(&base);
        let mut names: Vec<String> = snapshot.notes.into_iter().map(|n| n.name).collect();
        names.sort();

        assert_eq!(names, vec!["Deep", "Plan", "Root"]);
        let _ = fs::remove_dir_all(base);
    }

    #[test]
    fn snapshot_collects_folder_entries() {
        let base = unique_test_dir("snapshot-folders");
        fs::create_dir_all(base.join("Projects").join("Nested")).unwrap();
        fs::create_dir_all(base.join("Area")).unwrap();

        let snapshot = list_library_snapshot_at(&base);
        let mut paths: Vec<String> = snapshot.folders.into_iter().map(|f| f.path).collect();
        paths.sort();

        assert_eq!(paths, vec!["Area", "Projects", "Projects/Nested"]);
        let _ = fs::remove_dir_all(base);
    }

    #[test]
    fn snapshot_excludes_trash_folder() {
        let base = unique_test_dir("snapshot-excludes-trash");
        fs::create_dir_all(base.join(".trash")).unwrap();
        fs::write(base.join(".trash").join("Deleted.md"), "deleted").unwrap();
        fs::write(base.join("Visible.md"), "visible").unwrap();

        let snapshot = list_library_snapshot_at(&base);
        let note_names: Vec<String> = snapshot.notes.into_iter().map(|n| n.name).collect();

        assert_eq!(note_names, vec!["Visible"]);
        assert!(snapshot.folders.is_empty());
        let _ = fs::remove_dir_all(base);
    }

    #[test]
    fn snapshot_excludes_underscore_prefixed_folders() {
        let base = unique_test_dir("snapshot-excludes-underscore");
        fs::create_dir_all(base.join("_themes")).unwrap();
        fs::create_dir_all(base.join("Projects")).unwrap();
        fs::write(base.join("_themes").join("Hidden.md"), "hidden").unwrap();
        fs::write(base.join("Projects").join("Visible.md"), "visible").unwrap();

        let snapshot = list_library_snapshot_at(&base);
        let note_names: Vec<String> = snapshot.notes.into_iter().map(|n| n.name).collect();
        let folder_paths: Vec<String> = snapshot.folders.into_iter().map(|f| f.path).collect();

        assert_eq!(note_names, vec!["Visible"]);
        assert_eq!(folder_paths, vec!["Projects"]);
        let _ = fs::remove_dir_all(base);
    }

    #[test]
    fn home_folder_status_serializes_for_frontend_contract() {
        let status = HomeFolderStatus {
            configured_path: "/configured".to_string(),
            effective_path: "/effective".to_string(),
            is_fallback: true,
        };

        let value = serde_json::to_value(status).unwrap();

        assert_eq!(value["configuredPath"], "/configured");
        assert_eq!(value["effectivePath"], "/effective");
        assert_eq!(value["isFallback"], true);
        assert!(value.get("configured_path").is_none());
        assert!(value.get("effective_path").is_none());
        assert!(value.get("is_fallback").is_none());
    }

    #[test]
    fn repair_trash_metadata_removes_stale_entries() {
        let base = unique_test_dir("repair-stale");
        let trash = base.join(".trash");
        fs::create_dir_all(&trash).unwrap();
        // Create only one of the two trash files
        fs::write(trash.join("existing.md"), "body").unwrap();

        let entries = vec![
            TrashEntry {
                original_name: "Existing".to_string(),
                original_path: "Existing.md".to_string(),
                trashed_at: "2026-05-25T120000".to_string(),
                is_folder: false,
                trash_name: "existing.md".to_string(),
            },
            TrashEntry {
                original_name: "Stale".to_string(),
                original_path: "Stale.md".to_string(),
                trashed_at: "2026-05-25T120000".to_string(),
                is_folder: false,
                trash_name: "stale.md".to_string(),
            },
        ];

        let remaining = repair_trash_metadata_at(&base, &entries);

        assert_eq!(remaining.len(), 1);
        assert_eq!(remaining[0].trash_name, "existing.md");

        let _ = fs::remove_dir_all(base);
    }

    #[test]
    fn repair_trash_metadata_drops_unsafe_trash_names() {
        let base = unique_test_dir("repair-unsafe");
        let trash = base.join(".trash");
        fs::create_dir_all(&trash).unwrap();
        // Create files for all entries
        fs::write(trash.join("safe.md"), "body").unwrap();

        let entries = vec![
            TrashEntry {
                original_name: "Safe".to_string(),
                original_path: "Safe.md".to_string(),
                trashed_at: "2026-05-25T120000".to_string(),
                is_folder: false,
                trash_name: "safe.md".to_string(),
            },
            TrashEntry {
                original_name: "HasSlash".to_string(),
                original_path: "HasSlash.md".to_string(),
                trashed_at: "2026-05-25T120000".to_string(),
                is_folder: false,
                trash_name: "../escape.md".to_string(),
            },
            TrashEntry {
                original_name: "HasBackslash".to_string(),
                original_path: "HasBackslash.md".to_string(),
                trashed_at: "2026-05-25T120000".to_string(),
                is_folder: false,
                trash_name: "sub\\bad.md".to_string(),
            },
            TrashEntry {
                original_name: "HasDotDot".to_string(),
                original_path: "HasDotDot.md".to_string(),
                trashed_at: "2026-05-25T120000".to_string(),
                is_folder: false,
                trash_name: "sub/../bad.md".to_string(),
            },
        ];

        let remaining = repair_trash_metadata_at(&base, &entries);

        assert_eq!(remaining.len(), 1);
        assert_eq!(remaining[0].trash_name, "safe.md");

        let _ = fs::remove_dir_all(base);
    }

    fn unique_test_dir(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "quietness-trash-test-{}-{}",
            name,
            chrono::Local::now()
                .timestamp_nanos_opt()
                .unwrap_or_default()
        ));
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    // ── Template tests ──

    #[test]
    fn template_list_returns_empty_when_no_templates() {
        let dir = unique_test_dir("templates-empty");
        let result = list_templates_at(&dir);
        assert!(result.is_empty());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn template_list_returns_sorted_templates() {
        let dir = unique_test_dir("templates-list");
        fs::write(dir.join("z_last.md"), "z").unwrap();
        fs::write(dir.join("a_first.md"), "a").unwrap();
        fs::write(dir.join("M_mid.md"), "m").unwrap();

        let result = list_templates_at(&dir);

        assert_eq!(result.len(), 3);
        assert_eq!(result[0].name, "a_first");
        assert_eq!(result[1].name, "M_mid");
        assert_eq!(result[2].name, "z_last");
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn template_list_ignores_non_md_files() {
        let dir = unique_test_dir("templates-ignore-nonmd");
        fs::write(dir.join("note.md"), "content").unwrap();
        fs::write(dir.join("readme.txt"), "text").unwrap();
        fs::write(dir.join("script.js"), "code").unwrap();

        let result = list_templates_at(&dir);

        assert_eq!(result.len(), 1);
        assert_eq!(result[0].name, "note");
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn template_create_writes_file_and_allows_listing() {
        let dir = unique_test_dir("templates-create");
        create_template_at(&dir, "daily", "# Daily Notes\n\n- [ ] ").unwrap();

        assert!(dir.join("daily.md").exists());
        assert_eq!(
            fs::read_to_string(dir.join("daily.md")).unwrap(),
            "# Daily Notes\n\n- [ ] "
        );

        let list = list_templates_at(&dir);
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].name, "daily");
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn template_create_rejects_duplicate_name() {
        let dir = unique_test_dir("templates-dup");
        fs::write(dir.join("existing.md"), "content").unwrap();

        let err = create_template_at(&dir, "existing", "new content").unwrap_err();
        assert!(err.contains("already exists"));
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn template_create_rejects_invalid_name() {
        let dir = unique_test_dir("templates-invalid-name");
        let err = create_template_at(&dir, "../escape", "x").unwrap_err();
        assert!(err.contains("Invalid"));
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn template_delete_removes_file_and_updates_list() {
        let dir = unique_test_dir("templates-delete");
        fs::write(dir.join("obsolete.md"), "old content").unwrap();

        delete_template_at(&dir, "obsolete").unwrap();

        assert!(!dir.join("obsolete.md").exists());
        assert!(list_templates_at(&dir).is_empty());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn template_delete_reports_missing_template() {
        let dir = unique_test_dir("templates-delete-missing");
        let err = delete_template_at(&dir, "nonexistent").unwrap_err();
        assert!(err.contains("not found"));
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn template_read_returns_content() {
        let dir = unique_test_dir("templates-read");
        fs::write(dir.join("greeting.md"), "Hello, **World**!").unwrap();

        let content = read_template_at(&dir, "greeting").unwrap();
        assert_eq!(content, "Hello, **World**!");
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn template_read_rejects_traversal() {
        let dir = unique_test_dir("templates-read-traversal");
        let err = read_template_at(&dir, "../etc/passwd").unwrap_err();
        assert!(err.contains("Invalid") || err.contains("Access denied"));
        let _ = fs::remove_dir_all(&dir);
    }
}
