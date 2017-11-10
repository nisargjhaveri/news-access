var storedArticleUtils = require("../../articles/storedArticleUtils.js");
var ObjectID = require("mongodb").ObjectID;

if (process.argv.length < 4) {
    console.error("Usage: js prepareDataset.js USERNAME LANG");
    console.error("For advance usage edit the script! :P");
    process.exit(1);
}

var username = process.argv[2];
var lang = process.argv[3];

/**
 * Filter for finding accessible articles.
 * Change here if possible
 */
const filter = {
    "_meta.username": username,
    "lang": lang,
/*
    $and:[
        {
            "_timestamp": {
                $gt: new Date("2017-10-11 GMT+0530")
            }
        }, {
            "_timestamp": {
                $lt: new Date("2017-11-11 GMT+0530")
            }
        }
    ]
*/
};

storedArticleUtils.getDB(false)
    .then(function (db) {
        var collection = db.collection('accessible-articles');
        var logCollection = db.collection('accessible-articles-logs');

        const cursor = collection.find(filter);

        function handleDoc(doc) {
            if (!doc || !doc._meta.loggerId) {
                return propagateError("Invalid document");
            }

            return logCollection.findOne({ _id: ObjectID(doc._meta.loggerId) })
                .then(function (logger) {
                    if (!logger) {
                        return propagateError("Logger not found for", doc._id);
                    }

                    doc._meta.logger = logger;

                    console.log(JSON.stringify(doc));
                }, propagateError);
        }

        function hasNextHandler(res) {
            if (!res) return db.close();

            cursor.next()
                .then(handleDoc, propagateError)
                .catch(logError)
                .then(function() {
                    cursor.hasNext().then(hasNextHandler, logError);
                });
        }

        cursor.hasNext().then(hasNextHandler, logError);
    }, propagateError);


function propagateError(err) {
    return Promise.reject(err);
}

function logError(err) {
    console.error("Error:", err);
}
