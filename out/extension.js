"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
// ─── Tree Node ───────────────────────────────────────────────────────────────
class FileNode extends vscode.TreeItem {
    constructor(resourceUri, isDirectory, rootPath) {
        super(resourceUri, isDirectory
            ? vscode.TreeItemCollapsibleState.Collapsed
            : vscode.TreeItemCollapsibleState.None);
        this.resourceUri = resourceUri;
        this.isDirectory = isDirectory;
        this.rootPath = rootPath;
        this.children = [];
        this.checked = false;
        this.checkboxState = vscode.TreeItemCheckboxState.Unchecked;
        this.contextValue = isDirectory ? 'folder' : 'file';
        if (!isDirectory) {
            this.command = undefined;
        }
    }
}
// ─── Tree Data Provider ──────────────────────────────────────────────────────
const EXCLUDE_DIRS = new Set(['node_modules', '.git', 'dist', 'out', 'build', '.vscode']);
class MultiCopyTreeProvider {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.nodeMap = new Map(); // fsPath → node
        this.rootNodes = [];
    }
    refresh() {
        this.nodeMap.clear();
        this.rootNodes = [];
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            if (this.rootNodes.length === 0) {
                this.rootNodes = this.buildChildren(this.workspaceRoot);
            }
            return this.rootNodes;
        }
        if (element.children.length === 0 && element.isDirectory) {
            element.children = this.buildChildren(element.resourceUri.fsPath);
        }
        return element.children;
    }
    buildChildren(dirPath) {
        let entries;
        try {
            entries = fs.readdirSync(dirPath, { withFileTypes: true });
        }
        catch {
            return [];
        }
        const dirs = [];
        const files = [];
        for (const entry of entries) {
            if (entry.name.startsWith('.') && entry.isDirectory())
                continue;
            if (EXCLUDE_DIRS.has(entry.name))
                continue;
            const fullPath = path.join(dirPath, entry.name);
            const uri = vscode.Uri.file(fullPath);
            const isDir = entry.isDirectory();
            const node = new FileNode(uri, isDir, this.workspaceRoot);
            this.nodeMap.set(fullPath, node);
            if (isDir)
                dirs.push(node);
            else
                files.push(node);
        }
        const sort = (a, b) => path.basename(a.resourceUri.fsPath).localeCompare(path.basename(b.resourceUri.fsPath));
        return [...dirs.sort(sort), ...files.sort(sort)];
    }
    // ─── Checkbox handling ───────────────────────────────────────────────────
    setChecked(node, checked) {
        node.checked = checked;
        node.checkboxState = checked
            ? vscode.TreeItemCheckboxState.Checked
            : vscode.TreeItemCheckboxState.Unchecked;
        if (node.isDirectory) {
            // Ensure children are loaded
            if (node.children.length === 0) {
                node.children = this.buildChildren(node.resourceUri.fsPath);
            }
            for (const child of node.children) {
                this.setChecked(child, checked);
            }
        }
        this._onDidChangeTreeData.fire(node);
    }
    getCheckedFiles() {
        const result = [];
        this.collectChecked(this.rootNodes, result);
        return result;
    }
    collectChecked(nodes, result) {
        for (const node of nodes) {
            if (!node.isDirectory && node.checked) {
                result.push(node.resourceUri.fsPath);
            }
            if (node.isDirectory && node.children.length > 0) {
                this.collectChecked(node.children, result);
            }
        }
    }
    uncheckAll() {
        this.uncheckNodes(this.rootNodes);
        this._onDidChangeTreeData.fire();
    }
    uncheckNodes(nodes) {
        for (const node of nodes) {
            node.checked = false;
            node.checkboxState = vscode.TreeItemCheckboxState.Unchecked;
            if (node.children.length > 0) {
                this.uncheckNodes(node.children);
            }
        }
    }
}
// ─── Activate ────────────────────────────────────────────────────────────────
function activate(context) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const rootPath = workspaceFolders?.[0]?.uri.fsPath ?? '';
    // ── Sidebar tree ──
    const treeProvider = new MultiCopyTreeProvider(rootPath);
    const treeView = vscode.window.createTreeView('multiCopyExplorer', {
        treeDataProvider: treeProvider,
        showCollapseAll: true,
        canSelectMany: false,
    });
    // Checkbox toggle
    treeView.onDidChangeCheckboxState(e => {
        for (const [node, state] of e.items) {
            treeProvider.setChecked(node, state === vscode.TreeItemCheckboxState.Checked);
        }
    });
    context.subscriptions.push(treeView);
    // ── Commands ──
    // Copy selected from tree
    const copySelected = vscode.commands.registerCommand('multiCopy.copySelected', async () => {
        const files = treeProvider.getCheckedFiles();
        if (files.length === 0) {
            vscode.window.showWarningMessage('MultiCopy: No files selected. Check some files in the panel.');
            return;
        }
        await copyFilesToClipboard(files, rootPath);
        treeProvider.uncheckAll();
    });
    // Refresh tree
    const refreshTree = vscode.commands.registerCommand('multiCopy.refresh', () => {
        treeProvider.refresh();
    });
    // Legacy: Quick Pick select
    const selectAndCopy = vscode.commands.registerCommand('multiCopy.selectAndCopy', async () => {
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder open.');
            return;
        }
        const excludePattern = new vscode.RelativePattern(workspaceFolders[0], '{**/node_modules/**,**/.git/**,**/dist/**,**/out/**,**/.vscode/**,**/build/**}');
        const allFiles = await vscode.workspace.findFiles('**/*', excludePattern, 5000);
        if (allFiles.length === 0) {
            vscode.window.showInformationMessage('No files found in workspace.');
            return;
        }
        const items = allFiles
            .map(uri => ({
            label: path.basename(uri.fsPath),
            description: path.relative(rootPath, uri.fsPath),
            detail: uri.fsPath,
        }))
            .sort((a, b) => (a.description || '').localeCompare(b.description || ''));
        const selected = await vscode.window.showQuickPick(items, {
            canPickMany: true,
            placeHolder: 'Select files to copy for AI chat (Space = select, Enter = confirm)',
            matchOnDescription: true,
        });
        if (!selected || selected.length === 0)
            return;
        await copyFilesToClipboard(selected.map(i => i.detail), rootPath);
    });
    // Legacy: Copy open tabs
    const copyOpenTabs = vscode.commands.registerCommand('multiCopy.copyOpenTabs', async () => {
        const openDocs = vscode.workspace.textDocuments.filter(doc => !doc.isUntitled && doc.uri.scheme === 'file');
        if (openDocs.length === 0) {
            vscode.window.showInformationMessage('No open file tabs found.');
            return;
        }
        const items = openDocs.map(doc => ({
            label: path.basename(doc.uri.fsPath),
            description: rootPath ? path.relative(rootPath, doc.uri.fsPath) : doc.uri.fsPath,
            detail: doc.uri.fsPath,
            picked: true,
        }));
        const selected = await vscode.window.showQuickPick(items, {
            canPickMany: true,
            placeHolder: 'Select open tabs to copy for AI chat',
            matchOnDescription: true,
        });
        if (!selected || selected.length === 0)
            return;
        await copyFilesToClipboard(selected.map(i => i.detail), rootPath);
    });
    context.subscriptions.push(copySelected, refreshTree, selectAndCopy, copyOpenTabs);
}
// ─── Clipboard helper ─────────────────────────────────────────────────────────
async function copyFilesToClipboard(filePaths, rootPath) {
    const parts = [];
    const skipped = [];
    for (const filePath of filePaths) {
        const relativePath = rootPath ? path.relative(rootPath, filePath) : filePath;
        try {
            const stat = fs.statSync(filePath);
            if (stat.size > 500 * 1024) {
                skipped.push(relativePath);
                continue;
            }
            const content = fs.readFileSync(filePath, 'utf-8');
            const ext = path.extname(filePath).replace('.', '') || 'txt';
            parts.push(`// ${relativePath}\n\`\`\`${ext}\n${content}\n\`\`\``);
        }
        catch {
            skipped.push(relativePath);
        }
    }
    if (parts.length === 0) {
        vscode.window.showWarningMessage('No files could be read (binary or too large?).');
        return;
    }
    await vscode.env.clipboard.writeText(parts.join('\n\n'));
    let message = `MultiCopy: Copied ${parts.length} file${parts.length > 1 ? 's' : ''} to clipboard.`;
    if (skipped.length > 0)
        message += ` (${skipped.length} skipped — binary or >500KB)`;
    vscode.window.showInformationMessage(message);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map