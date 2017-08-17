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

var auth = require('./auth.js');
var handleSocket = require('./handleSocket.js');
var handlePushedArticles = require('./handlePushedArticles.js');

app.engine('handlebars', handlebars);
app.set('views', viewsDir);
app.set('view engine', 'handlebars');

app.use(auth.passport.initialize());

app.use(bodyParser.json({           // to support JSON-encoded bodies
    limit: '500kb'
}));
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true,
    limit: '500kb'
}));

app.use('/static', express.static(path.join(__dirname, 'static')));

app.get('/:articleSource?', function(req, res){
    res.render('index', {
        articleSource: req.params.articleSource,
        baseUrl: config.baseUrl,
    });
});

app.get('/article/:articleSource/:articleId', function(req, res){
    res.render('article', {
        articleSource: req.params.articleSource,
        articleId: req.params.articleId,
        baseUrl: config.baseUrl,
    });
});

app.get('/workbench/:articleSource/:articleId', function(req, res){
    res.render('workbench', {
        articleSource: req.params.articleSource,
        articleId: req.params.articleId,
        baseUrl: config.baseUrl,
    });
});

app.post(
    '/api/veooz/push-articles',
    auth.passport.authenticate('localapikey', {session: false}),
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
