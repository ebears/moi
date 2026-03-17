<script lang="ts">
  import type { ChezmoiEntry } from "../ipc";

  interface Props {
    entries: ChezmoiEntry[];
    onselect?: (path: string) => void;
  }

  let { entries, onselect }: Props = $props();

  function statusColor(status: string): string {
    switch (status) {
      case "M": return "badge-modified";
      case "A": return "badge-added";
      case "D": return "badge-deleted";
      default: return "text-[var(--clr-text-2)] bg-[var(--clr-bg-2)]";
    }
  }

  function statusLabel(status: string): string {
    switch (status) {
      case "M": return "M";
      case "A": return "A";
      case "D": return "D";
      default: return status;
    }
  }

  interface TreeNodeData {
    value: string;
    label: string;
    children?: TreeNodeData[];
    status?: string;
  }

  function buildTree(entries: ChezmoiEntry[]): TreeNodeData[] {
    const root: TreeNodeData = { value: "", label: "root", children: [] };
    const nodeMap = new Map<string, TreeNodeData>();
    nodeMap.set("", root);

    for (const entry of entries) {
      const parts = entry.path.split("/");
      let currentPath = "";

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]!;
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (!nodeMap.has(currentPath)) {
          const isLeaf = i === parts.length - 1;
          const newNode: TreeNodeData = {
            value: currentPath,
            label: part,
            ...(isLeaf ? {} : { children: [] }),
            ...(isLeaf ? { status: entry.status } : {}),
          };
          nodeMap.set(currentPath, newNode);

          const parent = nodeMap.get(parentPath);
          if (parent?.children) {
            parent.children.push(newNode);
          }
        } else if (i === parts.length - 1) {
          const existing = nodeMap.get(currentPath);
          if (existing) {
            existing.status = entry.status;
          }
        }
      }
    }

    return root.children ?? [];
  }

  function flattenNodes(nodes: TreeNodeData[], depth: number): { node: TreeNodeData; depth: number; isBranch: boolean }[] {
    const result: { node: TreeNodeData; depth: number; isBranch: boolean }[] = [];
    for (const node of nodes) {
      const isBranch = node.children !== undefined && node.children.length > 0;
      result.push({ node, depth, isBranch });
      if (isBranch && node.children) {
        result.push(...flattenNodes(node.children, depth + 1));
      }
    }
    return result;
  }

  const tree = $derived(buildTree(entries));
  const flatNodes = $derived(flattenNodes(tree, 0));
</script>

<div class="space-y-0.5">
  {#each flatNodes as { node, depth, isBranch } (node.value)}
    {@const indent = depth * 16}
    <div
      class="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-[var(--clr-bg-2)] cursor-pointer transition-colors"
      style="padding-left: {indent + 12}px"
      role="button"
      tabindex="0"
      onclick={() => {
        if (!isBranch) onselect?.(node.value);
      }}
      onkeydown={(e) => {
        if (e.key === "Enter" && !isBranch) onselect?.(node.value);
      }}
    >
      {#if isBranch}
        <svg class="w-4 h-4 text-[var(--clr-text-3)] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>
        <span class="font-medium text-sm">{node.label}</span>
      {:else}
        <svg class="w-4 h-4 text-[var(--clr-text-3)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span class="flex-1 font-mono text-sm">{node.label}</span>
        {#if node.status}
          <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium {statusColor(node.status)}">
            {statusLabel(node.status)}
          </span>
        {/if}
      {/if}
    </div>
  {/each}
</div>
