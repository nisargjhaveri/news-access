var Articles = require("../articles").Articles;
var summarize = require("../summarize");
var translate = require("../translate");
var pipeline = require("../pipeline");

module.exports = function (socket) {
    socket.articleFactory = new Articles(socket.id);

    function handleError(err) {
        return Promise.reject(err);
    }

    function throwError(err) {
        console.log(socket.id, "Throwing error:", err);
        socket.emit('new error', err);
    }

    socket.on('get article list', function (maxArticles) {
        function emitArticle (article) {
            socket.emit('new article', article);
        }

        for (var i = 0; i < maxArticles; i++) {
            socket.articleFactory.fetchOne().then(emitArticle, throwError);
        }
    });

    socket.on('access article', function (articleId, langs, options) {
        socket.articleFactory.fetchOne(articleId)
            .then(function (article) {
                return pipeline.accessArticle(article, langs, options);
            }, handleError)
            .then(function (articles) {
                socket.emit('accessible articles', articles);
            }, handleError)
            .catch(throwError);
    });

    socket.on('translate text', function (text, from, to, method) {
        translate.translateText(text, from, to, method)
            .then(function (translation) {
                socket.emit('translated text', text, translation);
            }, throwError);
    });
};
