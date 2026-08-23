use crate::fs::{
    self, FolderEntry, HomeFolderStatus, IntegrityRepairReport, LibrarySnapshot, NoteEntry,
    SearchMatch, Settings, TemplateEntry, TrashEntry, UserThemeEntry,
};
use tauri::AppHandle;

#[tauri::command]
pub async fn list_notes(app_handle: AppHandle) -> Result<Vec<NoteEntry>, String> {
    tauri::async_runtime::spawn_blocking(move || fs::list_notes(&app_handle))
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_notes_dir(app_handle: AppHandle) -> String {
    tauri::async_runtime::spawn_blocking(move || {
        fs::get_notes_dir(&app_handle).to_string_lossy().to_string()
    })
    .await
    .unwrap_or_default()
}

#[tauri::command]
pub async fn read_note(app_handle: AppHandle, path: String) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || fs::read_note(&app_handle, &path))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn write_note(app_handle: AppHandle, path: String, content: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || fs::write_note(&app_handle, &path, &content))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn create_folder(app_handle: AppHandle, path: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || fs::create_folder(&app_handle, &path))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn delete_folder(app_handle: AppHandle, path: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || fs::delete_folder(&app_handle, &path))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn list_folders(app_handle: AppHandle) -> Result<Vec<FolderEntry>, String> {
    tauri::async_runtime::spawn_blocking(move || fs::list_folders(&app_handle))
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_notes_in_folder(
    app_handle: AppHandle,
    folder_path: String,
) -> Result<Vec<NoteEntry>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        fs::list_notes_in_folder(&app_handle, &folder_path)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn list_library_snapshot(app_handle: AppHandle) -> Result<LibrarySnapshot, String> {
    tauri::async_runtime::spawn_blocking(move || fs::list_library_snapshot(&app_handle))
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_note(app_handle: AppHandle, path: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || fs::delete_note(&app_handle, &path))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn search_notes(
    app_handle: AppHandle,
    query: String,
    scope: Option<String>,
    scope_path: Option<String>,
) -> Vec<SearchMatch> {
    let scope = scope.unwrap_or_else(|| "all".to_string());
    fs::search_notes(&app_handle, &query, &scope, scope_path.as_deref()).await
}

#[tauri::command]
pub async fn rename_note(
    app_handle: AppHandle,
    old_path: String,
    new_name: String,
) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || fs::rename_note(&app_handle, &old_path, &new_name))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn rename_folder(
    app_handle: AppHandle,
    old_path: String,
    new_name: String,
) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        fs::rename_folder(&app_handle, &old_path, &new_name)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn move_note(
    app_handle: AppHandle,
    path: String,
    dest_folder: String,
) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || fs::move_note(&app_handle, &path, &dest_folder))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn move_folder(
    app_handle: AppHandle,
    path: String,
    dest_folder: String,
) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        fs::move_folder(&app_handle, &path, &dest_folder)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn load_settings(app_handle: AppHandle) -> Settings {
    tauri::async_runtime::spawn_blocking(move || fs::load_settings(&app_handle))
        .await
        .unwrap_or_default()
}

#[tauri::command]
pub async fn save_settings(app_handle: AppHandle, settings: Settings) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || fs::save_settings(&app_handle, &settings))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn list_user_themes(app_handle: AppHandle) -> Vec<UserThemeEntry> {
    tauri::async_runtime::spawn_blocking(move || fs::list_user_themes(&app_handle))
        .await
        .unwrap_or_default()
}

#[tauri::command]
pub async fn read_user_theme_css(app_handle: AppHandle, id: String) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || fs::read_user_theme_css(&app_handle, &id))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn set_home_folder(app_handle: AppHandle, path: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || fs::set_home_folder(&app_handle, &path))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn reset_home_folder(app_handle: AppHandle) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || fs::reset_home_folder(&app_handle))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn get_home_folder(app_handle: AppHandle) -> String {
    tauri::async_runtime::spawn_blocking(move || fs::get_home_folder(&app_handle))
        .await
        .unwrap_or_default()
}

#[tauri::command]
pub async fn home_folder_status(app_handle: AppHandle) -> HomeFolderStatus {
    tauri::async_runtime::spawn_blocking(move || fs::get_home_folder_status(&app_handle))
        .await
        .unwrap_or_default()
}

#[tauri::command]
pub async fn count_md_files(path: String) -> u32 {
    tauri::async_runtime::spawn_blocking(move || fs::count_md_files(&path))
        .await
        .unwrap_or_default()
}

#[tauri::command]
pub async fn migrate_content(from: String, to: String) -> Result<u32, String> {
    tauri::async_runtime::spawn_blocking(move || fs::migrate_content(&from, &to))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn trash_note(app_handle: AppHandle, path: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || fs::trash_note(&app_handle, &path))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn trash_folder(app_handle: AppHandle, path: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || fs::trash_folder(&app_handle, &path))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn list_trash(app_handle: AppHandle) -> Vec<TrashEntry> {
    tauri::async_runtime::spawn_blocking(move || fs::list_trash(&app_handle))
        .await
        .unwrap_or_default()
}

#[tauri::command]
pub async fn restore_trash_entry(app_handle: AppHandle, trash_name: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || fs::restore_trash_entry(&app_handle, &trash_name))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn permanently_delete_trash_entry(
    app_handle: AppHandle,
    trash_name: String,
) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        fs::permanently_delete_trash_entry(&app_handle, &trash_name)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn repair_integrity(app_handle: AppHandle) -> Result<IntegrityRepairReport, String> {
    tauri::async_runtime::spawn_blocking(move || fs::repair_integrity(&app_handle))
        .await
        .map_err(|e| e.to_string())
}

// ── Backlinks commands ──

#[tauri::command]
pub async fn find_backlinks(
    app_handle: AppHandle,
    target_name: String,
) -> Result<Vec<fs::BacklinkEntry>, String> {
    tauri::async_runtime::spawn_blocking(move || fs::find_backlinks(&app_handle, &target_name))
        .await
        .map_err(|e| e.to_string())
}

// ── Template commands ──

#[tauri::command]
pub async fn list_templates(app_handle: AppHandle) -> Vec<TemplateEntry> {
    tauri::async_runtime::spawn_blocking(move || fs::list_templates(&app_handle))
        .await
        .unwrap_or_default()
}

#[tauri::command]
pub async fn read_template(app_handle: AppHandle, name: String) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || fs::read_template(&app_handle, &name))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn create_template(
    app_handle: AppHandle,
    name: String,
    content: String,
) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        fs::create_template(&app_handle, &name, &content)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn delete_template(app_handle: AppHandle, name: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || fs::delete_template(&app_handle, &name))
        .await
        .map_err(|e| e.to_string())?
}
