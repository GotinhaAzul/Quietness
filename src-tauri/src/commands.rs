use tauri::AppHandle;
use crate::fs::{self, FolderEntry, NoteEntry};

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
pub fn list_folders(app_handle: AppHandle) -> Vec<FolderEntry> {
    fs::list_folders(&app_handle)
}

#[tauri::command]
pub fn list_notes_in_folder(app_handle: AppHandle, folder_path: String) -> Vec<NoteEntry> {
    fs::list_notes_in_folder(&app_handle, &folder_path)
}

#[tauri::command]
pub fn delete_note(app_handle: AppHandle, path: String) -> Result<(), String> {
    fs::delete_note(&app_handle, &path)
}
