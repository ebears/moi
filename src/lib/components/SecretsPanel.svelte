<script lang="ts">
  import { onMount } from "svelte";
  import { Dialog } from "@skeletonlabs/skeleton-svelte";
  import { statusList } from "../stores/status";
  import { chezmoiCatSource, opItemGet, opCheckInstalled, type OpItemResult } from "../ipc";
  import { parseSecretReferences, type SecretReference } from "../secrets";

  interface Props {
    open: boolean;
    onclose: () => void;
  }

  let { open, onclose }: Props = $props();

  interface SecretEntry extends SecretReference {
    status: "checking" | "resolvable" | "unresolvable" | "error";
    itemTitle?: string;
    errorMessage?: string;
  }

  let secrets = $state<SecretEntry[]>([]);
  let loading = $state(false);
  let opInstalled = $state<boolean | null>(null);

  $effect(() => {
    if (open) {
      loadSecrets();
    }
  });

  async function loadSecrets() {
    loading = true;
    secrets = [];

    try {
      // Check if op CLI is installed
      opInstalled = await opCheckInstalled();

      // Get all file entries from status
      const entries = $statusList;
      const allRefs: SecretReference[] = [];

      for (const entry of entries) {
        try {
          const source = await chezmoiCatSource(entry.path);
          const refs = parseSecretReferences(source, entry.path);
          allRefs.push(...refs);
        } catch {
          // Skip files that can't be read
        }
      }

      // Initialize secrets with checking status
      secrets = allRefs.map((ref) => ({ ...ref, status: "checking" as const }));

      // Check each secret reference
      const updatedSecrets = [...secrets];
      for (let i = 0; i < updatedSecrets.length; i++) {
        const secret = updatedSecrets[i]!;
        if (!opInstalled) {
          updatedSecrets[i] = { ...secret, status: "error" as const, errorMessage: "1Password CLI not installed" };
          continue;
        }

        try {
          const result = await opItemGet(secret.itemId);
          updatedSecrets[i] = {
            ...secret,
            status: result.resolvable ? "resolvable" as const : "unresolvable" as const,
            itemTitle: result.title,
          };
        } catch (e) {
          updatedSecrets[i] = { ...secret, status: "error" as const, errorMessage: String(e) };
        }
      }
      secrets = updatedSecrets;
    } catch (e) {
      console.error("Failed to load secrets:", e);
    } finally {
      loading = false;
    }
  }

  function statusIcon(status: SecretEntry["status"]): string {
    switch (status) {
      case "resolvable": return "✓";
      case "unresolvable": return "✗";
      case "error": return "⚠";
      case "checking": return "⋯";
    }
  }

  function statusClass(status: SecretEntry["status"]): string {
    switch (status) {
      case "resolvable": return "text-green-600";
      case "unresolvable": return "text-red-600";
      case "error": return "text-yellow-600";
      case "checking": return "text-gray-400";
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
    <Dialog.Content class="relative bg-[var(--color-adwaita-card)] rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
      <div class="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
        <Dialog.Title class="text-lg font-semibold">
          1Password Secrets
        </Dialog.Title>
        <Dialog.CloseTrigger class="p-1.5 rounded-md hover:bg-gray-100 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Dialog.CloseTrigger>
      </div>

      <div class="flex-1 overflow-auto px-6 py-4">
        {#if loading}
          <div class="text-center text-gray-500 py-8">
            Scanning for secret references...
          </div>
        {:else if secrets.length === 0}
          <div class="text-center text-gray-400 py-8">
            No 1Password references found in managed files
          </div>
        {:else}
          <div class="space-y-3">
            {#each secrets as secret}
              <div class="flex items-start gap-3 px-4 py-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]">
                <span class="text-lg {statusClass(secret.status)} flex-shrink-0 mt-0.5">
                  {statusIcon(secret.status)}
                </span>
                <div class="flex-1 min-w-0">
                  <div class="font-mono text-sm truncate">{secret.path}</div>
                  <div class="text-xs text-gray-500 mt-1">
                    <span class="font-medium">{secret.type}</span>: {secret.reference}
                  </div>
                  {#if secret.itemTitle}
                    <div class="text-xs text-gray-600 mt-1">
                      Item: {secret.itemTitle}
                    </div>
                  {/if}
                  {#if secret.errorMessage}
                    <div class="text-xs text-red-500 mt-1">
                      {secret.errorMessage}
                    </div>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <div class="px-6 py-4 border-t border-[var(--border-color)]">
        <div class="text-xs text-gray-500">
          {#if opInstalled === false}
            <span class="text-yellow-600">1Password CLI (op) is not installed.</span>
          {:else if secrets.length > 0}
            {secrets.filter(s => s.status === "resolvable").length} of {secrets.length} secrets resolvable
          {/if}
        </div>
      </div>
    </Dialog.Content>
  </Dialog.Positioner>
</Dialog>
