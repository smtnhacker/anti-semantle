const cors = require('cors')
const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
const session = require('express-session')

const app = express()
const httpServer = createServer(app)

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
}))

const sessionMiddleware = session({
    secret: "its a secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
        sameSite: false,
        httpOnly: true
    },
})

app.use(sessionMiddleware)

app.get("*", (req, res) => {
    res.end()
})

const io = new Server(httpServer, {
    cors: {
        origin: ["http://localhost:3000"],
        credentials: true,
    }
})

// convert express middleware to socket middleware
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next)

io.use(wrap(sessionMiddleware))

let freeRoom = 0;

function getRoom() {
    const res = freeRoom.toString();
    freeRoom++;
    return res;
}

let rooms = {}

io.on('connection', (socket) => {
    const req = socket.request

    socket.use((_, next) => {
        req.session.reload(err => {
            if (err) {
                console.log(err);
                socket.disconnect();
            } else {
                next();
            }
        })
    })
    
    req.session.username = req.session.username ?? req.sessionID
    req.session.save()
    
    console.log(`Client connected: ${req.session.username}`)

    socket.on('send-message', (message) => {
        io.emit('send-message', `received ${message}`)
    })

    socket.on('set-username', (name, cb) => {
        console.log('setting name of', req.session.username, "to", name);
        req.session.username = name;
        req.session.save();
        cb();
    })

    socket.on('join-room', (roomID, cb) => {

        if (roomID in rooms) {
            if (rooms[roomID].state === 'lobby') {
                socket.join(roomID);
                req.session.room = roomID;
                req.session.save();
                console.log(req.session.username, "joined", roomID);
                rooms[roomID].players.push({
                    id: req.sessionID,
                    name: req.session.username
                });
                console.log(rooms);
                io.to(roomID).emit('joined-room', rooms[roomID].players);
                cb();
            }
        } else {
            console.error("invalid room", roomID);
        }

    })

    socket.on('create-room', (cb) => {
        const roomID = getRoom();
        rooms[roomID] = {
            players: [],
            scores: {},
            history: [],
            curPlayer: 0,
            state: 'lobby'
        }
        cb(roomID);
    })

    socket.on('start-room', (roomID) => {
        console.log('starting room', roomID);
        rooms[roomID].state = 'started';
        rooms[roomID].players.forEach(player => {
            rooms[roomID].scores[player.name] = 0;
        })
        io.to(roomID).emit('update-game', rooms[roomID].scores, rooms[roomID].history);
    })

    socket.on('score', (score, word, roomID) => {
        const r = rooms[roomID]
        if (req.sessionID === r.players[r.curPlayer].id) {
            const name = r.players[r.curPlayer].name
            const numPlayers = r.players.length

            r.curPlayer = (r.curPlayer + 1) % numPlayers
            r.scores[name] += score
            
            r.history.push({
                player: name,
                word: word,
                score: score
            });

            io.to(roomID).emit('update-game', r.scores, r.history)
        }
    })

    socket.on('disconnect', () => {
        const roomID = req.session.room
        if (roomID && rooms[roomID].state === 'lobby') {
            rooms[roomID].players = rooms[roomID].players.filter(player => player.id !== req.sessionID)
            console.log(rooms[roomID]);
            io.to(roomID).emit('joined-room', rooms[roomID].players)
        } else if (roomID && rooms[roomID].state === 'started') {
            rooms[roomID].players.forEach((player, idx) => {
                if (player.id === req.sessionID) {
                    if (idx <= rooms[roomID].curPlayer) {
                        rooms[roomID].curPlayer--;
                    }
                }
            })
            rooms[roomID].players = rooms[roomID].players.filter(player => player.id !== req.sessionID)
            rooms[roomID].scores[req.session.username] = 'left'
            io.to(roomID).emit('update-game', rooms[roomID].scores, rooms[roomID].history)
        }
    })
})

httpServer.listen(8080, () => {
    console.log('webserver listening at port 8080')
})