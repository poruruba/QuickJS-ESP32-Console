const vscode = require('vscode');
const Arduino = require('./Arduino');

let targetIp = null;
let arduino = null;
const module_name = "QuickJS_ESP32_Console";
const defaultPriority = 1000;

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
	console.log("activate called");

	if( !targetIp ){
		const ipaddress = await vscode.window.showInputBox({
			title: '対象デバイスのIPアドレス'
		});
		if (ipaddress) {
			targetIp = ipaddress;
		}
	}

	if( targetIp ){
		arduino = new Arduino("http://" + targetIp);
		vscode.window.showInformationMessage(`対象デバイス(${targetIp})を開きました。`);
	}

	var myButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, defaultPriority);
	myButton.text = "QuickJS_ESP32";
	myButton.command = module_name + ".command_menu";
	myButton.show();

	var myButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, defaultPriority);
	myButton.text = "$(repo-pull)";
	myButton.tooltip = "コードをアップロードします。";
	myButton.command = module_name + ".code_upload";
	myButton.show();

	var myButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, defaultPriority);
	myButton.text = "$(repo-push)";
	myButton.tooltip = "コードをダウンロードします。";
	myButton.command = module_name + ".code_download";
	myButton.show();

	var myButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, defaultPriority);
	myButton.text = "$(debug-restart)";
	myButton.tooltip = "対象デバイスを再起動します。";
	myButton.command = module_name + ".terminal_restart";
	myButton.show();

	var disposable = vscode.commands.registerCommand(module_name + '.code_upload', async function () {
		if( !targetIp ){
			vscode.window.showInformationMessage('対象デバイスのIPアドレスを指定してください。');
			return;
		}

		let script;
		try{
			const editor = vscode.window.activeTextEditor;
			script = editor.document.getText();
		}catch(error){
			console.error(error);
			vscode.window.showInformationMessage('ファイルがありません。');
			return;
		}
		try{
			await arduino.code_upload_main(script, false);
					
			vscode.window.showInformationMessage('アップロードしました。');
		}catch(error){
			console.error(error);
			vscode.window.showInformationMessage('アップロードに失敗しました。');
		}
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand(module_name + '.command_menu', async function () {
		const selected = await vscode.window.showQuickPick(
				['Upload', 'Download', 'Restart', 'Setting'],
				{ placeHolder: 'コマンドを選択して下さい。' });
		switch(selected){
			case "Upload": 	vscode.commands.executeCommand(module_name + '.code_upload'); break;
			case "Download": 	vscode.commands.executeCommand(module_name + '.code_download'); break;
			case "Restart": 	vscode.commands.executeCommand(module_name + '.terminal_restart'); break;
			case "Setting": 	vscode.commands.executeCommand(module_name + '.setting_host'); break;
		}
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand(module_name + '.setting_host', async function () {
		const ipaddress = await vscode.window.showInputBox({
			title: '対象デバイスのIPアドレス',
			value: targetIp
		});
		if (ipaddress) {
			targetIp = ipaddress;
			arduino = new Arduino("http://" + targetIp);
			vscode.window.showInformationMessage(`対象デバイス(${targetIp})を開きました。`);
		}else{
			vscode.window.showInformationMessage('キャンセルされました。');
		}
	});	
	context.subscriptions.push(disposable);

	var disposable = vscode.commands.registerCommand(module_name + '.code_download', async function () {
		if( !targetIp ){
			vscode.window.showInformationMessage('対象デバイスのIPアドレスを指定してください。');
			return;
		}

		try{
			const script = await arduino.code_download();

			vscode.env.clipboard.writeText(script);
			
			// var answer = await vscode.window.showInformationMessage('コードを差し替えますがよいですか？', 'Yes', 'No');
			// console.log(answer);

			// vscode.window.activeTextEditor.edit(builder => {
			// 	const doc = vscode.window.activeTextEditor.document;
			// 	builder.replace(new vscode.Range(doc.lineAt(0).range.start, doc.lineAt(doc.lineCount - 1).range.end), script);
			// });
					
			vscode.window.showInformationMessage('クリップボードにダウンロードしたコードをコピーしました。');
		}catch(error){
			console.error(error);
			vscode.window.showInformationMessage('ダウンロードに失敗しました。');
		}
	});	
	context.subscriptions.push(disposable);

	var disposable = vscode.commands.registerCommand(module_name + '.terminal_restart', async function () {
		if( !targetIp ){
			vscode.window.showInformationMessage('対象デバイスのIPアドレスを指定してください。');
			return;
		}

		try{
			await arduino.restart();
		}catch(error){
			console.error(error);
			vscode.window.showInformationMessage('再起動に失敗しました。');
		}
	});	
	context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
