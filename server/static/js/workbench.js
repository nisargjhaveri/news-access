function prepareArticle() {
    function showArticle(sentences) {
        articleBody = $('.article-body');
        // sourceArticleParent = $('<div class="flex-item">').appendTo(articleBody);
        // translatedArticleParent = $('<div class="flex-item">').appendTo(articleBody);

        for (var i = 0; i < sentences.length; i++) {
            para = $('<div class="flex-row">');

            $('<p class="paragraph flex-item">')
                .append($('<span class="sentence source-sentence">').text(sentences[i].source))
                .appendTo(para);
            $('<p class="paragraph flex-item">')
                .append($('<span class="sentence ">').text(sentences[i].target))
                .appendTo(para);

            para.appendTo(articleBody);
        }
    }

    showArticle(sentences);
}

var sentenceToolbar = (function() {

    return {
        show: "",
        hide: "",
    };
})();

$(function () {
    prepareArticle();
});
