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
    store: redisStore,
    secret: "secret",
    resave: true,
    saveUninitialized: true
});

app.use(cookieParser);
app.use(session);
io.use(ios(session)); // session support

var sub = redis.createClient();
var pub = redis.createClient();
var CHAT_NAME = "chat";
sub.subscribe(CHAT_NAME);

app.get("/", function(req, res) {
    req.session.user = "usernameToCome";
    res.sendFile("index.html", { root: __dirname });
});

io.on("connection", function(socket) {
    console.log("Somebody joined the chat.");


    var user = socket.handshake.session.user;
    console.log(user);

    socket.emit("joinedChat", user);
    socket.broadcast.emit("joinedChat", user);

    socket.on("toServerMessage", function(data) {
        // console.log("In toServerMessage: " + data);
        pub.publish(CHAT_NAME, data);
    });

    sub.on("message", function(channel, message) {
        // console.log("In message: " + message);
        socket.emit("toUserMessage", message);
    });
});

server.listen(app_port);

// var app_port = process.env.PORT || 8001;
// var REDIS_HOST = "redischatcluster.fqys9c.0001.usw2.cache.amazonaws.com";
// var REDIS_PORT = 6379;

// var express = require("express");
// var app = express();
// var ExpressSession = require("express-session");
// var server = require("http").Server(app);
// var io = require("socket.io")(server);
// var CookieParser = require('cookie-parser');
// var cookieParser = CookieParser('secret');
// var redis = require('redis');
// var RedisStore = require('connect-redis')(ExpressSession);
// var rClient = redis.createClient(REDIS_PORT, REDIS_HOST);
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

// var sub = redis.createClient(REDIS_PORT, REDIS_HOST);
// var pub = redis.createClient(REDIS_PORT, REDIS_HOST);
// var CHAT_NAME = "chat";
// sub.subscribe(CHAT_NAME);

// app.get("/", function(req, res) {
//     req.session.user = "usernameToCome";
//     res.sendFile("index.html", { root: __dirname });
// });

// io.on("connection", function(socket) {
//     console.log("Somebody joined the chat.");


//     var user = socket.handshake.session.user;
//     console.log(user);

//     socket.emit("joinedChat", user);
//     socket.broadcast.emit("joinedChat", user);

//     socket.on("toServerMessage", function(data) {
//         // console.log("In toServerMessage: " + data);
//         pub.publish(CHAT_NAME, data);
//     });

//     sub.on("message", function(channel, message) {
//         // console.log("In message: " + message);
//         socket.emit("toUserMessage", message);
//     });
// });

// server.listen(app_port);