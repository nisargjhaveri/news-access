var Articles = require("../articles");
var summarize = require("../summarize");
var translate = require("../translate");
var pipeline = require("../pipeline");

var veoozInterface = require("./veoozInterface.js");

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

    socket.on('get article list', function (options, callback) {
        socket.articleFactory.fetchList(options).then(callback, throwError);
    });

    socket.on('access article', function (articleId, langs, options, callback) {
        socket.articleFactory.fetchOne(articleId)
            .then(function (article) {
                return pipeline.accessArticle(article, langs, options);
            }, handleError)
            .then(callback, handleError)
            .catch(throwError);
    });

    socket.on('publish article', function (article, callback) {
        socket.articleFactory.storeEdited(article)
            .then(callback, throwError)
            .then(function () {
                if (!article._meta || !article._meta.rawId) {
                    // Don't push to Veooz
                    return;
                } else {
                    console.log(socket.id, "Pushing accessible article to Veooz:", article.id);
                    return veoozInterface.pushArticle(article);
                }
            }, handleError)
            .catch(function (err) {
                console.log(socket.id, "Error:", err);
            });
    });

    socket.on('translate text', function (text, from, to, method, callback) {
        translate.translateText(text, from, to, method)
            .then(callback, throwError);
    });
};
