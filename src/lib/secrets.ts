export interface SecretReference {
  path: string;
  type: "onepassword" | "onepasswordItemFields";
  reference: string;
  itemId: string;
}

export function parseSecretReferences(content: string, path: string): SecretReference[] {
  const refs: SecretReference[] = [];

  // Match onepassword "reference" patterns
  const onepasswordRegex = /onepassword\s+"([^"]+)"/g;
  let match;
  while ((match = onepasswordRegex.exec(content)) !== null) {
    const reference = match[1]!;
    const itemId = extractItemId(reference);
    if (itemId) {
      refs.push({
        path,
        type: "onepassword",
        reference,
        itemId,
      });
    }
  }

  // Match onepasswordItemFields "reference" patterns
  const itemFieldsRegex = /onepasswordItemFields\s+"([^"]+)"/g;
  while ((match = itemFieldsRegex.exec(content)) !== null) {
    const reference = match[1]!;
    const itemId = extractItemId(reference);
    if (itemId) {
      refs.push({
        path,
        type: "onepasswordItemFields",
        reference,
        itemId,
      });
    }
  }

  return refs;
}

function extractItemId(reference: string): string | null {
  // References can be: op://vault/item/field or just an item ID
  // Extract the item ID part
  if (reference.startsWith("op://")) {
    const parts = reference.replace("op://", "").split("/");
    // op://vault/item/field -> item is at index 1
    return parts.length >= 2 ? (parts[1] ?? null) : null;
  }
  // Assume it's a raw item ID
  return reference;
}
