function prepareArticle() {
    function showArticle(sentences) {
        articleBody = $('.article-body');
        // sourceArticleParent = $('<div class="flex-item">').appendTo(articleBody);
        // translatedArticleParent = $('<div class="flex-item">').appendTo(articleBody);

        for (var i = 0; i < sentences.length; i++) {
            para = $('<div class="flex-row">');

            $('<p class="paragraph paragraph-draggable paragraph-source flex-item">')
                .append($('<span class="sentence">').text(sentences[i].source))
                .append($('<span class="sentence">').text(sentences[i].source))
                .appendTo(para);
            $('<p class="paragraph flex-item">')
                .append($('<span class="sentence">').text(sentences[i].target))
                .appendTo(para);

            para.appendTo(articleBody);
        }

        $('.summary-source')
            .append($('<span class="sentence">').text(
                "An expert in river conservation and a member of the Parliamentary forum on global warming, environment was a subject close to the heart of Anil Madhav Dave who was appointed Environment Minister only last year."
            ))
            .append($('<span class="sentence">').text(
                "A two-time Rajya Sabha MP from Madhya Pradesh, Dave was known in the BJP circles as a man gifted with immaculate organisational skills."
            ));
    }

    function enableDragDrop() {
        $('.paragraph-source').each(function(i, elem) {
            Sortable.create(elem, {
                group: {
                    name: "source-sentence-list",
                    pull: "clone",
                    put: false
                },
                sort: false
            });
        });

        Sortable.create($('.summary-source').get(0), {
            group: {
                name: "summary-source",
                pull: true,
                put: ["source-sentence-list"]
            },
            sort: true,
            onStart: function(e) {
                $('.summary-bin-container').removeClass('hidden');
            },
            onEnd: function(e) {
                $('.summary-bin-container').addClass('hidden');
                $('.summary-bin').removeClass('summary-bin-highlight');
            },
            onMove: function (e) {
                if ($(e.to).is(".summary-bin")) {
                    $('.summary-bin').addClass('summary-bin-highlight');
                } else {
                    $('.summary-bin').removeClass('summary-bin-highlight');
                }
            }
        });

        Sortable.create($('.summary-bin').get(0), {
            group: {
                name: "summary-bin",
                pull: false,
                put: ["summary-source"]
            },
            onAdd: function(e) {
                var elem = e.item;
                $(elem).remove();
            },
            onStart: function(e) {
                console.log(e);
            }
        });
    }

    showArticle(sentences);
    enableDragDrop();
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
