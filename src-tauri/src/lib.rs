mod commands;
mod fs;
use tokio::time::{sleep, Duration};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(fs::HomeFolderState::default())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Startup trash purge
            let handle = app.handle().clone();
            match fs::purge_trash(&handle, fs::load_settings(&handle).trash_retention_days) {
                Ok(count) => {
                    if count > 0 {
                        log::info!("Purged {} expired item(s) from trash", count);
                    }
                }
                Err(e) => log::error!("Failed to purge trash on startup: {}", e),
            }

            // Periodic cleanup every hour
            tauri::async_runtime::spawn(async move {
                loop {
                    sleep(Duration::from_secs(3600)).await;
                    let settings = fs::load_settings(&handle);
                    if let Err(e) = fs::purge_trash(&handle, settings.trash_retention_days) {
                        log::error!("Failed to purge trash: {}", e);
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::list_notes,
            commands::get_notes_dir,
            commands::read_note,
            commands::write_note,
            commands::create_folder,
            commands::delete_folder,
            commands::list_folders,
            commands::list_notes_in_folder,
            commands::list_library_snapshot,
            commands::delete_note,
            commands::search_notes,
            commands::rename_note,
            commands::rename_folder,
            commands::move_note,
            commands::move_folder,
            commands::load_settings,
            commands::save_settings,
            commands::list_user_themes,
            commands::read_user_theme_css,
            commands::set_home_folder,
            commands::reset_home_folder,
            commands::get_home_folder,
            commands::home_folder_status,
            commands::count_md_files,
            commands::migrate_content,
            commands::trash_note,
            commands::trash_folder,
            commands::list_trash,
            commands::restore_trash_entry,
            commands::permanently_delete_trash_entry,
            commands::repair_integrity,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
