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
                    !!constraints.useLetters ? 
                    /* html */`
                        <h3>Use these letters</h3>
                        <div>
                            ${constraints.useLetters.reduce((total, letter) => {
                                return total + " " + letter
                            }, "")}
                        </div>
                    ` : ''
                }
                ${
                    !!constraints.avoidLetters ?
                    /* html */`
                    <h3>Do not use these letters</h3>
                    <div>
                        ${constraints.avoidLetters.reduce((total, letter) => {
                            return total + " " + letter
                        }, "")}
                    </div>
                    ` : ''
                }
                ${
                    !!constraints.avoidWords ?
                    /* html */`
                    <h3>Completely avoid these words</h3>
                    <div>
                        ${constraints.avoidWords.reduce((total, word) => {
                            return total + "\n" + word
                        }, "")}
                    </div>
                    ` : ''
                }
            </div>
            <form id="mainForm" autocomplete="off">
                <div class="form-group">
                    <input id="mainInput" type="text" placeholder="Enter the least semantically-relevant word" required />
                    <input class="btn" type="submit" value="Submit" />
                    <button id="passBtn" class="btn" style="margin-left: 6px">Pass</button>
                </div>
            </form>
        </div>
    `
}

export function getSubmissionRating(distance) {
    const red = 255 * (1 - distance);
    const blue = 255 * distance;

    let text = "";

    if (distance < 0.15) text = "You can surely win at Semantle..."
    else if (distance < 0.3) text = "It must be semantically FAR...";
    else if (distance < 0.5) text = "Broaden your horizon even further.";
    else if (distance < 0.75) text = "You're getting the hang of it!";
    else if (distance < 0.9) text = "That's some creative thinking!";
    else text = "Is that even a word?!" 

    return `<span style="color: rgb(${red}, 0, ${blue})">${text}</span>`;
}

export function Flash(flash) {
    return /* html */`
        <div id="flash-container">
            <h3>Submission</h3>
            <div id="flash-description">
                Near <div id="flash-color"></div> Far
            </div>
            <div id="flash-list">
            ${
                flash.reduce((total, {word, distance}) => {
                    return total + "\n" + /* html */`
                        <div class="flash-item">${word} - ${getSubmissionRating(distance)}</div>
                    `
                }, "")
            }
            </div>
        </div>
    `
}

export function Rounds(roundsLeft) {
    if (roundsLeft === null) {
        return ''
    } else {
        return `<h3>Rounds Left: ${roundsLeft}</h3>`
    }
}

export default function Game(roomName, scores, history, players, currentPlayer, pastWords, constraints, flash, roundsLeft) {
    return /* html */`
        <div id="main-game-container">
            <h1 id="title">anti-semantics</h1>
            ${Rounds(roundsLeft)}
            <div id="game-interface">
                <div id="left">
                    ${Scores(scores, players, currentPlayer)}
                    ${flash ? Flash(flash) : ''}
                </div>
                ${MainGame(pastWords, constraints)}
                ${History(history)}
            </div>
        </div>
    `;
}