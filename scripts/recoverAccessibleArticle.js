var storedArticleUtils = require("../articles/storedArticleUtils.js");
var ObjectID = require("mongodb").ObjectID;

if (process.argv.length < 4) {
    console.error("Please provide relative path to the recovery file and username");
    process.exit(1);
}

var recoverySnapshot = require(process.argv[2]);
var username = process.argv[3];

// recoverySnapshot.accessibleArticle.id = 0;
// recoverySnapshot.accessibleArticle._meta.loggerId = 0;

function propagateError(err) {
    return Promise.reject(err);
}

function logError(err) {
    console.log("Error:", err);
}

storedArticleUtils.getDB()
    .then(function (db) {
        var collection = db.collection('accessible-articles');
        var logCollection = db.collection('accessible-articles-logs');

        var accessibleArticleId;

        collection.findOne({
            "id": recoverySnapshot.accessibleArticle.id,
            "_meta.loggerId": recoverySnapshot.accessibleArticle._meta.loggerId
        })
        .then(function(doc) {
            if (!doc) {
                console.log("Accessible article not found. Inserting.");

                // We don't use storedArticleUtils.storeEdited here, to keep the timestamp
                delete recoverySnapshot.accessibleArticle._id;
                recoverySnapshot.accessibleArticle._timestamp = new Date(recoverySnapshot.accessibleArticle._timestamp);

                recoverySnapshot.accessibleArticle._meta.username = username;

                return collection.insertOne(recoverySnapshot.accessibleArticle)
                    .then(function (res) {
                        accessibleArticleId = res.insertedId.toHexString();
                    }, propagateError);
            } else {
                accessibleArticleId = doc._id.toHexString();
            }
        })
        .then(function () {
            return logCollection.findOne({ _id: ObjectID(recoverySnapshot.accessibleArticle._meta.loggerId) })
                .then(function (logger) {
                    if (!logger) {
                        return Promise.reject("Logger not found");
                    }

                    // Find event id of the last pushed log
                    var lastLogEventId = -1;

                    logger.translationSentencesLogs.forEach(function (sentence) {
                        sentence.logs.forEach(function (event) {
                            lastLogEventId = Math.max(lastLogEventId, event.id);
                        });
                    });

                    logger.summarySentencesLogs.forEach(function (sentence) {
                        sentence.logs.forEach(function (event) {
                            lastLogEventId = Math.max(lastLogEventId, event.id);
                        });
                    });

                    logger.summaryLogs.forEach(function (event) {
                        lastLogEventId = Math.max(lastLogEventId, event.id);
                    });

                    logger.articleLogs.forEach(function (event) {
                        lastLogEventId = Math.max(lastLogEventId, event.id);
                    });

                    // Find event id of the first event in lastLogsToPush
                    var newLogEventId = Infinity;
                    var lastLogsToPush = recoverySnapshot.loggerSnapshot.lastLogsToPush;

                    Object.keys(lastLogsToPush.translationSentencesLogs).forEach(function (sentenceId) {
                        lastLogsToPush.translationSentencesLogs[sentenceId].forEach(function (event) {
                            newLogEventId = Math.min(newLogEventId, event.id);
                        });
                    });

                    Object.keys(lastLogsToPush.summarySentencesLogs).forEach(function (sentenceId) {
                        lastLogsToPush.translationSentencesLogs[sentenceId].forEach(function (event) {
                            newLogEventId = Math.min(newLogEventId, event.id);
                        });
                    });

                    lastLogsToPush.summaryLogs.forEach(function (event) {
                        newLogEventId = Math.min(newLogEventId, event.id);
                    });

                    lastLogsToPush.articleLogs.forEach(function (event) {
                        newLogEventId = Math.min(newLogEventId, event.id);
                    });

                    // Insert lastLogsToPush if it is not already pushed
                    if (newLogEventId < Infinity && newLogEventId > lastLogEventId) {
                        console.log("Inserting lastLogsToPush");
                        return storedArticleUtils.insertLogs(recoverySnapshot.loggerSnapshot.loggerId, lastLogsToPush);
                    }
                }, propagateError);
        }, propagateError)
        .then(function () {
            if (recoverySnapshot.loggerSnapshot.pendingLogsCount) {
                console.log("Inserting pending logs");
                return storedArticleUtils.insertLogs(recoverySnapshot.loggerSnapshot.loggerId, recoverySnapshot.loggerSnapshot.pendingLogs);
            }
        }, propagateError)
        .then(function () {
            if (accessibleArticleId) {
                console.log("Setting accessibleArticleId");
                return storedArticleUtils.insertLogs(recoverySnapshot.loggerSnapshot.loggerId, {
                    translationSentencesLogs: {},
                    summarySentencesLogs: {},
                    summaryLogs: [],
                    articleLogs: [],
                    accessibleArticleId
                });
            }
        }, propagateError)
        .catch(logError)
        .then(function () {
            db.close();
        });

    }, logError);


storedArticleUtils.insertLogs();
