var googleTranslate = require('./googleTranslate.js');
var microsoftTranslate = require('./microsoftTranslate.js');

exports.translateArticle = function (article, targetLang, method) {
    method = method || 'google-translate';
    var translateText;

    switch (method) {
        case 'microsoft-translate':
            translateText = microsoftTranslate;
            break;
        case 'google-translate': // jshint ignore:line
        default:
            translateText = googleTranslate;
    }

    var targetArticle = JSON.parse(JSON.stringify(article));

    targetArticle.orignialArticle = article;
    targetArticle.lang = targetLang;

    console.log(article.id, "Translating title and summary to " + targetLang);

    var titleTranslateP = translateText(article.title, article.lang, targetLang)
                            .then(function (targetTitle) {
                                console.log(article.id, "Title translated to " + targetLang);
                                targetArticle.title = targetTitle;
                            }, function (err) {
                                console.log(article.id, "Failed to translate title to " + targetLang + ": ", err);
                                targetArticle.error = err;
                            });

    var summaryTranslateP = translateText(article.summary, article.lang, targetLang)
                                .then(function (targetSummary) {
                                    console.log(article.id, "Summary translated to " + targetLang);
                                    targetArticle.summary = targetSummary;
                                }, function (err) {
                                    console.log(article.id, "Failed to translate title to " + targetLang + ": ", err);
                                    targetArticle.error = err;
                                });

    return Promise.all([titleTranslateP, summaryTranslateP]).then(function (values) {
        return targetArticle;
    });
};
