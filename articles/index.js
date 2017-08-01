var liveArticles = require("./liveArticles.js");
var storedArticle = require("./storedArticles.js");

function Articles(id, source) {
    this.id = id || 'noid';
    this.source = source || 'thehindu';

    switch (this.source) {
        case 'pti':
            this.articles = new storedArticle(this.id);
            break;
        // case 'timesofindia':
        case 'indianexpress':
        case 'thehindu':
            this.articles = new liveArticles(this.id, this.source);
    }
}

/**
 * Get one article
 * @param  {string}  id id of the article.
 * @return {promise}    Resolves to the article.
 */
Articles.prototype.fetchOne = function (id) {
    if (!this.articles) return Promise.reject("Bad article source selected");
    return this.articles.fetchOne(id);
};

/**
 * Get list of articles
 * @param  {object}  options Options
 * @return {promise}         Resolves to an array of article, depending on options
 */
Articles.prototype.fetchList = function (options) {
    if (!this.articles) return Promise.reject("Bad article source selected");
    return this.articles.fetchList(options);
};

/**
 * Get article from a raw article
 * @param  {object}  article raw article
 * @return {promise}         Resolving an article correspoding to raw article.
 */
Articles.prototype.receiveRaw = function (article) {
    if (!this.articles) return Promise.reject("Bad article source selected");
    return this.articles.receiveRaw(article);
};

/**
 * Store article after processing
 * @param  {object}  article Article to be stored
 * @return {promise}         Resolves if successful
 */
Articles.prototype.storePreprocessed = function (article) {
    if (!this.articles) return Promise.reject("Bad article source selected");
    return this.articles.storePreprocessed(article);
};

/**
 * Store a final processed article
 * @param  {object}  article Article to be stored
 * @return {promise}         Resolves if successful
 */
Articles.prototype.storeEdited = function (article) {
    if (!this.articles) return Promise.reject("Bad article source selected");
    return this.articles.storeEdited(article);
};

module.exports = Articles;
