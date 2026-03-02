"use strict";
document.querySelectorAll(".tiles img")
    .forEach((tile) => {
    tile.addEventListener("click", () => {
        tile.style.visibility = "hidden";
    });
});
//# sourceMappingURL=main.js.map