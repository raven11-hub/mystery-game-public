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
        if (problem.answers[ansIdx].extraMessage) {
            const msgArea = document.getElementById(`extra-msg-area-${problemId}`);
            if (msgArea && !document.getElementById(`msg-${problemId}-${ansIdx}`)) {
                msgArea.innerHTML += `<p class="red-message" id="msg-${problemId}-${ansIdx}">${problem.answers[ansIdx].extraMessage}</p>`;
            }
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
    const formArea = document.getElementById('form-area');
    if (!formArea)
        return;
    formArea.addEventListener('click', (e) => {
        // targetを「クリックされた要素から一番近いボタン」に設定し直す
        const target = e.target.closest('.check-button-inline');
        // targetが存在しない（ボタン以外をクリックした）場合は何もしない
        if (!target) {
            return;
        }
        if (target.classList.contains('check-button-inline')) {
            const problemId = parseInt(target.getAttribute('data-id') || "0", 10);
            const ansIdx = parseInt(target.getAttribute('data-ans-idx') || "0", 10);
            const inputElement = document.getElementById(`answer-${problemId}-${ansIdx}`);
            if (!inputElement || !gameData) {
                return; // gameDataのnullチェック
            }
            const problem = gameData.problems.find(p => p.id === problemId);
            if (!problem) {
                return;
            }
            const userAnswer = inputElement.value.trim();
            const currentAnswerData = problem.answers[ansIdx];
            // setupEventListeners の中
            if (currentAnswerData.accept.includes(userAnswer)) {
                if (problem.type === 'final') {
                    // 最終問題正解！クリア画面へ飛ばす
                    window.location.href = "clear.html";
                }
                else {
                    // 通常の問題正解
                    applyCorrectState(problemId, ansIdx);
                    saveProgress(problemId, ansIdx + 1);
                }
            }
            else {
                alert("残念！不正解です。");
            }
        }
    });
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