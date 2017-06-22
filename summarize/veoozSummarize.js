var nltk = require('../nltk-binding');
// This is dummy summarizer, assumes summary is already there in the origianl article, and just splits sentences

function summarize(article) {
    return nltk.splitSentences(article.summary)
        .then(function(sentences) {
            article.summary = sentences.join("\n");
            return Promise.resolve(article);
        }, function(err) {
            return Promise.reject(err);
        });
    // return Promise.resolve(article);
}

module.exports = summarize;
