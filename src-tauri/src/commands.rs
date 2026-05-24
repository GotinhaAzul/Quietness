use tauri::AppHandle;
use crate::fs::{self, FolderEntry, NoteEntry, Settings, UserThemeEntry};

#[tauri::command]
pub fn list_notes(app_handle: AppHandle) -> Vec<NoteEntry> {
    fs::list_notes(&app_handle)
}

#[tauri::command]
pub fn get_notes_dir(app_handle: AppHandle) -> String {
    fs::get_notes_dir(&app_handle)
        .to_string_lossy()
        .to_string()
}

#[tauri::command]
pub fn read_note(app_handle: AppHandle, path: String) -> Result<String, String> {
    fs::read_note(&app_handle, &path)
}

#[tauri::command]
pub fn write_note(app_handle: AppHandle, path: String, content: String) -> Result<(), String> {
    fs::write_note(&app_handle, &path, &content)
}

#[tauri::command]
pub fn create_folder(app_handle: AppHandle, path: String) -> Result<(), String> {
    fs::create_folder(&app_handle, &path)
}

#[tauri::command]
pub fn list_folders(app_handle: AppHandle) -> Vec<FolderEntry> {
    fs::list_folders(&app_handle)
}

#[tauri::command]
pub fn list_notes_in_folder(app_handle: AppHandle, folder_path: String) -> Vec<NoteEntry> {
    fs::list_notes_in_folder(&app_handle, &folder_path)
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
) -> Vec<NoteEntry> {
    let scope = scope.unwrap_or_else(|| "all_notes".to_string());
    fs::search_notes(&app_handle, &query, &scope, scope_path.as_deref()).await
}

#[tauri::command]
pub fn rename_note(app_handle: AppHandle, old_path: String, new_name: String) -> Result<(), String> {
    fs::rename_note(&app_handle, &old_path, &new_name)
}

#[tauri::command]
pub fn load_settings(app_handle: AppHandle) -> Settings {
    fs::load_settings(&app_handle)
}

#[tauri::command]
pub fn save_settings(app_handle: AppHandle, settings: Settings) -> Result<(), String> {
    fs::save_settings(&app_handle, &settings)
}

#[tauri::command]
pub fn list_user_themes(app_handle: AppHandle) -> Vec<UserThemeEntry> {
    fs::list_user_themes(&app_handle)
}

#[tauri::command]
pub fn read_user_theme_css(app_handle: AppHandle, id: String) -> Result<String, String> {
    fs::read_user_theme_css(&app_handle, &id)
}
