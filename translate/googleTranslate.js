var token = require('./googleTranslateToken.js');
var request = require('request').defaults({
    'proxy': process.env.http_proxy || process.env.HTTP_PROXY
});
var querystring = require('querystring');
var safeEval = require('safe-eval');

var supported_langs = ['en', 'hi', 'gu', 'bn', 'kn', 'ml', 'mr', 'ne', 'pa', 'sd', 'ta', 'te', 'ur'];

function translateSentence (text, from, to) {
    if (supported_langs.indexOf(from) < 0 || supported_langs.indexOf(to) < 0) {
        return Promise.reject("LANG_NOT_SUPPORTED");
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
                if (err) {
                    reject(err);
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

function translate (text, from, to) {
    var sourceSentences = text.split("\n").filter(function (sentence) {
        return sentence;
    });
    var translatePromises = [];
    sourceSentences.forEach(function (sentence) {
        translatePromises.push(translateSentence(sentence, from, to));
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

module.exports = translate;
