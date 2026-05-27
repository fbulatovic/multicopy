"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
function activate(context) {
    const selectAndCopy = vscode.commands.registerCommand('multiCopy.selectAndCopy', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
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
        const rootPath = workspaceFolders[0].uri.fsPath;
        const items = allFiles
            .map(uri => {
            const relativePath = path.relative(rootPath, uri.fsPath);
            return {
                label: path.basename(uri.fsPath),
                description: relativePath,
                detail: uri.fsPath,
            };
        })
            .sort((a, b) => (a.description || '').localeCompare(b.description || ''));
        const selected = await vscode.window.showQuickPick(items, {
            canPickMany: true,
            placeHolder: 'Select files to copy for AI chat  (Space = select, Enter = confirm)',
            matchOnDescription: true,
            matchOnDetail: false,
        });
        if (!selected || selected.length === 0) {
            return;
        }
        await copyFilesToClipboard(selected.map(item => item.detail), rootPath);
    });
    const copyOpenTabs = vscode.commands.registerCommand('multiCopy.copyOpenTabs', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        const rootPath = workspaceFolders?.[0]?.uri.fsPath ?? '';
        const openDocs = vscode.workspace.textDocuments.filter(doc => !doc.isUntitled && doc.uri.scheme === 'file');
        if (openDocs.length === 0) {
            vscode.window.showInformationMessage('No open file tabs found.');
            return;
        }
        const items = openDocs.map(doc => {
            const relativePath = rootPath ? path.relative(rootPath, doc.uri.fsPath) : doc.uri.fsPath;
            return {
                label: path.basename(doc.uri.fsPath),
                description: relativePath,
                detail: doc.uri.fsPath,
                picked: true,
            };
        });
        const selected = await vscode.window.showQuickPick(items, {
            canPickMany: true,
            placeHolder: 'Select open tabs to copy for AI chat',
            matchOnDescription: true,
        });
        if (!selected || selected.length === 0) {
            return;
        }
        await copyFilesToClipboard(selected.map(item => item.detail), rootPath);
    });
    context.subscriptions.push(selectAndCopy, copyOpenTabs);
}
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
    const output = parts.join('\n\n');
    await vscode.env.clipboard.writeText(output);
    let message = `MultiCopy: Copied ${parts.length} file${parts.length > 1 ? 's' : ''} to clipboard.`;
    if (skipped.length > 0) {
        message += ` (${skipped.length} skipped — binary or >500KB)`;
    }
    vscode.window.showInformationMessage(message);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map