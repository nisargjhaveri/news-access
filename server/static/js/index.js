/* globals articleSource: false, baseUrl: false, availableSources: false */

function getActionUrl (id, action) {
    return [action, articleSource, id].join("/");
}

function addNewArticle (article) {
    var $article = $('#sample-article').clone();
    $article.removeAttr('id');
    $article.find('.show-title').text(article.title);
    $article.find('.show-source').text(article.source);
    $article.find('.show-published-time').text(moment(article.publishedTime).fromNow());
    $article.find('.show-image').attr('src', article.picture).addClass(article.picture ? "" : "hidden");
    $article.find('.link-article').attr('href', getActionUrl(article.id, "article"));
    $article.find('.link-original-article').attr('href', article.url);
    $article.find('.link-workbench').attr('href', getActionUrl(article.id, "workbench"));

    $('.article-list').append($article);
}

function setupOptionsAndLoad() {
    if (availableSources.indexOf(articleSource) == -1) {
        var selectedSource = localStorage.getItem('news-access-source') || "pti";
        changeSource(selectedSource);
    } else {
        $('.select-source option[value="' + articleSource + '"]').prop('selected', true);
        loadArticleList();
    }

    $('.select-source').on('change', manageOptionsAndRefresh);
}

function manageOptionsAndRefresh() {
    var selectedSource = $('.select-source').val();

    localStorage.setItem('news-access-source', selectedSource);

    changeSource(selectedSource);
}

function changeSource(source) {
    window.location.href = source;
}

function panic() {
    $('.article-list').removeClass('loading');
    $('.error-container').removeClass('hidden');
}

var socket;

function loadArticleList() {
    socket = io({path: baseUrl + 'socket.io'});

    socket.on('new error', function (err) {
        panic();
        console.log("Error", err);
    });

    socket.emit('select article source', articleSource);

    console.log("Requesting article list");
    socket.emit('get article list', {limit: 10}, function (articles) {
        console.log(articles);

        if (articles.length) {
            articles.forEach(function (article) {
                addNewArticle(article);
            });
        } else {
            $('.article-list .info-line').removeClass('hidden');
        }

        $('.article-list').removeClass('loading');
    });
}

$(function () {
    setupOptionsAndLoad();
});
