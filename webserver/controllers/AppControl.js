const { nanoid } = require('nanoid')

const { Room } = require('./Room')
const { GameControl } = require('./GameControl')

class AppControl {

    constructor(api = "http://localhost:5000/api") {
        this.rooms = { };
        this.gameMaster = new GameControl(api)
    }

    createRoomID() {
        let roomID = nanoid();
        while(roomID in this.rooms) {
            roomID = nanoid();
        }
        return roomID;
    }

    createRoom(opts) {
        const roomID = this.createRoomID();
        this.rooms[roomID] = new Room(roomID, opts, this.gameMaster);
        return roomID;
    }

    destroyRoom(roomID) {
        if (roomID in this.rooms) {
            delete this.rooms[roomID];
        } else {
            throw new Error("Room doesn't exist");
        }
    }

    getPublicRooms() {
        const res = [];
        Object.keys(this.rooms).forEach(roomID => {
            const room = this.rooms[roomID];
            if (room.isPublic && room.state === Room.STATES.IN_LOBBY) {
                res.push(roomID);
            }
        });
        return res;
    }

    joinRoom(roomID, person) {
        if (roomID in this.rooms) {
            this.rooms[roomID].add(person);
            return this.rooms[roomID].getScreenshot();
        } else {
            throw new Error("Room doesn't exist");
        }
    }

    leaveRoom(roomID, person) {
        if (roomID in this.rooms) {
            this.rooms[roomID].remove(person);
            return this.rooms[roomID].getScreenshot();
        } else {
            throw new Error("Room doesn't exist");
        }
    }

    async startRoom(roomID) {
        if (roomID in this.rooms) {
            await this.rooms[roomID].startGame();
        } else {
            throw new Error("Room doesn't exist");
        }
    }

    async attemptSubmit(roomID, person, word) {
        if (roomID in this.rooms) {
            const room = this.rooms[roomID];
            const screenshot = room.getScreenshot();
            const curPlayer = room.peekNextPlayer();

            if (curPlayer.id === person.id) {
                const constraints = {
                    usedWords: screenshot.history,
                    numPlayers: screenshot.players.length,
                    ...screenshot.constraints
                }
                const score = await this.gameMaster.attemptSubmit(word, constraints);
                room.addEntry(person, word, score);
                await room.setNextPlayer();
                return room.getScreenshot();
            } else {
                throw new Error("It's not your turn yet...");
            }
        } else {
            throw new Error("Room doesn't exist");
        }
    }

    async pass(roomID, person) {
        if (roomID in this.rooms) {
            const room = this.rooms[roomID];
            const screenshot = room.getScreenshot();
            const curPlayer = room.peekNextPlayer();

            if (curPlayer.id === person.id) {
                const constraints = {
                    usedWords: screenshot.history,
                    numPlayers: screenshot.players.length,
                    ...screenshot.constraints
                }
                await room.setNextPlayer();
                return room.getScreenshot();
            } else {
                throw new Error("It's not your turn yet...");
            }
        } else {
            throw new Error("Room doesn't exist");
        }
    }

    peekRoom(roomID) {
        if (roomID in this.rooms) {
            return this.rooms[roomID].getScreenshot();
        } else {
            throw new Error("Room doesn't exist");
        }
    }
}

module.exports = {
    AppControl: AppControl,
}