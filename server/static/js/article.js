/* globals articleSource: false, articleId:false, baseUrl: false */

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

    $article.attr('lang', article.lang);
    $article.find('.show-title').text(article.title);
    $article.find('.show-summary').text(article.summary);
    $article.find('.show-source').text(article.source);
    $article.find('.show-published-time').text(moment(article.published).fromNow());
    $article.find('.link-original-article').attr('href', article.url);

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
    $article.find('.link-original-article').attr('href', orignialArticle.url);
    $article.find('.show-image')
        .attr('src', orignialArticle.picture)
        .addClass(orignialArticle.picture ? "" : "hidden");

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
        $('.select-language option[value="' + selectedLanguage + '"]').prop('selected', true);
    }
    if (selectedSummarizer) {
        $('.select-summarizer option[value="' + selectedSummarizer + '"]').prop('selected', true);
    }
    if (selectedTranslator) {
        $('.select-translator option[value="' + selectedTranslator + '"]').prop('selected', true);
    }

    $('.select-language').on('change', manageOptionsAndRefresh);
    $('.select-summarizer').on('change', manageOptionsAndRefresh);
    $('.select-translator').on('change', manageOptionsAndRefresh);
}

function manageOptionsAndRefresh() {
    $('.select-language').attr('disabled', 'true');
    $('.select-summarizer').attr('disabled', 'true');
    $('.select-translator').attr('disabled', 'true');

    var selectedLanguage = $('.select-language').val();
    var selectedSummarizer = $('.select-summarizer').val();
    var selectedTranslator = $('.select-translator').val();

    if (['en', 'hi', 'ur'].indexOf(selectedLanguage) == -1) {
        $('.select-translator option[value="microsoft-translate"]').attr('disabled', 'true');

        if (selectedTranslator == 'microsoft-translate') {
            selectedTranslator = 'google-translate';
            $('.select-translator').val(selectedTranslator);
        }
    } else {
        $('.select-translator option[value="microsoft-translate"]').removeAttr('disabled');
    }

    localStorage.setItem('news-access-language', selectedLanguage);
    localStorage.setItem('news-access-summarizer', selectedSummarizer);
    localStorage.setItem('news-access-translator', selectedTranslator);

    refreshArticle();
}

function refreshArticle() {
    $('.article-container').empty().addClass('loading');

    var selectedLanguage = $('.select-language').val();
    var selectedSummarizer = $('.select-summarizer').val();
    var selectedTranslator = $('.select-translator').val();

    console.log("Requesting article");
    socket.emit('access article', articleId, [selectedLanguage], {
        'summarizer': selectedSummarizer,
        'translator': selectedTranslator
    });
}

function panic(err) {
    $('.select-language').removeAttr('disabled');
    $('.select-summarizer').removeAttr('disabled');
    $('.select-translator').removeAttr('disabled');

    $('.article-container').removeClass('loading');
    $('.error-container').removeClass('hidden');
}

var socket;

$(function () {
    socket = io({path: baseUrl + 'socket.io'});
    socket.emit('select article source', articleSource);

    socket.on('accessible articles', function (articles) {
        showAccessibleArticles(articles);

        $('.select-language').removeAttr('disabled');
        $('.select-summarizer').removeAttr('disabled');
        $('.select-translator').removeAttr('disabled');
        console.log(articles);
    });

    socket.on('new error', function (err) {
        panic(err);
        console.log("Error", err);
    });

    setupOptions();
    manageOptionsAndRefresh();
});
