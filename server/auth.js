var crypto = require('crypto');
var fs = require('fs');
var path = require('path');

var expressSession = require('express-session');
var MongoStore = require('connect-mongo')(expressSession);

var passport = require('passport');
var LocalApikeyStrategy = require('passport-localapikey').Strategy;
var LocalStrategy = require('passport-local').Strategy;

var passportSocketIo = require("passport.socketio");

var config = require('./config.json');

var storedArticleUtils = require('../articles/storedArticleUtils.js');

var Users = (function () {
    function User (username, password) {
        this.username = username;
        this.password = password;
    }

    User.prototype.verifyPassword = function (password) {
        password = crypto.createHash('sha256').update(password).digest('hex');
        if (this.password === password) {
            return true;
        }
        return false;
    };

    function findOne(username, callback) {
        fs.readFile(path.join(__dirname, 'users.json'), function (err, data) {
            if (err) {
                return callback(null, false);
            }

            var usersList = {};
            try {
                usersList = JSON.parse(data);
            } catch (e) {
                usersList = {};
            }

            if (usersList.hasOwnProperty(username)) {
                return callback(null, new User(username, usersList[username]));
            }

            return callback(null, false);
        });
    }

    return {
        findOne
    };
})();

passport.use(new LocalApikeyStrategy(
    function(apikey, done) {
        if (config.apikeys.indexOf(apikey) > -1) {
            return done(null, true);
        } else {
            return done(null, false, { message: 'Unknown apikey'});
        }
    }
));

passport.use(new LocalStrategy(
    function(username, password, done) {
        Users.findOne(username, function (err, user) {
            if (err) { return done(err); }
            if (!user || !user.verifyPassword(password)) {
                return done(null, false);
            }
            return done(null, user);
        });
    }
));

passport.serializeUser(function (user, callback) {
    callback(null, user.username);
});

passport.deserializeUser(function (username, callback) {
    Users.findOne(username, function (err, user) {
        if (err) { return callback(err); }
        if (!user) {return callback(null, false); }
        callback(null, user);
    });
});

function ensureLoggedIn(req, res, next) {
    var loginUrl = path.join(config.baseUrl, 'login');

    if (!req.isAuthenticated || !req.isAuthenticated()) {
        if (req.session) {
            req.session.returnTo = path.join(config.baseUrl, req.originalUrl || req.url);
        }
        return res.redirect(loginUrl);
    }

    next();
}

function socketEnsureLoggedIn(socket) {
    return new Promise(function(resolve, reject) {
        var user = socket.request.user;
        if (user && user.logged_in && user.username) {
            return resolve(user);
        }
        return reject("Authentication required");
    });
}

// Sessions and auth middlewares
var sessionStore = new MongoStore({
    dbPromise: storedArticleUtils.getDB(),
    collection: '_sessions'
});

var expressSession = expressSession({
    name: 'news-access.sid',
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    store: sessionStore
});

var socketPassportAuth = passportSocketIo.authorize({
    cookieParser: require('cookie-parser'),
    key: 'news-access.sid',
    secret: 'keyboard cat',
    store: sessionStore,
    success: function(data, accept) {
        accept();
    },
    fail: function(data, message, error, accept) {
        accept();
    },
});

module.exports = {
    passport,
    passportSocketIo,
    sessionStore,
    expressSession,
    socketPassportAuth,
    ensureLoggedIn,
    socketEnsureLoggedIn,
};
