import { type Highlighter, createHighlighter } from "shiki";

let highlighter: Highlighter | null = null;
let initPromise: Promise<Highlighter> | null = null;

const LANGUAGES = ["bash", "json", "toml", "yaml", "vim", "python", "javascript", "typescript", "plaintext"];
const THEME = "github-light";

export async function getHighlighter(): Promise<Highlighter> {
  if (highlighter) return highlighter;
  if (initPromise) return initPromise;

  initPromise = createHighlighter({
    themes: [THEME],
    langs: LANGUAGES,
  });

  highlighter = await initPromise;
  return highlighter;
}

export function detectLanguage(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const langMap: Record<string, string> = {
    sh: "bash",
    bash: "bash",
    zsh: "bash",
    json: "json",
    toml: "toml",
    yaml: "yaml",
    yml: "yaml",
    vim: "vim",
    py: "python",
    js: "javascript",
    ts: "typescript",
  };
  return langMap[ext] || "plaintext";
}

export async function highlightCode(code: string, filename: string): Promise<string> {
  const hl = await getHighlighter();
  const lang = detectLanguage(filename);
  return hl.codeToHtml(code, { lang, theme: THEME });
}
