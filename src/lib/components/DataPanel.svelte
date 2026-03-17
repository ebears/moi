<script lang="ts">
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

{#if open}
  <div class="dialog-overlay" onclick={onclose} role="presentation"></div>
  <div class="dialog" role="dialog" aria-modal="true">
    <div class="dialog-header">
      <span class="dialog-title">Chezmoi Data</span>
      <button class="btn flat p-1.5" onclick={onclose} aria-label="Close">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div class="px-6 py-3">
      <div class="separator"></div>
      <input
        type="text"
        bind:value={search}
        placeholder="Filter keys..."
        class="input w-full"
      />
    </div>

    <div class="dialog-body font-mono text-sm" style="max-height: 60vh; overflow: auto;">
      {#if loading}
        <div class="flex flex-col items-center justify-center py-8 gap-3">
          <div class="spinner"><div class="inner-circle"></div></div>
          <span class="subtitle">Loading data...</span>
        </div>
      {:else if error}
        <div class="text-center text-[var(--clr-danger)] py-8">
          {error}
        </div>
      {:else if filteredKeys.length === 0}
        <div class="text-center subtitle py-8">
          {search.trim() ? "No matching keys" : "No data"}
        </div>
      {:else}
        <div class="list">
          {#each filteredKeys as key}
            {@const val = data[key]}
            {@const type = valueType(val)}
            <div>
              <button
                onclick={() => toggleKey(key)}
                class="list-element activable w-full text-left flex items-center gap-2"
              >
                <span class="subtitle w-4 flex-shrink-0">
                  {#if type === "object" || type === "array"}
                    {expandedKeys.has(key) ? "\u25bc" : "\u25b6"}
                  {:else}
                    {" "}
                  {/if}
                </span>
                <span class="label">{key}</span>
                <span class="subtitle text-xs">({type})</span>
              </button>
              {#if expandedKeys.has(key) && (type === "object" || type === "array")}
                <div class="ml-6 pl-3 py-1" style="border-left: 1px solid var(--clr-dimmed);">
                  {#if type === "object" && val !== null && val !== undefined}
                    {#each Object.entries(val as Record<string, unknown>) as [subKey, subVal]}
                      <div class="flex gap-2 py-0.5">
                        <span class="text-[var(--adw-accent)]">{subKey}:</span>
                        <span class="subtitle">{formatValue(subVal)}</span>
                      </div>
                    {/each}
                  {:else if type === "array" && Array.isArray(val)}
                    {#each val as item, i}
                      <div class="flex gap-2 py-0.5">
                        <span class="subtitle">[{i}]</span>
                        <span class="subtitle">{formatValue(item)}</span>
                      </div>
                    {/each}
                  {/if}
                </div>
              {:else if type !== "object" && type !== "array"}
                <div class="ml-6 subtitle py-0.5">
                  {formatValue(val)}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}
