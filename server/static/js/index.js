function getArticleUrl (id) {
    return "/article/" + id;
}

function addNewArticle (article) {
    var $article = $('#sample-article').clone();
    $article.removeAttr('id');
    $article.find('.show-title').text(article.title);
    $article.find('.show-source').text(article.source);
    $article.find('.show-published-time').text(moment(article.published).fromNow());
    $article.find('.show-image').attr('src', article.picture);
    $article.find('.link-article').attr('href', getArticleUrl(article.id));
    $article.find('.link-original-article').attr('href', article.url);

    $('.article-list').removeClass('loading').append($article);
}

$(function () {
    var socket = io();
    socket.on('new article', function (article) {
        addNewArticle(article);
        console.log(article);
    });

    console.log("Requesting article list");
    socket.emit('get article list', 10);
});
