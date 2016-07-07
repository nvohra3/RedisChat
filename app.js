var app_port = process.env.PORT || 8001;
// var REDIS_HOST = "redischatcluster.fqys9c.0001.usw2.cache.amazonaws.com";
// var REDIS_PORT = 6379;

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
var rClient = redis.createClient();
// var rClient = redis.createClient(REDIS_PORT, REDIS_HOST);
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

// For local host use
var sub = redis.createClient();
var pub = redis.createClient();
// For AWS host use
// var sub = redis.createClient(REDIS_PORT, REDIS_HOST);
// var pub = redis.createClient(REDIS_PORT, REDIS_HOST);

var CHAT = "redis_chat";
sub.subscribe(CHAT);

app.get("/", function(req, res) {
    res.sendFile("index.html", { root: __dirname });
});

var NEW_USER_JOINED_ROOM = "userJoined";
var NEW_MESSAGE = "newMessage";
var USER_LEFT_ROOM = "userLeaving";

io.on("connection", function(socket) {
    var username = socket.handshake.query.username;
    console.log("Socket connection established for " + username +".");

    // Notify all subscribers that a new user has joined the chatroom
    pub.publish(CHAT, JSON.stringify({ "username" : username, "messageType" : NEW_USER_JOINED_ROOM }));

    socket.on(NEW_MESSAGE, function(data) {
        pub.publish(CHAT, JSON.stringify({ "username" : username, "body" : data.body, "messageType" : NEW_MESSAGE }));
    });

    socket.on(USER_LEFT_ROOM, function() {
        pub.publish(CHAT, JSON.stringify({ "username" : username, "messageType" : USER_LEFT_ROOM }));
    });

    sub.on("message", function(channel, data) {
        var message = JSON.parse(data);
        var messageType = message.messageType;
        if (messageType.localeCompare(NEW_USER_JOINED_ROOM) == 0)
        {
            var joinedMessage = " has joined the chatroom. Say hello!";
            console.log(username + " log:\t" + message.username + joinedMessage);
            socket.emit(NEW_USER_JOINED_ROOM, { "username" : message.username, "body" : joinedMessage });
        } else if (messageType.localeCompare(NEW_MESSAGE) == 0)
        {
            console.log(username + " log:\t" + message.username + " sent the message \"" + message.body + "\"");
            socket.emit(NEW_MESSAGE, { "username" : message.username, "body" : message.body });
        } else // if (messageType.localeCompare(USER_LEFT_ROOM) == 0)
        {
            var leavingMessage = " has left the chatroom. :(";
            console.log(username + " log:\t" + message.username + leavingMessage);
            socket.emit(USER_LEFT_ROOM, { "username" : message.username, "body" : leavingMessage });
        }
    });
});

server.listen(app_port);