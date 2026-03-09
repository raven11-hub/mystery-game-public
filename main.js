// main.ts
// generateInputHtml を追加してインポートエラーを解消！
import { createForms, generateInputHtml } from './form.js';
import { gameData, loadGameData } from './data.js'; // loadGameDataをインポート
import { createTiles } from './tile.js';
function getSaveData() {
    const data = localStorage.getItem('mysteryGameProgress');
    return data ? JSON.parse(data) : {};
}
function saveProgress(problemId, answeredCount) {
    const data = getSaveData();
    data[problemId] = answeredCount;
    localStorage.setItem('mysteryGameProgress', JSON.stringify(data));
}
function applyCorrectState(problemId, ansIdx, isRestoring = false) {
    const inputElement = document.getElementById(`answer-${problemId}-${ansIdx}`);
    const button = document.querySelector(`.check-button-inline[data-id="${problemId}"][data-ans-idx="${ansIdx}"]`);
    if (!inputElement || !button || !gameData)
        return; // gameDataのnullチェックを追加
    const problem = gameData.problems.find(p => p.id === problemId);
    if (!problem)
        return;
    inputElement.disabled = true;
    button.disabled = true;
    button.textContent = "正解！";
    button.style.backgroundColor = "#28a745";
    if (isRestoring) {
        inputElement.value = problem.answers[ansIdx].display;
    }
    const nextAnsIdx = ansIdx + 1;
    if (nextAnsIdx < problem.answers.length) {
        // 隠されていたコンテンツ（追加ルールなど）があれば全て表示する
        const problemCard = document.getElementById(`problem-card-${problemId}`);
        if (problemCard) {
            const hiddenElements = problemCard.querySelectorAll('.hidden-content');
            hiddenElements.forEach(el => el.classList.remove('hidden-content'));
        }
        const inputsContainer = document.getElementById(`inputs-container-${problemId}`);
        if (inputsContainer && !document.getElementById(`form-group-${problemId}-${nextAnsIdx}`)) {
            inputsContainer.insertAdjacentHTML('beforeend', generateInputHtml(problemId, nextAnsIdx));
        }
    }
    else {
        const targetTile = document.getElementById(`tile-${problemId}`);
        if (targetTile)
            targetTile.classList.add('hidden-tile');
    }
}
function restoreState() {
    const data = getSaveData();
    for (const pIdStr in data) {
        const problemId = parseInt(pIdStr, 10);
        const answeredCount = data[problemId];
        for (let i = 0; i < answeredCount; i++) {
            applyCorrectState(problemId, i, true);
        }
    }
}
function setupEventListeners() {
    // 監視エリアを form-area から app-content に広げる
    const formArea = document.getElementById('app-content');
    if (!formArea)
        return;
    formArea.addEventListener('click', (e) => {
        // targetを「クリックされた要素から一番近いボタン」に設定し直す
        const target = e.target.closest('.check-button-inline');
        // targetが存在しない（ボタン以外をクリックした）場合は何もしない
        if (!target)
            return;
        const problemId = parseInt(target.getAttribute('data-id') || "0", 10);
        const currentInputIdx = parseInt(target.getAttribute('data-ans-idx') || "0", 10);
        const inputElement = document.getElementById(`answer-${problemId}-${currentInputIdx}`);
        if (!inputElement || !gameData) {
            return; // gameDataのnullチェック
        }
        const problem = gameData.problems.find(p => p.id === problemId);
        if (!problem)
            return;
        const userAnswer = inputElement.value.trim();
        // すでに正解済みの答えを特定するために、他の入力欄の値を集める
        const alreadyCorrectAnswers = [];
        for (let i = 0; i < currentInputIdx; i++) {
            const prevInput = document.getElementById(`answer-${problemId}-${i}`);
            if (prevInput)
                alreadyCorrectAnswers.push(prevInput.value.trim());
        }
        // まだ使われていない正解データの中から、入力と一致するものを探す
        const hitIdx = problem.answers.findIndex(ans => ans.accept.includes(userAnswer) && !alreadyCorrectAnswers.includes(ans.display));
        if (hitIdx !== -1) {
            // 正解！
            const hitAnswerData = problem.answers[hitIdx];
            // 入力欄の値を表示用の正式名称に書き換える（例：たーん → ターン）
            inputElement.value = hitAnswerData.display;
            // 正解状態の適用
            // ※applyCorrectStateの中で「次の入力欄を出すかどうか」は 
            // 「currentInputIdx + 1 < problem.answers.length」で判定する
            applyCorrectState(problemId, currentInputIdx);
            saveProgress(problemId, currentInputIdx + 1);
            // 全て正解したらタイルを消す、または遷移
            if (currentInputIdx + 1 === problem.answers.length) {
                if (problem.type === 'final') {
                    window.location.href = "clear.html";
                }
            }
        }
        else {
            // 不正解処理（ボタンを赤くする等）
            handleWrongAnswer(target, inputElement);
        }
    });
}
// 不正解時の共通処理
function handleWrongAnswer(button, input) {
    const originalText = button.textContent || "送信";
    button.textContent = "不正解";
    button.style.backgroundColor = "#e74c3c";
    button.disabled = true;
    input.value = "";
    setTimeout(() => {
        button.textContent = originalText;
        button.style.backgroundColor = "";
        button.disabled = false;
    }, 1500);
}
// ----------------------------------------------------
// メイン初期化処理
// ----------------------------------------------------
async function init() {
    // 1. まずJSONデータを取得してくる
    await loadGameData();
    // もしJSONが読み込めなかったらエラーを出す
    if (!gameData) {
        alert("問題データの読み込みに失敗しました。ローカルサーバーで実行しているか確認してください。");
        return;
    }
    // 2. 読み込み完了後、画面を表示してゲームを作る
    const loadingEl = document.getElementById('loading');
    if (loadingEl)
        loadingEl.style.display = 'none';
    const appContentEl = document.getElementById('app-content');
    if (appContentEl)
        appContentEl.style.display = 'block';
    createTiles(); // tile.ts の処理を実行
    createForms(); // JSONデータを元にフォームを作る
    restoreState();
    setupEventListeners();
}
init();
//# sourceMappingURL=main.js.map