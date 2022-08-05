import * as vscode from 'vscode';
import path = require('path');
import cp = require('child_process');

let disposables: vscode.Disposable[] = [];

export function activate(context: vscode.ExtensionContext) {
	const codelensProvider = new CodelensProvider();
	let provider = vscode.languages.registerCodeLensProvider('*', codelensProvider);
	disposables.push(provider)

	vscode.commands.registerCommand("goescape.enable", () => {
		vscode.workspace.getConfiguration("goescape").update("enable", true, true);
	});
	vscode.commands.registerCommand("goescape.disable", () => {
		vscode.workspace.getConfiguration("goescape").update("enable", false, true);
	});
}

// this method is called when your extension is deactivated
export function deactivate() {
	if (disposables) {
		disposables.forEach(item => item.dispose());
	}
	disposables = [];
}


export class CodelensProvider implements vscode.CodeLensProvider {

	private codeLenses: vscode.CodeLens[] = [];
	private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
	public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

	constructor() {
		vscode.workspace.onDidChangeConfiguration((_) => {
			this._onDidChangeCodeLenses.fire();
		});
		vscode.workspace.onDidSaveTextDocument((_) => {
			this._onDidChangeCodeLenses.fire();
		})
	}

	public provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
		if (!vscode.workspace.getConfiguration("goescape").get("enable", true)) {
			return []
		}
		if (document.languageId !== 'go') {
			return []
		}
		this.codeLenses = [];

		const dir = path.dirname(document.uri.path)
		const cmd = `go build -o __dbg_goescape -gcflags "-m" . 2>&1 | grep ` + path.parse(document.fileName).base + ` | grep heap; rm __dbg_goescape`
		const result = cp.execSync(cmd, { cwd: dir }).toString()

		// bad output from go build
		if (result.length === 0) {
			vscode.window.showInformationMessage(result)
			return []
		}

		const filename = `./${path.basename(document.uri.path)}`
		result.
			replace(/\r\n/g, '\n').
			split('\n').
			forEach((s) => {
				let data = s.slice(filename.length + 1)
				const pos = data.indexOf(' ')
				const message = data.slice(pos + 1)
				const line = +data.slice(undefined, pos - 1).split(':')[0]
				const position = new vscode.Position(line, 0)
				const range = new vscode.Range(position, new vscode.Position(line, message.length))
				this.codeLenses.push(new vscode.CodeLens(range, {
					command: "",
					title: message,
				}))
			})
		return this.codeLenses;
	}

	public resolveCodeLens(codeLens: vscode.CodeLens, token: vscode.CancellationToken) {
		if (vscode.workspace.getConfiguration("goescape").get("enable", true)) {
			return codeLens;
		}
		return null;
	}
}