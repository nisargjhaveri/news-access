var crypto = require('crypto');
var fs = require('fs');
var path = require('path');

var config = require('./config.json');

var passport = require('passport');
var LocalApikeyStrategy = require('passport-localapikey').Strategy;
var LocalStrategy = require('passport-local').Strategy;
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn(path.join(config.baseUrl, 'login'));

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

module.exports = {
    passport,
    ensureLoggedIn
};
