# moi — A chezmoi GUI (Tauri v2 + Svelte 5)

## Build & Dev Commands

- `pnpm install` — install frontend dependencies
- `pnpm tauri dev` — run the app in development mode
- `pnpm build` — build frontend with Vite
- `pnpm check` — run svelte-check (type checking)
- `cargo check` — compile Rust backend (WSL2, no system-tray)
- `cargo check --features system-tray` — compile with system-tray support (desktop Linux)

## Architecture

Tauri v2 app with IPC commands. Rust backend shells out to `chezmoi`, `op`, and `git` CLI tools. Frontend parses raw text output (not JSON) from these commands.

### Backend (`src-tauri/src/`)
- `main.rs` — app entry, registers IPC commands, starts fs watcher
- `commands/chezmoi.rs` — `chezmoi status`, `apply`, `diff`, `cat-source`, `data`
- `commands/git.rs` — `git log`, `git show`
- `commands/add.rs` — `chezmoi add`
- `commands/secrets.rs` — `op item get`, `op check-installed`
- `watcher.rs` — filesystem watcher with 500ms debounce, notifies frontend of changes

### Frontend (`src/`)
- Svelte 5 with runes (`$state`, `$derived`, `$props`)
- ADWaveCSS for GTK4/Libadwaita design tokens and component classes (`.btn`, `.btn.primary`, `.dialog`, `.input`, `.card`)
- ADWaveUI web components (`<adw-selector>`, `<adw-option>`) for interactive inputs
- Dark theme via OS preference detection (`prefers-color-scheme` → `.dark-theme`/`.light-theme` class)
- `lib/ipc.ts` — Tauri IPC wrappers
- `lib/diff.ts` — diff parsing and rendering
- `lib/git.ts` — git log/show parsing
- `lib/secrets.ts` — 1Password CLI helpers
- `lib/template.ts` — chezmoi template helpers

## Key Patterns

- `chezmoi status` outputs git-style text (not JSON) — parse manually
- System-tray functionality is gated behind `system-tray` Cargo feature
- Filesystem watcher uses 500ms debounce before triggering frontend refresh
- All IPC commands are async, registered in `main.rs` invoke_handler
- Diff/git/status variables are derived from ADWaveCSS tokens (e.g. `var(--clr-success)`, `var(--clr-danger)`) so they adapt to dark theme
- Sidebar panels (Diff, Git Log) use fixed positioning with `sidebar-panel` class; modals (Secrets, Data, AddFile) use ADWaveCSS `.dialog` pattern

## Project Structure

```
moi/
├── src/                    # Svelte frontend
│   ├── lib/                # Shared utilities and IPC wrappers
│   │   ├── components/     # Svelte components
│   │   └── stores/         # Svelte stores
│   ├── App.svelte          # Root component
│   └── main.ts             # Entry point
├── src-tauri/              # Rust backend
│   └── src/
│       ├── commands/       # Tauri IPC command handlers
│       ├── main.rs
│       ├── watcher.rs
│       └── tray.rs         # System tray (behind feature flag)
├── package.json
├── Cargo.toml
└── tauri.conf.json
```
