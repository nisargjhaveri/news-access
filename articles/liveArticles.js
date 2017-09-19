var ArticleList = require("./liveListArticles.js");
var fullArticle = require("./liveFullArticle.js");
var storedArticleUtils = require('./storedArticleUtils.js');

function getErrorFunc (logId) {
    return function (err) {
        console.error(logId, err);
        return Promise.reject(err);
    };
}

function LiveArticles(logId, source) {
    this.logId = logId || 'noid';
    this.articleList = new ArticleList(this.logId, source);
}

LiveArticles.prototype.fetchOne = function (id) {
    var that = this;

    return this.articleList.getSpecificArticle(id)
        .then(function (article) {
            if (id) {
                return fullArticle.addBodyText(that.logId, article);
            } else {
                return article;
            }
        }, getErrorFunc(that.logId));
};

LiveArticles.prototype.fetchList = function (options) {
    var articles = [];

    var limit = options.limit || 10;

    return this.articleList.getArticleList(limit);
};

LiveArticles.prototype.receiveRaw = function (rawArticle) {
    return Promise.reject("Cannot recieve raw article");
};

LiveArticles.prototype.storePreprocessed = function (article) {
    return Promise.reject("Cannot store preprocessed article");
};

LiveArticles.prototype.storeEdited = storedArticleUtils.storeEdited;
LiveArticles.prototype.initializeLogger = storedArticleUtils.initializeLogger;


module.exports = LiveArticles;
