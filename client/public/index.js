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

    generateMainMenu() {
        const container = document.createElement('div');
        container.innerHTML = Title();
        this.root.replaceChildren(container);
        
        const createBtn = document.getElementById('createBtn');
        createBtn.onclick = () => this.generateNewGameMenu();

        const joinBtn = document.getElementById('joinBtn');
        joinBtn.onclick = () => this.onGenerateLobbies();

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

        // add some fancy names
        const roomname = document.getElementById('roomname');
        fetch(WEBSERVER_PATH + "/api/get_room_name")
            .then(res => res.json())
            .then(res => roomname.setAttribute('value', res.result))

        // add event handlers
        const form = document.getElementById('new-game-form')

        form.onsubmit = (e) => {
            e.preventDefault();
            const name = document.getElementById('username').value;
            const roomName = roomname.value;
            const isPublic = document.getElementById('public').checked;
            const avoidLetters = document.getElementById('avoidLetters').checked;
            const avoidWords = document.getElementById('avoidWords').checked;

            const opts = {
                isPublic: isPublic,
                avoidLetters: avoidLetters,
                avoidWords: avoidWords
            }

            this.onNewRoom(name, roomName, opts);
        }

        const backBtn = document.getElementById('backBtn');
        backBtn.onclick = (e) => {
            e.preventDefault();
            this.onGoToMenu();
        }

    }

    generateLobby(roomID, roomName, players) {
        const container = document.createElement('div');
        container.innerHTML = Lobby(roomName, roomID, players);
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

        const backBtn = document.getElementById('backBtn');
        backBtn.onclick = (e) => {
            e.preventDefault();
            this.onGoToMenu();
        }
    }

    generateGame(roomName, scores, history, players, curPlayer, pastWords, constraints) {
        const container = document.createElement('div');
        container.innerHTML = Game(roomName, scores, history, players, curPlayer, pastWords, constraints);
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

        const passBtn = document.getElementById('passBtn');
        passBtn.onclick = () => {
            this.onPass();
        }
    }   
}

class MainController {
    constructor(view, model) {
        this.view = view;
        this.model = model;

        this.view.onNewRoom = (name, roomName, opts) => this.createRoom(name, roomName, opts);
        this.view.onJoinRoom = (roomID, name) => this.joinRoom(roomID, name);
        this.view.onStartGame = () => this.startGame();
        this.view.onSubmitWord = (word) =>  this.submitWord(word);
        this.view.onPass = () => this.pass();
        this.view.onGoToMenu = () => this.view.generateMainMenu();
        
        socket.timeout(3000).emit('get-public-rooms', (err, publicRooms) => {
            if (err) {
                this.view.onGenerateLobbies = () => this.view.generateJoinLobby([])
            } else {
                this.view.onGenerateLobbies = () => this.view.generateJoinLobby(publicRooms)
            }
            this.view.generateMainMenu();
        })
    }

    createRoom(hostName, roomName, opts) {
        socket.emit('set-username', hostName, () => {
            socket.emit('create-room', roomName, opts, (roomID) => {
                this.roomID = roomID;
                socket.emit('join-room', roomID, () => {});
            })
        });
    }

    refreshLobby(players, roomName) {
        this.view.generateLobby(this.roomID, roomName, players);
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

    refreshGame(roomName, scores, history, pastWords, players, curPlayer, constraints) {
        this.history = history;
        this.players = players
        this.view.generateGame(roomName, scores, history, players, curPlayer, pastWords, constraints);
    }

    submitWord(word) {
        socket.emit('submit-word', this.roomID, word, (err) => {
            alert(err);
        })
    }

    pass() {
        socket.emit('pass', this.roomID)
    }
}

window.onload = async () => {
    await fetch(WEBSERVER_PATH, { credentials: 'include' })
    
    socket.connect()

    const controller = new MainController(
        new View(),
        null
    );

    socket.on('joined-room', (players, roomName) => controller.refreshLobby(players, roomName))
    socket.on('update-game', (roomName, scores, history, pastWords, players, curPlayer, constraints) => 
        controller.refreshGame(roomName, scores, history, pastWords, players, curPlayer, constraints))
}