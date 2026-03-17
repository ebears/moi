<script lang="ts">
  import { TreeView, createTreeViewCollection } from "@skeletonlabs/skeleton-svelte";
  import type { ChezmoiEntry } from "../ipc";

  interface Props {
    entries: ChezmoiEntry[];
    onselect?: (path: string) => void;
  }

  let { entries, onselect }: Props = $props();

  function statusColor(status: string): string {
    switch (status) {
      case "M": return "text-yellow-600 bg-yellow-50";
      case "A": return "text-green-600 bg-green-50";
      case "D": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
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

  function buildTree(entries: ChezmoiEntry[]): TreeNodeData {
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

    return root;
  }

  const tree = $derived(buildTree(entries));

  const collection = $derived(
    createTreeViewCollection({
      rootNode: tree,
    })
  );

  const flatNodes = $derived(collection.flatten());
</script>

<div class="space-y-0.5">
  {#each flatNodes as flatNode (flatNode.value)}
    {@const depth = flatNode._index ?? 0}
    {@const node = flatNode as TreeNodeData & { _children?: number[]; _parent?: number; _index: number }}
    {@const isBranch = node._children !== undefined && node._children.length > 0}
    {@const indent = depth * 16}
    <div
      class="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-[var(--color-adwaita-hover)] cursor-pointer transition-colors"
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
        <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>
        <span class="font-medium text-sm">{node.label}</span>
      {:else}
        <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
