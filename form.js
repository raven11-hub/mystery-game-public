export function createForms() {
    const formArea = document.getElementById("form-area");
    if (!formArea)
        return;
    for (let i = 1; i <= 9; i++) {
        const container = document.createElement("div");
        container.className = "form-group";
        container.innerHTML = `
            <img src="assets/images/250x250_${i}.png" alt="問題${i}" class="form-thumbnail">

            <div class="input-container">
                <input type="text" id="answer-${i}" placeholder=" " autocomplete="off">
                <label for="answer-${i}">答えを入力してください</label>
            </div>
            <button type="button" class="check-button" data-index="${i}">
                答えを照合する
            </button>
        `;
        formArea.appendChild(container);
    }
}
//# sourceMappingURL=form.js.map