var gFlowSummarize = require('./gFlowSummarize.js');
var veoozSummzrize = require('./veoozSummarize.js');

function summarizeArticle(article, method) {
    method = method || 'veooz';
    var summarize;

    switch (method) {
        case 'g-flow':
            summarize = gFlowSummarize;
            break;
        case 'veooz': // jshint ignore:line
        default:
            summarize = veoozSummzrize;
    }

    return summarize(article);
}

exports.summarizeArticle = summarizeArticle;
