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
  <header class="flex items-center justify-between px-6 py-4 border-b border-[var(--clr-border)] bg-[var(--clr-bg-3)]">
    <h1 class="text-xl font-semibold">moi</h1>
    <div class="flex gap-3">
      <button
        onclick={openGitLogPanel}
        class="btn"
      >
        Git Log
      </button>
      <button
        onclick={openDataPanel}
        class="btn"
      >
        Data
      </button>
      <button
        onclick={openSecretsPanel}
        class="btn"
      >
        Secrets
      </button>
      <button
        onclick={openAddFileWizard}
        class="btn"
      >
        Add File
      </button>
      <button
        onclick={refreshStatus}
        class="btn"
      >
        Refresh
      </button>
      <button
        onclick={applyAll}
        class="btn primary"
      >
        Apply All
      </button>
    </div>
  </header>

  <!-- Content -->
  <main class="flex-1 overflow-auto p-6">
    {#if $statusLoading}
      <div class="text-center text-[var(--clr-text-2)] py-12">Loading status…</div>
    {:else if $statusError}
      <div class="text-center text-[var(--clr-danger)] py-12">
        <p class="font-medium">Error loading status</p>
        <p class="text-sm mt-1">{$statusError}</p>
      </div>
    {:else if $statusList.length === 0}
      <div class="text-center text-[var(--clr-text-3)] py-12">No pending changes</div>
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
