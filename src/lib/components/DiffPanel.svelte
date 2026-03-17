<script lang="ts">
  import { onMount } from "svelte";
  import { Dialog } from "@skeletonlabs/skeleton-svelte";
  import { chezmoiDiff, chezmoiApplyFile, chezmoiCatSource } from "../ipc";
  import { refreshStatus } from "../stores/status";
  import { parseSideBySide, type DiffLine, parseUnifiedDiff } from "../diff";
  import { highlightCode } from "../highlight";
  import { highlightTemplateSource } from "../template";

  interface Props {
    open: boolean;
    path: string | null;
    onclose: () => void;
  }

  let { open, path, onclose }: Props = $props();

  let diffLines = $state<ReturnType<typeof parseSideBySide>>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let applying = $state(false);
  let activeTab = $state<"diff" | "source">("diff");
  let sourceContent = $state("");
  let sourceLoading = $state(false);

  let isTemplate = $derived(path?.endsWith(".tmpl") ?? false);

  $effect(() => {
    if (open && path) {
      activeTab = "diff";
      loadDiff(path);
    }
  });

  async function loadSource() {
    if (!path) return;
    sourceLoading = true;
    try {
      sourceContent = await chezmoiCatSource(path);
    } catch (e) {
      sourceContent = `Error: ${e}`;
    } finally {
      sourceLoading = false;
    }
  }

  function switchTab(tab: "diff" | "source") {
    activeTab = tab;
    if (tab === "source" && !sourceContent) {
      loadSource();
    }
  }

  async function loadDiff(filePath: string) {
    loading = true;
    error = null;
    try {
      const rawDiff = await chezmoiDiff(filePath);
      const parsed = parseUnifiedDiff(rawDiff);
      diffLines = parseSideBySide(parsed);
    } catch (e) {
      error = String(e);
    } finally {
      loading = false;
    }
  }

  async function applyFile() {
    if (!path) return;
    applying = true;
    try {
      await chezmoiApplyFile(path);
      await refreshStatus();
      onclose();
    } catch (e) {
      error = String(e);
    } finally {
      applying = false;
    }
  }

  function lineClass(type: string | undefined): string {
    switch (type) {
      case "remove": return "bg-[var(--color-diff-remove-bg)] text-[var(--color-diff-remove-text)]";
      case "add": return "bg-[var(--color-diff-add-bg)] text-[var(--color-diff-add-text)]";
      default: return "bg-[var(--color-diff-context-bg)]";
    }
  }
</script>

<Dialog
  {open}
  onOpenChange={(details) => {
    if (!details.open) onclose();
  }}
>
  <Dialog.Positioner class="fixed right-0 top-0 h-full w-[60vw] z-50">
    <Dialog.Backdrop class="fixed inset-0 bg-black/30" />
    <Dialog.Content class="h-full bg-[var(--color-adwaita-card)] shadow-xl flex flex-col">
      <div class="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
        <div class="flex items-center gap-4">
          <Dialog.Title class="text-lg font-semibold font-mono truncate">
            {path}
          </Dialog.Title>
          {#if isTemplate}
            <div class="flex gap-1 text-sm">
              <button
                onclick={() => switchTab("diff")}
                class="px-3 py-1 rounded-md transition-colors {activeTab === 'diff' ? 'bg-[var(--color-adwaita-accent)] text-white' : 'hover:bg-gray-100'}"
              >
                Diff
              </button>
              <button
                onclick={() => switchTab("source")}
                class="px-3 py-1 rounded-md transition-colors {activeTab === 'source' ? 'bg-[var(--color-adwaita-accent)] text-white' : 'hover:bg-gray-100'}"
              >
                Source
              </button>
            </div>
          {/if}
        </div>
        <div class="flex gap-2">
          <button
            onclick={applyFile}
            disabled={applying}
            class="px-3 py-1.5 text-xs rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
          >
            {applying ? "Applying..." : "Apply"}
          </button>
          <Dialog.CloseTrigger class="p-1.5 rounded-md hover:bg-gray-100 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Dialog.CloseTrigger>
        </div>
      </div>

      <div class="flex-1 overflow-auto font-mono text-sm">
        {#if activeTab === "source" && isTemplate}
          {#if sourceLoading}
            <div class="flex items-center justify-center h-full text-gray-500">
              Loading source...
            </div>
          {:else}
            <pre class="p-4 whitespace-pre-wrap">{@html highlightTemplateSource(sourceContent)}</pre>
          {/if}
        {:else if loading}
          <div class="flex items-center justify-center h-full text-gray-500">
            Loading diff...
          </div>
        {:else if error}
          <div class="flex items-center justify-center h-full text-red-600">
            {error}
          </div>
        {:else if diffLines.length === 0}
          <div class="flex items-center justify-center h-full text-gray-400">
            No differences
          </div>
        {:else}
          <div class="divide-y divide-[var(--border-color)]">
            {#each diffLines as line}
              {#if line.isHeader}
                <div class="px-4 py-1 bg-gray-100 text-gray-600 font-semibold text-xs">
                  {line.leftContent}
                </div>
              {:else if line.isHunk}
                <div class="px-4 py-1 bg-blue-50 text-blue-700 text-xs">
                  {line.leftContent}
                </div>
              {:else}
                <div class="grid grid-cols-2 divide-x divide-[var(--border-color)]">
                  <!-- Left side (original) -->
                  <div class="{lineClass(line.leftType)}">
                    <div class="flex">
                      <span class="w-12 px-2 py-0.5 text-right text-[var(--color-diff-line-num)] bg-gray-50 select-none flex-shrink-0">
                        {line.leftNum ?? ""}
                      </span>
                      <span class="px-2 py-0.5 flex-1 whitespace-pre overflow-x-auto">
                        {line.leftContent ?? ""}
                      </span>
                    </div>
                  </div>
                  <!-- Right side (modified) -->
                  <div class="{lineClass(line.rightType)}">
                    <div class="flex">
                      <span class="w-12 px-2 py-0.5 text-right text-[var(--color-diff-line-num)] bg-gray-50 select-none flex-shrink-0">
                        {line.rightNum ?? ""}
                      </span>
                      <span class="px-2 py-0.5 flex-1 whitespace-pre overflow-x-auto">
                        {line.rightContent ?? ""}
                      </span>
                    </div>
                  </div>
                </div>
              {/if}
            {/each}
          </div>
        {/if}
      </div>
    </Dialog.Content>
  </Dialog.Positioner>
</Dialog>
