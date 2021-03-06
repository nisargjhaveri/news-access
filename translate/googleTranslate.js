var token = require('./googleTranslateToken.js');
var request = require('request').defaults({
    'proxy': process.env.http_proxy || process.env.HTTP_PROXY,
    'timeout': 20 * 1000
});
var querystring = require('querystring');
var safeEval = require('safe-eval');

var supported_langs = ['en', 'hi', 'gu', 'bn', 'kn', 'ml', 'mr', 'ne', 'pa', 'sd', 'ta', 'te', 'ur'];

function translateText (text, from, to) {
    if (supported_langs.indexOf(from) < 0 || supported_langs.indexOf(to) < 0) {
        return Promise.reject("LANG_NOT_SUPPORTED");
    }

    if (text.length > 4500) { // Limit seems to be 5000, but just to be on the safe side.
        var lines1 = text.split("\n");

        if (lines1.length <= 1) {
            return Promise.reject("SENTENCE_TOO_LARGE");
        }

        var lines2 = lines1.splice(Math.floor(lines1.length / 2));

        return Promise.all([
            translateText(lines1.join("\n"), from, to),
            translateText(lines2.join("\n"), from, to)
        ]).then(function (translation) {
            return Promise.resolve({
                'text': [translation[0].text, translation[1].text].join("\n"),
                'sentences': translation[0].sentences.concat(translation[1].sentences)
            });
        }, function (err) {
            return Promise.reject(err);
        });
    }

    return token.get(text).then(function (token) {
        var url = 'https://translate.google.com/translate_a/single';
        var data = {
            client: 't',
            sl: from,
            tl: to,
            hl: to,
            dt: ['at', 'bd', 'ex', 'ld', 'md', 'qca', 'rw', 'rm', 'ss', 't'],
            ie: 'UTF-8',
            oe: 'UTF-8',
            otf: 1,
            ssel: 0,
            tsel: 0,
            kc: 7,
            q: text
        };

        data[token.name] = token.value;

        url = url + '?' + querystring.stringify(data);

        return new Promise(function(resolve, reject) {
            request(url, function (err, res, body) {
                if (err || res.statusCode !== 200) {
                    reject(err || (res.statusCode + ' ' + res.statusMessage));
                } else {
                    body = safeEval(body);
                    var translation = "";
                    var sentences = [];

                    body[0].forEach(function (sentence) {
                        if (sentence[0]) {
                            translation += sentence[0];
                            sentences.push({
                                source: sentence[1].trim(),
                                target: sentence[0].trim()
                            });
                        }
                    });

                    resolve({
                        'text': translation,
                        'sentences': sentences
                    });
                }
            });
        });
    });
}

/*
// Keeping this code commented, in case the other solution doesn't work

function translate (text, from, to) {
    var sourceSentences = text.split("\n").filter(function (sentence) {
        return sentence;
    });
    var translatePromises = [];
    sourceSentences.forEach(function (sentence) {
        translatePromises.push(translateText(sentence, from, to));
    });

    return Promise.all(translatePromises)
        .then(function (translations) {
            var translation = "";
            var sentences = [];

            translations.forEach(function (translation, i) {
                sentences.push({
                    source: sourceSentences[i],
                    target: translation.text
                });
            });

            return Promise.resolve({
                'text': sentences.map(function (sentence) {
                    return sentence.target;
                }).join("\n"),
                'sentences': sentences
            });
        }, function (err) {
            return Promise.reject(err);
        });
}
 */

function translate (text, from, to) {
    return translateText(text, from, to)
        .then(function (translation) {
            var sentences = [];
            var sourceSentences = text.split("\n");
            var targetSentences = translation.text.split("\n");

            if (sourceSentences.length != targetSentences.length) {
                return Promise.reject("GOOGLE_TRANSLATION_ERROR");
            } else {
                for (var i = 0; i < sourceSentences.length; i++) {
                    sentences.push({
                        source: sourceSentences[i].trim(),
                        target: targetSentences[i].trim()
                    });
                }
            }

            return Promise.resolve({
                'text': sentences.map(function (sentence) {
                    return sentence.target;
                }).join("\n"),
                'sentences': sentences
            });
        });
}

module.exports = translate;
