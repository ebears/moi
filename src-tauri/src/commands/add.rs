use std::process::Command;

#[tauri::command]
pub async fn chezmoi_add(path: String, template: bool, encrypt: bool) -> Result<String, String> {
    let mut args = vec!["add"];

    if template {
        args.push("--template");
    }

    if encrypt {
        args.push("--encrypt");
    }

    args.push(&path);

    let output = Command::new("chezmoi")
        .args(&args)
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}
