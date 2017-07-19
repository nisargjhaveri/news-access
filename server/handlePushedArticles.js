var articleStore = require("../articles").articleStore;
var summarize = require("../summarize");
var translate = require("../translate");
var pipeline = require("../pipeline");

module.exports = function (articles) {
    articleStore.saveRawArticles(articles);
    return true;
};
