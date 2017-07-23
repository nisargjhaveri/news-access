var MongoClient = require("mongodb").MongoClient;

var config = require("./config.json");

var dbConnection = null;
function getDB() {
    return new Promise(function(resolve, reject) {
        if (!dbConnection) {
            var mongoServerUri = 'mongodb://' +
                config.mongodb.user + ':' + config.mongodb.password + '@' +
                config.mongodb.host + '/' + config.mongodb.database +
                '?authSource=' + config.mongodb.authSource;

            MongoClient
                .connect(mongoServerUri)
                .then(function(db) {
                    console.log("Connected to mongodb");
                    dbConnection = db;

                    dbConnection.on("close", function(err) {
                        console.log("Mongodb connection closed. Reason:", err);
                    }).on("error", function(err) {
                        console.log("Mongodb error:", err);
                    });

                    resolve(dbConnection);
                }, function(err) {
                    reject(err);
                });
        } else {
            resolve(dbConnection);
        }
    });
}

module.exports.saveRawArticles = function (rawArticles) {
    // Best effort async save the raw articles
    getDB().then(function (db) {
        console.log("Received " + rawArticles.length + " articles");
        rawArticles.forEach(function (article) {
            var collection = db.collection('raw-articles');

            collection.findOne({
                _id: article.id
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
                    console.log("Nothing to update in raw article:", article.id);
                    return;
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

                collection.updateOne(
                    { _id: article.id },
                    update,
                    { upsert: true }
                ).then(function(res) {
                    console.log("Raw article upserted:", article.id);
                }, function(err) {
                    console.log("Error in upsert:", err);
                });
            }, function (err) {
                console.log("Error in find:", err);
            });
        });
    });
};

module.exports.savePreprocessedArticle = function (article) {
    return getDB().then(function (db) {
        var collection = db.collection('raw-articles');

        article._id = article.id;
        return collection.insertOne(article);
    });
};
