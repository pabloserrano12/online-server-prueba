const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});


// ================================
// ROOMS
// ================================

const rooms = {};


// ================================
// BASIC SERVER ROUTE
// ================================

const path = require("path");

app.use(express.static(path.join(__dirname, "../client")));

// ================================
// SOCKET CONNECTION
// ================================

io.on("connection", (socket) => {

    console.log("Player connected:", socket.id);


    // ============================
    // CREATE ROOM
    // ============================

    socket.on("createRoom", (playerName) => {

        const roomCode = generateRoomCode();

        rooms[roomCode] = {

            host: socket.id,

            players: []

        };


        addPlayerToRoom(
            socket,
            roomCode,
            playerName,
            true
        );

    });


    // ============================
    // JOIN ROOM
    // ============================

    socket.on(
        "joinRoom",
        ({ roomCode, playerName }) => {

            roomCode =
                roomCode.toUpperCase();


            const room =
                rooms[roomCode];


            if (!room) {

                socket.emit(
                    "roomError",
                    "Room not found."
                );

                return;
            }


            if (room.players.length >= 8) {

                socket.emit(
                    "roomError",
                    "Room is full."
                );

                return;
            }


            addPlayerToRoom(
                socket,
                roomCode,
                playerName,
                false
            );

        }
    );


    // ============================
    // READY
    // ============================

    socket.on("toggleReady", () => {

        const playerInfo =
            findPlayer(socket.id);

        if (!playerInfo) {
            return;
        }


        const player =
            playerInfo.player;


        player.ready =
            !player.ready;


        io.to(playerInfo.roomCode).emit(
            "playersUpdated",
            getPublicPlayers(
                playerInfo.roomCode
            )
        );

    });


    // ============================
    // CHAT
    // ============================

    socket.on(
        "chatMessage",
        (message) => {

            const playerInfo =
                findPlayer(socket.id);

            if (!playerInfo) {
                return;
            }


            const cleanMessage =
                String(message)
                    .trim()
                    .slice(0, 200);


            if (!cleanMessage) {
                return;
            }


            io.to(playerInfo.roomCode).emit(
                "chatMessage",
                {

                    playerName:
                        playerInfo.player.name,

                    message:
                        cleanMessage,

                    playerId:
                        socket.id

                }
            );

        }
    );


    // ============================
    // START GAME
    // ============================

    socket.on("startGame", () => {

        const playerInfo =
            findPlayer(socket.id);

        if (!playerInfo) {
            return;
        }


        const room =
            rooms[playerInfo.roomCode];


        if (room.host !== socket.id) {
            return;
        }


        const allReady =
            room.players.every(
                player => player.ready
            );


        if (!allReady) {

            socket.emit(
                "roomError",
                "Everyone must be ready."
            );

            return;
        }


        io.to(playerInfo.roomCode).emit(
            "gameStarting"
        );

    });


    // ============================
    // DISCONNECT
    // ============================

    socket.on("disconnect", () => {

        console.log(
            "Player disconnected:",
            socket.id
        );


        const playerInfo =
            findPlayer(socket.id);


        if (!playerInfo) {
            return;
        }


        const roomCode =
            playerInfo.roomCode;


        const room =
            rooms[roomCode];


        room.players =
            room.players.filter(
                player =>
                    player.id !== socket.id
            );


        // If the host leaves,
        // give the room to another player.

        if (room.host === socket.id) {

            if (room.players.length > 0) {

                room.host =
                    room.players[0].id;

                room.players[0].host =
                    true;

            } else {

                delete rooms[roomCode];

                return;

            }

        }


        io.to(roomCode).emit(
            "playersUpdated",
            getPublicPlayers(roomCode)
        );


        io.to(roomCode).emit(
            "systemMessage",
            `${playerInfo.player.name} left the room.`
        );

    });

});


// ================================
// ADD PLAYER
// ================================

function addPlayerToRoom(
    socket,
    roomCode,
    playerName,
    isHost
) {

    const room =
        rooms[roomCode];


    const player = {

        id: socket.id,

        name:
            String(playerName)
                .trim()
                .slice(0, 16),

        ready: false,

        host: isHost

    };


    room.players.push(player);


    socket.join(roomCode);


    socket.roomCode =
        roomCode;


    socket.emit(
        "roomJoined",
        {

            roomCode,

            isHost,

            players:
                getPublicPlayers(roomCode)

        }
    );


    io.to(roomCode).emit(
        "playersUpdated",
        getPublicPlayers(roomCode)
    );


    if (room.players.length > 1) {

        io.to(roomCode).emit(
            "systemMessage",
            `${player.name} joined the room.`
        );

    }

}


// ================================
// FIND PLAYER
// ================================

function findPlayer(socketId) {

    for (
        const roomCode in rooms
    ) {

        const room =
            rooms[roomCode];


        const player =
            room.players.find(
                player =>
                    player.id === socketId
            );


        if (player) {

            return {

                roomCode,

                player

            };

        }

    }


    return null;

}


// ================================
// PUBLIC PLAYER DATA
// ================================

function getPublicPlayers(roomCode) {

    const room =
        rooms[roomCode];


    if (!room) {
        return [];
    }


    return room.players.map(
        player => ({

            id: player.id,

            name: player.name,

            ready: player.ready,

            host: player.host

        })
    );

}


// ================================
// ROOM CODE
// ================================

function generateRoomCode() {

    const characters =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";


    let code;


    do {

        code = "";

        for (let i = 0; i < 4; i++) {

            code +=
                characters[
                    Math.floor(
                        Math.random() *
                        characters.length
                    )
                ];

        }

    } while (rooms[code]);


    return code;

}


// ================================
// START SERVER
// ================================

const PORT =
    process.env.PORT || 3000;


server.listen(
    PORT,
    () => {

        console.log(
            `Server running on port ${PORT}`
        );

    }
);