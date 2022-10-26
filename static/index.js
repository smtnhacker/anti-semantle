var inGame = false;
var numPlayers;
var curPlayer;
var wordHistory;
var scores;

// Game Logic
function normalizeScore(score) {
    return Math.round(score * 1000);
}

async function submitWord(word) {
    const numPastWords = numPlayers;
    var score = 0;
    let pastWords = [];

    if (wordHistory.length < numPastWords) {
        pastWords = wordHistory;
    } else {
        const l = wordHistory.length;
        pastWords = wordHistory.slice(l-numPastWords);
    }

    for(past of pastWords) {
        try {
            const pastWord = past.word;
            const res = await fetch(API_ENDPOINT + `get_distance=${word},${pastWord}`);
            if (!res.ok) {
                console.error(res.statusText);
            }
            const data = await res.json();
            score += 1 - data.distance;

        } catch (err) {
            console.error(err);
        }
    }
    
    const normalizedScore = wordHistory.length >= numPastWords ? normalizeScore(score) : 0;
    scores[curPlayer + 1] += normalizedScore;

    wordHistory.push({
        player: curPlayer,
        word: word,
        score: normalizedScore
    });

    curPlayer = (curPlayer + 1) % numPlayers;
    return normalizedScore;
}

// Game UI

function getApp() {
    const app = document.getElementById("app");
    
    if (!app) {
        throw new Error("App container is missing. Please refresh the page");
    }

    return app;
}

function generateMenu() {
    const app = getApp();

    const menuDiv = document.createElement('div');
    menuDiv.classList.add('menu');

    const numPlayersInput = document.createElement('input');
    numPlayersInput.setAttribute('type', 'text');
    numPlayersInput.setAttribute('placeholder', 'Enter the number of players');

    const handleStart = (e) => {
        try {
            numPlayers = parseInt(numPlayersInput.value);
            startGame();
        } catch (err) {
            console.error(err)
        }
    }

    const startBtn = document.createElement('button')
    startBtn.innerText = 'START'
    startBtn.onclick = handleStart;

    menuDiv.appendChild(numPlayersInput);
    menuDiv.appendChild(startBtn);
    app.replaceChildren(menuDiv);
}

function generateMainUI() {
    // setup UI generators
    const generateScoresDiv = (currentScore) => {
        const container = document.createElement('div');
        const scoreHeader = document.createElement("h3");
        scoreHeader.innerText = "Scores";
        container.appendChild(scoreHeader);
        Object.keys(currentScore).forEach(index => {
            const score = currentScore[index];
            const curItem = document.createElement('div');
            curItem.innerHTML = /* html */ `
                ${index}: ${score}
            `
            container.appendChild(curItem);
        });
        return container;     
    }

    const generateHistory = (history) => {
        const container = document.createElement('div');
        const historyHeader = document.createElement('h3');
        historyHeader.innerText = "History";
        const list = document.createElement('ol');
        history.forEach(({ player, word, score }) => {
            const curItem = document.createElement('li');
            curItem.innerHTML = /* html */`
                Player ${player+1}: ${word} (${score})
            `
            list.appendChild(curItem);
        });
        container.appendChild(historyHeader);
        container.appendChild(list);
        return container;
    }
    
    const generateMainForm = () => {
        const container = document.createElement('form');
        const input = document.createElement('input');
        input.setAttribute('type', 'text');
        const submitBtn = document.createElement('input');
        submitBtn.setAttribute('type', 'submit');
        submitBtn.setAttribute('value', 'Submit');
        
        const handleSubmit = async (e) => {
            e.preventDefault();
            if (input.value.trim().length === 0) {
                alert("Please input a word");
                return;
            }

            const curWord = input.value.toLowerCase().trim();

            // check if already existing
            if (wordHistory.filter(({ word }) => word === curWord).length) {
                alert("Word already used");
                return;
            }

            const score = await submitWord(curWord);
            console.log(curPlayer, "got score", score);
            generateMainUI();
        }

        container.appendChild(input);
        container.appendChild(submitBtn);
        container.onsubmit = handleSubmit;

        return container;
    }
    
    // Setup the UI
    const scoresDiv = generateScoresDiv(scores);
    const mainForm = generateMainForm();
    const history = generateHistory(wordHistory);
    
    const container = document.createElement('div');
    container.appendChild(scoresDiv);
    container.appendChild(mainForm);
    container.appendChild(history);
    
    app.replaceChildren(container);
}

function startGame() {
    // Reset the scores and history
    wordHistory = [];
    curPlayer = 0;
    scores = Array(numPlayers).fill(0).map((_, index) => index).reduce((total, index) => {
        return { ...total, [index+1]: 0 }
    }, {});

    generateMainUI();
}

window.onload = () => generateMenu();