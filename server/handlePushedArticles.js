var Articles = require("../articles");
var articleUtils = require("../articles/articleUtils.js");
var summarize = require("../summarize");
var translate = require("../translate");
var pipeline = require("../pipeline");

module.exports = function (articles) {
    var articleStore = new Articles('apicall', 'stored');

    function propagateError(err) {
        return Promise.reject(err);
    }

    function throwError(err) {
        console.log(socket.id, "Throwing error:", err);
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

    console.log("Received " + articles.length + " articles");

    articles.forEach(function (article) {
        // Sequentially insert the articles
        articleStore.receiveRaw(article)
            .then(function (article) {
                console.log(article.id, "Preprocessing raw article");
                return articleUtils.populateBodySentences(article);
            }, propagateError)
            .then(function (article) {
                return pipeline.preProcessArticle(article);
            }, propagateError)
            .then(function (article) {
                return articleStore.storePreprocessed(article);
            }, propagateError)
            .catch(throwError);
    });

    return true;
};
