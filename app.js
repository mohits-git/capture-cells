const app = require('express')();
app.get('/', (req, res) => res.sendFile(__dirname + "/index.html"));
app.listen(3000 , () => console.log("http: Listening on port 3000"));
