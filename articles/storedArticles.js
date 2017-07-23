var MongoClient = require("mongodb").MongoClient;
var htmlToText = require("html-to-text");

var config = require("./config.json");

var articleUtils = require('./articleUtils.js');

function getCleanId (id) {
    return id
        .replace(/https?:\/\//g, '')
        .replace('veooz.com/articles/pti/', '')
        .replace('.html', '')
        .replace(/[^\.a-zA-Z0-9_-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/(^-|-$)/, '');
}

var dbPromise = null;
function getDB() {
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
}

function saveRawArticle (article, logId) {
    // Best effort async save the raw article
    return getDB().then(function (db) {
        var collection = db.collection('raw-articles');

        return collection.findOne({
            _id: getCleanId(article.id)
        }).then(function (oldArticle) {
            var $set = false;
            var $history = false;

            if (oldArticle) {
                for (var key in article) {
                    if (article.hasOwnProperty(key) && key[0] != '_') {
                        if (!(key in oldArticle) || oldArticle[key] != article[key]) {
                            if (!$history) $history = {};
                            if (!$set) $set = {};
                            $history[key] = oldArticle[key];
                            $set[key] = article[key];
                        }
                    }
                }

                if ($history) {
                    $history._timestamp = oldArticle._timestamp;
                    $history = [$history];
                }
            } else {
                $set = article;
            }

            if (!$set) {
                console.log(logId, "Nothing to update in raw article:", article.id);
                return Promise.reject();
            }

            var update = {
                $set,
                $setOnInsert: {
                    _history: []
                },
                $currentDate: {
                    _timestamp: true
                }
            };

            if ($history) {
                update.$push = {
                    _history: {
                        $each: $history
                    }
                };
            }

            return collection.updateOne(
                { _id: getCleanId(article.id) },
                update,
                { upsert: true }
            ).then(function(res) {
                console.log(logId, "Raw article upserted:", article.id);
            }, function(err) {
                console.log(logId, "Error in upsert:", err);
            });
        }, function (err) {
            console.log(logId, "Error in find:", err);
        });
    });
}

function convertRawArticle(rawArticle) {
    var article = {
        id: getCleanId(rawArticle.id),
        title: rawArticle.title,
        summary: rawArticle.summary,
        picture: rawArticle.image,
        url: rawArticle.url,
        lang: rawArticle.language,
        source: rawArticle.source,
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
    if (article.body.split(" ").indexOf("(PTI)") <= 10) {
        var cutPosition = article.body.indexOf("(PTI)") + 5;

        article.publishedPlace = article.body.substr(0, cutPosition).trim();
        article.body = article.publishedPlace + '. ' + article.body.substr(cutPosition).trim();

        if (article.summary.indexOf(article.publishedPlace) <= 5) {
            article.summary = article.summary.replace(article.publishedPlace, '').trim();
        }
    }

    return article;
}

function StoredArticles (id) {
    this.id = id || 'noid';
}

StoredArticles.prototype.fetchOne = function (id) {
    id = id || false;

    if (id) {
        return getDB().then(function (db) {
            var collection = db.collection('preprocessed-articles');

            return collection.findOne({ _id: id }, { _id: 0 })
                .then(function (res) {
                    if (!res) {
                        return Promise.reject("Article not found");
                    }
                    return Promise.resolve(res);
                }, function (err) {
                    return Promise.reject(err);
                });
        });
    } else {
        return Promise.reject("TODO");
    }
};

StoredArticles.prototype.receiveRaw = function (rawArticle) {
    var that = this;

    return saveRawArticle(rawArticle, that.id)
        .then(function () {
            rawArticle.source = rawArticle.source || "PTI";
            return convertRawArticle(rawArticle);
        });
};

StoredArticles.prototype.storePreprocessed = function (article) {
    return getDB().then(function (db) {
        var collection = db.collection('preprocessed-articles');

        return collection.replaceOne(
            { _id: article.id },
            article,
            { upsert: true }
        );
    });
};

StoredArticles.prototype.storeEdited = function (article) {
    return getDB().then(function (db) {
        var collection = db.collection('accessible-articles');

        delete article._id;
        return collection.insertOne(article);
    });
};

module.exports = StoredArticles;
