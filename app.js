// var app_port = process.env.PORT || 8001;

// var express = require("express");
// var app = express();
// var ExpressSession = require("express-session");
// var server = require("http").Server(app);
// var io = require("socket.io")(server);
// var CookieParser = require('cookie-parser');
// var cookieParser = CookieParser('secret');
// var redis = require('redis');
// var RedisStore = require('connect-redis')(ExpressSession);
// var rClient = redis.createClient();
// var redisStore = new RedisStore({client:rClient});
// var ios = require('socket.io-express-session');

// var session = ExpressSession({
//     store: redisStore,
//     secret: "secret",
//     resave: true,
//     saveUninitialized: true
// });

// app.use(cookieParser);
// app.use(session);
// io.use(ios(session)); // session support

// var sub = redis.createClient();
// var pub = redis.createClient();
// var CHAT_NAME = "chat";
// sub.subscribe(CHAT_NAME);

// app.get("/home", function(req, res) {
//     res.sendFile("index.html", { root: __dirname });
// });

// io.on("connection", function(socket) {
//     console.log("Somebody joined the chat.");
//     var username = socket.handshake.query.username;

//     // Still don't get why both are needed
//     // Don't emit this; publish it
//     socket.emit("joining", {"username" : username });
//     socket.broadcast.emit("joining", {"username" : username });

//     socket.on("toServerMessage", function(data) {
//         pub.publish(CHAT_NAME, JSON.stringify({ "username" : data.username, "message" : data.message }));
//     });

//     sub.on("message", function(channel, data) {
//         var object = JSON.parse(data);
//         socket.emit("toUserMessage", { "username" : object.username, "message" : object.message });
//     });

//     socket.on("disconnect", function() {
//         console.log(username + " leaving");
//         socket.emit("leaving", { "username" : username });
//         socket.broadcast.emit("leaving", { "username" : username });
//     });
// });

// server.listen(app_port);

var app_port = process.env.PORT || 8001;
var REDIS_HOST = "redischatcluster.fqys9c.0001.usw2.cache.amazonaws.com";
var REDIS_PORT = 6379;

require('events').EventEmitter.defaultMaxListeners = Infinity;
var express = require("express");
var app = express();
var ExpressSession = require("express-session");
var server = require("http").Server(app);
var io = require("socket.io")(server);
var CookieParser = require('cookie-parser');
var cookieParser = CookieParser('secret');
var redis = require('redis');
var RedisStore = require('connect-redis')(ExpressSession);
var rClient = redis.createClient(REDIS_PORT, REDIS_HOST);
var redisStore = new RedisStore({client:rClient});
var ios = require('socket.io-express-session');

var session = ExpressSession({
    store: redisStore,
    secret: "secret",
    resave: true,
    saveUninitialized: true
});

app.use(cookieParser);
app.use(session);
io.use(ios(session)); // session support

var sub = redis.createClient(REDIS_PORT, REDIS_HOST);
var pub = redis.createClient(REDIS_PORT, REDIS_HOST);
var CHAT_NAME = "chat";
sub.subscribe(CHAT_NAME);

app.get("/", function(req, res) {
    res.sendFile("index.html", { root: __dirname });
});

io.on("connection", function(socket) {
    var username = socket.handshake.query.username;
    console.log(username + " joined the chatroom.");

    // Still don't get why both are needed
    // Don't emit this; publish it
    socket.emit("joining", {"username" : username });
    socket.broadcast.emit("joining", {"username" : username });

    socket.on("toServerMessage", function(data) {
        console.log(username + " just sent the message \"" + data.message + "\"");
        pub.publish(CHAT_NAME, JSON.stringify({ "username" : username, "message" : data.message }));
    });

    sub.on("message", function(channel, data) {
        var object = JSON.parse(data);
        socket.emit("toUserMessage", { "username" : object.username, "message" : object.message });
    });

    socket.on("disconnect", function() {
        console.log(username + " is leaving the chatroom.");
        socket.emit("leaving", { "username" : username });
        socket.broadcast.emit("leaving", { "username" : username });
    });
});

server.listen(app_port);