export function Scores(scores, players, curPlayer) {
    return /* html */`
        <div id="scores-container">
            <h3>Scores</h3>
            <div id="score-list" class="list">
                ${
                    Object.keys(scores).reduce((total, id) => {
                        const name = scores[id].name;
                        const score = scores[id].score;
                        let curItem;

                        if (id === curPlayer.id) {
                            curItem = /* html */`<strong>${name}</strong>: ${score}`;
                        } else if (!players.filter(p => p.id === id)[0].active) {
                            curItem = /* html */`<span style="color: var(--muted)">${name}: ${score}</span>`;
                        } else {
                            curItem = /* html */`${name}: ${score}`;
                        }

                        return total + "\n" + /* html */`<div class="list-item">${curItem}</div>`
                    }, "")
                }
            </div>
        </div>
    `;
}

export function History(history) {
    return /* html */`
        <div id="history-container">
            <h3>History</h3>
            <div id="history-list" class="list">
                ${
                    history.reduce((total, cur, index) => {
                        const { name, word, score } = cur;
                        return /* html */`
                            <div class="list-item">
                                ${index+1}. ${name}: ${word} (${score})
                            </div>
                        ` + "\n" + total;
                    }, "")
                }
            </div>
        </div>
    `;
}

export function MainGame(pastWords, constraints) {
    return /* html */`
        <div id="main-container">
            <div id="round-info">
                <h3>Avoid these words</h3>
                <div id="word-list">
                    ${
                        pastWords.reduce((total, word) => {
                            return total + "\n" + /* html */`
                                <div class="word-list-item">
                                    ${word}
                                </div>
                            `
                        }, "")
                    }
                </div>
                ${
                    constraints.useLetters && 
                    /* html */`
                        <h3>Use these letters</h3>
                        <div>
                            ${constraints.useLetters.reduce((total, letter) => {
                                return total + " " + letter
                            }, "")}
                        </div>
                    `
                }
                ${
                    constraints.avoidLetters &&
                    /* html */`
                    <h3>Do not use these letters</h3>
                    <div>
                        ${constraints.avoidLetters.reduce((total, letter) => {
                            return total + " " + letter
                        }, "")}
                    </div>
                    `
                }
                ${
                    constraints.avoidWords &&
                    /* html */`
                    <h3>Completely avoid these words</h3>
                    <div>
                        ${constraints.avoidWords.reduce((total, word) => {
                            return total + "\n" + word
                        }, "")}
                    </div>
                    `
                }
            </div>
            <form id="mainForm">
                <div class="form-group">
                    <input id="mainInput" type="text" placeholder="Enter the least semantically-relevant word" required />
                    <input class="btn" type="submit" value="Submit" />
                    <button id="passBtn" class="btn" style="margin-left: 6px">Pass</button>
                </div>
            </form>
        </div>
    `
}

export default function Game(scores, history, players, currentPlayer, pastWords, constraints) {
    return /* html */`
        <div id="main-game-container">
            <h1 id="title">anti-semantle</h1>
            <div id="game-interface">
                ${Scores(scores, players, currentPlayer)}
                ${MainGame(pastWords, constraints)}
                ${History(history)}
            </div>
        </div>
    `;
}