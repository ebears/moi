mod commands;
mod watcher;

#[cfg(feature = "system-tray")]
mod tray;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle().clone();
            match watcher::start_watcher(app_handle) {
                Ok(()) => println!("Filesystem watcher started"),
                Err(e) => eprintln!("Failed to start filesystem watcher: {}", e),
            }

            #[cfg(feature = "system-tray")]
            if let Err(e) = tray::setup_tray(app) {
                eprintln!("Failed to setup system tray: {}", e);
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::chezmoi::chezmoi_status,
            commands::chezmoi::chezmoi_apply,
            commands::chezmoi::chezmoi_apply_file,
            commands::chezmoi::chezmoi_diff,
            commands::chezmoi::chezmoi_cat_source,
            commands::chezmoi::chezmoi_data,
            commands::git::git_log,
            commands::git::git_show,
            commands::add::chezmoi_add,
            commands::secrets::op_item_get,
            commands::secrets::op_check_installed,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
