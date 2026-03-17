import { invoke } from "@tauri-apps/api/core";

export interface ChezmoiEntry {
  path: string;
  status: string;
}

export async function chezmoiStatus(): Promise<ChezmoiEntry[]> {
  const raw: string = await invoke("chezmoi_status");
  if (!raw.trim()) return [];

  const lines = raw.trim().split("\n");
  return lines
    .filter((line) => line.length >= 3)
    .map((line) => {
      const firstCol = line[0] ?? " ";
      const secondCol = line[1] ?? " ";
      const path = line.slice(3);
      // Use the most relevant status: what apply will do (second column)
      // falls back to first column if second is empty
      const status = secondCol !== " " ? secondCol : firstCol;
      return { path, status };
    });
}

export async function chezmoiApply(): Promise<void> {
  await invoke("chezmoi_apply");
}

export async function chezmoiApplyFile(path: string): Promise<void> {
  await invoke("chezmoi_apply_file", { path });
}

export async function chezmoiDiff(path: string): Promise<string> {
  return await invoke("chezmoi_diff", { path });
}

export async function chezmoiCatSource(path: string): Promise<string> {
  return await invoke("chezmoi_cat_source", { path });
}

export interface OpItemResult {
  id: string;
  title: string;
  resolvable: boolean;
}

export async function opItemGet(itemId: string): Promise<OpItemResult> {
  return await invoke("op_item_get", { itemId });
}

export async function opCheckInstalled(): Promise<boolean> {
  return await invoke("op_check_installed");
}

export async function gitLog(count?: number): Promise<string> {
  return await invoke("git_log", { count });
}

export async function gitShow(hash: string): Promise<string> {
  return await invoke("git_show", { hash });
}

export async function chezmoiData(): Promise<Record<string, unknown>> {
  const raw: string = await invoke("chezmoi_data");
  return JSON.parse(raw);
}

export async function chezmoiAdd(
  path: string,
  template: boolean,
  encrypt: boolean,
): Promise<string> {
  return await invoke("chezmoi_add", { path, template, encrypt });
}
