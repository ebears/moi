<script lang="ts">
  import { Dialog } from "@skeletonlabs/skeleton-svelte";
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
        <Dialog.Title class="text-lg font-semibold">
          Git Log
        </Dialog.Title>
        <Dialog.CloseTrigger class="p-1.5 rounded-md hover:bg-gray-100 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Dialog.CloseTrigger>
      </div>

      <div class="flex-1 overflow-auto font-mono text-sm">
        {#if loading}
          <div class="flex items-center justify-center h-full text-gray-500">
            Loading git log...
          </div>
        {:else if error}
          <div class="flex items-center justify-center h-full text-red-600 px-6 text-center">
            {error}
          </div>
        {:else if commits.length === 0}
          <div class="flex items-center justify-center h-full text-gray-400">
            No commits found
          </div>
        {:else}
          <div class="divide-y divide-[var(--border-color)]">
            {#each commits as commit}
              <div>
                <button
                  onclick={() => toggleCommit(commit.hash)}
                  class="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex gap-3"
                >
                  <span class="text-[var(--color-adwaita-accent)] font-semibold flex-shrink-0">
                    {commit.hash}
                  </span>
                  <span class="truncate">{commit.message}</span>
                </button>
                {#if expandedHash === commit.hash}
                  <div class="px-4 py-3 bg-gray-50 border-t border-[var(--border-color)]">
                    {#if showLoading}
                      <div class="text-gray-500">Loading...</div>
                    {:else}
                      <pre class="whitespace-pre-wrap text-xs">{showDetail}</pre>
                    {/if}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </Dialog.Content>
  </Dialog.Positioner>
</Dialog>
