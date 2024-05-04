const WebSocket = require('ws');

const PORT = process.env.PORT || 10000;

const clients = {};
const games = {};

const wsServer = new WebSocket.Server({ port: PORT });

wsServer.on("connection", connection => {
    connection.on("open", () => console.log("Open!!"));
    connection.on("close", () => console.log("Closed!!"));
    connection.on("message", message => {
        const result = JSON.parse(message);

        if (result.method === "create") {
            const cId = result.clientId;
            const gameId = guid();
            games[gameId] = {
                "id": gameId,
                "balls": 20,
                "clients": [],
            }

            const payload = {
                "method": "create",
                "game": games[gameId]
            }

            const con = clients[cId].connection;
            con.send(JSON.stringify(payload));
        }

        if (result.method === "join") {
            const gId = result.gameId;
            const cId = result.clientId;

            const game = games[gId];
            if (game.clients.length >= 3) {
                return;
            }
            const color = { "0": "red", "1": "green", "2": "blue" }[game.clients.length];
            game.clients.push({
                "clientId": cId,
                "color": color
            });

            const payload = {
                "method": "join",
                "game": game
            };

            game.clients.forEach(c => {
                clients[c.clientId].connection.send(JSON.stringify(payload));
            });
        }

        if (result.method === "play") {
            const cId = result.cliendId;
            const gId = result.gameId;
            const ballId = result.ballId;

            let state = games[gId].state;
            if (!state) {
                startGame(gId);
                state = {}
            }

            state[ballId] = result.color;
            games[gId].state = state;
            updateGameState();
        }

    });

    const clientId = guid();
    clients[clientId] = {
        "connection": connection,
    };

    const payload = {
        "method": "connect",
        "clientId": clientId,
    };
    connection.send(JSON.stringify(payload));
});

function updateGameState() {
    for (const g of Object.keys(games)) {
        const game = games[g];
        const payload = {
            "method": "update",
            "game": game,
        };
        game.clients.forEach(c => {
            clients[c.clientId].connection.send(JSON.stringify(payload));
        });
    }

    setTimeout(updateGameState, 500);
}

function startGame(gid) {
    setTimeout(() => endGame(gid), 10 * 1000);
}
function endGame(gid) {
    let red = 0, blue = 0, green = 0;
    for (const b of Object.keys(games[gid].state)) {
        if (games[gid].state[b] === 'red') red++;
        if (games[gid].state[b] === 'blue') blue++;
        if (games[gid].state[b] === 'green') green++;
    }

    let winner = null;
    if (red >= blue && red >= green) {
        winner = "red";
    }
    else if (red <= blue && blue >= green) {
        winner = "blue";
    }
    else {
        winner = "green";
    }

    const payload = {
        "method": "end",
        "winner": winner,
    };

    games[gid].clients.forEach(c => {
        clients[c.clientId].connection.send(JSON.stringify(payload));
    });
}

function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

function guid() {
    return (S4() + S4() + "-" + S4() + "-4" + S4().substring(0, 3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
}
