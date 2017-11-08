var storedArticleUtils = require("../articles/storedArticleUtils.js");
var ObjectID = require("mongodb").ObjectID;

if (process.argv.length < 4) {
    console.warn("Manually check the recovery file and applicability before running this script");
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

function getMinEventId(logsToPush) {
    // Find event id of the first event in logsToPush
    var newLogEventId = Infinity;

    Object.keys(logsToPush.translationSentencesLogs).forEach(function (sentenceId) {
        logsToPush.translationSentencesLogs[sentenceId].forEach(function (event) {
            newLogEventId = Math.min(newLogEventId, event.id);
        });
    });

    Object.keys(logsToPush.summarySentencesLogs).forEach(function (sentenceId) {
        logsToPush.translationSentencesLogs[sentenceId].forEach(function (event) {
            newLogEventId = Math.min(newLogEventId, event.id);
        });
    });

    logsToPush.summaryLogs.forEach(function (event) {
        newLogEventId = Math.min(newLogEventId, event.id);
    });

    logsToPush.articleLogs.forEach(function (event) {
        newLogEventId = Math.min(newLogEventId, event.id);
    });

    return newLogEventId;
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

                    var lastLogPushedPromise = Promise.resolve();
                    var newLogEventId;

                    // Insert lastLogsToPush if it is not already pushed
                    newLogEventId = getMinEventId(recoverySnapshot.loggerSnapshot.lastLogsToPush);
                    if (newLogEventId < Infinity && newLogEventId > lastLogEventId) {
                        lastLogPushedPromise = lastLogPushedPromise.then(function() {
                            console.log("Inserting lastLogsToPush");
                            return storedArticleUtils.insertLogs(
                                recoverySnapshot.loggerSnapshot.loggerId,
                                recoverySnapshot.loggerSnapshot.lastLogsToPush
                            );
                        }, propagateError);
                    }

                    newLogEventId = getMinEventId(recoverySnapshot.loggerSnapshot.pendingLogs);
                    if (newLogEventId < Infinity && newLogEventId > lastLogEventId) {
                        lastLogPushedPromise = lastLogPushedPromise.then(function() {
                            console.log("Inserting pending logs");
                            return storedArticleUtils.insertLogs(
                                recoverySnapshot.loggerSnapshot.loggerId,
                                recoverySnapshot.loggerSnapshot.pendingLogs
                            );
                        }, propagateError);
                    }

                    return lastLogPushedPromise;
                }, propagateError);
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
