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

/* ================= */
/* == Random APIs == */
/* ================= */

const { uniqueNamesGenerator, adjectives, colors, names } = require('unique-names-generator');

app.get('/api/get_room_name', (req, res) => {
    res.json({
        result: uniqueNamesGenerator({
            dictionaries: [adjectives, colors, names],
            separator: "-",
            length: 3
        })
    })
})

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

const appControl = new AppControl(process.env.API);

const sanitizeString = (s) => {
    const clean = Array.from(s).filter(x => x.toLowerCase() !== x.toUpperCase() || x === ' ' || x === '-' || x === '_').reduce((t, c) => 
        t + c, "");
    const short = clean.slice(0, Math.min(clean.length, 20));
    console.log(short);
    return short;
}

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
        req.session.name = sanitizeString(name);
        req.session.save();
        cb();
    })

    socket.on('join-room', (roomID, cb) => {

        try {
            const player = {
                id: req.sessionID,
                name: req.session.name
            }
            const roomScreenshot = appControl.joinRoom(roomID, player);
            const { players, state, roomName } = roomScreenshot;
            socket.join(roomID);
            req.session.room = roomID;
            req.session.save();

            if (state === Room.STATES.IN_LOBBY) {
                io.to(roomID).emit('joined-room', players, roomName);
            } else if (state === Room.STATES.IN_GAME) {
                io.to(roomID).emit('update-game', roomScreenshot);
            }

            cb();

        } catch (err) {
            console.error(err);
        }

    })

    socket.on('create-room', (roomName, _opts, cb) => {
        const opts = {
            ..._opts,
            useLetters: false,
        }
        const roomID = appControl.createRoom(sanitizeString(roomName), opts);
        cb(roomID);
    })

    socket.on('get-public-rooms', (cb) => {
        const publicRooms = appControl.getPublicRooms();
        cb(publicRooms);
    })

    socket.on('start-room', async (roomID) => {
        try {
            await appControl.startRoom(roomID);
            const roomScreenshot = appControl.peekRoom(roomID);
            io.to(roomID).emit('update-game', roomScreenshot);
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
            const roomScreenshot = await appControl.attemptSubmit(roomID, player, word);
            io.to(roomID).emit('update-game', roomScreenshot);
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
            const roomScreenshot = await appControl.pass(roomID, player);
            io.to(roomID).emit('update-game', roomScreenshot);
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
                const roomScreenshot = appControl.leaveRoom(roomID, player);
                const { players, state } = roomScreenshot;
                if (state === Room.STATES.IN_LOBBY) {
                    io.to(roomID).emit('joined-room', players);
                } else if (state === Room.STATES.IN_GAME) {
                    io.to(roomID).emit('update-game', roomScreenshot);
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