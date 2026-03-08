// data.ts
// 読み込んだデータを保持する変数（最初はnull）
export let gameData = null;
// JSONファイルをフェッチ（取得）する関数
export async function loadGameData() {
    try {
        const response = await fetch('assets/data/problems.json');
        if (!response.ok) {
            throw new Error(`HTTPエラー: ${response.status}`);
        }
        gameData = await response.json();
    }
    catch (error) {
        console.error("JSONデータの読み込みに失敗しました:", error);
    }
}
//# sourceMappingURL=data.js.map