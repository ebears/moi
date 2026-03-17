<script lang="ts">
  import { Dialog } from "@skeletonlabs/skeleton-svelte";
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

<Dialog
  {open}
  onOpenChange={(details) => {
    if (!details.open) onclose();
  }}
>
  <Dialog.Positioner class="fixed inset-0 z-50 flex items-center justify-center">
    <Dialog.Backdrop class="fixed inset-0 bg-black/30" />
    <Dialog.Content class="relative bg-[var(--color-adwaita-card)] rounded-lg shadow-xl w-full max-w-lg flex flex-col">
      <div class="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
        <Dialog.Title class="text-lg font-semibold">
          Add File to Chezmoi
        </Dialog.Title>
        <Dialog.CloseTrigger class="p-1.5 rounded-md hover:bg-gray-100 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Dialog.CloseTrigger>
      </div>

      <div class="px-6 py-4">
        <!-- Step indicator -->
        <div class="flex gap-2 mb-6">
          {#each ["path", "type", "confirm"] as s}
            <div class="flex-1 h-1 rounded-full {step === s ? 'bg-[var(--color-adwaita-accent)]' : 'bg-gray-200'}"></div>
          {/each}
        </div>

        {#if step === "path"}
          <div class="space-y-3">
            <label class="block text-sm font-medium">Target file path</label>
            <input
              type="text"
              bind:value={filePath}
              placeholder="~/.config/app/config.toml"
              class="w-full px-3 py-2 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-adwaita-accent)] font-mono text-sm"
            />
          </div>
        {:else if step === "type"}
          <div class="space-y-3">
            <label class="block text-sm font-medium">File type</label>
            <div class="space-y-2">
              <label class="flex items-center gap-3 px-3 py-2 rounded-md border border-[var(--border-color)] cursor-pointer hover:bg-gray-50 {fileType === 'plain' ? 'ring-2 ring-[var(--color-adwaita-accent)]' : ''}">
                <input type="radio" bind:group={fileType} value="plain" class="sr-only" />
                <div class="w-4 h-4 rounded-full border-2 flex items-center justify-center {fileType === 'plain' ? 'border-[var(--color-adwaita-accent)]' : 'border-gray-300'}">
                  {#if fileType === "plain"}
                    <div class="w-2 h-2 rounded-full bg-[var(--color-adwaita-accent)]"></div>
                  {/if}
                </div>
                <div>
                  <div class="text-sm font-medium">Plain</div>
                  <div class="text-xs text-gray-500">Copy file as-is</div>
                </div>
              </label>
              <label class="flex items-center gap-3 px-3 py-2 rounded-md border border-[var(--border-color)] cursor-pointer hover:bg-gray-50 {fileType === 'template' ? 'ring-2 ring-[var(--color-adwaita-accent)]' : ''}">
                <input type="radio" bind:group={fileType} value="template" class="sr-only" />
                <div class="w-4 h-4 rounded-full border-2 flex items-center justify-center {fileType === 'template' ? 'border-[var(--color-adwaita-accent)]' : 'border-gray-300'}">
                  {#if fileType === "template"}
                    <div class="w-2 h-2 rounded-full bg-[var(--color-adwaita-accent)]"></div>
                  {/if}
                </div>
                <div>
                  <div class="text-sm font-medium">Template</div>
                  <div class="text-xs text-gray-500">Add as .tmpl template file</div>
                </div>
              </label>
              <label class="flex items-center gap-3 px-3 py-2 rounded-md border border-[var(--border-color)] cursor-pointer hover:bg-gray-50 {fileType === 'encrypt' ? 'ring-2 ring-[var(--color-adwaita-accent)]' : ''}">
                <input type="radio" bind:group={fileType} value="encrypt" class="sr-only" />
                <div class="w-4 h-4 rounded-full border-2 flex items-center justify-center {fileType === 'encrypt' ? 'border-[var(--color-adwaita-accent)]' : 'border-gray-300'}">
                  {#if fileType === "encrypt"}
                    <div class="w-2 h-2 rounded-full bg-[var(--color-adwaita-accent)]"></div>
                  {/if}
                </div>
                <div>
                  <div class="text-sm font-medium">Encrypted</div>
                  <div class="text-xs text-gray-500">Encrypt file contents</div>
                </div>
              </label>
            </div>
          </div>
        {:else if step === "confirm"}
          <div class="space-y-4">
            <div class="text-sm font-medium">Summary</div>
            <div class="bg-gray-50 rounded-md p-3 space-y-2 text-sm font-mono">
              <div><span class="text-gray-500">Path:</span> {filePath}</div>
              <div><span class="text-gray-500">Type:</span> {fileType}</div>
            </div>
            {#if error}
              <div class="text-sm text-red-600">{error}</div>
            {/if}
            {#if result !== null}
              <div class="text-sm text-green-600">File added successfully.</div>
            {/if}
          </div>
        {/if}
      </div>

      <div class="px-6 py-4 border-t border-[var(--border-color)] flex justify-between">
        <div>
          {#if step !== "path"}
            <button
              onclick={prevStep}
              class="px-4 py-2 text-sm rounded-md border border-[var(--border-color)] hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          {/if}
        </div>
        <div class="flex gap-2">
          {#if step !== "confirm"}
            <button
              onclick={nextStep}
              disabled={step === "path" && !filePath.trim()}
              class="px-4 py-2 text-sm rounded-md bg-[var(--color-adwaita-accent)] text-white hover:bg-[var(--color-adwaita-accent-hover)] transition-colors disabled:opacity-50"
            >
              Next
            </button>
          {:else if result === null}
            <button
              onclick={submit}
              disabled={submitting}
              class="px-4 py-2 text-sm rounded-md bg-[var(--color-adwaita-accent)] text-white hover:bg-[var(--color-adwaita-accent-hover)] transition-colors disabled:opacity-50"
            >
              {submitting ? "Adding..." : "Add File"}
            </button>
          {:else}
            <button
              onclick={onclose}
              class="px-4 py-2 text-sm rounded-md bg-[var(--color-adwaita-accent)] text-white hover:bg-[var(--color-adwaita-accent-hover)] transition-colors"
            >
              Done
            </button>
          {/if}
        </div>
      </div>
    </Dialog.Content>
  </Dialog.Positioner>
</Dialog>
