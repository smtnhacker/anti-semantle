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

    createRoom() {
        const roomID = this.createRoomID();
        this.rooms[roomID] = new Room(roomID);
        return roomID;
    }

    destroyRoom(roomID) {
        if (roomID in this.rooms) {
            delete this.rooms[roomID];
        } else {
            throw new Error("Room doesn't exist");
        }
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