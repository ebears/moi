<script lang="ts">
  import { onMount } from "svelte";
  import "adwaveui";
  import { chezmoiAdd } from "../ipc";
  import { refreshStatus } from "../stores/status";

  interface Props {
    open: boolean;
    onclose: () => void;
  }

  let { open, onclose }: Props = $props();

  type Step = "path" | "type" | "confirm";
  let step = $state<Step>("path");
  let filePath = $state("");
  let fileType = $state<"plain" | "template" | "encrypt">("plain");
  let submitting = $state(false);
  let error = $state<string | null>(null);
  let result = $state<string | null>(null);
  let selectorEl: HTMLElement | undefined = $state();

  $effect(() => {
    if (open) {
      step = "path";
      filePath = "";
      fileType = "plain";
      submitting = false;
      error = null;
      result = null;
    }
  });

  onMount(() => {
    selectorEl?.addEventListener("change", (e: Event) => {
      const ce = e as CustomEvent;
      fileType = ce.detail.value;
    });
  });

  function nextStep() {
    if (step === "path") {
      if (!filePath.trim()) return;
      step = "type";
    } else if (step === "type") {
      step = "confirm";
    }
  }

  function prevStep() {
    if (step === "type") {
      step = "path";
    } else if (step === "confirm") {
      step = "type";
    }
  }

  async function submit() {
    submitting = true;
    error = null;
    try {
      result = await chezmoiAdd(
        filePath,
        fileType === "template",
        fileType === "encrypt",
      );
      await refreshStatus();
    } catch (e) {
      error = String(e);
    } finally {
      submitting = false;
    }
  }
</script>

{#if open}
  <div class="dialog-overlay" onclick={onclose} role="presentation"></div>
  <div class="dialog" role="dialog" aria-modal="true">
    <div class="dialog-header">
      <span class="dialog-title">Add File to Chezmoi</span>
      <button class="btn flat p-1.5" onclick={onclose}>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div class="dialog-body">
      <!-- Step indicator -->
      <div class="flex gap-2 mb-6">
        {#each ["path", "type", "confirm"] as s}
          <div class="flex-1 h-1 rounded-full {step === s ? 'bg-[var(--adw-accent)]' : 'bg-[var(--clr-bg-3)]'}"></div>
        {/each}
      </div>

      {#if step === "path"}
        <div class="space-y-3">
          <label class="block label">Target file path</label>
          <input
            type="text"
            bind:value={filePath}
            placeholder="~/.config/app/config.toml"
            class="input w-full font-mono"
          />
        </div>
      {:else if step === "type"}
        <div class="space-y-3">
          <label class="block label">File type</label>
          <adw-selector bind:this={selectorEl} value={fileType}>
            <adw-option value="plain">Plain</adw-option>
            <adw-option value="template">Template</adw-option>
            <adw-option value="encrypt">Encrypted</adw-option>
          </adw-selector>
        </div>
      {:else if step === "confirm"}
        <div class="space-y-4">
          <div class="label">Summary</div>
          <div class="card font-mono text-sm">
            <div><span class="subtitle">Path:</span> {filePath}</div>
            <div><span class="subtitle">Type:</span> {fileType}</div>
          </div>
          {#if error}
            <div class="text-sm text-[var(--clr-danger)]">{error}</div>
          {/if}
          {#if result !== null}
            <div class="text-sm text-[var(--clr-success)]">File added successfully.</div>
          {/if}
        </div>
      {/if}
    </div>

    <div class="separator"></div>
    <div class="px-6 py-4 flex justify-between">
      <div>
        {#if step !== "path"}
          <button onclick={prevStep} class="btn">
            Back
          </button>
        {/if}
      </div>
      <div class="flex gap-2">
        {#if step !== "confirm"}
          <button
            onclick={nextStep}
            disabled={step === "path" && !filePath.trim()}
            class="btn primary {step === "path" && !filePath.trim() ? 'disabled' : ''}"
          >
            Next
          </button>
        {:else if result === null}
          <button
            onclick={submit}
            disabled={submitting}
            class="btn primary {submitting ? 'disabled' : ''}"
          >
            {submitting ? "Adding..." : "Add File"}
          </button>
        {:else}
          <button onclick={onclose} class="btn primary">
            Done
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}
