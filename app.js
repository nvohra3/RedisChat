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
// var rClient = redis.createClient();
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

// For local host use
// var sub = redis.createClient();
// var pub = redis.createClient();
var sub = redis.createClient(REDIS_PORT, REDIS_HOST);
var pub = redis.createClient(REDIS_PORT, REDIS_HOST);
var CHAT_NEW_USER = "chat.newUser"
var CHAT_NEW_MESSAGE = "chat.newMessage";
var CHAT_USER_LEAVING = "chat.userLeaving";
// How does psubscribe pattern matching work? Could reduce this to one line.
sub.subscribe(CHAT_NEW_USER);
sub.subscribe(CHAT_NEW_MESSAGE);
sub.subscribe(CHAT_USER_LEAVING);

app.get("/", function(req, res) {
    res.sendFile("index.html", { root: __dirname });
});

io.on("connection", function(socket) {
    var username = socket.handshake.query.username;
    console.log(username + " joined the chatroom.");

    // Notify all subscribers that a new user has joined the chatroom
    pub.publish(CHAT_NEW_USER, JSON.stringify({ "username" : username }));

    socket.on("toServerMessage", function(data) {
        pub.publish(CHAT_NEW_MESSAGE, JSON.stringify({ "username" : username, "body" : data.body }));
    });

    socket.on("leavingChatroom", function() {
        pub.publish(CHAT_USER_LEAVING, JSON.stringify({ "username" : username }));
    });

    sub.on("message", function(channel, data) {
        var message = JSON.parse(data);
        if (channel.localeCompare(CHAT_NEW_USER) == 0)
        {
            var joinedMessage = " has joined the chatroom. Say hello!";
            console.log(message.username + joinedMessage);
            socket.emit("newUser", { "username" : message.username, "body" : joinedMessage });
        } else if (channel.localeCompare(CHAT_NEW_MESSAGE) == 0)
        {
            console.log(message.username + " just sent the message \"" + message.body + "\"");
            socket.emit("toUserMessage", { "username" : message.username, "body" : message.body });
        } else if (channel.localeCompare(CHAT_USER_LEAVING) == 0)
        {
            var leavingMessage = " has left the chatroom. :(";
            console.log(message.username + leavingMessage);
            socket.emit("userLeaving", { "username" : message.username, "body" : leavingMessage });
        }
    });
});

server.listen(app_port);