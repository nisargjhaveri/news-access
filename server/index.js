var path = require('path');
var express = require('express');

var config = require('./config.json');
process.env.http_proxy = config.proxy;

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var viewsDir = path.join(__dirname, 'views');

var handlebars = require('express-handlebars')({
    partialsDir: path.join(viewsDir, 'partials')
});
var bodyParser = require('body-parser');
var passport = require('passport');
var LocalApikeyStrategy = require('passport-localapikey').Strategy;

var handleSocket = require('./handleSocket.js');
var handlePushedArticles = require('./handlePushedArticles.js');

app.engine('handlebars', handlebars);
app.set('views', viewsDir);
app.set('view engine', 'handlebars');

passport.use(new LocalApikeyStrategy(
    function(apikey, done) {
        if (config.apikeys.indexOf(apikey) > -1) {
            return done(null, true);
        } else {
            return done(null, false, { message: 'Unknown apikey'});
        }
    }
));
app.use(passport.initialize());

app.use(bodyParser.json());         // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

app.use('/static', express.static(path.join(__dirname, 'static')));

app.get('/', function(req, res){
    res.render('index', {
        baseUrl: config.baseUrl,
    });
});

app.get('/article/:articleId', function(req, res){
    res.render('article', {
        articleId: req.params.articleId,
        baseUrl: config.baseUrl,
    });
});

app.get('/workbench/:articleId', function(req, res){
    res.render('workbench', {
        articleId: req.params.articleId,
        baseUrl: config.baseUrl,
    });
});

app.post(
    '/api/veooz/push-articles',
    passport.authenticate('localapikey', {session: false}),
    function(req, res) {
        console.log("API request received on /api/veooz/push-articles");

        var status = false;
        if ('articles' in req.body) {
            if (typeof req.body.articles === 'string' || req.body.articles instanceof String) {
                req.body.articles = JSON.parse(req.body.articles);
            }

            status = handlePushedArticles(req.body.articles);
        }

        res.status(status ? 200 : 400).end();
    }
);

io.on('connection', function(socket){
  console.log('a user connected', socket.id);

  handleSocket(socket);
});

http.listen(config.port, function(){
  console.log('listening on *:' + config.port);
});
