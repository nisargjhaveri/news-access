function prepareArticle() {
    function showArticle(sentences) {
        articleBody = $('.article-body');
        // sourceArticleParent = $('<div class="flex-item">').appendTo(articleBody);
        // translatedArticleParent = $('<div class="flex-item">').appendTo(articleBody);

        for (var i = 0; i < sentences.length; i++) {
            para = $('<div class="flex-row">');

            $('<p class="paragraph paragraph-draggable paragraph-source flex-item">')
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
