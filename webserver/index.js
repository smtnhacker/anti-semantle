const cors = require('cors')
const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
const session = require('express-session')

const { AppControl } = require("./controllers/AppControl")
const { Room } = require("./controllers/Room")

require('dotenv').config()

const app = express()
const httpServer = createServer(app)

app.use(cors({
    origin: process.env.CLIENT,
    credentials: true,
}))

const sessionMiddleware = session({
    secret: process.env.SECRET || "its a secret",
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
        origin: [process.env.CLIENT],
        credentials: true,
    }
})

// convert express middleware to socket middleware
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next)
io.use(wrap(sessionMiddleware))

const appControl = new AppControl();

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
    
    req.session.name = req.session.name ?? req.sessionID
    req.session.save()
    
    console.log(`Client connected: ${req.session.name}`)

    socket.on('send-message', (message) => {
        io.emit('send-message', `received ${message}`)
    })

    socket.on('set-username', (name, cb) => {
        console.log('setting name of', req.session.name, "to", name);
        req.session.name = name;
        req.session.save();
        cb();
    })

    socket.on('join-room', (roomID, cb) => {

        try {
            const player = {
                id: req.sessionID,
                name: req.session.name
            }
            const { state, scores, history, players, curPlayer, pastWords, constraints } = appControl.joinRoom(roomID, player);
            socket.join(roomID);
            req.session.room = roomID;
            req.session.save();

            if (state === Room.STATES.IN_LOBBY) {
                io.to(roomID).emit('joined-room', players);
            } else if (state === Room.STATES.IN_GAME) {
                io.to(roomID).emit('update-game', scores, history, pastWords, players, curPlayer, constraints);
            }

            cb();

        } catch (err) {
            console.error(err);
        }

    })

    socket.on('create-room', (isPublic, cb) => {
        const opts = {
            isPublic: isPublic,
            useLetters: true,
            avoidLetters: true,
            avoidWords: true
        }
        const roomID = appControl.createRoom(opts);
        cb(roomID);
    })

    socket.on('get-public-rooms', (cb) => {
        const publicRooms = appControl.getPublicRooms();
        cb(publicRooms);
    })

    socket.on('start-room', async (roomID) => {
        try {
            await appControl.startRoom(roomID);
            const { scores, history, players, curPlayer, pastWords, constraints } = appControl.peekRoom(roomID);
            io.to(roomID).emit('update-game', scores, history, pastWords, players, curPlayer, constraints);
        } catch (err) {
            console.error(err);
        }
    })

    socket.on('submit-word', async (roomID, word, cb) => {
        const player = {
            id: req.sessionID,
            name: req.session.name
        };
        try {
            const res = await appControl.attemptSubmit(roomID, player, word);
            const { scores, history, players, curPlayer, pastWords, constraints } = res;
            io.to(roomID).emit('update-game', scores, history, pastWords, players, curPlayer, constraints);
        } catch (err) {
            console.log(err);
            cb(err.message);
        }
    })

    socket.on('pass', async (roomID) => {
        const player = {
            id: req.sessionID,
            name: req.session.name
        };
        try {
            const res = await appControl.pass(roomID, player);
            const { scores, history, players, curPlayer, pastWords, constraints } = res;
            io.to(roomID).emit('update-game', scores, history, pastWords, players, curPlayer, constraints);
        } catch (err) {
            console.log(err);
        }
    })

    socket.on('disconnect', () => {
        const roomID = req.session.room
        const player = {
            id: req.sessionID,
            name: req.session.name
        };
        try {
            if (roomID) {
                const { state, players, curPlayer, scores, history, pastWords } = appControl.leaveRoom(roomID, player);
                if (state === Room.STATES.IN_LOBBY) {
                    io.to(roomID).emit('joined-room', players);
                } else if (state === Room.STATES.IN_GAME) {
                    io.to(roomID).emit('update-game', scores, history, pastWords, players, curPlayer);
                }
                socket.leave(roomID);
                delete req.session.room;
                req.session.save();
            }
        } catch (err) {
            console.error(err);
        }
    })
})

const PORT = process.env.PORT || 8080;

httpServer.listen(PORT, () => {
    console.log(`webserver listening at port ${PORT}`)
})