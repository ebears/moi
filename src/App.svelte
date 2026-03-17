<script lang="ts">
  import { onMount } from "svelte";
  import { statusList, statusLoading, statusError, refreshStatus } from "./lib/stores/status";
  import { invoke } from "@tauri-apps/api/core";
  import { listen } from "@tauri-apps/api/event";
  import FileTree from "./lib/components/FileTree.svelte";
  import DiffPanel from "./lib/components/DiffPanel.svelte";
  import SecretsPanel from "./lib/components/SecretsPanel.svelte";
  import GitLogPanel from "./lib/components/GitLogPanel.svelte";
  import DataPanel from "./lib/components/DataPanel.svelte";
  import AddFileWizard from "./lib/components/AddFileWizard.svelte";

  let selectedFile = $state<string | null>(null);
  let diffPanelOpen = $state(false);
  let secretsPanelOpen = $state(false);
  let gitLogPanelOpen = $state(false);
  let dataPanelOpen = $state(false);
  let addFileWizardOpen = $state(false);

  onMount(() => {
    refreshStatus();

    const unlistenChanged = listen("chezmoi://changed", () => {
      refreshStatus();
    });

    const unlistenTrayRefresh = listen("moi://tray-refresh", () => {
      refreshStatus();
    });

    return () => {
      unlistenChanged.then((fn) => fn());
      unlistenTrayRefresh.then((fn) => fn());
    };
  });

  async function applyAll() {
    try {
      await invoke("chezmoi_apply");
      await refreshStatus();
    } catch (e) {
      alert(`Apply failed: ${e}`);
    }
  }

  async function applyFile(path: string) {
    try {
      await invoke("chezmoi_apply_file", { path });
      await refreshStatus();
    } catch (e) {
      alert(`Apply failed: ${e}`);
    }
  }

  function handleFileSelect(path: string) {
    selectedFile = path;
    diffPanelOpen = true;
  }

  function closeDiffPanel() {
    diffPanelOpen = false;
  }

  function openSecretsPanel() {
    secretsPanelOpen = true;
  }

  function closeSecretsPanel() {
    secretsPanelOpen = false;
  }

  function openGitLogPanel() {
    gitLogPanelOpen = true;
  }

  function closeGitLogPanel() {
    gitLogPanelOpen = false;
  }

  function openDataPanel() {
    dataPanelOpen = true;
  }

  function closeDataPanel() {
    dataPanelOpen = false;
  }

  function openAddFileWizard() {
    addFileWizardOpen = true;
  }

  function closeAddFileWizard() {
    addFileWizardOpen = false;
  }
</script>

<div class="h-full flex flex-col">
  <!-- Header -->
  <header class="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-card)]">
    <h1 class="text-xl font-semibold">moi</h1>
    <div class="flex gap-3">
      <button
        onclick={openGitLogPanel}
        class="px-4 py-2 text-sm rounded-md border border-[var(--border-color)] hover:bg-gray-50 transition-colors"
      >
        Git Log
      </button>
      <button
        onclick={openDataPanel}
        class="px-4 py-2 text-sm rounded-md border border-[var(--border-color)] hover:bg-gray-50 transition-colors"
      >
        Data
      </button>
      <button
        onclick={openSecretsPanel}
        class="px-4 py-2 text-sm rounded-md border border-[var(--border-color)] hover:bg-gray-50 transition-colors"
      >
        Secrets
      </button>
      <button
        onclick={openAddFileWizard}
        class="px-4 py-2 text-sm rounded-md border border-[var(--border-color)] hover:bg-gray-50 transition-colors"
      >
        Add File
      </button>
      <button
        onclick={refreshStatus}
        class="px-4 py-2 text-sm rounded-md border border-[var(--border-color)] hover:bg-gray-50 transition-colors"
      >
        Refresh
      </button>
      <button
        onclick={applyAll}
        class="px-4 py-2 text-sm rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
      >
        Apply All
      </button>
    </div>
  </header>

  <!-- Content -->
  <main class="flex-1 overflow-auto p-6">
    {#if $statusLoading}
      <div class="text-center text-gray-500 py-12">Loading status…</div>
    {:else if $statusError}
      <div class="text-center text-red-600 py-12">
        <p class="font-medium">Error loading status</p>
        <p class="text-sm mt-1">{$statusError}</p>
      </div>
    {:else if $statusList.length === 0}
      <div class="text-center text-gray-400 py-12">No pending changes</div>
    {:else}
      <div class="space-y-2">
        <FileTree entries={$statusList} onselect={handleFileSelect} />
      </div>
    {/if}
  </main>
</div>

<DiffPanel open={diffPanelOpen} path={selectedFile} onclose={closeDiffPanel} />
<SecretsPanel open={secretsPanelOpen} onclose={closeSecretsPanel} />
<GitLogPanel open={gitLogPanelOpen} onclose={closeGitLogPanel} />
<DataPanel open={dataPanelOpen} onclose={closeDataPanel} />
<AddFileWizard open={addFileWizardOpen} onclose={closeAddFileWizard} />
