var Articles = require("../articles");
var articleUtils = require("../articles/articleUtils.js");
var storedArticleUtils = require("../articles/storedArticleUtils.js");
var veoozArticleUtils = require("../articles/veoozArticleUtils.js");

var pipeline = require("../pipeline");

var articleStore = new Articles("script", 'pti');

function propagateError(err) {
    return Promise.reject(err);
}

function getErrorLogger(logId) {
    return function (err) {
        console.log(logId, "Error:", err);
    };
}

storedArticleUtils.getDB().then(function (db) {
    var collection = db.collection('raw-articles');

    var promises = [];

    var articlesCursor = collection.find();

    articlesCursor.forEach(function (rawArticle) {
        promises.push(
            Promise.resolve(veoozArticleUtils.convertRawArticle(rawArticle))
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
                .catch(getErrorLogger(rawArticle.id))
        );
    }, function (err) {
        console.log("End forEach:", err);
        Promise.all(
            promises.map(function (promise) {
                return promise.catch();
            })
        ).then(function () {
            db.close();
            console.log("Done. Press Ctrl+C to exit.");
        });
    });
});
