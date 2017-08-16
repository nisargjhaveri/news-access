var passport = require('passport');
var LocalApikeyStrategy = require('passport-localapikey').Strategy;

var config = require('./config.json');

passport.use(new LocalApikeyStrategy(
    function(apikey, done) {
        if (config.apikeys.indexOf(apikey) > -1) {
            return done(null, true);
        } else {
            return done(null, false, { message: 'Unknown apikey'});
        }
    }
));

module.exports = passport;
