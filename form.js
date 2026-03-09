// form.ts
import { gameData } from './data.js';
function generateContentHtml(contents, problemId) {
    // もしデータが空っぽなら、ループせずに空の文字を返すようにガードする
    if (!contents || !Array.isArray(contents))
        return '';
    return contents.map((item, idx) => {
        // hiddenプロパティがある場合は、最初は非表示にするクラスを付与
        const hiddenClass = item.hidden ? 'hidden-content' : '';
        const idAttr = `id="content-${problemId}-${idx}"`;
        if (item.type === "text") {
            return `<p class="problem-text ${hiddenClass}" ${idAttr}>${item.value}</p>`;
        }
        else if (item.type === "dice" && Array.isArray(item.value)) {
            const diceHtml = item.value.map(v => `<img src="assets/images/dice_${v}.png" class="dice-icon" alt="${v}">`).join(' <span>➔</span> ');
            // サイコロ行にも hiddenClass を適用できるように修正
            return `<div class="dice-row ${hiddenClass}" ${idAttr}>${diceHtml} <span>＝ ${item.result}</span></div>`;
        }
        return '';
    }).join('');
}
export function generateInputHtml(problemId, answerIndex) {
    // answerIndex が 0 なら1つ目、それ以外（1以上）なら2つ目以降のメッセージにする
    const labelText = answerIndex === 0
        ? "答えを入力してください"
        : "別の答えを入力してください";
    return `
        <div class="form-group" id="form-group-${problemId}-${answerIndex}">
            <div class="input-container inline-form">
                <input type="text" id="answer-${problemId}-${answerIndex}" placeholder=" " autocomplete="off">
                <label for="answer-${problemId}-${answerIndex}">${labelText}</label>
                <button type="button" class="check-button-inline" data-id="${problemId}" data-ans-idx="${answerIndex}">送信</button>
            </div>
        </div>
    `;
}
export function createForms() {
    // 通常問題用のコンテナを取得する
    const formArea = document.getElementById("form-area");
    // 最終問題用のコンテナを取得する
    const finalFormContainer = document.getElementById("final-form-container");
    // formAreaが無い、または JSONが読み込めていない(gameDataがnull) 場合は処理を止める
    if (!formArea || !gameData)
        return;
    // 初期化
    formArea.innerHTML = '';
    if (finalFormContainer)
        finalFormContainer.innerHTML = '';
    gameData.problems.forEach(p => {
        // IDがないデータはスキップ（前回のundefined対策）
        if (p.id === undefined)
            return;
        if (p.type === "final") {
            // --- 最終問題の場合：game-containerの下に配置 ---
            if (finalFormContainer) {
                finalFormContainer.innerHTML = `
                    <div class="final-problem-content" id="problem-card-${p.id}">
                        ${generateContentHtml(p.content, p.id)}
                        <div class="problem-bottom" id="inputs-container-${p.id}">
                            ${generateInputHtml(p.id, 0)}
                        </div>
                    </div>
                `;
            }
        }
        else {
            // --- 通常の問題の場合：カード形式で form-area に追加 ---
            const container = document.createElement("div");
            container.className = "problem-card";
            container.id = `problem-card-${p.id}`;
            container.innerHTML = `
                <div class="problem-top">
                    <img src="assets/images/250x250_${p.id}.png" alt="問題${p.id}" class="problem-thumbnail">
                    <div class="problem-content-area">
                        ${generateContentHtml(p.content, p.id)}
                    </div>
                </div>
                <div class="problem-bottom" id="inputs-container-${p.id}">  
                    ${generateInputHtml(p.id, 0)}
                </div>
            `;
            formArea.appendChild(container);
        }
    });
}
//# sourceMappingURL=form.js.map