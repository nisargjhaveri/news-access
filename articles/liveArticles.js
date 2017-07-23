var ArticleList = require("./liveListArticles.js");
var fullArticle = require("./liveFullArticle.js");

function getErrorFunc (id) {
    return function (err) {
        console.error(id, err);
        return Promise.reject(err);
    };
}

function LiveArticles(id, source) {
    this.id = id || 'noid';
    this.articleList = new ArticleList(this.id);
}

LiveArticles.prototype.fetchOne = function (id) {
    id = id || false;
    var that = this;

    return new Promise(function (resolve, reject) {
        var articlePromise;
        if (id) {
            articlePromise = that.articleList.getSpecificArticle(id);
        } else {
            articlePromise = that.articleList.getArticle();
        }

        articlePromise
            .then(function (article) {
                if (id) {
                    return fullArticle.addBodyText(that.id, article);
                } else {
                    return article;
                }
            }, getErrorFunc(that.id))
            .then(resolve, reject);
    });
};


LiveArticles.prototype.receiveRaw = function (rawArticle) {
    return Promise.reject(this.id, "Cannot recieve raw article");
};

LiveArticles.prototype.storePreprocessed = function (article) {
    return Promise.reject(this.id, "Cannot store article");
};

LiveArticles.prototype.storeEdited = function (article) {
    return Promise.reject(this.id, "Cannot store article");
};


module.exports = LiveArticles;
