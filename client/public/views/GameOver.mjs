export function formatElapsed(elapsed) {
    // convert to seconds
    let t = Math.floor(elapsed / 1000);
    console.log(t);

    let ans = "";

    const seconds = t % 60;
    t = Math.floor(t / 60);
    const minutes = t % 60;
    t = Math.floor(t / 60);
    const hours = t % 24;
    t = Math.floor(t / 24);
    const days = t % 7;

    if (days) ans += `${days} day${days > 1 ? 's' : ''} `;
    if (hours) ans += `${hours} hour${hours > 1 ? 's' : ''} `;
    if (minutes) ans += `${minutes} minute${minutes > 1 ? 's' : ''} `;
    ans += `${seconds} second${seconds > 1 ? 's' : ''} `;

    return ans;
}

export default function GameOver(roomName, scores, elapsed) {   
    const ranking = Object.keys(scores).map(key => scores[key])
                            .sort((a, b) => b.score - a.score);
    return /* html */`
        <div id="game-over-container">
            <h1>Game Over!</h1>
            <h3>Total Game Time: ${formatElapsed(elapsed)}</h3>
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