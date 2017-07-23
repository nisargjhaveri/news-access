var liveArticles = require("./liveArticles.js");
var storedArticle = require("./storedArticles.js");

function Articles(id, source) {
    this.id = id || 'noid';
    this.source = source || 'live';

    switch (this.source) {
        case 'stored':
            this.articles = new storedArticle(this.id);
            break;
        case 'live': // jshint ignore:line
        default:
            this.articles = new liveArticles(this.id);
    }
}

/**
 * Get one article
 * @param  {string|null} id (optional) id of the article.
 * @return {promise}        Resolving an article. Ramdom article if id not provided.
 */
Articles.prototype.fetchOne = function (id) {
    return this.articles.fetchOne(id);
};

/**
 * Get article from a raw article
 * @param  {object}  article raw article
 * @return {promise}         Resolving an article correspoding to raw article.
 */
Articles.prototype.receiveRaw = function (article) {
    return this.articles.receiveRaw(article);
};

/**
 * Store article after processing
 * @param  {object}  article Article to be stored
 * @return {promise}         Resolves if successful
 */
Articles.prototype.storePreprocessed = function (article) {
    return this.articles.storePreprocessed(article);
};

/**
 * Store a final processed article
 * @param  {object}  article Article to be stored
 * @return {promise}         Resolves if successful
 */
Articles.prototype.storeEdited = function (article) {
    return this.articles.storeEdited(article);
};

module.exports = Articles;
