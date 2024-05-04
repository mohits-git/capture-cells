const app = require('express')();
app.get('/', (req, res) => res.sendFile(__dirname + "/index.html"));
app.listen(9091, () => console.log("http: listening at 9091"));

const http = require('http');
const websocketServer = require("websocket").server;
const httpServer = http.createServer();
httpServer.listen(9090, () => console.log("ws: Listening at 9090"));

const clients = {};
const games = {};

const wsServer = new websocketServer({
    "httpServer": httpServer,
});

wsServer.on("request", request => {
    const connection = request.accept(null, request.origin);
    connection.on("open", () => console.log("Open!!"));
    connection.on("close", () => console.log("Closed!!"));
    connection.on("message", message => {
        const result = JSON.parse(message.utf8Data);

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

        if(result.method === "join") {
            const gId = result.gameId;
            const cId = result.clientId;

            const game = games[gId];
            if(game.clients.length >= 3) {
                return;
            }
            const color = {"0": "red", "1": "green", "2": "blue" }[game.clients.length];
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

function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

function guid() {
    return (S4() + S4() + "-" + S4() + "-4" + S4().substring(0, 3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
}
