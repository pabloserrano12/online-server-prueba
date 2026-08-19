// ==========================================
// SOCKET.IO
// ==========================================

const socket = io();


// ==========================================
// ELEMENTS
// ==========================================

const homeScreen =
    document.getElementById("homeScreen");

const roomScreen =
    document.getElementById("roomScreen");

const gameScreen =
    document.getElementById("gameScreen");


const playerNameInput =
    document.getElementById("playerName");

const roomCodeInput =
    document.getElementById("roomCodeInput");


const createRoomBtn =
    document.getElementById("createRoomBtn");

const joinRoomBtn =
    document.getElementById("joinRoomBtn");


const homeMessage =
    document.getElementById("homeMessage");


const roomCodeDisplay =
    document.getElementById("roomCodeDisplay");

const playerCount =
    document.getElementById("playerCount");

const playersList =
    document.getElementById("playersList");


const readyBtn =
    document.getElementById("readyBtn");

const startGameBtn =
    document.getElementById("startGameBtn");

const leaveRoomBtn =
    document.getElementById("leaveRoomBtn");


const chatMessages =
    document.getElementById("chatMessages");

const chatForm =
    document.getElementById("chatForm");

const chatInput =
    document.getElementById("chatInput");


const countdown =
    document.getElementById("countdown");

const gameMessage =
    document.getElementById("gameMessage");


// ==========================================
// VARIABLES
// ==========================================

let playerName = "";

let roomCode = "";

let isHost = false;

let isReady = false;


// ==========================================
// CREATE ROOM
// ==========================================

createRoomBtn.addEventListener(
    "click",
    () => {

        const name =
            playerNameInput.value.trim();


        if (!name) {

            showHomeMessage(
                "Enter your name first."
            );

            return;

        }


        playerName = name;


        socket.emit(
            "createRoom",
            playerName
        );

    }
);


// ==========================================
// JOIN ROOM
// ==========================================

joinRoomBtn.addEventListener(
    "click",
    () => {

        const name =
            playerNameInput.value.trim();


        const code =
            roomCodeInput.value
                .trim()
                .toUpperCase();


        if (!name) {

            showHomeMessage(
                "Enter your name first."
            );

            return;

        }


        if (!code) {

            showHomeMessage(
                "Enter a room code."
            );

            return;

        }


        playerName = name;


        socket.emit(
            "joinRoom",
            {

                roomCode: code,

                playerName: playerName

            }
        );

    }
);


// ==========================================
// ROOM JOINED
// ==========================================

socket.on(
    "roomJoined",
    (data) => {

        roomCode =
            data.roomCode;


        isHost =
            data.isHost;


        isReady = false;


        roomCodeDisplay.textContent =
            roomCode;


        homeScreen.classList.add(
            "hidden"
        );


        roomScreen.classList.remove(
            "hidden"
        );


        gameScreen.classList.add(
            "hidden"
        );


        readyBtn.classList.remove(
            "ready"
        );


        readyBtn.textContent =
            "READY";


        if (isHost) {

            startGameBtn.classList.remove(
                "hidden"
            );

        } else {

            startGameBtn.classList.add(
                "hidden"
            );

        }


        updatePlayers(
            data.players
        );

    }
);


// ==========================================
// PLAYERS UPDATED
// ==========================================

socket.on(
    "playersUpdated",
    (players) => {

        updatePlayers(
            players
        );

    }
);


// ==========================================
// UPDATE PLAYERS
// ==========================================

function updatePlayers(
    players
) {

    playersList.innerHTML = "";


    playerCount.textContent =
        players.length;


    const localPlayer =
        players.find(
            player =>
                player.id === socket.id
        );


    if (localPlayer) {

        isReady =
            localPlayer.ready;


        if (isReady) {

            readyBtn.classList.add(
                "ready"
            );


            readyBtn.textContent =
                "✓ READY";

        } else {

            readyBtn.classList.remove(
                "ready"
            );


            readyBtn.textContent =
                "READY";

        }

    }


    const hostPlayer =
        players.find(
            player =>
                player.host
        );


    if (
        hostPlayer &&
        hostPlayer.id === socket.id
    ) {

        isHost = true;

        startGameBtn.classList.remove(
            "hidden"
        );

    }


    players.forEach(
        player => {

            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "player";


            const statusClass =
                player.ready
                    ? "statusReady"
                    : "statusWaiting";


            const statusText =
                player.ready
                    ? "Ready"
                    : "Not ready";


            element.innerHTML = `

                <div class="playerInfo">

                    <div class="playerAvatar">
                        👤
                    </div>

                    <div>

                        <div class="playerName">

                            ${escapeHTML(
                                player.name
                            )}

                            ${
                                player.host
                                    ? `<span class="hostBadge">HOST</span>`
                                    : ""
                            }

                        </div>

                    </div>

                </div>


                <div
                    class="playerStatus ${statusClass}"
                >
                    ${statusText}
                </div>

            `;


            playersList.appendChild(
                element
            );

        }
    );

}


// ==========================================
// READY
// ==========================================

readyBtn.addEventListener(
    "click",
    () => {

        socket.emit(
            "toggleReady"
        );

    }
);


// ==========================================
// START GAME
// ==========================================

startGameBtn.addEventListener(
    "click",
    () => {

        socket.emit(
            "startGame"
        );

    }
);


// ==========================================
// GAME STARTING
// ==========================================

socket.on(
    "gameStarting",
    () => {

        roomScreen.classList.add(
            "hidden"
        );


        homeScreen.classList.add(
            "hidden"
        );


        gameScreen.classList.remove(
            "hidden"
        );


        startCountdown();

    }
);


// ==========================================
// COUNTDOWN
// ==========================================

function startCountdown() {

    let number = 3;


    countdown.textContent =
        number;


    gameMessage.textContent =
        "Get ready!";


    const timer =
        setInterval(
            () => {

                number--;


                if (number > 0) {

                    countdown.textContent =
                        number;

                }


                else {

                    clearInterval(
                        timer
                    );


                    countdown.textContent =
                        "GO!";


                    gameMessage.textContent =
                        "Have fun!";

                }

            },
            1000
        );

}


// ==========================================
// CHAT
// ==========================================

chatForm.addEventListener(
    "submit",
    (event) => {

        event.preventDefault();


        const message =
            chatInput.value.trim();


        if (!message) {
            return;
        }


        socket.emit(
            "chatMessage",
            message
        );


        chatInput.value = "";


        chatInput.focus();

    }
);


// ==========================================
// RECEIVE CHAT
// ==========================================

socket.on(
    "chatMessage",
    (data) => {

        const mine =
            data.playerId === socket.id;


        addChatMessage(
            data.playerName,
            data.message,
            mine
        );

    }
);


// ==========================================
// SYSTEM MESSAGE
// ==========================================

socket.on(
    "systemMessage",
    (message) => {

        addSystemMessage(
            message
        );

    }
);


// ==========================================
// ROOM ERROR
// ==========================================

socket.on(
    "roomError",
    (message) => {

        showHomeMessage(
            message
        );

    }
);


// ==========================================
// LEAVE
// ==========================================

leaveRoomBtn.addEventListener(
    "click",
    () => {

        location.reload();

    }
);


// ==========================================
// CHAT MESSAGE
// ==========================================

function addChatMessage(
    name,
    message,
    mine
) {

    const element =
        document.createElement(
            "div"
        );


    element.className =
        "chatMessage";


    if (mine) {

        element.classList.add(
            "mine"
        );

    }


    element.innerHTML = `

        <div class="chatName">

            ${escapeHTML(name)}

        </div>


        <div class="chatText">

            ${escapeHTML(message)}

        </div>

    `;


    chatMessages.appendChild(
        element
    );


    chatMessages.scrollTop =
        chatMessages.scrollHeight;

}


// ==========================================
// SYSTEM MESSAGE
// ==========================================

function addSystemMessage(
    message
) {

    const element =
        document.createElement(
            "div"
        );


    element.className =
        "systemMessage";


    element.textContent =
        message;


    chatMessages.appendChild(
        element
    );


    chatMessages.scrollTop =
        chatMessages.scrollHeight;

}


// ==========================================
// HOME ERROR
// ==========================================

function showHomeMessage(
    message
) {

    homeMessage.textContent =
        message;

}


// ==========================================
// HTML SECURITY
// ==========================================

function escapeHTML(
    text
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text;


    return div.innerHTML;

}


// ==========================================
// ENTER KEY
// ==========================================

playerNameInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter"
        ) {

            createRoomBtn.click();

        }

    }
);


roomCodeInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter"
        ) {

            joinRoomBtn.click();

        }

    }
);