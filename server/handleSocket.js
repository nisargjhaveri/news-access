var Articles = require("../articles");
var summarize = require("../summarize");
var translate = require("../translate");
var pipeline = require("../pipeline");

module.exports = function (socket) {
    socket.articleFactory = new Articles(socket.id);

    function handleError(err) {
        socket.emit('new error', err);
    }

    socket.on('get article list', function (maxArticles) {
        function emitArticle (article) {
            socket.emit('new article', article);
        }

        for (var i = 0; i < maxArticles; i++) {
            socket.articleFactory.fetchOne().then(emitArticle, handleError);
        }
    });

    socket.on('access article', function (articleId, langs, options) {
        socket.articleFactory.fetchOne(articleId)
            .then(function (article) {
                return pipeline.accessArticle(article, langs, options);
            }, function(err) {
                return Promise.reject(err);
            })
            .then(function (articles) {
                socket.emit('accessible articles', articles);
            }, handleError);
    });

};
