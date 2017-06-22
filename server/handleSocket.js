var Articles = require("../articles");
var summarize = require("../summarize");
var translate = require("../translate");
var pipeline = require("../pipeline");
var nltk = require('../nltk-binding');

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

    socket.on('workbench get article', function (articleId, lang, options) {
        socket.articleFactory.fetchOne(articleId)
            .then(function (article) {
                return pipeline.accessArticle(article, [lang], options);
            }, handleError)
            .then(function (articles) {
                return articles[0];
            }, handleError)
            .then(function (article) {
                paragraphs = [];
                article.body.split("\n").map(function (para) {
                    paragraphs.push(nltk.splitSentences(para.trim()));
                });

                return Promise.all(paragraphs)
                    .then(function (paragraphs) {
                        paragraphs = paragraphs.filter(function (paragraph) {
                            return paragraph.length;
                        });

                        var id = 0;

                        paragraphs = paragraphs.map(function (paragraph) {
                            return paragraph.map(function (sentence) {
                                return {
                                    id: id++,
                                    source: sentence
                                };
                            });
                        });

                        article.bodySentences = paragraphs;

                        return article;
                    }, function (err) {
                        return Promise.reject(err);
                    });
            }, handleError)
            // .then(function (sentences) {
            //
            // })
            .then(function (article) {
                socket.emit('workbench article', article);
            }, handleError);
    });
};
