var Articles = require("../articles");
var summarize = require("../summarize");
var translate = require("../translate");
var pipeline = require("../pipeline");
var nltk = require('../nltk-binding');

var leven = require('leven');

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

    socket.on('workbench get article', function (articleId, lang, options) {
        // FIXME: too much logic here. Move it somewhere else
        socket.articleFactory.fetchOne(articleId)
            .then(function (article) {
                return pipeline.accessArticle(article, [lang], options);
            }, handleError)
            .then(function (articles) {
                return articles[0];
            }, handleError)
            .then(function (article) {
                // Split sentences in body
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
            .then(function (article) {
                // Map sentences in body and summary
                sentences = [].concat.apply([], article.bodySentences);
                summarySentences = article.summarySentences;

                summarySentences.map(function (summarySentence) {
                    var similarities = sentences.map(function (sentence) {
                        return {
                            id: sentence.id,
                            distance: leven(sentence.source, summarySentence.source) / sentence.source.length
                        };
                    });

                    similarities.sort(function (a, b) {
                        return a.distance - b.distance;
                    });

                    // If similarity is more than 90%, match sentence
                    if (similarities[0].distance < 0.1) {
                        summarySentence.id = similarities[0].id;
                    }
                });

                return article;
            }, handleError)
            .then(function (article) {
                socket.emit('workbench article', article);
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
