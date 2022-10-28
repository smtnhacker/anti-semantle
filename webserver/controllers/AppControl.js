const { nanoid } = require('nanoid')

const { Room } = require('./Room')

class AppControl {

    constructor() {
        this.rooms = { };
    }

    createRoomID() {
        let roomID = nanoid();
        while(roomID in this.rooms) {
            roomID = nanoid();
        }
        return roomID;
    }

    createRoom(isPublic) {
        const roomID = this.createRoomID();
        console.log(roomID, "public:", isPublic);
        this.rooms[roomID] = new Room(roomID, isPublic);
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

    startRoom(roomID) {
        if (roomID in this.rooms) {
            this.rooms[roomID].startGame();
        } else {
            throw new Error("Room doesn't exist");
        }
    }

    submitEntry(roomID, person, word, score) {
        if (roomID in this.rooms) {
            const room = this.rooms[roomID];
            const curPlayer = room.peekNextPlayer();

            if (curPlayer.id === person.id) {
                room.addEntry(person, word, score);
                room.setNextPlayer();
                return room.getScreenshot();
            } else {
                return false;
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