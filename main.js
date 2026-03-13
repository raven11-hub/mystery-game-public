// main.ts
// generateInputHtml を追加してインポートエラーを解消！
import { createForms, generateInputHtml } from './form.js';
import { gameData, loadGameData } from './data.js'; // loadGameDataをインポート
import { createTiles } from './tile.js';
function getSaveData() {
    const dataStr = localStorage.getItem('mysteryGameSaveDataV2');
    // 古い形式のセーブデータと互換性を持たせる
    if (!dataStr) {
        return { progress: {}, hints: {}, answers: {} }; // 新規プレイヤー
    }
    try {
        const parsed = JSON.parse(dataStr);
        // もし古い形式のデータだったら、新しい形式に変換してあげる
        return {
            progress: (parsed && typeof parsed.progress === 'object') ? parsed.progress : {},
            hints: (parsed && typeof parsed.hints === 'object') ? parsed.hints : {},
            answers: (parsed && typeof parsed.answers === 'object') ? parsed.answers : {},
            isBackgroundRevealed: (parsed && typeof parsed.isBackgroundRevealed === 'boolean') ? parsed.isBackgroundRevealed : false
        };
    }
    catch (e) {
        return { progress: {}, hints: {}, answers: {} };
    }
}
function saveProgress(problemId, answeredCount) {
    const data = getSaveData();
    data.progress[problemId] = answeredCount;
    localStorage.setItem('mysteryGameSaveDataV2', JSON.stringify(data));
}
function saveHintProgress(problemId, unlockedCount) {
    const data = getSaveData();
    data.hints[problemId] = unlockedCount;
    localStorage.setItem('mysteryGameSaveDataV2', JSON.stringify(data));
}
// 答えの解放状態を保存する関数
function saveAnswerUnlocked(problemId) {
    const data = getSaveData();
    data.answers[problemId] = true;
    localStorage.setItem('mysteryGameSaveDataV2', JSON.stringify(data));
}
// 画像が切り替わった状態を保存する
function saveBackgroundRevealed() {
    const data = getSaveData();
    data.isBackgroundRevealed = true;
    localStorage.setItem('mysteryGameSaveDataV3', JSON.stringify(data));
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
    // 正解状態の復元
    for (const pIdStr in data.progress) {
        const problemId = parseInt(pIdStr, 10);
        const answeredCount = data.progress[problemId];
        for (let i = 0; i < answeredCount; i++) {
            applyCorrectState(problemId, i, true);
        }
    }
    // ヒント状態の復元（解放済みのボタンを押せるようにする）
    for (const pIdStr in data.hints) {
        const problemId = parseInt(pIdStr, 10);
        const unlockedCount = data.hints[problemId];
        unlockHints(problemId, unlockedCount);
    }
    const mainBg = document.getElementById('main-background');
    const revealBtn = document.getElementById('reveal-last-image-btn');
    if (data.isBackgroundRevealed) {
        if (mainBg)
            mainBg.src = 'assets/images/block_last.png';
        if (revealBtn) {
            revealBtn.disabled = true;
            revealBtn.textContent = "解放済み";
        }
    }
    // 最後にタイルが全開かチェック
    checkAllTilesOpened();
}
// ヒントボタンの disabled を解除する関数
function unlockHints(problemId, unlockedCount) {
    const container = document.getElementById(`hints-container-${problemId}`);
    if (container) {
        const buttons = container.querySelectorAll('.hint-button');
        buttons.forEach((btn, idx) => {
            if (idx <= unlockedCount) {
                btn.disabled = false;
            }
        });
    }
    // すべてのヒントを解放したかチェックして、答えボタンを有効化する
    const problem = gameData?.problems.find(p => p.id === problemId);
    if (problem && problem.hints) {
        // 現在の解放数(unlockedCount)が、ヒントの総数と同じになったら
        if (unlockedCount >= problem.hints.length) {
            const answerBtn = document.querySelector(`.show-answer-button[data-problem-id="${problemId}"]`);
            if (answerBtn) {
                answerBtn.disabled = false; // 答えボタンのロック解除！
            }
        }
    }
}
// --- 自作確認ダイアログの関数 ---
function showCustomConfirm(message) {
    return new Promise((resolve) => {
        const confirmModal = document.getElementById('confirm-modal');
        const confirmText = document.getElementById('confirm-modal-text');
        const okBtn = document.getElementById('confirm-ok');
        const cancelBtn = document.getElementById('confirm-cancel');
        if (!confirmModal || !confirmText || !okBtn || !cancelBtn)
            return resolve(false);
        confirmText.textContent = message;
        confirmModal.classList.remove('hidden');
        // OKボタン
        const onOk = () => {
            cleanup();
            resolve(true);
        };
        // キャンセルボタン
        const onCancel = () => {
            cleanup();
            resolve(false);
        };
        // 後片付け
        const cleanup = () => {
            confirmModal.classList.add('hidden');
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
        };
        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
    });
}
// 9枚のタイルがすべて消えているか確認し、ボタンを有効化する関数
function checkAllTilesOpened() {
    const allTiles = document.querySelectorAll('.tiles img');
    const hiddenTiles = document.querySelectorAll('.hidden-tile');
    const revealBtn = document.getElementById('reveal-last-image-btn');
    // タイルが9枚あり、かつ全てが隠れて(hidden)いればボタンを解放
    if (revealBtn && allTiles.length > 0 && allTiles.length === hiddenTiles.length) {
        revealBtn.disabled = false;
    }
}
function setupEventListeners() {
    const appContent = document.getElementById('app-content');
    if (!appContent)
        return;
    // --- ヒントモーダルを閉じる処理（独立させる） ---
    const modal = document.getElementById('hint-modal');
    const closeBtn = document.getElementById('hint-modal-close');
    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    }
    // --- 画面全体のクリック監視（1つだけにする！） ---
    appContent.addEventListener('click', async (e) => {
        const target = e.target;
        // 【1】ヒントボタンが押された時の処理
        const hintBtn = target.closest('.hint-button');
        if (hintBtn) {
            const problemId = parseInt(hintBtn.getAttribute('data-problem-id') || "0", 10);
            const hintIdx = parseInt(hintBtn.getAttribute('data-hint-idx') || "0", 10);
            const problem = gameData?.problems.find(p => p.id === problemId);
            if (!problem || !problem.hints)
                return;
            const hintData = problem.hints[hintIdx];
            const data = getSaveData();
            const currentUnlocked = data.hints[problemId] || 0;
            // まだこのヒントを解放していない場合のみ、確認ダイアログを出す
            if (hintIdx >= currentUnlocked) {
                const isConfirmed = await showCustomConfirm(`ヒント${hintIdx + 1}を開けますか？\n（一度開けると、以降は確認されません）`);
                if (!isConfirmed)
                    return; // キャンセルしたら何もしない
                // 確認OKなら、解放状態を更新（このヒントを開けた = 次のヒントも押せるようにする）
                const newUnlocked = hintIdx + 1;
                saveHintProgress(problemId, newUnlocked);
                unlockHints(problemId, newUnlocked);
            }
            // モーダルにヒントテキストをセットして表示
            const modalTitle = document.getElementById('hint-modal-title');
            const modalText = document.getElementById('hint-modal-text');
            const modalImage = document.getElementById('explanation-modal-image'); // ★追加
            if (modalTitle && modalText && modal) {
                modalTitle.textContent = `ヒント ${hintIdx + 1}`;
                modalTitle.style.color = '#f39c12'; // ★ヒントの時はオレンジ色に
                modalText.textContent = hintData.text;
                // ★ヒントの時は画像を隠す
                if (modalImage) {
                    modalImage.style.display = 'none';
                    modalImage.src = '';
                }
                modal.classList.remove('hidden');
            }
            return; // ここでリターンするので、下の送信ボタンの処理には行かない
        }
        // 【1.5】答えを見るボタンが押された時の処理
        const answerBtn = target.closest('.show-answer-button');
        if (answerBtn) {
            const problemId = parseInt(answerBtn.getAttribute('data-problem-id') || "0", 10);
            const problem = gameData?.problems.find(p => p.id === problemId);
            if (!problem || !problem.answers)
                return;
            const data = getSaveData();
            const isAlreadyUnlocked = data.answers[problemId] || false; // ★保存状態を確認
            // まだ解放していない場合のみ、確認ダイアログを出す
            if (!isAlreadyUnlocked) {
                const isConfirmed = await showCustomConfirm(`本当に答えを見ますか？\n（一度開けると、以降は確認されません）`);
                if (!isConfirmed)
                    return;
                // OKなら保存する
                saveAnswerUnlocked(problemId);
            }
            // JSONデータから答えのテキストを作成（答えが複数ある場合は改行でつなげる）
            const answerTexts = problem.answers.map((ans, idx) => {
                const label = problem.answers.length > 1 ? `答え${idx + 1}：` : `答え：`;
                // ★ここを修正：spanタグとクラスを付与
                return `<span class="answer-highlight">${label}${ans.display}</span>`;
            }).join('\n');
            // 解説のテキストを作成
            let explanationText = "";
            if (problem.explanation) {
                explanationText = `【解説】\n${problem.explanation.text}`;
            }
            // 既存のヒント用モーダルを使い回して答えを表示
            const modal = document.getElementById('hint-modal');
            const modalTitle = document.getElementById('hint-modal-title');
            const modalText = document.getElementById('hint-modal-text');
            const modalImage = document.getElementById('explanation-modal-image');
            if (modalTitle && modalText && modal) {
                modalTitle.textContent = `答えと解説`;
                modalTitle.style.color = '#000000'; // ★答えの時は赤色にして警告感を出す
                // ★答えと解説を合体させて表示
                modalText.innerHTML = answerTexts + explanationText.replace(/\n/g, '<br>');
                // 解説画像がある場合は表示する
                if (problem.explanation && problem.explanation.imagePath) {
                    modalImage.src = problem.explanation.imagePath;
                    modalImage.style.display = 'block';
                }
                else {
                    modalImage.style.display = 'none';
                    modalImage.src = '';
                }
                modal.classList.remove('hidden');
            }
            return; // ここでリターンするので、下の送信ボタンの処理には行かない
        }
        // 【1.8】「すべて開けたら押せ」ボタンが押された時の処理
        const revealBtnClicked = target.closest('#reveal-last-image-btn');
        if (revealBtnClicked) {
            const mainBg = document.getElementById('main-background');
            if (!mainBg)
                return;
            // ボタンをもう押せないようにし、テキストを変える
            revealBtnClicked.disabled = true;
            revealBtnClicked.textContent = "解放済み";
            // 状態をセーブ
            saveBackgroundRevealed();
            // アニメーション：一度透明にして、裏で画像を差し替え、また透明度を戻す
            mainBg.style.opacity = '0'; // ふわっと消える
            setTimeout(() => {
                mainBg.src = 'assets/images/block_last.png'; // 画像をチェンジ
                mainBg.style.opacity = '1'; // ふわっと現れる
            }, 800); // 0.8秒待つ（CSSの transition 0.8s と合わせる）
            return; // ここでリターン
        }
        // 【2】送信（解答）ボタンが押された時の処理
        const submitBtn = target.closest('.check-button-inline');
        // 送信ボタン以外をクリックした場合はここで終了
        if (!submitBtn)
            return;
        const problemId = parseInt(submitBtn.getAttribute('data-id') || "0", 10);
        const currentInputIdx = parseInt(submitBtn.getAttribute('data-ans-idx') || "0", 10);
        const inputElement = document.getElementById(`answer-${problemId}-${currentInputIdx}`);
        if (!inputElement || !gameData)
            return;
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
            inputElement.value = hitAnswerData.display;
            // 正解状態の適用
            applyCorrectState(problemId, currentInputIdx);
            saveProgress(problemId, currentInputIdx + 1);
            // 正解するたびに、すべてのタイルが開いたかチェックする！
            checkAllTilesOpened();
            // 全て正解したらタイルを消す、または遷移
            if (currentInputIdx + 1 === problem.answers.length) {
                if (problem.type === 'final') {
                    window.location.href = "clear.html";
                }
            }
        }
        else {
            // 不正解処理
            handleWrongAnswer(submitBtn, inputElement);
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