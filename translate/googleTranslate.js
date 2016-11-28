var token = require('google-translate-token');
var request = require('request').defaults({
    'proxy': process.env.http_proxy || process.env.HTTP_PROXY
});
var querystring = require('querystring');
var safeEval = require('safe-eval');

function translate (text, from, to) {
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

                    body[0].forEach(function (sentence) {
                        if (sentence[0]) {
                            translation += sentence[0];
                        }
                    });

                    resolve(translation);
                }
            });
        });
    });
}

module.exports = translate;
