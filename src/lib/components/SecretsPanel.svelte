<script lang="ts">
  import { onMount } from "svelte";
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
      case "resolvable": return "\u2713";
      case "unresolvable": return "\u2717";
      case "error": return "\u26a0";
      case "checking": return "\u22ef";
    }
  }

  function statusClass(status: SecretEntry["status"]): string {
    switch (status) {
      case "resolvable": return "text-[var(--clr-success)]";
      case "unresolvable": return "text-[var(--clr-danger)]";
      case "error": return "text-[var(--clr-warning)]";
      case "checking": return "text-[var(--clr-text-3)]";
    }
  }
</script>

{#if open}
  <div class="dialog-overlay" onclick={onclose} role="presentation"></div>
  <div class="dialog" role="dialog" aria-modal="true">
    <div class="dialog-header">
      <span class="dialog-title">1Password Secrets</span>
      <button class="btn flat p-1.5" onclick={onclose} aria-label="Close">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div class="dialog-body" style="max-height: 60vh; overflow: auto;">
      {#if loading}
        <div class="flex flex-col items-center justify-center py-8 gap-3">
          <div class="spinner"><div class="inner-circle"></div></div>
          <span class="subtitle">Scanning for secret references...</span>
        </div>
      {:else if secrets.length === 0}
        <div class="text-center subtitle py-8">
          No 1Password references found in managed files
        </div>
      {:else}
        <div class="space-y-3">
          {#each secrets as secret}
            <div class="card">
              <div class="flex items-start gap-3">
                <span class="text-lg {statusClass(secret.status)} flex-shrink-0 mt-0.5">
                  {statusIcon(secret.status)}
                </span>
                <div class="flex-1 min-w-0">
                  <div class="font-mono text-sm truncate">{secret.path}</div>
                  <div class="subtitle mt-1">
                    <span class="label">{secret.type}</span>: {secret.reference}
                  </div>
                  {#if secret.itemTitle}
                    <div class="subtitle mt-1">
                      Item: {secret.itemTitle}
                    </div>
                  {/if}
                  {#if secret.errorMessage}
                    <div class="text-xs text-[var(--clr-danger)] mt-1">
                      {secret.errorMessage}
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <div class="separator"></div>
    <div class="px-6 py-4">
      <div class="subtitle">
        {#if opInstalled === false}
          <span class="text-[var(--clr-warning)]">1Password CLI (op) is not installed.</span>
        {:else if secrets.length > 0}
          {secrets.filter(s => s.status === "resolvable").length} of {secrets.length} secrets resolvable
        {/if}
      </div>
    </div>
  </div>
{/if}
