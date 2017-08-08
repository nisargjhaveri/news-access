var articleUtils = require('./articleUtils.js');
var storedArticleUtils = require('./storedArticleUtils.js');
var veoozArticleUtils = require('./veoozArticleUtils.js');

function saveRawArticle (article, logId) {
    // Best effort async save the raw article
    return storedArticleUtils.getDB().then(function (db) {
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
    return storedArticleUtils.getDB().then(function (db) {
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
    return storedArticleUtils.getDB().then(function (db) {
        var collection = db.collection('preprocessed-articles');

        return collection.find({})
            .sort("publishedTime", -1)
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
            return veoozArticleUtils.convertRawArticle(rawArticle);
        }, function (err) {
            return Promise.reject(err);
        });
};

StoredArticles.prototype.storePreprocessed = function (article) {
    return storedArticleUtils.getDB().then(function (db) {
        var collection = db.collection('preprocessed-articles');

        return collection.replaceOne(
            { _id: article.id },
            article,
            { upsert: true }
        );
    });
};

StoredArticles.prototype.storeEdited = function (article) {
    var that = this;
    return storedArticleUtils.getDB().then(function (db) {
        console.log(that.logId, "Storing accessible article", article.id, article.lang);
        var collection = db.collection('accessible-articles');

        delete article._id;

        return collection.updateOne(
            { $and: [{ _id: { $gt: 0 }}, { _id: { $lt: 0 }}] },
            {
                $set: article,
                $currentDate: {
                    _timestamp: true
                }
            },
            { upsert: true }
        ).then(function (res) {
            return Promise.resolve(article);
        }, function (err) {
            return Promise.reject(err);
        });
    });
};

module.exports = StoredArticles;
