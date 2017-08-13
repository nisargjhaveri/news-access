var request = require('request').defaults({
    'proxy': process.env.http_proxy || process.env.HTTP_PROXY,
    'timeout': 20 * 1000
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

    var sourceSentences = text.split("\n").filter(function (sentence) {
        return sentence;
    });

    return getAccessToken().then(function (token) {
        var url = 'http://api.microsofttranslator.com/v2/Http.svc/TranslateArray';

        var data = {
            AppId: 'Bearer ' + token,
            From: from,
            Texts: {
                string: sourceSentences.map(function (sentence) {
                    return {
                        $: {
                            xmlns: "http://schemas.microsoft.com/2003/10/Serialization/Arrays"
                        },
                        _: sentence
                    };
                })
            },
            To: to,
        };

        var xmlBuilder = new xml2js.Builder({
            rootName: "TranslateArrayRequest",
            headless: true
        });
        var requestXml = xmlBuilder.buildObject(data);

        return new Promise(function(resolve, reject) {
            request.post(
                {
                    url: url,
                    body: requestXml,
                    headers: {
                        "Content-Type": "application/xml"
                    }
                },
                function (err, res, body) {
                    if (err || res.statusCode !== 200) {
                        reject(err);
                    } else {
                        xml2js.parseString(body, function (err, result) {
                            if (err) {
                                reject(err);
                            } else {
                                var targetSentences = result.ArrayOfTranslateArrayResponse.TranslateArrayResponse
                                    .map(function (trans) {
                                        return trans.TranslatedText[0];
                                    });
                                var sentences = [];

                                if (sourceSentences.length != targetSentences.length) {
                                    reject("MS_TRANSLATION_ERROR");
                                } else {
                                    for (var i = 0; i < sourceSentences.length; i++) {
                                        sentences.push({
                                            source: sourceSentences[i].trim(),
                                            target: targetSentences[i].trim()
                                        });
                                    }
                                }

                                resolve({
                                    'text': sentences.map(function (sentence) {
                                        return sentence.target;
                                    }).join("\n"),
                                    'sentences': sentences
                                });
                            }
                        });
                    }
                }
            );
        });
    });
}

module.exports = translate;
