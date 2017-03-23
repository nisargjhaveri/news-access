function getErrorText(article) {
    var selectedLanguageName = $('.select-language option:selected').text();
    var selectedSummarizerName = $('.select-translator option:selected').text();

    if (article.error == "LANG_NOT_SUPPORTED") {
        return "The translator you selected (" + selectedSummarizerName + ") " +
            "does not support the selected language (" + selectedLanguageName + ")";
    }
}

function appendParagraphs($elem, text) {
    var paragraphs = text.split("\n").map(function (para) {
        return para.trim();
    });

    paragraphs.forEach(function (para) {
        if (para) $elem.append($('<p>').text(para));
    });
}

function makeAccessibleArticle(article) {
    var $article = $('#sample-accessible-article').clone();
    $article.removeAttr('id');

    if (article.error) {
        $article.empty();
        $article.append($('<div>').addClass('access-error').text(getErrorText(article)));
    } else {
        $article.find('.show-title').text(article.title);
        $article.find('.show-summary').text(article.summary);
        $article.find('.show-source').text(article.source);
        $article.find('.show-published-time').text(moment(article.published).fromNow());
        $article.find('.link-original-article').attr('href', article.url);
    }

    return $article;
}

function showAccessibleArticles(articles) {
    if (! articles.length) {
        console.log("No articles to show");
        return;
    }

    var orignialArticle = articles[0].orignialArticle;

    var $article = $('#sample-original-article').clone();
    $article.removeAttr('id');

    $article.find('.show-title').text(orignialArticle.title);
    $article.find('.show-source').text(orignialArticle.source);
    $article.find('.show-published-time').text(moment(orignialArticle.published).fromNow());
    $article.find('.show-summary').text(orignialArticle.summary);
    appendParagraphs($article.find('.show-full-article'), orignialArticle.body);
    $article.find('.show-image').attr('src', orignialArticle.picture);
    $article.find('.link-original-article').attr('href', orignialArticle.url);

    for (var i = 0; i < articles.length; i++) {
        $article.find('.accessible-article-list').append(makeAccessibleArticle(articles[i]));
    }

    $('.article-container').removeClass('loading').append($article);
}

function setupOptions() {
    var selectedLanguage = localStorage.getItem('news-access-language');
    var selectedSummarizer = localStorage.getItem('news-access-summarizer');
    var selectedTranslator = localStorage.getItem('news-access-translator');

    if (selectedLanguage) {
        $('.select-language option').removeAttr('selected');
        $('.select-language option[value="' + selectedLanguage + '"]').attr('selected', 'selected');
    }
    if (selectedSummarizer) {
        $('.select-summarizer option').removeAttr('selected');
        $('.select-summarizer option[value="' + selectedSummarizer + '"]').attr('selected', 'selected');
    }
    if (selectedTranslator) {
        $('.select-translator option').removeAttr('selected');
        $('.select-translator option[value="' + selectedTranslator + '"]').attr('selected', 'selected');
    }

    $('.select-language').on('change', refreshArticle);
    $('.select-summarizer').on('change', refreshArticle);
    $('.select-translator').on('change', refreshArticle);
}

function refreshArticle() {
    $('.article-container').empty().addClass('loading');

    $('.select-language').attr('disabled', 'true');
    $('.select-summarizer').attr('disabled', 'true');
    $('.select-translator').attr('disabled', 'true');

    var selectedLanguage = $('.select-language').val();
    var selectedSummarizer = $('.select-summarizer').val();
    var selectedTranslator = $('.select-translator').val();

    localStorage.setItem('news-access-language', selectedLanguage);
    localStorage.setItem('news-access-summarizer', selectedSummarizer);
    localStorage.setItem('news-access-translator', selectedTranslator);

    console.log("Requesting article");
    socket.emit('access article', articleId, [selectedLanguage], {
        'summarizer': selectedSummarizer,
        'translator': selectedTranslator
    });
}

var socket;

$(function () {
    socket = io({path: baseUrl + 'socket.io'});
    socket.on('accessible articles', function (articles) {
        showAccessibleArticles(articles);

        $('.select-language').removeAttr('disabled');
        $('.select-summarizer').removeAttr('disabled');
        $('.select-translator').removeAttr('disabled');
        console.log(articles);
    });

    setupOptions();
    refreshArticle();
});
