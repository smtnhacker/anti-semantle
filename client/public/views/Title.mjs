export default function Title() {
    return /* html */`
        <div id="main-menu-container">
            <h1 id="title">
                ${
                    Array.from("anti-semantle").reduce((total, letter, idx) => {
                        return total + /* html */`<span class="title-letter" data-phase="${Math.floor(Math.random() * 6)}" data-index="${idx}">${letter}</span>`
                    }, "")
                }
            </h1>
            <div class="subtitle">Broaden your creativity. Go against semantics.</div>
            <div id="mainBtns" class="buttons-container">
                <button id="createBtn" class="btn">Create Game</button>
                <button id="joinBtn" class="btn">Join Room</button>
            </div>
        </div>
    `;
}