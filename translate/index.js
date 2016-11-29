var translateText = require('./googleTranslate.js');

exports.translateArticle = function (article, targetLang) {
    var targetArticle = JSON.parse(JSON.stringify(article));

    targetArticle.orignialArticle = article;
    targetArticle.lang = targetLang;

    console.log(article.id, "Translating title and summary to " + targetLang);

    var titleTranslateP = translateText(article.title, article.lang, targetLang)
                            .then(function (targetTitle) {
                                console.log(article.id, "Title translated to " + targetLang);
                                targetArticle.title = targetTitle;
                            });
    var summaryTranslateP = translateText(article.summary, article.lang, targetLang)
                                .then(function (targetSummary) {
                                    console.log(article.id, "Summary translated to " + targetLang);
                                    targetArticle.summary = targetSummary;
                                });

    return Promise.all([titleTranslateP, summaryTranslateP]).then(function (values) {
        return targetArticle;
    });
};
