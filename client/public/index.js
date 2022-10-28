const WEBSERVER_PATH = 'http://localhost:8080'
const API_ENDPOINT = 'http://localhost:5000/api/'

const socket = io(WEBSERVER_PATH, {
    withCredentials: true,
    autoConnect: false,
})

function normalizeScore(score) {
    return Math.round(score * 10) * 100;
}

async function submitWord(word, history, numPlayers) {
    const numPastWords = numPlayers;
    var score = 2;
    let pastWords = [];

    if (history.length < numPastWords) {
        pastWords = history;
    } else {
        const l = history.length;
        pastWords = history.slice(l-numPastWords);
    }

    for(past of pastWords) {
        try {
            const pastWord = past.word;
            const res = await fetch(API_ENDPOINT + `get_distance=${word},${pastWord}`);
            if (!res.ok) {
                console.error(res.statusText);
            }
            const data = await res.json();
            score = Math.min(score, 1 - data.distance);

        } catch (err) {
            console.error(err);
        }
    }
    
    const normalizedScore = history.length >= numPastWords ? normalizeScore(score) : 0;

    return normalizedScore;
}

class View {

    constructor() {
        this.root = document.getElementById('app');
    }

    generateMainMenu(publicRooms) {
        const container = document.createElement('div');
        
        const createBtn = document.createElement('button');
        createBtn.innerText = "CREATE GAME";
        createBtn.onclick = () => this.generateNewGameMenu();

        const joinBtn = document.createElement('button');
        joinBtn.innerText = "JOIN ROOM";
        joinBtn.onclick = () => this.generateJoinLobby(publicRooms);

        container.replaceChildren(
            createBtn,
            joinBtn
        );

        this.root.replaceChildren(container);
    }

    generateNewGameMenu() {
        const container = document.createElement('form');

        container.innerHTML = /* html */`
            <div class="form-group">
                <label>Name</label>
                <input type="text" id="username" name="username" required />
            </div>
            <div class="form-group">
                <label>Public</label>
                <input type="checkbox" id="public" name="public" />
            </div>
            <div class="form-group">
                <input type="submit" value="Create Game" />
            </div>
        `

        container.onsubmit = (e) => {
            e.preventDefault();
            const name = document.getElementById('username').value;
            const isPublic = document.getElementById('public').checked;
            this.onNewRoom(name, isPublic);
        }

        this.root.replaceChildren(container)
    }

    generateLobby(roomID, players) {
        const container = document.createElement('div');

        const roomName = document.createElement('h3');
        roomName.innerText = roomID;

        const playersList = document.createElement('ul');
        players.forEach(player => {
            const playerItem = document.createElement('li');
            playerItem.innerHTML = /* html */`
                <span>${player.name}</span>
            `
            playersList.appendChild(playerItem);
        });

        const startBtn = document.createElement('button');
        startBtn.innerText = "START GAME";
        startBtn.onclick = () => this.onStartGame();

        container.replaceChildren(
            roomName,
            playersList,
            startBtn,
        );

        this.root.replaceChildren(container);
    }

    generateJoinLobby(publicRooms) {
        const container = document.createElement('div');
        const form = document.createElement('form');
        
        form.innerHTML = /* html */`
            <div class="form-group">
                <label>Name</label>
                <input type="text" id="username" name="username" required />
            </div>
            <div class="form-group">
                <label>Lobby Code</label>
                <input type="text" id="roomID" name="roomID" required />
            </div>
            <div class="form-group">
                <input type="submit" value="JOIN" />
            </div>
        `;

        form.onsubmit = (e) => {
            e.preventDefault();
            const name = document.getElementById('username').value;
            const roomID = document.getElementById('roomID').value;
            this.onJoinRoom(roomID, name);
        }
        
        const publicContainer = document.createElement('div');
        const publicHeader = document.createElement('h3');
        publicHeader.innerText = 'Public Lobbies';
        
        const publicList = document.createElement('ul');
        publicRooms.forEach(roomID => {
            const item = document.createElement('li');
            item.innerHTML = /* html */`
                ${roomID}
            `;
            publicList.appendChild(item);
        });
        
        publicContainer.replaceChildren(
            publicHeader,
            publicList
        );
        
        container.appendChild(form);
        container.appendChild(publicContainer);
        this.root.replaceChildren(container);
    }

    generateGame(scores, history, players, curPlayer) {
        // setup UI generators
        const generateScoresDiv = (currentScore) => {
            const container = document.createElement('div');
            const scoreHeader = document.createElement("h3");
            scoreHeader.innerText = "Scores";
            container.appendChild(scoreHeader);
            Object.keys(currentScore).forEach(key => {
                const name = currentScore[key].name;
                const score = currentScore[key].score;
                const curItem = document.createElement('div');

                if (key === curPlayer.id) {
                    curItem.innerHTML = /* html */`
                        <strong>${name}</strong>: ${score}
                    `
                } else if (!players.filter(p => p.id === key)[0].active) {
                    curItem.innerHTML = /* html */`
                        <span style="color:#999">${name}: ${score}</span>
                    `
                } else {
                    curItem.innerHTML = /* html */ `
                        ${name}: ${score}
                    `
                }

                container.appendChild(curItem);
            });
            return container;     
        }

        const generateHistory = (history) => {
            const container = document.createElement('div');
            const historyHeader = document.createElement('h3');
            historyHeader.innerText = "History";
            const list = document.createElement('ol');
            history.forEach(({ name, word, score }) => {
                const curItem = document.createElement('li');
                curItem.innerHTML = /* html */`
                    Player ${name}: ${word} (${score})
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
                if (history.filter(({ word }) => word === curWord).length) {
                    alert("Word already used");
                    return;
                }

                this.onSubmitWord(curWord)
            }

            container.appendChild(input);
            container.appendChild(submitBtn);
            container.onsubmit = handleSubmit;

            return container;
        }
        
        // Setup the UI
        const scoresDiv = generateScoresDiv(scores);
        const mainForm = generateMainForm();
        const historyDiv = generateHistory(history);
        
        const container = document.createElement('div');
        container.appendChild(scoresDiv);
        container.appendChild(mainForm);
        container.appendChild(historyDiv);
        
        this.root.replaceChildren(container);
    }   
}

class MainController {
    constructor(view, model) {
        this.view = view;
        this.model = model;

        this.view.onNewRoom = (name, isPublic) => this.createRoom(name, isPublic);
        this.view.onJoinRoom = (roomID, name) => this.joinRoom(roomID, name);
        this.view.onStartGame = () => this.startGame();
        this.view.onSubmitWord = (word) =>  this.submitWord(word);

        socket.timeout(3000).emit('get-public-rooms', (err, publicRooms) => {
            if (err) {
                this.view.generateMainForm([]);
            } else {
                this.view.generateMainMenu(publicRooms);
            }
        })
    }

    createRoom(hostName, isPublic) {
        socket.emit('set-username', hostName, () => {
            socket.emit('create-room', isPublic, (roomID) => {
                this.roomID = roomID;
                socket.emit('join-room', roomID, () => {});
            })
        });
    }

    refreshLobby(players, publicRooms) {
        this.numPlayers = players.length
        this.view.generateLobby(this.roomID, players, publicRooms);
    }

    joinRoom(roomID, name) {
        this.roomID = roomID;
        socket.emit('set-username', name, () => {
            socket.timeout(3000).emit('join-room', roomID, (err) => {
                if (err) {
                    alert('cannot join room');
                }
            })
        });
    }

    startGame() {
        socket.emit('start-room', this.roomID);
    }

    refreshGame(scores, history, players, curPlayer) {
        this.history = history;
        this.view.generateGame(scores, history, players, curPlayer);
    }

    submitWord(word) {
        submitWord(word, this.history, this.numPlayers)
            .then(score => {
                socket.emit('score', score, word, this.roomID);
            })
    }
}

window.onload = async () => {
    await fetch(WEBSERVER_PATH, { credentials: 'include' })
    
    socket.connect()

    const controller = new MainController(
        new View(),
        null
    );

    socket.on('joined-room', (players) => controller.refreshLobby(players))
    socket.on('update-game', (scores, history, players, curPlayer) => controller.refreshGame(scores, history, players, curPlayer))
}