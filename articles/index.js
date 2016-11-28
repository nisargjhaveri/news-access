var ArticleList = require("./listArticles.js").ArticleList;
var fullArticle = require("./fullArticle.js");

function throwError (error) {
    console.error(error);
    throw error;
}

function Articles() {
    this.articleList = new ArticleList();
}

Articles.prototype.fetchOne = function () {
    var that = this;

    return new Promise(function (resolve, reject) {
        that.articleList.getArticle()
            .then(fullArticle.addBodyText, throwError)
            .then(resolve, throwError);
    });
};

module.exports = Articles;

// a = new Articles();
// a.fetchOne().then(function (article) {
//     console.log(article);
// }, throwError);
