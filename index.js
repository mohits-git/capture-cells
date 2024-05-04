const http = require('http');
const websocketServer = require("websocket").server;
const httpServer = http.createServer();
httpServer.listen(9090, () => console.log("http: Listening at 9090"));

const clients = {};

const wsServer = new websocketServer({
    "httpServer": httpServer,
});

wsServer.on("request", request => {
    const connection = request.accept(null, request.origin);
    connection.on("open", () => console.log("Open!!"));
    connection.on("close", () => console.log("Closed!!"));
    connection.on("message", message => {
        const result = JSON.parse(message.utf8Data);
        console.log(result);
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
