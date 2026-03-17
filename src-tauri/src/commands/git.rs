use std::process::Command;

fn get_source_dir() -> Result<String, String> {
    let output = Command::new("chezmoi")
        .arg("source-path")
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

#[tauri::command]
pub async fn git_log(count: Option<u32>) -> Result<String, String> {
    let source_dir = get_source_dir()?;
    let n = count.unwrap_or(50).to_string();

    let output = Command::new("git")
        .args(["-C", &source_dir, "log", "--oneline", "-n", &n])
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

#[tauri::command]
pub async fn git_show(hash: String) -> Result<String, String> {
    let source_dir = get_source_dir()?;

    let output = Command::new("git")
        .args(["-C", &source_dir, "show", &hash, "--stat"])
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}
