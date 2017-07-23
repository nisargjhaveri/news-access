// var Tokenizer = require('sentence-tokenizer');
// var tokenizer = new Tokenizer();
//
// tokenizer.setEntry("This is an entry. Possibly composed of several sentences.");
// tokenizer.getSentences();

var summarize = require("../summarize");
var translate = require("../translate");

function preProcessArticle (article, options) {
    console.log(article.id, "Preprocessing article");

    options = options || {};
    var summaryPromise = summarize.summarizeArticle(article, options.summarizer);

    return summaryPromise;
}

function accessArticle (article, langs, options) {
    options = options || {};

    var summaryPromise;

    if (article.summary && Array.isArray(article.summarySentences)) {
        summaryPromise = Promise.resolve(article);
    } else {
        summaryPromise = preProcessArticle(article, options);
    }

    var langArticlePromises = [];

    function getSummaryPromiseResolver (lang) {
        return function (article) {
            return translate.translateArticle(article, lang, options.translator);
        };
    }

    for (var i = 0; i < langs.length; i++) {
        langArticlePromises.push(
            summaryPromise.then(getSummaryPromiseResolver(langs[i]))
        );
    }

    return Promise.all(langArticlePromises);
}

module.exports = {
    preProcessArticle,
    accessArticle
};
