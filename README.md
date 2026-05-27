# MultiCopy

**MultiCopy** is a Visual Studio Code extension that lets you select multiple files from your workspace and copy their contents to clipboard — formatted and ready to paste into AI chats like Claude, ChatGPT, or GitHub Copilot.

---

## Features

- 📋 **Multi-file selection** — pick any number of files at once using a Quick Pick dialog
- 🤖 **AI-ready format** — each file is wrapped with its relative path and a syntax-highlighted code block
- ⚡ **Fast fuzzy search** — instantly filter through thousands of files by name or path
- 🗂️ **Open tabs mode** — copy only your currently open editor tabs, all pre-selected
- 🚫 **Smart excludes** — automatically ignores `node_modules`, `.git`, `dist`, `out`, `build`
- 🛡️ **Safe** — skips binary files and files larger than 500KB

---

## Usage

### Copy files from workspace

**Keyboard shortcut:** `Ctrl+Alt+C` (Mac: `Cmd+Alt+C`)

Or open the Command Palette (`Ctrl+Shift+P`) and run:
> `MultiCopy: Select Files and Copy for AI Chat`

1. A Quick Pick dialog opens with all files in your workspace
2. Use fuzzy search to filter files by name or path
3. Press `Space` to select/deselect files
4. Press `Enter` to copy selected files to clipboard

### Copy open tabs

Open the Command Palette and run:
> `MultiCopy: Copy Open Tabs for AI Chat`

All currently open editor tabs are pre-selected. Deselect what you don't need, then press `Enter` to copy.

---

## Output format

Each selected file is formatted as:

```
// src/components/Button.tsx
```tsx
export const Button = ({ label }: Props) => {
  return <button>{label}</button>;
};
```

// src/utils/helpers.ts
```ts
export const formatDate = (date: Date) => {
  return date.toISOString();
};
```
```

Paste the clipboard content directly into any AI chat — the model will immediately understand the file structure and contents.

---

## Commands

| Command | Description |
|---|---|
| `MultiCopy: Select Files and Copy for AI Chat` | Open file picker and copy selected files |
| `MultiCopy: Copy Open Tabs for AI Chat` | Copy currently open editor tabs |

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Alt+C` | Open file picker (Mac: `Cmd+Alt+C`) |

---

## Requirements

- Visual Studio Code `1.85.0` or higher

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
