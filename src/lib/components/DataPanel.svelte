<script lang="ts">
  import { Dialog } from "@skeletonlabs/skeleton-svelte";
  import { chezmoiData } from "../ipc";

  interface Props {
    open: boolean;
    onclose: () => void;
  }

  let { open, onclose }: Props = $props();

  let data = $state<Record<string, unknown>>({});
  let loading = $state(false);
  let error = $state<string | null>(null);
  let search = $state("");
  let expandedKeys = $state<Set<string>>(new Set());

  $effect(() => {
    if (open) {
      loadData();
    }
  });

  async function loadData() {
    loading = true;
    error = null;
    try {
      data = await chezmoiData();
      // Expand top-level keys by default
      expandedKeys = new Set(Object.keys(data));
    } catch (e) {
      error = String(e);
    } finally {
      loading = false;
    }
  }

  function toggleKey(key: string) {
    const next = new Set(expandedKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    expandedKeys = next;
  }

  function formatValue(val: unknown): string {
    if (val === null) return "null";
    if (val === undefined) return "undefined";
    if (typeof val === "string") return `"${val}"`;
    if (typeof val === "number" || typeof val === "boolean") return String(val);
    return JSON.stringify(val);
  }

  function valueType(val: unknown): string {
    if (val === null) return "null";
    if (Array.isArray(val)) return "array";
    return typeof val;
  }

  let filteredKeys = $derived.by(() => {
    const keys = Object.keys(data);
    if (!search.trim()) return keys;
    const q = search.toLowerCase();
    return keys.filter((k) => k.toLowerCase().includes(q));
  });
</script>

<Dialog
  {open}
  onOpenChange={(details) => {
    if (!details.open) onclose();
  }}
>
  <Dialog.Positioner class="fixed inset-0 z-50 flex items-center justify-center">
    <Dialog.Backdrop class="fixed inset-0 bg-black/30" />
    <Dialog.Content class="relative bg-[var(--color-adwaita-card)] rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
      <div class="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
        <Dialog.Title class="text-lg font-semibold">
          Chezmoi Data
        </Dialog.Title>
        <Dialog.CloseTrigger class="p-1.5 rounded-md hover:bg-gray-100 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Dialog.CloseTrigger>
      </div>

      <div class="px-6 py-3 border-b border-[var(--border-color)]">
        <input
          type="text"
          bind:value={search}
          placeholder="Filter keys..."
          class="w-full px-3 py-2 text-sm border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-adwaita-accent)]"
        />
      </div>

      <div class="flex-1 overflow-auto px-6 py-4 font-mono text-sm">
        {#if loading}
          <div class="text-center text-gray-500 py-8">
            Loading data...
          </div>
        {:else if error}
          <div class="text-center text-red-600 py-8">
            {error}
          </div>
        {:else if filteredKeys.length === 0}
          <div class="text-center text-gray-400 py-8">
            {search.trim() ? "No matching keys" : "No data"}
          </div>
        {:else}
          <div class="space-y-1">
            {#each filteredKeys as key}
              {@const val = data[key]}
              {@const type = valueType(val)}
              <div>
                <button
                  onclick={() => toggleKey(key)}
                  class="w-full text-left px-2 py-1 rounded hover:bg-gray-50 flex items-center gap-2"
                >
                  <span class="text-gray-400 w-4 flex-shrink-0">
                    {#if type === "object" || type === "array"}
                      {expandedKeys.has(key) ? "▼" : "▶"}
                    {:else}
                      {" "}
                    {/if}
                  </span>
                  <span class="font-semibold text-[var(--color-adwaita-fg)]">{key}</span>
                  <span class="text-gray-400 text-xs">({type})</span>
                </button>
                {#if expandedKeys.has(key) && (type === "object" || type === "array")}
                  <div class="ml-6 border-l border-[var(--border-color)] pl-3 py-1">
                    {#if type === "object" && val !== null && val !== undefined}
                      {#each Object.entries(val as Record<string, unknown>) as [subKey, subVal]}
                        <div class="flex gap-2 py-0.5">
                          <span class="text-[var(--color-adwaita-accent)]">{subKey}:</span>
                          <span class="text-gray-600">{formatValue(subVal)}</span>
                        </div>
                      {/each}
                    {:else if type === "array" && Array.isArray(val)}
                      {#each val as item, i}
                        <div class="flex gap-2 py-0.5">
                          <span class="text-gray-400">[{i}]</span>
                          <span class="text-gray-600">{formatValue(item)}</span>
                        </div>
                      {/each}
                    {/if}
                  </div>
                {:else if type !== "object" && type !== "array"}
                  <div class="ml-6 text-gray-600 py-0.5">
                    {formatValue(val)}
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
