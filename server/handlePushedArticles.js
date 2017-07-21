var articleStore = require("../articles").articleStore;
var summarize = require("../summarize");
var translate = require("../translate");
var pipeline = require("../pipeline");

module.exports = function (articles) {
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

    articleStore.saveRawArticles(articles);
    return true;
};
