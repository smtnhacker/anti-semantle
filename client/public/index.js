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

class View {

    constructor() {
        this.root = document.getElementById('app');

        this.prevTitleInterval = {}
        this.titleFactors = 1
    }

    generateMainMenu(publicRooms) {
        const container = document.createElement('div');
        container.innerHTML = Title();
        this.root.replaceChildren(container);
        
        const createBtn = document.getElementById('createBtn');
        createBtn.onclick = () => this.generateNewGameMenu();

        const joinBtn = document.getElementById('joinBtn');
        joinBtn.onclick = () => this.generateJoinLobby(publicRooms);

        /* ================================ */
        /* === Add chaotic title effect === */
        /* ================================ */

        const letters = document.getElementsByClassName('title-letter');
        Array.from(letters).forEach((letterSpan, index) => {

            const nextPhase = () => {
                const factor = this.titleFactors
                const MAX = 6;
                setTimeout(() => {
                    const attr = letterSpan.getAttribute('data-phase');
                    const nextAttr = ((parseInt(attr) + 1) % MAX).toString();
                    letterSpan.setAttribute('data-phase', nextAttr);
                    nextPhase();
                }, factor * (500 * Math.random() + 500))
            }

            nextPhase();
        })

        container.onmousemove = (e) => {
            // get the bounding box of the buttons
            const bbox = document.getElementById('mainBtns').getBoundingClientRect();
            const xmid = bbox.x + bbox.width / 2;
            const ymid = bbox.y + bbox.height / 2;

            const distance = (xmid - e.x) ** 2 + (ymid - e.y) ** 2;
            const factor = Math.min(5, Math.max(distance / 50000, 0.2));

            this.titleFactors = factor
        }

    

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

    generateGame(scores, history, players, curPlayer, pastWords, constraints) {
        const container = document.createElement('div');
        container.innerHTML = Game(scores, history, players, curPlayer, pastWords, constraints);
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

            const curWord = input.value.trim();
    
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

    refreshGame(scores, history, pastWords, players, curPlayer, constraints) {
        this.history = history;
        this.players = players
        this.view.generateGame(scores, history, players, curPlayer, pastWords, constraints);
    }

    submitWord(word) {
        socket.emit('submit-word', this.roomID, word, (err) => {
            alert(err);
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
    socket.on('update-game', (scores, history, pastWords, players, curPlayer, constraints) => 
        controller.refreshGame(scores, history, pastWords, players, curPlayer, constraints))
}