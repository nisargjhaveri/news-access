var Articles = require("../articles");
var summarize = require("../summarize");
var translate = require("../translate");
var pipeline = require("../pipeline");

var veoozInterface = require("./veoozInterface.js");

module.exports = function (socketEnsureLoggedIn, socket) {
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
        var authPromise;
        if (options.requireAuth) {
            authPromise = socketEnsureLoggedIn(socket);
        } else {
            authPromise = Promise.resolve();
        }

        authPromise
            .then(function () {
                return socket.articleFactory.fetchOne(articleId);
            }, handleError)
            .then(function (article) {
                return pipeline.accessArticle(article, langs, options);
            }, handleError)
            .then(callback, handleError)
            .catch(throwError);
    });

    socket.on('publish article', function (article, callback) {
        socketEnsureLoggedIn(socket)
            .then(function (user) {
                if (!article._meta) {
                    article._meta = {};
                }
                article._meta.username = user.username;

                return article;
            }, handleError)
            .then(function (article) {
                socket.articleFactory.storeEdited(article)
                    .then(callback, throwError);

                if (article._meta.rawId) {
                    console.log(socket.id, "Pushing accessible article to Veooz:", article.id);
                    return veoozInterface.pushArticle(article).catch(function (err) {
                        console.log(socket.id, "Error pushing article:", err);
                    });
                }
            }, throwError);
    });

    socket.on('translate text', function (text, from, to, method, callback) {
        translate.translateText(text, from, to, method)
            .then(callback, throwError);
    });
};
