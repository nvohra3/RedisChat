var app_port = process.env.PORT || 8001;

var express = require("express");
var app = express();
var ExpressSession = require("express-session");
var server = require("http").Server(app);
var io = require("socket.io")(server);
var CookieParser = require('cookie-parser');
var cookieParser = CookieParser('secret');
var redis = require('redis');
var RedisStore = require('connect-redis')(ExpressSession);
var rClient = redis.createClient();
var redisStore = new RedisStore({client:rClient});
var ios = require('socket.io-express-session');

var session = ExpressSession({
    // store: redisStore,
    secret: "secret",
    resave: true,
    saveUninitialized: true
});

app.use(cookieParser);
app.use(session);
io.use(ios(session)); // session support

app.get("/", function(req, res) {
    req.session.user = "usernameToCome";
    res.sendFile("/index.html");
});

io.on("connection", function(socket) {
    console.log("Somebody joined the chat.");
    

    var user = socket.handshake.session.user;
    console.log(user);

    socket.emit("joinedChat", user);
    socket.broadcast.emit("joinedChat", user);

    socket.on("toServerMessage", function(data) {
        socket.emit("toUserMessage", data);
        socket.broadcast.emit("toUserMessage", data);
    });
});

server.listen(app_port);