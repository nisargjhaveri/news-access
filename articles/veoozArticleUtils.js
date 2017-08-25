var htmlToText = require("html-to-text");

var articleUtils = require('./articleUtils.js');

// Convert article sent by Veooz to internal format
module.exports.convertRawArticle = function (rawArticle) {
    var article = {
        _meta: {
            rawId: rawArticle.id,
            priority: rawArticle.priority || 0,
            category: rawArticle.category,
        },
        id: articleUtils.getCleanId(rawArticle.id),
        url: rawArticle.url,
        picture: rawArticle.image,
        title: rawArticle.title,
        summary: rawArticle.summary,
        body: null,
        lang: rawArticle.language,
        source: rawArticle.source || "PTI",
        publishedTime: new Date(parseInt(rawArticle.publishedTime)),
        publishedPlace: null,
    };

    article.body = htmlToText.fromString(
        rawArticle.taggedText,
        {
            wordwrap: false,
            uppercaseHeadings: false,
            ignoreImages: true,
            ignoreHref: true
        }
    );

    // FIXME: Find a better way?
    var sourceSeparators = [
        /\(PTI\)/,
        /\(AFP\)/,
        /\/PRNewswire\/\s*?--/
    ];

    for (var i = 0; i < sourceSeparators.length; i++) {
        var matchResult = article.body.match(sourceSeparators[i]);
        if (matchResult && matchResult.index <= 65) {                   //FIXME: Magic number 65
            var cutPosition = matchResult.index + matchResult[0].length;

            article.publishedPlace = article.body.substr(0, cutPosition).trim();
            article.body = article.publishedPlace + '. ' + article.body.substr(cutPosition).trim();

            if (article.summary.indexOf(article.publishedPlace) <= 5) { //FIXME: Magic number 5
                article.summary = article.summary.replace(article.publishedPlace, '').trim();
            }

            break;  // Don't check for more separators
        }
    }

    return article;
};

// Convert article to send to Veooz
module.exports.convertAccessibleArticle = function (article) {
    function getTaggedText(text) {
        return text.split("\n").filter(function (para) {
            return para;
        }).map(function (para) {
            return "<p>" + para + "</p>";
        }).join("");
    }

    var veoozArticle = {
        id: article._meta.rawId,
        url: article.url,
        publishedTime: new Date(article.publishedTime).getTime().toString(),
        title: article.orignialArticle.title,
        text: article.orignialArticle.body,
        taggedText: getTaggedText(article.orignialArticle.body),
        summary: article.orignialArticle.summary,
        language: article.orignialArticle.lang,
        translatedTitle: article.title,
        translatedText: article.body,
        translatedTaggedText: getTaggedText(article.body),
        translatedSummary: article.summary,
        translatedLanguage: article.lang,
        manuallyEdited: "true"
    };

    return veoozArticle;
};
