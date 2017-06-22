function prepareArticle(article) {
    function showArticle(paragraphs) {
        articleBody = $('.article-body');
        // sourceArticleParent = $('<div class="flex-item">').appendTo(articleBody);
        // translatedArticleParent = $('<div class="flex-item">').appendTo(articleBody);

        articleBody.append(
            paragraphs.map(function (paragraph) {
                var paraContainer = $('<div class="flex-row">');

                var sentences =  paragraph.map(function (sentence) {
                    return $('<span class="sentence">')
                        .text(sentence.source)
                        .attr('data-sentence-id', sentence.id);
                });

                $('<p class="paragraph paragraph-draggable paragraph-source flex-item">')
                    .append(sentences)
                    .appendTo(paraContainer);

                return paraContainer;
            })
        );

        $('.article-title-source').text(article.orignialArticle.title);
        $('.article-title-target').text(article.title);


        $('.summary-source').append(
            article.summarySentences.map(function (sentence) {
                return $('<span class="sentence">')
                    .text(sentence.source)
                    .attr('data-sentence-id', sentence.id);
            })
        );

        $('.summary-target').append(
            article.summarySentences.map(function (sentence) {
                return $('<span class="sentence">')
                    .text(sentence.target)
                    .attr('data-sentence-id', sentence.id);
            })
        );

        $('.summary-source')
            .on('click', '.sentence', function(e) {
                // Do nothing if already contenteditable
                if ($(this).attr('contenteditable')) {
                    return;
                }

                $(this).attr('contenteditable', true);

                // Focus and set caret position
                var range;
                var textNode;
                var offset;

                if (document.caretPositionFromPoint) {
                    range = document.caretPositionFromPoint(e.clientX, e.clientY);
                    textNode = range.offsetNode;
                    offset = range.offset;
                } else if (document.caretRangeFromPoint) {
                    range = document.caretRangeFromPoint(e.clientX, e.clientY);
                    textNode = range.startContainer;
                    offset = range.startOffset;
                }

                range = document.createRange();
                var sel = window.getSelection();
                range.setStart(textNode, offset);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            })
            .on("blur", '.sentence', function(e) {
                $(this).removeAttr('contenteditable');
            });
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

        $('.summary-source').data(
            'sortable',
            Sortable.create($('.summary-source').get(0), {
                group: {
                    name: "summary-source",
                    pull: true,
                    put: ["source-sentence-list"]
                },
                sort: true,
                preventOnFilter: false,
                filter: function(e, target) {
                    return $(target).attr('contenteditable');
                },
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
            })
        );

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

    showArticle(article.bodySentences);
    enableDragDrop();

    $('.bench-container').removeClass('loading');
}

var sentenceToolbar = (function() {
    return {
        show: "",
        hide: "",
    };
})();

function panic() {
    alert("Error!");
}

$(function () {
    socket = io({path: baseUrl + 'socket.io'});
    socket.on('workbench article', function (article) {
        console.log(article);
        prepareArticle(article);
    });

    socket.on('new error', function (err) {
        panic();
        console.log("Error", err);
    });

    var articleId = '2MwKe8d';

    var selectedLanguage = localStorage.getItem('news-access-language');
    var selectedSummarizer = localStorage.getItem('news-access-summarizer');
    var selectedTranslator = localStorage.getItem('news-access-translator');

    socket.emit('workbench get article', articleId, selectedLanguage, {
        'summarizer': selectedSummarizer,
        'translator': selectedTranslator
    });
});
