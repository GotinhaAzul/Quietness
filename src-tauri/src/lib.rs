mod commands;
mod fs;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      commands::list_notes,
      commands::get_notes_dir,
      commands::read_note,
      commands::write_note,
      commands::list_folders,
      commands::list_notes_in_folder,
      commands::delete_note,
      commands::search_notes,
      commands::rename_note,
      commands::load_settings,
      commands::save_settings,
      commands::list_user_themes,
      commands::read_user_theme_css,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
