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
    $article.find('.show-image').attr('src', orignialArticle.picture);
    $article.find('.link-original-article').attr('href', orignialArticle.url);

    for (var i = 0; i < articles.length; i++) {
        $article.find('.accessible-article-list').append(makeAccessibleArticle(articles[i]));
    }

    $('.article-container').append($article);
}

$(function () {
    var socket = io();
    socket.on('accessible articles', function (articles) {
        showAccessibleArticles(articles);
        console.log(articles);
    });

    console.log("Requesting article");
    socket.emit('access article', articleId, langs);
});
