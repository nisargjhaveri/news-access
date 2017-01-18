var request = require('request').defaults({
    'proxy': process.env.http_proxy || process.env.HTTP_PROXY
});
var querystring = require('querystring');
var xml2js = require('xml2js');

var supported_langs = ['en', 'hi'];

function getAccessToken() {
    return new Promise(function (resolve, reject) {
        var options = {
            url: 'https://api.cognitive.microsoft.com/sts/v1.0/issueToken',
            headers: {
                'Ocp-Apim-Subscription-Key': '36a5c542248e4e64ba341415998686de'
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
                            resolve(result.string._);
                        }
                    });
                }
            });
        });
    });
}

module.exports = translate;
