# moi

**A chezmoi GUI for your dotfiles** — Project Development Plan

---

## Overview

moi is a desktop GUI for chezmoi, built with Tauri (Rust backend) and Svelte (frontend). It surfaces chezmoi's core workflows — inspecting dotfile status, reviewing diffs, applying changes, and managing 1Password-backed secrets — in a clean, native-feeling interface.

The name is taken directly from chezmoi itself: *chez moi* is French for "at my home". moi is small, obvious, and entirely on-brand.

---

## Technology Stack

| Layer | Choice | Rationale |
|---|---|---|
| App framework | Tauri v2.10 | Rust backend with native OS access; small binaries, no Chromium bundled |
| Frontend | Svelte 5.53 + TypeScript 5.9 | Compiles away at build time, no virtual DOM overhead, concise reactivity model |
| UI components | ADWaveCSS 0.2 + ADWaveUI 0.3 | GTK4/Libadwaita design tokens, component classes (.btn, .dialog, .input), web components (adw-selector) |
| Styling | Tailwind CSS 4.2 | Utility-first CSS with `@tailwindcss/vite` plugin; layout utilities complement ADWaveCSS |
| Theming | ADWaveCSS design tokens | Automatic light/dark theme via `prefers-color-scheme` detection; all colors derive from CSS custom properties (clr-bg-*, clr-text-*, adw-accent) |
| Syntax highlighting | shiki | TextMate grammar-based; accurate highlighting for dotfile languages |
| FS watching | notify crate | Cross-platform filesystem events from Rust, emitted to frontend via Tauri events |
| Package manager | pnpm | Fast, disk-efficient package manager |
| Build tool | Vite 8.0 | Next-gen frontend build tooling |

---

## Architecture

moi is structured in three layers that communicate via Tauri's IPC bridge:

- **UI layer (Svelte)** — all visual components, reactive state, user interactions
- **Command layer (Rust)** — IPC command handlers that shell out to `chezmoi`, `op`, and `git`
- **External tools** — chezmoi CLI, 1Password CLI, and the chezmoi source directory (a git repo)

### IPC pattern

Every user action in the UI invokes a named Tauri command on the Rust side. Commands are thin wrappers around `std::process::Command` calls to the chezmoi binary. Results are returned as raw strings to Svelte, which parses them on the frontend side. This avoids a chezmoi library dependency and stays forward-compatible with chezmoi CLI changes.

```rust
#[tauri::command]
pub async fn chezmoi_status() -> Result<String, String> {
    let output = Command::new("chezmoi")
        .arg("status")
        .output()
        .map_err(|e| e.to_string())?;
    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }
    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}
```

**Note:** `chezmoi status` does not support `--format=json` in chezmoi v2.69.4. The frontend parses the git-style two-column text output (e.g., ` M .bashrc`).

### Filesystem watching

The `notify` crate watches the chezmoi source directory (`~/.local/share/chezmoi`) for changes. On any file event, Rust emits a Tauri event (`chezmoi://changed`) to the frontend, which re-fetches status automatically. This keeps the UI live without polling.

---

## UI Views

### Status list *(Phase 1 — implemented)*
A scrollable list of managed files with their status. Each entry shows a color-coded badge (Modified/Added/Deleted) and an inline Apply button. Header has Refresh and Apply All buttons.

### File tree *(Phase 2 — implemented)*
The primary view, built as a custom recursive tree with `flattenNodes` helper. Each node represents a managed file or directory. Status badges (M/A/D) use ADWaveCSS token-derived color classes (`.badge-modified`, `.badge-added`, `.badge-deleted`). Clicking a file opens the diff panel.

### Diff panel *(Phase 2 — implemented)*
A sidebar panel (fixed right, 60vw width) using `sidebar-panel` class with ADWaveCSS tokens. Shows a side-by-side diff of the chezmoi source vs the target file. Includes Apply button scoped to the selected file (`.btn primary`). Unified diff parsing handles context, additions, removals, and hunk headers. *(Phase 3 addition: "Source" tab for `.tmpl` files showing raw template with highlighted `{{ }}` expressions.)*

### Apply controls *(Phase 1 — implemented)*
Toolbar-level actions for Apply All and per-file Apply. These call `chezmoi apply` and `chezmoi apply <path>` respectively via IPC commands.

### Secrets panel *(Phase 2 — implemented)*
A centered modal using ADWaveCSS `.dialog` pattern listing files that reference 1Password secrets. Parses `onepassword "..."` and `onepasswordItemFields "..."` patterns from source files. For each reference, runs `op item get` and shows a green checkmark (resolvable), red X (unresolvable), or warning (op CLI not installed). Status colors use ADWaveCSS tokens (clr-success, clr-danger, clr-warning).

### Git log *(Phase 3 — implemented)*
A right-side sidebar panel (60vw) using `sidebar-panel` class showing commit history from the chezmoi source git repo. Runs `git log --oneline -n 50` via IPC. Clicking a commit expands to show `git show --stat` output with file change summary. Hashes use `var(--color-git-hash)` token.

### Data viewer *(Phase 3 — implemented)*
A centered modal using ADWaveCSS `.dialog` pattern showing `chezmoi data --format=json` output as expandable, searchable JSON. Top-level keys rendered as section headers with type indicators. Supports nested objects and arrays with collapsible sections. Filter input uses `.input` class.

### Add-file wizard *(Phase 3 — implemented)*
A 3-step centered modal using ADWaveCSS `.dialog` pattern for running `chezmoi add`:
1. **Path**: text input (`.input` class) for the target file path
2. **Type**: `<adw-selector>` web component with `<adw-option>` items — Plain / Template / Encrypted
3. **Confirm**: summary display, executes `chezmoi add [--template] [--encrypt] <path>`, shows result

---

## Build Phases

### Phase 1 — MVP ✅ (complete)
**Goal:** A working shell usable as a daily driver. Ship fast, use daily.

- [x] Tauri + Svelte project scaffold
- [x] `chezmoi status` list with color-coded badges
- [x] Apply All and per-file Apply buttons
- [x] Basic error handling and loading states

### Phase 2 — Polish ✅ (complete)
**Goal:** Make it genuinely pleasant to use.

- [x] File tree with recursive node builder and flat rendering
- [x] Diff panel with side-by-side view and unified diff parsing
- [x] Filesystem watching (live status refresh via `notify` crate)
- [x] Secrets panel with 1Password resolvability indicators
- [x] ADWaveCSS theme with design tokens, dark mode support, and domain-specific CSS variables

### Phase 3 — Power ✅ (complete)
**Goal:** Turn it into a complete dotfile workstation.

- [x] Git log view (`git_log`, `git_show` commands + `GitLogPanel.svelte`)
- [x] Template inspector (Diff/Source tab toggle for `.tmpl` files with `{{ }}` highlighting)
- [x] Add-file wizard (3-step modal: path → type → confirm, wraps `chezmoi add`)
- [x] Machine profile / chezmoi data viewer (`chezmoi_data` command + `DataPanel.svelte`)
- [x] System tray (gated behind `system-tray` Cargo feature; context menu with Refresh, Show/Hide, Quit; left-click toggles window visibility)
- [x] Migrate from Skeleton UI to ADWaveCSS + ADWaveUI for authentic GTK4/Libadwaita styling

---

## Getting Started

### Prerequisites

- Rust toolchain (`rustup`)
- Node.js 20+
- pnpm
- chezmoi installed and initialized
- System libraries (Linux): `webkit2gtk4.1-devel`, `gtk3-devel`, `libsoup3-devel`, `javascriptcoregtk4.1-devel`

On Fedora:
```bash
sudo dnf install -y webkit2gtk4.1-devel gtk3-devel libsoup3-devel javascriptcoregtk4.1-devel
```

On Debian/Ubuntu:
```bash
sudo apt-get install -y build-essential libwebkit2gtk-4.1-dev libgtk-3-dev libsoup-3.0-dev libjavascriptcoregtk-4.1-dev
```

### Install and run

```bash
pnpm install
pnpm tauri dev
```

### Project structure

```
moi/
  src/                    # Svelte 5 frontend
    lib/
      components/
        FileTree.svelte       # TreeView file tree with status badges
        DiffPanel.svelte      # Right-side diff viewer with Apply button + Source tab for .tmpl
        SecretsPanel.svelte   # 1Password secrets modal
        GitLogPanel.svelte    # Git log drawer with commit expansion
        DataPanel.svelte      # Chezmoi data JSON viewer with search
        AddFileWizard.svelte  # 3-step add file modal
      stores/
        status.ts             # Svelte store for chezmoi status entries (emits moi://status-update)
      ipc.ts                  # Typed wrappers around Tauri invoke()
      diff.ts                 # Unified diff parser (side-by-side line pairs)
      highlight.ts            # Lazy-loaded shiki wrapper (singleton)
      secrets.ts              # Template parser for 1Password references
      git.ts                  # Git log parser (parseGitLog)
      template.ts             # Template source highlighter ({{ }} expression highlighting)
    App.svelte                # Main UI: tree, panels, header controls
    main.ts                   # App entry point
    app.css                   # Tailwind v4 + ADWaveCSS design tokens + domain variables
  src-tauri/                  # Rust backend
    src/
      commands/
        mod.rs                # Module declarations (chezmoi, secrets, git, add)
        chezmoi.rs            # chezmoi_status, chezmoi_apply, chezmoi_apply_file,
                              # chezmoi_diff, chezmoi_cat_source, chezmoi_data
        git.rs                # git_log, git_show (with get_source_dir helper)
        add.rs                # chezmoi_add (--template, --encrypt flags)
        secrets.rs            # op_item_get, op_check_installed
      watcher.rs              # notify-based filesystem watcher
      tray.rs                 # System tray setup (behind `system-tray` feature)
      main.rs                 # Tauri builder with command registration + setup hook
    capabilities/
      default.json            # Tauri v2 permissions (core:event:allow-listen, core:event:allow-emit)
    Cargo.toml
    tauri.conf.json
    icons/                    # App icons + tray-icon.png, tray-icon-busy.png
  index.html
  package.json
  vite.config.ts              # Vite 8 + @tailwindcss/vite + svelte plugins
  svelte.config.js
  tsconfig.json
```

---

## System dependencies

### npm packages

| Package | Version |
|---------|---------|
| vite | 8.0.0 |
| tailwindcss | 4.2.1 |
| @tailwindcss/vite | 4.2.1 |
| adwavecss | 0.2.6 |
| adwaveui | 0.3.2 |
| @sveltejs/vite-plugin-svelte | 7.0.0 |
| svelte | 5.53.12 |
| typescript | 5.9.3 |
| @tauri-apps/cli | 2.10.1 |
| @tauri-apps/api | 2.10.1 |
| @tauri-apps/plugin-shell | 2.3.5 |
| shiki | 1.29.2 |

### Rust crates (src-tauri/Cargo.toml)

| Crate | Version | Notes |
|-------|---------|-------|
| tauri | 2 | features: `[]`; optional `tray-icon` via `system-tray` feature |
| tauri-build | 2 | |
| serde | 1 | with `derive` feature |
| serde_json | 1 | |
| tokio | 1 | with `process` feature |
| notify | 6 | with `macos_kqueue` feature |
| dirs | 5 | |

---

## Design Notes

- moi wraps the chezmoi CLI rather than reimplementing its logic. This keeps it thin, correct, and forward-compatible.
- All destructive actions (apply, revert) require confirmation. The UI should never surprise you.
- The GTK4/Libadwaita-inspired theme uses ADWaveCSS design tokens — no GTK4 dependency. It works on Windows, Linux, and macOS without any platform-specific code.
- Phase 1 is intentionally minimal. Real daily use will surface the right things to build in Phase 2.
- `chezmoi status` outputs git-style two-column text (not JSON), so the frontend parses the raw text format.
- Tailwind v4 uses CSS-based configuration (`@import`) instead of JS config files. No `postcss.config.js` needed. Tailwind handles layout utilities; ADWaveCSS handles component styling and design tokens.
- ADWaveCSS provides the design token system (`--clr-bg-*`, `--clr-text-*`, `--clr-border`, `--adw-accent`, `--clr-success/danger/warning`). All domain-specific CSS variables (diff colors, git hash color, status badges) are derived from these tokens using `color-mix()` so they automatically adapt to light/dark themes.
- Dark theme is detected via `prefers-color-scheme` media query and applied as `.dark-theme`/`.light-theme` class on `<body>` before the app mounts.
- ADWaveUI web components (`<adw-selector>`, `<adw-option>`) are used for interactive inputs like the file type selector in AddFileWizard, replacing ~40 lines of custom radio button HTML.
- The FileTree uses a custom recursive `buildTree`/`flattenNodes` approach to produce a flat render list. Status metadata is stored on leaf nodes and rendered with `.badge-modified`/`.badge-added`/`.badge-deleted` classes.
- Diff panel uses a side-by-side layout parsing unified diff output, with line numbers and color-coded add/remove/context sections. All colors derive from ADWaveCSS tokens.
- Filesystem watcher uses a 500ms debounce to avoid excessive refreshes during bulk file operations.
- Secrets panel scans all managed template files for `onepassword` and `onepasswordItemFields` patterns, then checks each reference with `op item get` for resolvability.
- Tauri v2 requires explicit capabilities (`src-tauri/capabilities/default.json`) for event permissions (`core:event:allow-listen`, `core:event:allow-emit`).
- Git commands discover the source directory via `chezmoi source-path` rather than hardcoding the path.
- Template inspector highlights `{{ }}` expressions using regex-based HTML wrapping with a dedicated CSS class.
- System tray is gated behind `system-tray` Cargo feature (`tauri/tray-icon`) so `cargo check` works on WSL2 without desktop tray libraries. On desktop, build with `--features system-tray` or add it to the default features.

---

## Verification

### Per-feature checks
1. **Type check:** `pnpm check` — 0 errors (7 a11y warnings from close buttons without labels, pre-existing)
2. **Rust check (WSL2):** `cargo check` in `src-tauri/` — compiles without system-tray feature
3. **Rust check (desktop):** `cargo check --features system-tray` — compiles with tray code
4. **Frontend build:** `pnpm build` — Vite builds successfully

### Integration testing (`pnpm tauri dev`)
5. **File tree:** Status entries render as nested directory tree, clicking a file opens diff panel
6. **Diff panel:** Selecting a file opens right-side sidebar panel with side-by-side diff view; `.tmpl` files show Diff/Source tabs
7. **FS watching:** Editing a file in `~/.local/share/chezmoi` triggers auto-refresh
8. **Secrets panel:** Opening shows 1Password references with green/red status indicators using ADWaveCSS tokens
9. **Theme:** All components use ADWaveCSS design tokens (`--clr-*`, `--adw-accent`), no hardcoded grays; dark theme activates via OS preference
10. **Git log:** Clicking "Git Log" opens right sidebar panel with commit list; clicking a commit shows `git show --stat`
11. **Data viewer:** Clicking "Data" opens ADWaveCSS modal dialog with searchable, expandable JSON from `chezmoi data`
12. **Add-file wizard:** Clicking "Add File" walks through path → type → confirm steps using ADWaveCSS dialog and `<adw-selector>`, executes `chezmoi add`
13. **System tray** (desktop only, `--features system-tray`): Tray icon appears; left-click toggles window; right-click menu has Refresh, Show/Hide, Quit; Refresh emits `moi://tray-refresh` to frontend
