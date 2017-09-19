var googleTranslate = require('./googleTranslate.js');
var microsoftTranslate = require('./microsoftTranslate.js');

function getMethod(method) {
    return method || 'google-translate';
}

function getTranslator(method) {
    method = getMethod(method);
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

function propagateError(err) {
    return Promise.reject(err);
}

exports.translateText = function(text, sourceLang, targetLang, method) {
    return getTranslator(method)(text, sourceLang, targetLang);
};

exports.translateArticle = function (article, targetLang, method) {
    var translateText = getTranslator(method);
    var targetArticle = JSON.parse(JSON.stringify(article));

    targetArticle.orignialArticle = article;
    targetArticle.lang = targetLang;

    console.log(article.id, "Translating article to " + targetLang);

    var titleTranslateP = translateText(article.title, article.lang, targetLang)
                            .then(function (translation) {
                                console.log(article.id, "Title translated to " + targetLang);
                                targetArticle.title = translation.text;
                                targetArticle.titleSentence = {
                                    source: article.title,
                                    target: translation.text
                                };
                            }, propagateError);

    function translateSentences(sentences) {
        // Adds .target to sentences as side effect
        var sentencesText = sentences.map(function (sentence) {
            return sentence.source;
        }).join("\n");

        return translateText(sentencesText, article.lang, targetLang)
            .then(function (translation) {
                if (sentences.length !== translation.sentences.length) {
                    console.log(article.id, "Error while translating:", "SENTENCE_COUNT_MISMATCH");
                    return Promise.reject("SENTENCE_COUNT_MISMATCH");
                }

                // Assume the same order
                for (var i = 0; i < translation.sentences.length; i++) {
                    sentences[i].target = translation.sentences[i].target;
                }

                return sentences;
            }, propagateError);
    }

    var bodySentences = [].concat.apply([], targetArticle.bodySentences);
    var bodyTranslateP = translateSentences(bodySentences)
                            .then(function (sentences) {
                                targetArticle.body = targetArticle.bodySentences.map(function (paragraph) {
                                    return paragraph.map(function (sentence) {
                                        return sentence.target;
                                    }).join(" ");
                                }).join("\n");
                                console.log(article.id, "Body translated to " + targetLang);
                            }, propagateError);

    var summaryTranslateP = translateSentences(targetArticle.summarySentences)
                                .then(function (sentences) {
                                    targetArticle.summary = sentences.map(function (sentence) {
                                                                return sentence.target;
                                                            }).join("\n");
                                    console.log(article.id, "Summary translated to " + targetLang);
                                }, propagateError);

    return Promise.all([titleTranslateP, bodyTranslateP, summaryTranslateP]).then(function (values) {
        if (!("_meta" in targetArticle)) {
            targetArticle._meta = {};
        }
        targetArticle._meta.translator = getMethod(method);

        return targetArticle;
    }, propagateError);
};
