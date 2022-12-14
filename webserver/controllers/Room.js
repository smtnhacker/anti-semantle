class ScoreController {
    constructor() {
        this.store = {}
    }

    set(id, name, score) {
        this.store[id] = { name: name, score: score }
    }

    get(id) {
        if (id in this.store) {
            return { ...this.store[id] };
        } else {
            return { name: null, score: 0 };
        }
    }

    increment(id, score) {
        const prev = this.get(id);
        this.store[id] = {
            ...prev,
            score: prev.score + score
        }
    }

    generateScoreBoardWithPlayers(players) {
        const res = [];
        players.forEach(player => {
            res.push(this.get(player.id))
        });
        return res;
    }

    generateScoreBoard() {
        return JSON.parse(JSON.stringify(this.store))
    }
}

class HistoryController {
    constructor() {
        this.store = []
    }

    addEntry(name, word, score) {
        this.store.push({
            name: name,
            word: word,
            score: score
        })
    }

    generateHistory(amount = this.store.length) {
        if (amount > this.store.length) {
            return JSOM.parse(JSON.stringify(this.store));
        }
        return JSON.parse(JSON.stringify(this.store.slice(-amount)));
    }
}

class Room {

    static STATES = {
        IN_LOBBY: 0,
        IN_GAME: 1,
        ENDED: 2,
    }

    constructor(id, name, opts, gameMaster) {

        this.id = id
        this.name = name

        this.numRounds = opts.numRounds
        this.isPublic = opts.isPublic
        this.constraintsOpts = {
            useLetters: opts.useLetters,
            avoidLetters: opts.avoidLetters,
            avoidWords: opts.avoidWords
        }
        this.gameMaster = gameMaster

        this.state = Room.STATES.IN_LOBBY
        this.curPlayer = -1
        this.roundsLeft = this.numRounds ? this.numRounds : null

        this.members = []
        this.ScoreController = new ScoreController()
        this.HistoryController = new HistoryController()

        this.start = new Date();

    }

    add(person) {
        if (this.state === Room.STATES.ENDED) {
            throw new Error('Room has already ended');
        } else if (this.members.filter(p => p.id === person.id).length) {
            if (this.state === Room.STATES.IN_LOBBY) {
                throw new Error(`Person already exists in the lobby ${this.id}`);
            } else {
                this.members = this.members.map(p => {
                    if (p.id === person.id) return { ...p, active: true };
                    else return p;
                })
            }
        } else if (this.state === Room.STATES.IN_GAME) {
            throw new Error("Cannot join an existing game")
        } else {
            this.members.push({ ...person, active: true });
        }
    }

    remove(person) {
        if (this.members.filter(p => p.id === person.id).length === 0) {
            throw new Error(`Person does not exist in room ${this.id}`);
        } else if (this.state === Room.STATES.IN_GAME) {
            this.members = this.members.map(p => {
                if (p.id === person.id) return { ...p, active: false };
                else return p;
            })
        } else {
            this.members = this.members.filter(p => p.id !== person.id);
        }
    }

    async startGame() {
        if (this.state === Room.STATES.IN_LOBBY) {
            this.start = (new Date());

            this.state = Room.STATES.IN_GAME;
            this.curPlayer = -1;

            this.members.forEach(person => this.ScoreController.set(person.id, person.name, 0));
            this.constraints = await this.gameMaster.generateConstraints(this.constraintsOpts)

            // add seed words
            for(let i=0; i < Math.ceil(this.members.length * 1.5); i++) {
                const randWord = await this.gameMaster.getRandomWord();
                this.HistoryController.addEntry('Seed', randWord, 0);
            }

        } else {
            throw new Error('Room cannot start unless in lobby.')
        }
    }

    addEntry(person, word, score) {
        if (this.state === Room.STATES.ENDED) return;

        this.ScoreController.increment(person.id, score);
        this.HistoryController.addEntry(person.name, word, score);
    }

    getMembers() {
        return JSON.parse(JSON.stringify(this.members));
    }

    getScreenshot() {
        return {
            roomName: this.name,
            state: this.state,
            STATES: Room.STATES,
            curPlayer: this.peekNextPlayer(),
            players: this.getMembers(),
            scores: this.ScoreController.generateScoreBoard(),
            history: this.HistoryController.generateHistory(),
            pastWords: this.gameMaster.getRelevantWords(this.HistoryController.generateHistory(), this.members.length),
            constraints: this.constraints,
            roundsLeft: this.roundsLeft,
            elapsed: (new Date()) - this.start
        }
    }

    peekNextPlayer() {
        for(let i=1; i<=this.members.length; i++) {
            const cur = (this.curPlayer + i) % this.members.length;
            if (this.members[cur].active) {
                return this.members[cur];
            }
        }
    }

    async setNextPlayer() {
        if (this.state === Room.STATES.ENDED) return;

        const prevPlayer = this.peekNextPlayer();
        const prevPlayerId = this.members.findIndex(p => p.id === prevPlayer.id);
        
        this.curPlayer++;
        this.constraints = await this.gameMaster.generateConstraints(this.constraintsOpts)

        const curPlayer = this.peekNextPlayer();
        const curPlayerId = this.members.findIndex(p => p.id === curPlayer.id);
        if (curPlayerId <= prevPlayerId) {
            this.endTurn();
        }
    }

    endTurn() {
        if (!this.numRounds || this.state === Room.STATES.ENDED) {
            return;
        }

        this.roundsLeft--;
        if (this.roundsLeft <= 0) {
            this.state = Room.STATES.ENDED;
        }
    }
}

module.exports = {
    Room: Room
}