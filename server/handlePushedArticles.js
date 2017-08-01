var Articles = require("../articles");
var articleUtils = require("../articles/articleUtils.js");
var pipeline = require("../pipeline");

module.exports = function (articles) {
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
};
