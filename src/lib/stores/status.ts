import { writable } from "svelte/store";
import { emit } from "@tauri-apps/api/event";
import { chezmoiStatus, type ChezmoiEntry } from "../ipc";

export const statusList = writable<ChezmoiEntry[]>([]);
export const statusLoading = writable(false);
export const statusError = writable<string | null>(null);

export async function refreshStatus(): Promise<void> {
  statusLoading.set(true);
  statusError.set(null);
  try {
    const entries = await chezmoiStatus();
    statusList.set(entries);
    await emit("moi://status-update", { count: entries.length });
  } catch (e) {
    statusError.set(String(e));
  } finally {
    statusLoading.set(false);
  }
}
