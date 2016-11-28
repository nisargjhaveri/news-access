// var Tokenizer = require('sentence-tokenizer');
// var tokenizer = new Tokenizer();
//
// tokenizer.setEntry("This is an entry. Possibly composed of several sentences.");
// tokenizer.getSentences();

var Articles = require("../articles");
var summarize = require("../summarize");
var translate = require("../translate");

var articles = new Articles();

articles.fetchOne()
    .then(summarize.summarizeArticle)
    .then(function (article) {
        return translate.translateArticle(article, 'gu');
    })
    .then(function (article) {
        console.log(article);
    });
