var MongoClient = require("mongodb").MongoClient;
var htmlToText = require("html-to-text");

var articleUtils = require('./articleUtils.js');
var config = require("./config.json");

var dbPromise = null;
module.exports.getDB = function () {
    if (!dbPromise) {
        dbPromise = new Promise(function(resolve, reject) {
            var mongoServerUri = 'mongodb://' +
                config.mongodb.user + ':' + config.mongodb.password + '@' +
                config.mongodb.host + '/' + config.mongodb.database +
                '?authSource=' + config.mongodb.authSource;

            MongoClient
                .connect(mongoServerUri)
                .then(function(db) {
                    console.log("Connected to mongodb");
                    var dbConnection = db;

                    dbConnection.on("close", function(err) {
                        console.log("Mongodb connection closed. Reason:", err);
                    }).on("error", function(err) {
                        console.log("Mongodb error:", err);
                    });

                    resolve(dbConnection);
                }, function(err) {
                    reject(err);
                });
        });
    }
    return dbPromise;
};

module.exports.convertRawArticle = function (rawArticle) {
    var article = {
        _meta: {
            rawId: rawArticle.id
        },
        id: articleUtils.getCleanId(rawArticle.id),
        title: rawArticle.title,
        summary: rawArticle.summary,
        picture: rawArticle.image,
        url: rawArticle.url,
        lang: rawArticle.language,
        source: rawArticle.source || "PTI",
        published: new Date(parseInt(rawArticle.publishedTime)),
        publishedPlace: null,
        body: null
    };

    article.body = htmlToText.fromString(
        rawArticle.taggedText,
        {
            wordwrap: false,
            uppercaseHeadings: false,
            ignoreImages: true,
            ignoreHref: true
        }
    );

    // FIXME: Find a better way?
    var sourceSeparators = [
        /\(PTI\)/,
        /\(AFP\)/,
        /\/PRNewswire\/\s*?--/
    ];

    for (var i = 0; i < sourceSeparators.length; i++) {
        var matchResult = article.body.match(sourceSeparators[i]);
        if (matchResult && matchResult.index <= 65) {                   //FIXME: Magic number 65
            var cutPosition = matchResult.index + matchResult[0].length;

            article.publishedPlace = article.body.substr(0, cutPosition).trim();
            article.body = article.publishedPlace + '. ' + article.body.substr(cutPosition).trim();

            if (article.summary.indexOf(article.publishedPlace) <= 5) { //FIXME: Magic number 5
                article.summary = article.summary.replace(article.publishedPlace, '').trim();
            }

            break;  // Don't check for more separators
        }
    }

    return article;
};
