var request = require("request").defaults({
    'proxy': process.env.http_proxy || process.env.HTTP_PROXY
});
var cheerio = require("cheerio");
var htmlToText = require('html-to-text');

function parseArticle (source, body) {
    var $ = cheerio.load(body);
    var article;

    if (source == "The Indian Express") {
        // FIXME: use htmlToText
        return $("[itemprop='articleBody'] p:not(.appstext)")
            .map(function(i, p) {
                return $(p).text();
            }).get().join("\n");
    } else if (source == "The Times of India") {
        article = $("[itemprop='articleBody'] arttextxml");
    } else if (source == "The Hindu") {
        article = $("[id^='content-body-']");
        $(".also-view-container").remove();
        $(".img-container").remove();
    }

    if (article) {
        return htmlToText.fromString(
            article.html(),
            {
                wordwrap: false,
                uppercaseHeadings: false,
                ignoreImages: true,
                ignoreHref: true
            }
        );
    }

    return false;
}

exports.addBodyText = function (id, article) {
    return new Promise(function (resolve, reject) {
        console.log(id, "Fetching article");
        request(article.url, function (err, res, body) {
            if (err) {
                reject(err);
            } else {
                article.body = parseArticle(article.source, body);
                if (article.body === false) {
                    reject("ARTICLE_PARSE_ERROR");
                } else {
                    resolve(article);
                }
            }
        });
    });
};
