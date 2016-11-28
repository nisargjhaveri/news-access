var translateText = require('./googleTranslate.js');

exports.translateArticle = function (article, targetLang) {
    var targetArticle = JSON.parse(JSON.stringify(article));

    targetArticle.orignialArticle = article;
    targetArticle.lang = targetLang;

    console.log("Translating title and summary");

    var titleTranslateP = translateText(article.title, article.lang, targetLang)
                            .then(function (targetTitle) {
                                console.log("Title translated");
                                targetArticle.title = targetTitle;
                            });
    var summaryTranslateP = translateText(article.summary, article.lang, targetLang)
                                .then(function (targetSummary) {
                                    console.log("Summary translated");
                                    targetArticle.summary = targetSummary;
                                });

    return Promise.all([titleTranslateP, summaryTranslateP]).then(function (values) {
        // console.log(targetArticle);
        return targetArticle;
    });
};
