// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */

var changeFlag = false;

function activate(context) {
    // console.log('Congratulations, your extension "latex-workshop-begin-end-synchronize" is now active!');
    // TODO 直接获取workshop的begin end匹配。
    // 当文档内容发生变化时触发
    vscode.workspace.onDidChangeTextDocument((event) => {
        // console.log('onDidChangeTextDocument');
        
        const document = event.document;

        // 如果不是LaTeX文档，直接返回
        if (document.languageId !== 'latex') return;

        // 如果是由本插件触发的文本修改，直接返回
        if (changeFlag) {
            changeFlag = false;
            return;
        }

        // 如果没有实际的内容变化，直接返回
        if (event.contentChanges.length === 0) return;

        // 判断是否由撤销操作触发，如果是则直接返回
        if (event.reason === vscode.TextDocumentChangeReason.Undo || event.reason === vscode.TextDocumentChangeReason.Redo) {
            return;
        }

        // 获取当前文档的内容
        const text = document.getText();

        // 找到正在编辑的位置，确认是哪里发生了变化
        const position = event.contentChanges[0].range.start;
        // console.log('position:', position);
        
        // 转化为index
        const index = document.offsetAt(position);
        // console.log('index:', index);


        // 使用正则表达式匹配所有的begin和end
        const beginMatches = [...text.matchAll(/(?<!%.*)\\begin\{([^\n}]*)\}/g)];
        const endMatches = [...text.matchAll(/(?<!%.*)\\end\{([^\n}]*)\}/g)];

        // console.log('beginMatches:', beginMatches);
        // console.log('endMatches:', endMatches);

        // 打印匹配结果
        // beginMatches.forEach(match => {
        //     console.log('begin:', match[0], 'index:', match.index, 'length:', match[0].length);
        // });
        // endMatches.forEach(match => {
        //     console.log('end:', match[0], 'index:', match.index, 'length:', match[0].length);
        // });

        // 如果begin和end数量匹配
        if (beginMatches.length === endMatches.length) {
            synchronizeBeginEnd(document, beginMatches, endMatches, index);
        }
    });
}

// 同步begin和end的修改
function synchronizeBeginEnd(document, beginMatches, endMatches, index) {
    const edits = [];

    // 看是否在begin和end中间
    let inBegin = false;
    let placeIndex = -1;
    for (let i = beginMatches.length - 1; i >= 0; i--) {
        const beginStart = beginMatches[i].index;
        const beginEnd = beginMatches[i].index + beginMatches[i][0].length;

        if (index >= beginStart && index <= beginEnd) {
            inBegin = true;
            placeIndex = i;            
        }
    }

    if (!inBegin) {
        for (let i = endMatches.length - 1; i >= 0; i--) {
            const endStart = endMatches[i].index;
            const endEnd = endMatches[i].index + endMatches[i][0].length;

            if (index >= endStart && index <= endEnd) {
                placeIndex = i;           
            }
        }
    }

    if (placeIndex === -1) {
        return;
    }
    
    // console.log('placeIndex:', placeIndex);
    // console.log('inBegin:', inBegin);

    if (inBegin) {

        let beginStackCount = 0;
        let beginPlaceIndex = placeIndex;
        beginStackCount++;
        
        let beginIndex = beginMatches[beginPlaceIndex].index;
        let endPlaceIndex = 0;
        while (endMatches[endPlaceIndex].index < beginIndex) {
            endPlaceIndex++;
        }
        let nextEndIndex = endMatches[endPlaceIndex].index
        let nextBeginIndex = 0;
        
        while (beginStackCount > 0){
            if (beginPlaceIndex < beginMatches.length - 1) {
                nextBeginIndex = beginMatches[beginPlaceIndex + 1].index;
                if (nextBeginIndex < nextEndIndex) {
                    beginPlaceIndex++;
                    // beginStack.push(beginPlaceIndex);
                    beginStackCount++;
                    beginIndex = beginMatches[beginPlaceIndex].index;
                } else {
                    endPlaceIndex++;
                    nextEndIndex = endMatches[endPlaceIndex].index;
                    // beginStack.pop();
                    beginStackCount--;
                }
            } else {
                endPlaceIndex++;
                // beginStack.pop();
                beginStackCount--;
            }
        }
        endPlaceIndex--;
        // console.log('beginPlaceIndex***:', placeIndex);
        // console.log('endPlaceIndex:', endPlaceIndex);
        const texEnv = beginMatches[placeIndex][0].slice(7, -1);
        const endRange = new vscode.Range(document.positionAt(endMatches[endPlaceIndex].index), document.positionAt(endMatches[endPlaceIndex].index + endMatches[endPlaceIndex][0].length));
        edits.push(vscode.TextEdit.replace(endRange, `\\end{${texEnv}}`));
        changeFlag = true;
    } else {
        let endStackCount = 0;
        let endPlaceIndex = placeIndex;
        endStackCount++;

        let endIndex = endMatches[endPlaceIndex].index;
        let beginPlaceIndex = beginMatches.length - 1;
        while (beginMatches[beginPlaceIndex].index > endIndex) {
            beginPlaceIndex--;
        }
        let nextBeginIndex = beginMatches[beginPlaceIndex].index;
        let nextEndIndex = 0;

        while (endStackCount > 0){
            if (endPlaceIndex > 0) {
                nextEndIndex = endMatches[endPlaceIndex - 1].index;
                if (nextEndIndex > nextBeginIndex) {
                    endPlaceIndex--;
                    endStackCount++;
                    endIndex = endMatches[endPlaceIndex].index;
                } else {
                    beginPlaceIndex--;
                    nextBeginIndex = beginMatches[beginPlaceIndex].index;
                    endStackCount--;
                }
            } else {
                beginPlaceIndex--;
                endStackCount--;
            }
        }
        beginPlaceIndex++;
        // console.log('beginPlaceIndex:', beginPlaceIndex);
        // console.log('endPlaceIndex***:', placeIndex);
        const texEnv = endMatches[placeIndex][0].slice(5, -1);
        const beginRange = new vscode.Range(document.positionAt(beginMatches[beginPlaceIndex].index), document.positionAt(beginMatches[beginPlaceIndex].index + beginMatches[beginPlaceIndex][0].length));
        edits.push(vscode.TextEdit.replace(beginRange, `\\begin{${texEnv}}`));
        changeFlag = true;
    }


    // 提交文本编辑
    const edit = new vscode.WorkspaceEdit();
    edit.set(document.uri, edits);
    vscode.workspace.applyEdit(edit);
}


function deactivate() {}

module.exports = {
    activate,
    deactivate
};

