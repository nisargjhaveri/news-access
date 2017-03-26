var path = require('path');
var express = require('express');

var config = require('./config.json');
process.env.http_proxy = config.proxy;

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var handlebars = require('express-handlebars')();

var handleSocket = require('./handleSocket.js');

app.engine('handlebars', handlebars);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');

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

io.on('connection', function(socket){
  console.log('a user connected', socket.id);

  handleSocket(socket);
});

http.listen(config.port, function(){
  console.log('listening on *:' + config.port);
});
