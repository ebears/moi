use serde::Serialize;
use std::process::Command;

#[derive(Serialize)]
pub struct OpItemResult {
    pub id: String,
    pub title: String,
    pub resolvable: bool,
}

#[tauri::command]
pub async fn op_item_get(item_id: String) -> Result<OpItemResult, String> {
    let output = Command::new("op")
        .args(["item", "get", &item_id, "--format=json"])
        .output()
        .map_err(|e| format!("Failed to run op CLI: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        if stderr.contains("not found") || stderr.contains("not signed in") {
            return Ok(OpItemResult {
                id: item_id,
                title: "Unknown".to_string(),
                resolvable: false,
            });
        }
        return Err(format!("op item get failed: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let json: serde_json::Value = serde_json::from_str(&stdout)
        .map_err(|e| format!("Failed to parse op output: {}", e))?;

    let title = json["title"].as_str().unwrap_or("Unknown").to_string();
    let id = json["id"].as_str().unwrap_or(&item_id).to_string();

    Ok(OpItemResult {
        id,
        title,
        resolvable: true,
    })
}

#[tauri::command]
pub async fn op_check_installed() -> Result<bool, String> {
    match Command::new("op").arg("--version").output() {
        Ok(output) => Ok(output.status.success()),
        Err(_) => Ok(false),
    }
}
