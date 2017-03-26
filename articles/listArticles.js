var request = require("request").defaults({
    'proxy': process.env.http_proxy || process.env.HTTP_PROXY
});
var cheerio = require("cheerio");

function parseArticles (body) {
    var $ = cheerio.load(body);

    var articleList = [];

    $('.feed-item').each(function (i, elem) {
        $elem = $(elem);
        articleList.push(makeArticle($elem));
    });

    return articleList;
}

function parseArticle (body, id) {
    var $ = cheerio.load(body);

    return makeArticle($(".feed-item[data-link-id='" + id + "']"));
}

function makeArticle ($elem) {
    return {
        id: $elem.data('linkId'),
        title: $elem.find('.feed-item-title .title-url').text(),
        summary: $elem.find('.feed-item-text .summary-content').text(),
        picture: $elem.find('img.feed-item-news-photo').attr('src'),
        url: $elem.data('webUrl'),
        lang: $elem.data('language'),
        source: $elem.find('.news-source-info .news-source').text().trim(),
        published: Date.parse($elem.find('.news-source-info .timeago').attr('datetime')),
    };
}

function ArticleList(id) {
    this.id = id || "noid";
    this.page = 1;

    this.articlePromise = Promise.resolve();
    this.articleList = [];
}

ArticleList.prototype.ensureArticleList = function () {
    var page = this.page || 1;
    var url = 'http://www.veooz.com/ajax/source?langEdition=en&geo=IN&sourceId=timesofindia.indiatimes.com&feedType=fpopular&page=' + page;

    var that = this;

    return new Promise(function (resolve, reject) {
        if (that.articleList.length === 0) {
            console.log(that.id, "Fetching list of articles");
            request(url, function (err, res, body) {
                if (err) {
                    reject(err);
                } else {
                    that.articleList = parseArticles(body);
                    if (that.articleList.length === 0) {
                        reject();
                    } else {
                        resolve();
                    }
                }
            });

            that.page += 1;
        } else {
            resolve();
        }
    });
};

ArticleList.prototype.getSpecificArticle = function (id) {
    var url = 'http://www.veooz.com/news/' + id + '.html';

    var that = this;

    return new Promise(function (resolve, reject) {
        console.log(that.id, "Fetching specific article");
        request(url, function (err, res, body) {
            if (err) {
                reject(err);
            } else {
                resolve(parseArticle(body, id));
            }
        });
    });
};

ArticleList.prototype.getArticle = function () {
    var that = this;
    this.articlePromise = this.articlePromise
                            .then(function() {
                                return that.ensureArticleList();
                            }).then(
                                function() {
                                    return that.articleList.shift();
                                }, function(err) {
                                    return Promise.reject(err);
                                }
                            );

    return this.articlePromise;
};

module.exports = ArticleList;
