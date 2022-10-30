import { 
    Title, 
    NewGameForm,
    JoinLobby,
    Lobby,
    Game,
 } from "./views/index.mjs";

const socket = io(WEBSERVER_PATH, {
    withCredentials: true,
    autoConnect: false,
})

function normalizeScore(score) {
    return Math.round(score * 10) * 100;
}

async function getScore(word, history, pastWords) {
    const numPastWords = pastWords.length;
    var score = 2;

    for(const pastWord of pastWords) {
        try {
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

function getRelevantWords(history, numPastWords) {
    let pastWords = [];

    if (history.length < numPastWords) {
        pastWords = { ...history };
    } else {
        const l = history.length;
        pastWords = history.slice(l-numPastWords);
    }

    return Object.keys(pastWords).map(key => pastWords[key].word);
}

class View {

    constructor() {
        this.root = document.getElementById('app');
    }

    generateMainMenu(publicRooms) {
        const container = document.createElement('div');
        container.innerHTML = Title();
        this.root.replaceChildren(container);
        
        const createBtn = document.getElementById('createBtn');
        createBtn.onclick = () => this.generateNewGameMenu();

        const joinBtn = document.getElementById('joinBtn');
        joinBtn.onclick = () => this.generateJoinLobby(publicRooms);

    }

    generateNewGameMenu() {
        const container = document.createElement('div');
        container.innerHTML = NewGameForm();
        this.root.replaceChildren(container)

        const form = document.getElementById('new-game-form')

        form.onsubmit = (e) => {
            e.preventDefault();
            const name = document.getElementById('username').value;
            const isPublic = document.getElementById('public').checked;
            this.onNewRoom(name, isPublic);
        }

    }

    generateLobby(roomID, players) {
        const container = document.createElement('div');
        container.innerHTML = Lobby("sample", roomID, players);
        this.root.replaceChildren(container);

        const startBtn = document.getElementById('startBtn');
        startBtn.onclick = () => this.onStartGame();
    }

    generateJoinLobby(publicRooms) {
        const container = document.createElement('div');
        container.innerHTML = JoinLobby(publicRooms);
        this.root.replaceChildren(container);

        const form = document.getElementById('joinLobbyForm');

        form.onsubmit = (e) => {
            e.preventDefault();
            const name = document.getElementById('username').value;
            const roomID = document.getElementById('roomID').value;
            this.onJoinRoom(roomID, name);
        }
    }

    generateGame(scores, history, players, curPlayer, pastWords) {
        const container = document.createElement('div');
        container.innerHTML = Game(scores, history, players, curPlayer, pastWords);
        this.root.replaceChildren(container);

        // apply event handlers
        const input = document.getElementById("mainInput")
        const form = document.getElementById("mainForm");

        form.onsubmit = async (e) => {
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
    
            e.target.reset();
            this.onSubmitWord(curWord);
        }
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
        this.players = players
        const numPastWords = this.players.length;
        const pastWords = getRelevantWords(this.history, numPastWords)
        this.view.generateGame(scores, history, players, curPlayer, pastWords);
    }

    submitWord(word) {
        const numPastWords = this.players.length;
        const pastWords = getRelevantWords(this.history, numPastWords)
        getScore(word, this.history, pastWords)
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