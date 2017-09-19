var MongoClient = require("mongodb").MongoClient;

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

function storeEdited (article) {
    var that = this;
    return getDB().then(function (db) {
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
}

function initializeLogger (article) {
    return getDB().then(function (db) {
        var collection = db.collection('accessible-articles-logs');

        return collection.insertOne({
            id: article.id,
            lang: article.lang,
            translationSentencesLogs: [],
            summarySentencesLogs: [],
            summaryLogs: []
        }).then(function (res) {
            return Promise.resolve(res.insertedId);
        }, function (err) {
            return Promise.reject(err);
        });
    });
}

module.exports = {
    getDB,
    storeEdited,
    initializeLogger
};
