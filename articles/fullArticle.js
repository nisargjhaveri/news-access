var request = require("request").defaults({
    'proxy': process.env.http_proxy || process.env.HTTP_PROXY
});
var cheerio = require("cheerio");

function parseArticle (source, body) {
    var $ = cheerio.load(body);

    if (source == "The Indian Express") {
        return $("[itemprop='articleBody'] p:not(.appstext)")
            .map(function(i, p) {
                return $(p).text();
            }).get().join("\n");
    } else if (source == "The Time of India") {
        return $("[itemprop='articleBody'] arttextxml").text().trim();
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
