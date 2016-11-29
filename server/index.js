var path = require('path');
var express = require('express');

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
    res.render('index');
});

app.get('/article/:articleId', function(req, res){
    res.render('article', {
        articleId: req.params.articleId
    });
});

io.on('connection', function(socket){
  console.log('a user connected', socket.id);

  handleSocket(socket);
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
