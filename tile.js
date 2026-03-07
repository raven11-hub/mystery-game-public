export function createTiles() {
    const tileContainer = document.querySelector(".tiles");
    if (!tileContainer)
        return;
    for (let i = 1; i <= 9; i++) {
        const img = document.createElement("img");
        img.src = `assets/images/250x250_${i}.png`;
        img.id = `tile-${i}`;
        tileContainer.appendChild(img);
    }
}
//# sourceMappingURL=tile.js.map