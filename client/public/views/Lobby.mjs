export default function Lobby(roomName, roomID, players) {
    return /* html */`
        <div id="lobby-container">
            <h1>${roomName}</h1>
            <div id="lobby-code"><strong>Code:</strong> <code>${roomID}</code></div>
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