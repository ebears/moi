use notify::{recommended_watcher, RecursiveMode, Watcher, Event, EventKind};
use std::sync::mpsc;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};

pub fn start_watcher(app_handle: AppHandle) -> Result<(), String> {
    let data_dir = dirs::data_local_dir()
        .ok_or("Could not find data directory")?
        .join("chezmoi");

    if !data_dir.exists() {
        return Err(format!("Chezmoi data directory not found: {:?}", data_dir));
    }

    let (tx, rx) = mpsc::channel::<Result<Event, notify::Error>>();

    let mut watcher = recommended_watcher(tx)
        .map_err(|e| format!("Failed to create watcher: {}", e))?;

    watcher
        .watch(&data_dir, RecursiveMode::Recursive)
        .map_err(|e| format!("Failed to watch directory: {}", e))?;

    // Spawn a thread to handle filesystem events with debounce
    std::thread::spawn(move || {
        let mut last_emit = Instant::now();
        let debounce_duration = Duration::from_millis(500);

        for event in rx {
            if let Ok(event) = event {
                match event.kind {
                    EventKind::Create(_) | EventKind::Modify(_) | EventKind::Remove(_) => {
                        let now = Instant::now();
                        if now.duration_since(last_emit) >= debounce_duration {
                            last_emit = now;
                            let _ = app_handle.emit("chezmoi://changed", ());
                        }
                    }
                    _ => {}
                }
            }
        }
    });

    // Keep watcher alive by leaking it (lives for app lifetime)
    std::mem::forget(watcher);

    Ok(())
}
