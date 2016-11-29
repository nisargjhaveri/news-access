var Articles = require("../articles");
var summarize = require("../summarize");
var translate = require("../translate");
var pipeline = require("../pipeline");

module.exports = function (socket) {
    socket.articleFactory = new Articles(socket.id);

    socket.on('get article list', function (maxArticles) {
        function emitArticle (article) {
            socket.emit('new article', article);
        }

        for (var i = 0; i < maxArticles; i++) {
            socket.articleFactory.fetchOne().then(emitArticle);
        }
    });

    socket.on('access article', function (articleId, langs) {
        socket.articleFactory.fetchOne(articleId)
            .then(function (article) {
                return pipeline.accessArticle(article, langs);
            })
            .then(function (articles) {
                socket.emit('accessible articles', articles);
            });
    });

};
