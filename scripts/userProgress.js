var storedArticleUtils = require("../articles/storedArticleUtils.js");
var ObjectID = require("mongodb").ObjectID;

function propagateError(err) {
    return Promise.reject(err);
}

function logError(err) {
    console.log("Error:", err);
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
                            .find({"_id": ObjectID(doc._meta.loggerId)}, {"_timestamp": 1, "_id": 0})
                            .toArray()
                            .then(function (logs) {
                                var editingTime =  doc._timestamp - logs[0]._timestamp;
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
    }, propagateError)
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
        console.log("Date\t\t", "\t", "Count", "\t\t", "Time");

        for (var date in dateWise) {
            var seconds = Math.round(dateWise[date].time / 1000);
            var hours = Math.floor(seconds / 3600);
            seconds %= 3600;
            var minutes = Math.floor(seconds / 60);
            seconds %= 60;

            var totalTime = [hours + "h", minutes + "m", seconds + "s"].join(" ");
            console.log(new Date(date).toDateString(), "\t", dateWise[date].count, "\t\t", totalTime);
        }
    }, propagateError)
    .catch(logError);
