<script lang="ts">
  import { onMount } from "svelte";
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

{#if open}
  <div class="sidebar-panel-backdrop" onclick={onclose} role="presentation"></div>
  <div class="sidebar-panel" role="dialog" aria-modal="true">
    <div class="flex items-center justify-between px-6 py-4">
      <div class="flex items-center gap-4">
        <span class="label font-mono truncate">
          {path}
        </span>
        {#if isTemplate}
          <div class="flex gap-1 text-xs">
            <button
              onclick={() => switchTab("diff")}
              class="px-3 py-1.5 transition-colors {activeTab === 'diff' ? 'text-[var(--adw-accent)] border-b-2 border-[var(--adw-accent)]' : 'subtitle hover:text-[var(--clr-text)]'}"
            >
              Diff
            </button>
            <button
              onclick={() => switchTab("source")}
              class="px-3 py-1.5 transition-colors {activeTab === 'source' ? 'text-[var(--adw-accent)] border-b-2 border-[var(--adw-accent)]' : 'subtitle hover:text-[var(--clr-text)]'}"
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
          class="btn primary text-xs {applying ? 'disabled' : ''}"
        >
          {applying ? "Applying..." : "Apply"}
        </button>
        <button class="btn flat p-1.5" onclick={onclose}>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
    <div class="separator"></div>

    <div class="flex-1 overflow-auto font-mono text-sm">
      {#if activeTab === "source" && isTemplate}
        {#if sourceLoading}
          <div class="flex flex-col items-center justify-center h-full gap-3">
            <div class="spinner"><div class="inner-circle"></div></div>
            <span class="subtitle">Loading source...</span>
          </div>
        {:else}
          <pre class="p-4 whitespace-pre-wrap">{@html highlightTemplateSource(sourceContent)}</pre>
        {/if}
      {:else if loading}
        <div class="flex flex-col items-center justify-center h-full gap-3">
          <div class="spinner"><div class="inner-circle"></div></div>
          <span class="subtitle">Loading diff...</span>
        </div>
      {:else if error}
        <div class="flex items-center justify-center h-full text-[var(--clr-danger)]">
          {error}
        </div>
      {:else if diffLines.length === 0}
        <div class="flex items-center justify-center h-full subtitle">
          No differences
        </div>
      {:else}
        <div>
          {#each diffLines as line}
            {#if line.isHeader}
              <div class="px-4 py-1 bg-[var(--clr-bg-2)] subtitle font-semibold text-xs">
                {line.leftContent}
              </div>
              <div class="separator"></div>
            {:else if line.isHunk}
              <div class="px-4 py-1 bg-[color-mix(in_srgb,var(--adw-accent)_12%,transparent)] text-[var(--adw-accent)] text-xs">
                {line.leftContent}
              </div>
              <div class="separator"></div>
            {:else}
              <div class="grid grid-cols-2" style="border-right: 1px solid var(--clr-dimmed);">
                <!-- Left side (original) -->
                <div class="{lineClass(line.leftType)}">
                  <div class="flex">
                    <span class="w-12 px-2 py-0.5 text-right text-[var(--color-diff-line-num)] bg-[var(--clr-bg-2)] select-none flex-shrink-0">
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
                    <span class="w-12 px-2 py-0.5 text-right text-[var(--color-diff-line-num)] bg-[var(--clr-bg-2)] select-none flex-shrink-0">
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
  </div>
{/if}
