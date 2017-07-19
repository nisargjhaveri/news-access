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

module.exports.saveRawArticles = function(rawArticles) {
    getDB().then(function (db) {
        console.log("Received " + rawArticles.length + " articles");
        rawArticles.forEach(function (article) {
            article._id = article.id;

            db.collection('raw-articles').insertOne(article).then(function(res) {
                console.log(res.insertedCount + " raw article stored in db: " + article.id);
            }, function(err) {
                console.log("Mongodb error: ", err.errmsg);
            });
        });
    });
};
