export default function Lobby(roomName, roomID, players) {
    const clipboard = feather.icons.clipboard.toSvg({ width: "1.5rem", height: "1.5rem" })
    return /* html */`
        <div id="lobby-container">
            <h1>${roomName}</h1>
            <div><span id="lobby-code" class="has-code"><strong>Code:</strong> <code>${roomID}${clipboard}</code></span></div>
            <div id="player-list" class="list">
                <h3>Players</h3>
                ${players.reduce((total, player) => (
                    total + "\n" + /* html */`<div class="list-item"><span>${player.name}</span></div>`
                ), "")}
            </div>
            <button id="startBtn" class="btn">
                Start Game
            </button>
        </div>
    `;
}