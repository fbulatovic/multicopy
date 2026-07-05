# MultiCopy

**MultiCopy** is a Visual Studio Code extension that lets you select multiple files from your workspace and copy their contents to clipboard — formatted and ready to paste into any AI chat.

---

## Features

- **File tree panel** — browse your workspace in a dedicated sidebar, select files and folders with checkboxes
- **Folder selection** — check a folder to automatically select all files inside it, recursively
- **Quick Pick mode** — keyboard-driven file picker with fuzzy search across thousands of files
- **Open tabs mode** — copy only your currently open editor tabs, all pre-selected
- **Smart excludes** — automatically ignores `node_modules`, `.git`, `dist`, `out`, `build`
- **Safe** — skips binary files and files larger than 500KB

---

## Usage

### File tree panel (sidebar)

Click the **MultiCopy icon** in the Activity Bar (left sidebar) to open the file tree.

1. Browse your workspace structure — folders and files are listed alphabetically, folders first
2. Check individual files, or check a folder to select everything inside it
3. Click the **copy icon** in the panel title bar to copy all selected files to clipboard
4. Checkboxes reset automatically after copying

Use the **refresh icon** in the title bar to reload the tree if your workspace files have changed.

### Quick Pick (keyboard)

**Keyboard shortcut:** `Ctrl+Alt+C` (Mac: `Cmd+Alt+C`)

Or open the Command Palette (`Ctrl+Shift+P`) and run:

> `MultiCopy: Select Files and Copy for AI Chat`

1. A Quick Pick dialog opens with all files in your workspace
2. Use fuzzy search to filter by name or path
3. Press `Space` to select/deselect, `Enter` to copy

### Copy open tabs

Open the Command Palette and run:

> `MultiCopy: Copy Open Tabs for AI Chat`

All currently open editor tabs are pre-selected. Deselect what you don't need, then press `Enter` to copy.

---

## Output format

Each selected file is formatted as:

````
// src/components/Button.tsx
```tsx
export const Button = ({ label }: Props) => {
  return <button>{label}</button>;
};
````

// src/utils/helpers.ts

```ts
export const formatDate = (date: Date) => {
  return date.toISOString();
};
```

```

---

## Commands

| Command | Description |
|---|---|
| `MultiCopy: Copy Selected to Clipboard` | Copy files checked in the sidebar tree |
| `MultiCopy: Select Files and Copy for AI Chat` | Open Quick Pick file picker |
| `MultiCopy: Copy Open Tabs for AI Chat` | Copy currently open editor tabs |
| `MultiCopy: Refresh` | Reload the file tree |

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Alt+C` | Open Quick Pick file picker (Mac: `Cmd+Alt+C`) |

---

## Requirements

- Visual Studio Code `1.90.0` or higher

---

## Known Limitations

- Files larger than **500KB** are skipped automatically
- Binary files (images, executables, etc.) are skipped
- Maximum of **5000 files** scanned per workspace

---

## Issues & Feedback

Found a bug or have a feature request? Open an issue on [GitHub](https://github.com/fbulatovic/multicopy/issues).

---

## License

[MIT](LICENSE)
```
