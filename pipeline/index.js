// var Tokenizer = require('sentence-tokenizer');
// var tokenizer = new Tokenizer();
//
// tokenizer.setEntry("This is an entry. Possibly composed of several sentences.");
// tokenizer.getSentences();

var summarize = require("../summarize");
var translate = require("../translate");

exports.accessArticle = function (article, langs, options) {
    options = options || {};
    var summaryPromise = summarize.summarizeArticle(article, options.summarizer);

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
};
