import { createForms } from './form.js'; // form.ts からインポート
import { createTiles } from './tile.js'; // tile.tsからインポート
// 各問題の「正解」を定義します
const answers = {
    1: "りんご", // 1番のフォームの正解
    2: "みかん", // 2番のフォームの正解
    3: "ぶどう",
    4: "いちご",
    5: "すいか",
    6: "ばなな",
    7: "めろん",
    8: "きうい",
    9: "もも"
};
// --- 画像の事前読み込み処理 ---
function preloadImages() {
    const imageUrls = [
        "./assets/images/750x750.png",
        // 1~9の画像を配列に追加
        ...Array.from({ length: 9 }, (_, i) => `./assets/images/250x250_${i + 1}.png`)
    ];
    const promises = imageUrls.map(url => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(); // 読み込み成功
            img.onerror = () => resolve(); // 読み込み失敗
            img.src = url;
        });
    });
    return Promise.all(promises); // 全部の画像が読み込まれるまで待つ
}
// --- LocalStorageから状態を復元 ---
function restoreState() {
    const savedData = localStorage.getItem(`clearedTiles`);
    if (!savedData)
        return;
    // 保存されていた配列を取得
    const clearedTiles = JSON.parse(savedData);
    clearedTiles.forEach(index => {
        // 画像を透明にする
        const targetTile = document.getElementById(`tile-${index}`);
        if (targetTile)
            targetTile.classList.add('hidden-tile');
        // フォームを正解済みの状態にする
        const inputElement = document.getElementById(`answer-${index}`);
        const button = document.querySelector(`.check-button[data-index="${index}"]`);
        if (inputElement && button) {
            inputElement.value = answers[index];
            inputElement.disabled = true;
            button.disabled = true;
            button.textContent = "正解！";
            button.style.backgroundColor = "#28a745";
        }
    });
}
// --- 正解した番号を保存 ---
function saveState(index) {
    const savedData = localStorage.getItem(`clearedTiles`);
    const clearedTiles = savedData ? JSON.parse(savedData) : [];
    if (!clearedTiles.includes(index)) {
        clearedTiles.push(index);
        localStorage.setItem(`clearedTiles`, JSON.stringify(clearedTiles)); // 文字列にして保存
    }
}
// --- イベント登録 ---
function setupEventListeners() {
    const checkButtons = document.querySelectorAll('.check-button');
    checkButtons.forEach(button => {
        button.addEventListener('click', () => {
            const index = button.getAttribute('data-index');
            if (!index)
                return;
            const inputElement = document.getElementById(`answer-${index}`);
            if (!inputElement)
                return;
            const userAnswer = inputElement.value.trim();
            if (userAnswer === answers[index]) {
                // 正解の処理
                const targetTile = document.getElementById(`tile-${index}`);
                if (targetTile)
                    targetTile.classList.add('hidden-tile');
                inputElement.disabled = true;
                button.disabled = true;
                button.textContent = "正解！";
                button.style.backgroundColor = "#28a745";
                // ★ ここでクリア状態を保存
                saveState(index);
            }
            else {
                alert("残念！不正解です。もう一度考えてみよう！");
            }
        });
    });
}
// --- メイン処理（起動時に実行される） ---
async function init() {
    try {
        // 1. 画像の読み込みが全部終わるまで待機
        await preloadImages();
        // 2. ロード画面を消して、アプリ画面を表示
        document.getElementById('loading').style.display = 'none';
        document.getElementById('app-content').style.display = 'block';
        // 3. 画像とフォームを生成する（ここでHTMLに追加される）
        createTiles();
        createForms();
        // 4. LocalStorageを読み込んで前回正解分を復元する
        restoreState();
        // 5. 生成したボタンに対してクリックイベントを登録する
        // ※必ず createForms() の後に実行すること！
        setupEventListeners();
    }
    catch (error) {
        console.error("画像の読み込みに失敗しました", error);
        alert("エラーが発生しました。リロードしてください。");
    }
}
// アプリケーション起動
init();
//# sourceMappingURL=main.js.map