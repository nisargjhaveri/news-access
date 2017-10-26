var MongoClient = require("mongodb").MongoClient;
var ObjectID = require("mongodb").ObjectID;

var config = require("./config.json");

var dbPromise = null;
function getDB () {
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

                    // Setup logging
                    dbConnection.on("close", function(err) {
                        console.log("Mongodb connection closed. Reason:", err);
                    }).on("error", function(err) {
                        console.log("Mongodb error:", err);
                    });

                    // Setup indexes
                    var indexPromises = [];

                    indexPromises.push(
                        dbConnection.collection('preprocessed-articles').createIndex({
                            "publishedTime" : -1
                        })
                    );

                    Promise.all(indexPromises)
                        .then(function() {
                            resolve(dbConnection);
                        }, function(err) {
                            reject(err);
                        });
                }, function(err) {
                    reject(err);
                });
        });
    }
    return dbPromise;
}

function storeEdited (article) {
    var that = this;
    return getDB().then(function (db) {
        console.log(that.logId, "Storing accessible article", article.id, article.lang);
        var collection = db.collection('accessible-articles');

        delete article._id;
        delete article._timestamp;

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
            return Promise.resolve(res.upsertedId._id);
        }, function (err) {
            return Promise.reject(err);
        });
    });
}

function initializeLogger (article) {
    return getDB().then(function (db) {
        var collection = db.collection('accessible-articles-logs');

        return collection.updateOne(
            { $and: [{ _id: { $gt: 0 }}, { _id: { $lt: 0 }}] },
            {
                $set: {
                    id: article.id,
                    lang: article.lang,
                    translationSentencesLogs: [],
                    summarySentencesLogs: [],
                    summaryLogs: [],
                    articleLogs: []
                },
                $currentDate: {
                    _timestamp: true
                }
            },
            { upsert: true }
        ).then(function (res) {
            return Promise.resolve(res.upsertedId._id);
        }, function (err) {
            return Promise.reject(err);
        });
    });
}

function insertLogs (loggerId, logs) {
    return getDB().then(function (db) {
        var collection = db.collection('accessible-articles-logs');

        function mergeLogs(storedLogArray, newLogMap) {
            if (!Array.isArray(storedLogArray)) {
                storedLogArray = [];
            }
            var storedLogMap = {};
            storedLogArray.forEach(function(sentenceEntry) {
                storedLogMap[sentenceEntry.key] = sentenceEntry;
            });

            for (var source in newLogMap) {
                if (newLogMap.hasOwnProperty(source)) {
                    if (source in storedLogMap) {
                        storedLogMap[source].logs.push.apply(storedLogMap[source].logs, newLogMap[source]);
                    } else {
                        storedLogMap[source] = {
                            key: source,
                            logs: newLogMap[source]
                        };
                        storedLogArray.push(storedLogMap[source]);
                    }
                }
            }

            return storedLogArray;
        }

        return collection.findOne({ _id: ObjectID(loggerId) })
            .then(function (logger) {
                if (!logger) {
                    return Promise.reject("Logger not found");
                }

                logger.translationSentencesLogs = mergeLogs(logger.translationSentencesLogs, logs.translationSentencesLogs);
                logger.summarySentencesLogs = mergeLogs(logger.summarySentencesLogs, logs.summarySentencesLogs);
                if (Array.isArray(logs.summaryLogs)) {
                    logs.summaryLogs.forEach(function (event) {
                        logger.summaryLogs.push(event);
                    });
                }
                if (Array.isArray(logs.articleLogs)) {
                    logs.articleLogs.forEach(function (event) {
                        logger.articleLogs.push(event);
                    });
                }
                if (logs.accessibleArticleId) {
                    logger.accessibleArticleId = logs.accessibleArticleId;
                }

                return collection.replaceOne(
                    { _id: ObjectID(loggerId) },
                    logger
                );
            }, function (err) {
                return Promise.reject(err);
            });
    });
}

module.exports = {
    getDB,
    storeEdited,
    initializeLogger,
    insertLogs
};
