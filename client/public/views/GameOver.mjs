export default function GameOver(roomName, scores) {
    const ranking = Object.keys(scores).map(key => scores[key])
                            .sort((a, b) => b.score - a.score);
    return /* html */`
        <div id="game-over-container">
            <h1>Game Over!</h1>
            <div id="ranking-list">
            ${
                ranking.reduce((total, cur) => {
                    return total + "\n" + /* html */`
                        <div class="ranking-item">${cur.name}: ${cur.score}</div>
                    `
                }, "")
            }
            </div>
            <button id="goBackBtn" class="btn btn-primary">Go Back to Main Menu</button>
        </div>
    `
}