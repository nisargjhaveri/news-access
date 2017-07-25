var gFlowSummarize = require('./gFlowSummarize.js');
var linBilmesSummarize = require('./linBilmesSummarize.js');
var veoozSummzrize = require('./veoozSummarize.js');

var leven = require('leven');

function summarizeArticle(article, method) {
    method = method || 'veooz';
    var summarize;

    switch (method) {
        case 'g-flow':
            summarize = gFlowSummarize;
            break;
        case 'linBilmes':
            summarize = linBilmesSummarize;
            break;
        case 'veooz': // jshint ignore:line
        default:
            summarize = veoozSummzrize;
    }

    return summarize(article).then(mapSummarySentences, function(err) {
        return Promise.reject(err);
    });
}

function mapSummarySentences(article) {
    // Map sentences in body and summary
    var sentences = [].concat.apply([], article.bodySentences);
    var summarySentences = article.summarySentences;

    summarySentences.map(function (summarySentence) {
        var similarities = sentences.map(function (sentence) {
            return {
                id: sentence.id,
                distance: leven(sentence.source, summarySentence.source) / sentence.source.length
            };
        });

        similarities.sort(function (a, b) {
            return a.distance - b.distance;
        });

        // If similarity is more than 90%, match sentence
        if (similarities[0].distance < 0.1) {
            summarySentence.id = similarities[0].id;
        }
    });

    return article;
}

exports.summarizeArticle = summarizeArticle;
