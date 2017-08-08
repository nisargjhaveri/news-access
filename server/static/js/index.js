/* globals articleSource: false, baseUrl: false */

function getArticleUrl (id) {
    return ["article", articleSource, id].join("/");
}

function addNewArticle (article) {
    var $article = $('#sample-article').clone();
    $article.removeAttr('id');
    $article.find('.show-title').text(article.title);
    $article.find('.show-source').text(article.source);
    $article.find('.show-published-time').text(moment(article.publishedTime).fromNow());
    $article.find('.show-image').attr('src', article.picture).addClass(article.picture ? "" : "hidden");
    $article.find('.link-article').attr('href', getArticleUrl(article.id));
    $article.find('.link-original-article').attr('href', article.url);

    $('.article-list').removeClass('loading').append($article);
}

function panic() {
    $('.article-list').removeClass('loading');
    $('.error-container').removeClass('hidden');
}

$(function () {
    var socket = io({path: baseUrl + 'socket.io'});
    socket.emit('select article source', articleSource);

    socket.on('new article', function (article) {
        addNewArticle(article);
        console.log(article);
    });

    socket.on('new error', function (err) {
        panic();
        console.log("Error", err);
    });

    console.log("Requesting article list");
    socket.emit('get article list', 10);
});
