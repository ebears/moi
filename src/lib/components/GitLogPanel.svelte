<script lang="ts">
  import { gitLog, gitShow } from "../ipc";
  import { parseGitLog, type GitCommit } from "../git";

  interface Props {
    open: boolean;
    onclose: () => void;
  }

  let { open, onclose }: Props = $props();

  let commits = $state<GitCommit[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let expandedHash = $state<string | null>(null);
  let showDetail = $state("");
  let showLoading = $state(false);

  $effect(() => {
    if (open) {
      loadLog();
    }
  });

  async function loadLog() {
    loading = true;
    error = null;
    expandedHash = null;
    try {
      const output = await gitLog(50);
      commits = parseGitLog(output);
    } catch (e) {
      error = String(e);
    } finally {
      loading = false;
    }
  }

  async function toggleCommit(hash: string) {
    if (expandedHash === hash) {
      expandedHash = null;
      return;
    }
    expandedHash = hash;
    showLoading = true;
    try {
      showDetail = await gitShow(hash);
    } catch (e) {
      showDetail = `Error: ${e}`;
    } finally {
      showLoading = false;
    }
  }
</script>

{#if open}
  <div class="sidebar-panel-backdrop" onclick={onclose} role="presentation"></div>
  <div class="sidebar-panel" role="dialog" aria-modal="true">
    <div class="flex items-center justify-between px-6 py-4">
      <span class="header-sm">
        Git Log
      </span>
      <button class="btn flat p-1.5" onclick={onclose}>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    <div class="separator"></div>

    <div class="flex-1 overflow-auto font-mono text-sm">
      {#if loading}
        <div class="flex flex-col items-center justify-center h-full gap-3">
          <div class="spinner"><div class="inner-circle"></div></div>
          <span class="subtitle">Loading git log...</span>
        </div>
      {:else if error}
        <div class="flex items-center justify-center h-full text-[var(--clr-danger)] px-6 text-center">
          {error}
        </div>
      {:else if commits.length === 0}
        <div class="flex items-center justify-center h-full subtitle">
          No commits found
        </div>
      {:else}
        <div class="list">
          {#each commits as commit}
            <div>
              <button
                onclick={() => toggleCommit(commit.hash)}
                class="list-element activable w-full text-left flex gap-3"
              >
                <span class="text-[var(--color-git-hash)] label flex-shrink-0">
                  {commit.hash}
                </span>
                <span class="truncate">{commit.message}</span>
              </button>
              {#if expandedHash === commit.hash}
                <div class="px-4 py-3 bg-[var(--clr-bg-2)]">
                  <div class="separator"></div>
                  {#if showLoading}
                    <div class="flex items-center gap-2 pt-3">
                      <div class="spinner"><div class="inner-circle"></div></div>
                      <span class="subtitle">Loading...</span>
                    </div>
                  {:else}
                    <pre class="whitespace-pre-wrap text-xs pt-3">{showDetail}</pre>
                  {/if}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}
