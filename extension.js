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
    console.log('Congratulations, your extension "latex-workshop-begin-end-synchronize" is now active!');
    // TODO 直接获取workshop的begin end匹配。
    // 当文档内容发生变化时触发
    vscode.workspace.onDidChangeTextDocument((event) => {
        // console.log('onDidChangeTextDocument');
        if (changeFlag) {
            changeFlag = false;
            return;
        }
        
        const document = event.document;

        // 如果不是LaTeX文档，直接返回
        if (document.languageId !== 'latex') return;

        // 如果没有实际的内容变化，直接返回
        if (event.contentChanges.length === 0) return;

        // 获取当前文档的内容
        const text = document.getText();

        // 找到正在编辑的位置，确认是哪里发生了变化
        const position = event.contentChanges[0].range.start;
        // console.log('position:', position);
        
        // 转化为index
        const index = document.offsetAt(position);
        // console.log('index:', index);


        // 使用正则表达式匹配所有的begin和end
        const beginMatches = [...text.matchAll(/\\begin\{([^}]*)\}/g)];
        const endMatches = [...text.matchAll(/\\end\{([^}]*)\}/g)];

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

    // vscode.commands.registerCommand('type', (args) => {
    //     console.log(`[DEBUG] type command triggered with args:`, args);
    //     return vscode.commands.executeCommand('default:type', args);
    // });
}

// 同步begin和end的修改
function synchronizeBeginEnd(document, beginMatches, endMatches, index) {
    const edits = [];
    // console.log('synchronizeBeginEnd ');
    // // 遍历所有的begin和end匹配项，进行同步操作
    // for (let i = 0; i < beginMatches.length; i++) {
    //     const beginStart = beginMatches[i].index;
    //     const beginEnd = beginMatches[i].index + beginMatches[i][0].length;

    //     const endStart = endMatches[i].index;
    //     const endEnd = endMatches[i].index + endMatches[i][0].length;

    //     // 在begin和end之间进行同步修改
    //     if (beginStart !== endStart) {
    //         // 你可以根据需求修改这些编辑内容
    //         const beginRange = new vscode.Range(document.positionAt(beginStart), document.positionAt(beginEnd));
    //         const endRange = new vscode.Range(document.positionAt(endStart), document.positionAt(endEnd));

    //         // edits.push(vscode.TextEdit.replace(beginRange, '修改后的begin文本'));
    //         // edits.push(vscode.TextEdit.replace(endRange, '修改后的end文本'));
    //     }
    // }



    // const pairings = matchBeginEnd(beginMatches, endMatches);
    // if (pairings === -1) {
    //     return;
    // }

    // 看是否在begin和end中间
    let inBegin = false;
    let placeIndex = -1;
    for (let i = beginMatches.length - 1; i >= 0; i--) {
        const beginStart = beginMatches[i].index;
        const beginEnd = beginMatches[i].index + beginMatches[i][0].length;

        if (index > beginStart && index < beginEnd) {
            inBegin = true;
            placeIndex = i;            
        }
    }

    if (!inBegin) {
        for (let i = endMatches.length - 1; i >= 0; i--) {
            const endStart = endMatches[i].index;
            const endEnd = endMatches[i].index + endMatches[i][0].length;

            if (index > endStart && index < endEnd) {
                placeIndex = i;           
            }
        }
    }

    if (placeIndex === -1) {
        return;
    }
    
    console.log('placeIndex:', placeIndex);
    console.log('inBegin:', inBegin);

    if (inBegin) {
        // 从pairings中找到对应的end
        // for (let i = 0; i < pairings.length; i++) {
        //     if (pairings[i].begin === placeIndex) {
        //         const endIndex = pairings[i].end;
        //         const texEnv = beginMatches[placeIndex][0].slice(7, -1);
        //         const endRange = new vscode.Range(document.positionAt(endMatches[endIndex].index), document.positionAt(endMatches[endIndex].index + endMatches[endIndex][0].length));
        //         edits.push(vscode.TextEdit.replace(endRange, `\\end{${texEnv}}`));
        //         break;
        //     }
        // }
        
        // let beginStack = [];
        let beginStackCount = 0;
        let beginPlaceIndex = placeIndex;
        // beginStack.push(beginPlaceIndex);
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
        console.log('beginPlaceIndex***:', placeIndex);
        console.log('endPlaceIndex:', endPlaceIndex);
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
        console.log('beginPlaceIndex:', beginPlaceIndex);
        console.log('endPlaceIndex***:', placeIndex);
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

// function matchBeginEnd(beginMatches, endMatches) {

//     // 使用堆栈来匹配 begin 和 end
//     let stack = [];
//     let pairings = [];

//     let beginIndex = 0;
//     let nextBeginIndex = 1;
//     let endIndex = 0;

//     while (endIndex <= endMatches.length) {
//         if (beginIndex < beginMatches.length && (endIndex >= endMatches.length || beginMatches[beginIndex].index < endMatches[endIndex].index)) {
//             // 处理 begin
//             const begin = beginMatches[beginIndex];
//             stack.push({ type: begin[1], index: begin.index });
//             beginIndex++;
//         }

//         // if (beginIndex < beginMatches.length && (endIndex >= endMatches.length || beginMatches[beginIndex].index < endMatches[endIndex].index)) {
//         //     // 处理 begin
//         //     const begin = beginMatches[beginIndex];
//         //     stack.push({ type: begin[1], index: begin.index });
//         //     beginIndex++;
//         // } else {
//         //     // 处理 end
//         //     const end = endMatches[endIndex];
//         //     const lastBegin = stack.pop();

//         //     if (lastBegin && lastBegin.type === end[1]) {
//         //         // 成对的 begin 和 end
//         //         pairings.push({ begin: lastBegin.index, end: end.index, type: lastBegin.type });
//         //     } else {
//         //         // 如果没有匹配的 begin，输出错误
//         //         console.error(`Unmatched \\end{${end[1]}} at index ${end.index}`);
//         //         return -1;
//         //     }
//         //     endIndex++;
//         // }
//     }

//     // 如果堆栈不为空，说明有未匹配的 begin
//     while (stack.length > 0) {
//         const unmatchedBegin = stack.pop();
//         console.error(`Unmatched \\begin{${unmatchedBegin.type}} at index ${unmatchedBegin.index}`);
//         return -1;
//     }

//     return pairings;
// }









function deactivate() {}

module.exports = {
    activate,
    deactivate
};

