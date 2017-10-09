var storedArticleUtils = require("../articles/storedArticleUtils.js");

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

        var results = collection.aggregate([
            {
                $match: {
                    "_meta.username": username
                }
            }, {
                $limit: 1000
            }, {
                $project: {
                    "_timestampIST": {
                        $add: ["$_timestamp", 5.5 * 60 * 60 * 1000]
                    },
                    "_timestamp": 1,
                }
            }, {
                $group: {
                    "_id": {
                        year: { $year : "$_timestampIST" },
                        month: { $month : "$_timestampIST" },
                        day: { $dayOfMonth : "$_timestampIST" }
                    },
                    "count": { $sum: 1 }
                }
            }, {
                $sort: {
                    "_id.year": -1,
                    "_id.month": -1,
                    "_id.day": -1
                }
            }
        ]);

        return results
            .toArray()
            .then(function (res) {
                db.close();
                return res;
            }, function (err) {
                db.close();
                return Promise.reject(err);
            });
    })
    .then(function(res) {
        console.log("");
        res.forEach(function (rec) {
            var date = new Date(rec._id.year, rec._id.month, rec._id.day);
            console.log(date.toDateString(), "\t", rec.count);
        });
    });
