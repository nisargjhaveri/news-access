var request = require("request").defaults({
    'proxy': process.env.http_proxy || process.env.HTTP_PROXY,
    'timeout': 20 * 1000
});
var cheerio = require("cheerio");

function parseArticles (body) {
    var $ = cheerio.load(body);

    var articleList = [];

    $('.feed-item').each(function (i, elem) {
        var $elem = $(elem);
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

function ArticleList(logId) {
    this.logId = logId || "noid";
    this.page = 1;

    this.articlePromise = Promise.resolve();
    this.articleList = [];
}

ArticleList.prototype.ensureArticleList = function () {
    var page = this.page || 1;
    // var source = 'timesofindia.indiatimes.com';
    // var source = 'indianexpress.com';
    var source = 'www.thehindu.com';

    var url = 'http://www.veooz.com/ajax/source?langEdition=en&geo=IN&sourceId=' + source + '&feedType=fpopular&page=' + page;

    var that = this;

    return new Promise(function (resolve, reject) {
        if (that.articleList.length === 0) {
            console.log(that.logId, "Fetching list of articles");
            request(url, function (err, res, body) {
                if (err) {
                    reject(err);
                } else {
                    that.articleList = parseArticles(body);
                    if (that.articleList.length === 0) {
                        reject("NO_ARTICLES_PARSED");
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
        console.log(that.logId, "Fetching specific article", id);
        request(url, function (err, res, body) {
            if (err) {
                reject(err);
            } else {
                resolve(parseArticle(body, id));
            }
        });
    });
};

ArticleList.prototype.getArticleList = function (limit) {
    var that = this;
    var articles = [];

    function addOneArticle() {
        that.articlePromise = that.articlePromise
                                .then(function() {
                                    return that.ensureArticleList();
                                }).then(
                                    function () {
                                        articles.push(that.articleList.shift());
                                        return articles;
                                    }
                                );
    }

    for (var i = 0; i < limit; i++) {
        addOneArticle();
    }

    return this.articlePromise;
};

module.exports = ArticleList;
