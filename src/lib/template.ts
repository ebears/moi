export function highlightTemplateSource(source: string): string {
  return source.replace(
    /\{\{[\s\S]*?\}\}/g,
    (match) =>
      `<span class="template-expression">${escapeHtml(match)}</span>`,
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
