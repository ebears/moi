use std::process::Command;

#[tauri::command]
pub async fn chezmoi_status() -> Result<String, String> {
    let output = Command::new("chezmoi")
        .arg("status")
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

#[tauri::command]
pub async fn chezmoi_apply() -> Result<String, String> {
    let output = Command::new("chezmoi")
        .arg("apply")
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

#[tauri::command]
pub async fn chezmoi_apply_file(path: String) -> Result<String, String> {
    let output = Command::new("chezmoi")
        .args(["apply", &path])
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

#[tauri::command]
pub async fn chezmoi_diff(path: String) -> Result<String, String> {
    let output = Command::new("chezmoi")
        .args(["diff", "--", &path])
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

#[tauri::command]
pub async fn chezmoi_cat_source(path: String) -> Result<String, String> {
    let output = Command::new("chezmoi")
        .args(["cat", &path])
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

#[tauri::command]
pub async fn chezmoi_data() -> Result<String, String> {
    let output = Command::new("chezmoi")
        .args(["data", "--format=json"])
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}
