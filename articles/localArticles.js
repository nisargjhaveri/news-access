var fs = require('fs');
var path = require('path');

var articleUtils = require('./articleUtils.js');
var storedArticleUtils = require('./storedArticleUtils.js');

var config = require("./config.json");

function getErrorFunc (logId) {
    return function (err) {
        if (logId) {
            console.error(logId, err);
        }
        return Promise.reject(err);
    };
}

function LocalArticles(logId, source) {
    this.logId = logId || 'noid';
    this.source = source;
    this.lang = 'en';

    var sourceDirs = {
        'tac2011': 'TAC2011-MultiLing',
        'duc2004': 'duc2004',
        'duc2004-hi': 'duc2004-hi',
    };

    var sourceNames = {
        'tac2011': 'TAC2011 MultiLing',
        'duc2004': 'DUC 2004',
        'duc2004-hi': 'DUC 2004',
    };

    this.sourceDir = path.join(config.localSourceDir || ".", sourceDirs[source] || source);
    this.sourceName = sourceNames[source] || source;
}

function makeArticle(source, filename, lang, body) {
    return {
        id: filename,
        title: filename,
        lang: lang,
        body: body,
        source: source,
        publishedTime: new Date('2018-01-01'),
    };
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

LocalArticles.prototype.fetchOne = function (id) {
    var that = this;
    return new Promise(function(resolve, reject) {
            return fs.readFile(path.join(that.sourceDir, id), function(err, data) {
                if (err) return reject(err);
                return resolve(data.toString());
            });
        })
        .then(function(data) {
            return makeArticle(that.sourceName, id, that.lang, data);
        }, getErrorFunc())
        .then(articleUtils.populateBodySentences, getErrorFunc(that.logId));
};

LocalArticles.prototype.fetchList = function (options) {
    var limit = options.limit || 10;

    var that = this;
    var articlesPromise = new Promise(function(resolve, reject) {
            return fs.readdir(that.sourceDir, function(err, files) {
                if (err) return reject(err);

                files = files.filter(function(f) {
                    return fs.statSync(path.join(that.sourceDir, f)).isFile();
                }).map(function (filename) {
                    return makeArticle(that.sourceName, filename, that.lang);
                });

                files = shuffle(files);

                return resolve(files);
            });
        });

    if (options.lang) {
        // Show articles not already made accessible in this language
        articlesPromise = articlesPromise.then(function (articles) {
            return storedArticleUtils.getDB().then(function (db) {
                var collection = db.collection('accessible-articles');

                return collection.find({
                    source: that.sourceName,
                    lang: options.lang
                }).toArray();
            }).then(function (accessibleArtiles) {
                var accessibleArtilesMap = {};

                accessibleArtiles.forEach(function(article) {
                    accessibleArtilesMap[article.id] = 1;
                });

                return articles.filter(function(article) {
                    return !(article.id in accessibleArtilesMap);
                });
            }, getErrorFunc());
        });
    }

    articlesPromise = articlesPromise.then(function (articles) {
        return articles.slice(0, limit);
    }, getErrorFunc(this.logId));

    return articlesPromise;
};

LocalArticles.prototype.receiveRaw = function (rawArticle) {
    return Promise.reject("Cannot recieve raw article");
};

LocalArticles.prototype.storePreprocessed = function (article) {
    return Promise.reject("Cannot store preprocessed article");
};

LocalArticles.prototype.storeEdited = storedArticleUtils.storeEdited;
LocalArticles.prototype.initializeLogger = storedArticleUtils.initializeLogger;
LocalArticles.prototype.insertLogs = storedArticleUtils.insertLogs;


module.exports = LocalArticles;
