var Articles = require("../articles");
var articleUtils = require("../articles/articleUtils.js");
var pipeline = require("../pipeline");

var logId = 'apicall';
var articleStore = new Articles(logId, 'pti');

function propagateError(err) {
    return Promise.reject(err);
}

function getErrorLogger(logId) {
    return function (err) {
        console.log(logId, "Error:", err);
    };
}

function receiveArticles(articles) {
    if (!Array.isArray(articles)) {
        return false;
    }

    var isValid = false;
    articles.forEach(function(article) {
        if (article.id) {
            isValid = true;
        }
    });
    if (!isValid) return false;

    console.log(logId, "Received " + articles.length + " articles");

    articles.forEach(function (article) {
        return articleStore.receiveRaw(article)
            .then(function (article) {
                console.log(article.id, "Preprocessing raw article");
                return articleUtils.populateBodySentences(article);
            }, propagateError)
            .then(function (article) {
                return pipeline.preProcessArticle(article);
            }, propagateError)
            .then(function (article) {
                console.log(article.id, "Preprocessed. Storing");
                return articleStore.storePreprocessed(article);
            }, propagateError)
            .catch(getErrorLogger(article.id));
    });

    return true;
}

function updateArticles(articles) {
    if (!Array.isArray(articles)) {
        return false;
    }

    var isValid = false;
    articles.forEach(function(article) {
        if (article.id) {
            isValid = true;
        }
    });
    if (!isValid) return false;

    console.log(logId, "Received " + articles.length + " articles");

    articles.forEach(function (article) {
        articleStore.receiveRaw(article)
            .then(function (article) {
                return articleStore.fetchOne(article.id)
                    .then(function (preprocessedArticle) {
                        var prop;
                        for (prop of ['url']) {
                            if (article[prop]) {
                                preprocessedArticle[prop] = article[prop];
                            }
                        }

                        if (!article._meta) {
                            return preprocessedArticle;
                        }

                        if (!preprocessedArticle._meta) {
                            preprocessedArticle._meta = {};
                        }

                        for (prop of ['priority', 'category']) {
                            if (article._meta[prop]) {
                                preprocessedArticle._meta[prop] = article._meta[prop];
                            }
                        }

                        return preprocessedArticle;
                    }, propagateError);
            }, propagateError)
            .then(function (article) {
                console.log(article.id, "Preprocessed. Storing");
                return articleStore.storePreprocessed(article);
            }, propagateError)
            .catch(getErrorLogger(article.id));
        });

    return true;
}

module.exports = {
    receiveArticles,
    updateArticles
};
