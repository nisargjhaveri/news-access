var request = require("request").defaults({
    'proxy': process.env.http_proxy || process.env.HTTP_PROXY
});
var cheerio = require("cheerio");

function parseArticle (body) {
    var $ = cheerio.load(body);

    return $("[itemprop='articleBody'] arttextxml").text().trim();
}

exports.addBodyText = function (id, article) {
    return new Promise(function (resolve, reject) {
        console.log(id, "Fetching article");
        request(article.url, function (err, res, body) {
            if (err) {
                reject(err);
            } else {
                article.body = parseArticle(body);
                resolve(article);
            }
        });
    });
};
