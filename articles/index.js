var ArticleList = require("./listArticles.js");
var fullArticle = require("./fullArticle.js");

function getErrorFunc (id) {
    return function (err) {
        console.error(id, err);
    };
}

function Articles(id) {
    this.id = id || 'noid';
    this.articleList = new ArticleList(this.id);
}

Articles.prototype.fetchOne = function (id) {
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
            .then(resolve, getErrorFunc(that.id));
    });
};

module.exports = Articles;
