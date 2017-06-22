var request = require('request').defaults({
    'proxy': process.env.http_proxy || process.env.HTTP_PROXY
});
var querystring = require('querystring');
var xml2js = require('xml2js');

var config = require('./config.json');

var supported_langs = ['en', 'hi', 'ur'];

function getAccessToken() {
    return new Promise(function (resolve, reject) {
        var options = {
            url: 'https://api.cognitive.microsoft.com/sts/v1.0/issueToken',
            headers: {
                'Ocp-Apim-Subscription-Key': config.microsoftTranslateSubscriptionKey
            },
        };
        request.post(options, function (error, response, body) {
            if (error) reject(error);
            else resolve(body);
        });
    });
}

function translate (text, from, to) {
    if (supported_langs.indexOf(from) < 0 || supported_langs.indexOf(to) < 0) {
        return Promise.reject("LANG_NOT_SUPPORTED");
    }

    return getAccessToken().then(function (token) {
        var url = 'http://api.microsofttranslator.com/v2/Http.svc/Translate';
        var data = {
            appid: 'Bearer ' + token,
            from: from,
            to: to,
            text: text,
        };

        url = url + '?' + querystring.stringify(data);

        return new Promise(function(resolve, reject) {
            request(url, function (err, res, body) {
                if (err || res.statusCode !== 200) {
                    reject(err);
                } else {
                    xml2js.parseString(body, function (err, result) {
                        if (err) {
                            reject(err);
                        } else {
                            var targetText = result.string._;
                            var sourceSentences = text.split("\n");
                            var targetSentences = targetText.split("\n");
                            var sentences = [];

                            if (sourceSentences.length != targetSentences.length) {
                                // FIXME: find a better way to handle this
                                sentences.push({
                                    source: text,
                                    target: targetText
                                });
                            } else {
                                for (var i = 0; i < sourceSentences.length; i++) {
                                    sentences.push({
                                        source: sourceSentences[i],
                                        target: targetSentences[i]
                                    });
                                }
                            }

                            resolve({
                                'text': targetText,
                                'sentences': sentences
                            });
                        }
                    });
                }
            });
        });
    });
}

module.exports = translate;
