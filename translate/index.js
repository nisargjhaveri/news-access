var googleTranslate = require('./googleTranslate.js');
var microsoftTranslate = require('./microsoftTranslate.js');

function getTranslator(method) {
    method = method || 'google-translate';
    var translator;

    switch (method) {
        case 'microsoft-translate':
            translator = microsoftTranslate;
            break;
        case 'google-translate': // jshint ignore:line
        default:
            translator = googleTranslate;
    }

    return translator;
}

exports.translateText = function(text, sourceLang, targetLang, method) {
    return getTranslator(method)(text, sourceLang, targetLang);
};

exports.translateArticle = function (article, targetLang, method) {
    var translateText = getTranslator(method);
    var targetArticle = JSON.parse(JSON.stringify(article));

    targetArticle.orignialArticle = article;
    targetArticle.lang = targetLang;

    console.log(article.id, "Translating title and summary to " + targetLang);

    var titleTranslateP = translateText(article.title, article.lang, targetLang)
                            .then(function (translation) {
                                console.log(article.id, "Title translated to " + targetLang);
                                targetArticle.title = translation.text;
                            }, function (err) {
                                console.log(article.id, "Failed to translate title to " + targetLang + ": ", err);
                                targetArticle.error = err;
                            });

    var summaryTranslateP = translateText(article.summary, article.lang, targetLang)
                                .then(function (translation) {
                                    console.log(article.id, "Summary translated to " + targetLang);
                                    targetArticle.summary = translation.text;
                                    targetArticle.summarySentences = translation.sentences;
                                }, function (err) {
                                    console.log(article.id, "Failed to translate title to " + targetLang + ": ", err);
                                    targetArticle.error = err;
                                });

    return Promise.all([titleTranslateP, summaryTranslateP]).then(function (values) {
        return targetArticle;
    });
};
