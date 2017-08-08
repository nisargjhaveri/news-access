var request = require("request").defaults({
    'proxy': process.env.http_proxy || process.env.HTTP_PROXY,
    'timeout': 20 * 1000
});

var veoozArticleUtils = require("../articles/veoozArticleUtils.js");

var config = require('./config.json');

module.exports.pushArticle = function (article) {
    return new Promise(function(resolve, reject) {
        request.post(
            {
                url: "http://www.veooz.com/api/v2/pusharticles",
                form: {
                    apikey: config.veoozApikey,
                    article: JSON.stringify(veoozArticleUtils.convertAccessibleArticle(article))
                }
            },
            function (err, res, body) {
                console.log(err, res, body);
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            }
        );
    });
};
