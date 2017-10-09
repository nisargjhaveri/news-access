var storedArticleUtils = require("../articles/storedArticleUtils.js");
var ObjectID = require("mongodb").ObjectID;

function propagateError(err) {
    return Promise.reject(err);
}

function getErrorLogger(logId) {
    return function (err) {
        console.log(logId, "Error:", err);
    };
}

if (process.argv.length < 3) {
    console.error("Please provide a username");
    process.exit(1);
}

var username = process.argv[2];

storedArticleUtils.getDB()
    .then(function (db) {
        var collection = db.collection('accessible-articles');
        var logCollection = db.collection('accessible-articles-logs');

        return collection.find({"_meta.username": username}, {"_id": 1, "_timestamp": 1, "_meta.loggerId": 1})
            .sort({
                "_timestamp": -1
            })
            .limit(1000)
            .toArray()
            .then(function (res) {
                var promises = [];
                res.forEach(function(doc) {

                    promises.push(
                        logCollection
                            .find({"_id": ObjectID(doc._meta.loggerId)}, {"articleLogs": 1, "_id": 0})
                            .toArray()
                            .then(function (logs) {
                                var editingTime = 0;
                                if (logs[0] && logs[0].articleLogs) {
                                    editingTime =  logs[0].articleLogs[logs[0].articleLogs.length - 2].timestamp - logs[0].articleLogs[1].timestamp;
                                }
                                var date = new Date(doc._timestamp.toDateString());
                                return {
                                    date,
                                    editingTime
                                };
                            }, propagateError)
                    );
                });
                var allPromises = Promise.all(promises);

                allPromises.then(function() {
                    db.close();
                }, function() {
                    db.close();
                });

                return allPromises;
            }, propagateError);
    })
    .then(function(res) {
        var dateWise = {};

        res.forEach(function (doc) {
            if (!(doc.date in dateWise)) {
                dateWise[doc.date] = {
                    count: 0,
                    time: 0,
                };
            }
            dateWise[doc.date].count++;
            dateWise[doc.date].time += doc.editingTime;
        });

        console.log("");

        for (var date in dateWise) {
            console.log(new Date(date).toDateString(), "\t", dateWise[date].count, "\t", dateWise[date].time / 1000);
        }
    });
