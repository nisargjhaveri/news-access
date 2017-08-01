var nltk = require('../nltk-binding');

module.exports.populateBodySentences = function (article) {
    // Split sentences and paragraphs in body
    var paragraphs = [];
    article.body.split("\n").map(function (para) {
        paragraphs.push(nltk.splitSentences(para.trim()));
    });

    return Promise.all(paragraphs)
        .then(function (paragraphs) {
            paragraphs = paragraphs.filter(function (paragraph) {
                return paragraph.length;
            });

            var id = 0;

            paragraphs = paragraphs.map(function (paragraph) {
                return paragraph.map(function (sentence) {
                    return {
                        id: id++,
                        source: sentence
                    };
                });
            });

            article.bodySentences = paragraphs;

            return article;
        }, function (err) {
            return Promise.reject(err);
        });
};

module.exports.getCleanId = function (id) {
    return id
        .replace(/https?:\/\//g, '')
        .replace('veooz.com/articles/pti/', '')
        .replace('.html', '')
        .replace(/[^\.a-zA-Z0-9_-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/(^-|-$)/, '');
};
