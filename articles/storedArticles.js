var MongoClient = require("mongodb").MongoClient;

var config = require("./config.json");

var articleUtils = require('./articleUtils.js');
var storedArticleUtils = require('./storedArticleUtils.js');

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
            _id: articleUtils.getCleanId(article.id)
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
                return Promise.reject("Nothing to update in raw article");
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
                { _id: articleUtils.getCleanId(article.id) },
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

function StoredArticles (logId) {
    this.logId = logId || 'noid';
}

StoredArticles.prototype.fetchOne = function (id) {
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
};

StoredArticles.prototype.fetchList = function (options) {
    return getDB().then(function (db) {
        var collection = db.collection('preprocessed-articles');

        return collection.find({})
            .sort("published", -1)
            .limit(options.limit || 10)
            .toArray()
            .then(function (docs) {
                if (!docs.length) {
                    return Promise.reject("No articles found");
                }
                return Promise.resolve(docs);
            }, function (err) {
                return Promise.reject(err);
            });
    });
};

StoredArticles.prototype.receiveRaw = function (rawArticle) {
    var that = this;

    return saveRawArticle(rawArticle, that.logId)
        .then(function () {
            return storedArticleUtils.convertRawArticle(rawArticle);
        }, function (err) {
            return Promise.reject(err);
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
