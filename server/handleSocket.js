var Articles = require("../articles");
var summarize = require("../summarize");
var translate = require("../translate");
var pipeline = require("../pipeline");

module.exports = function (socket) {
    function handleError(err) {
        return Promise.reject(err);
    }

    function throwError(err) {
        console.log(socket.id, "Throwing error:", err);
        socket.emit('new error', err);
    }

    socket.on('select article source', function (source) {
        socket.articleFactory = new Articles(socket.id, source);
    });

    socket.on('get article list', function (maxArticles) {
        function emitArticle (article) {
            socket.emit('new article', article);
        }

        socket.articleFactory.fetchList({
                limit: maxArticles
            }).then(function (articles) {
                articles.forEach(function (article) {
                    emitArticle(article);
                });
            }, throwError);
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

    socket.on('translate text', function (text, from, to, method, callback) {
        translate.translateText(text, from, to, method)
            .then(callback, throwError);
    });
};
