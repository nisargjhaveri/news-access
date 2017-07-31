/* globals Sortable:false */
/* globals articleId:false, baseUrl: false */

var summaryTranslator = (function () {
    var translationStore = {};
    var sentencesToTranslate;
    var summaryCallback;
    var fromLang, toLang;

    function translateSentence(sentence) {
        socket.emit('translate text', sentence.source, fromLang, toLang, getSelectedTranslator());
    }

    function checkSummaryResolved() {
        if (!sentencesToTranslate) return;

        var resolved = true;

        sentencesToTranslate.forEach(function (sentence) {
            if (sentence.target) return;

            if (sentence.source in translationStore) {
                sentence.target = translationStore[sentence.source].original;

                if (translationStore[sentence.source].edited) {
                    sentence.editedTarget = translationStore[sentence.source].edited;
                }
            } else {
                resolved = false;
            }
        });

        if (resolved) {
            var callback = summaryCallback;
            var summarySentences = sentencesToTranslate;

            summaryCallback = false;
            sentencesToTranslate = false;

            callback(summarySentences);
        }
    }

    return {
        initialize: function (sourceLang, targetLang) {
            fromLang = sourceLang;
            toLang = targetLang;

            socket.on('translated text', function (text, translation) {
                translationStore[text] = {
                    original: translation.text
                };
                checkSummaryResolved();
            });
        },
        translate: function (summarySentences, callback) {
            sentencesToTranslate = summarySentences;
            summaryCallback = callback;

            summarySentences.map(function (sentence) {
                if (!(sentence.source in translationStore)) {
                    translateSentence(sentence);
                }
            });

            checkSummaryResolved();
        },
        getCached: function(sentence) {
            var cachedSentence = {
                source: sentence.source
            };

            if (sentence.source in translationStore) {
                cachedSentence.target = translationStore[sentence.source].original;

                if (translationStore[sentence.source].edited) {
                    cachedSentence.editedTarget = translationStore[sentence.source].edited;
                }

                return cachedSentence;
            } else {
                return false;
            }
        },
        cacheTranslations: function (sentences) {
            sentences.forEach(function (sentence) {
                if (!(sentence.source in translationStore)) {
                    translationStore[sentence.source] = {};
                }
                if (sentence.target) {
                    translationStore[sentence.source].original = sentence.target;
                }
                if (sentence.editedTarget && sentence.editedTarget != translationStore[sentence.source].original) {
                    translationStore[sentence.source].edited = sentence.editedTarget;
                } else {
                    delete translationStore[sentence.source].edited;
                }
            });
        }
    };
})();

function prepareArticle(article) {
    function updateSummaryDisplay(summarySentences) {
        $('.summary-target').empty();
        $('.summary-target').addClass('loading');
        $('.summary-target').append(
            summarySentences.map(function (sentence) {
                return $('<span class="sentence ce-text-only" contenteditable="true">')
                    .text(sentence.editedTarget || sentence.target)
                    .addClass(sentence.editedTarget ? 'translation-edited' : '')
                    .attr('data-sentence-id', sentence.id);
            })
        );
        $('.summary-target').removeClass('loading');
    }

    function updateTargetSummary() {
        var sentences = [];
        $('.summary-target').empty();
        $('.summary-target').addClass('loading');

        $('.summary-source .sentence').each(function () {
            var $this = $(this);

            sentences.push({
                id: $this.attr('data-sentence-id'),
                source: $this.text()
            });
        });

        summaryTranslator.translate(sentences, updateSummaryDisplay);
    }

    function showArticle(paragraphs) {
        var articleBody = $('.article-body');

        // Show original article in source and target languages
        articleBody.append(
            paragraphs.map(function (paragraph) {
                var paraContainer = $('<div class="flex-row">');

                var sentences =  paragraph.map(function (sentence) {
                    return $('<span class="sentence">')
                        .text(sentence.source)
                        .attr('data-sentence-id', sentence.id);
                });

                var sentencesTarget =  paragraph.map(function (sentence) {
                    return $('<span class="sentence ce-text-only" contenteditable="true">')
                        .text(sentence.target)
                        .attr('data-sentence-id', sentence.id);
                });

                $('<p class="paragraph paragraph-draggable paragraph-source flex-item">')
                    .append(sentences)
                    .appendTo(paraContainer);

                $('<p class="paragraph paragraph-target flex-item">')
                    .append(sentencesTarget)
                    .appendTo(paraContainer);

                return paraContainer;
            })
        );

        // Show title in source and target languages
        $('.article-title-source').text(article.orignialArticle.title);
        $('.article-title-target').text(article.title);

        // Show summary in source language
        $('.summary-source').append(
            article.summarySentences.map(function (sentence) {
                return $('<span class="sentence ce-text-only">')
                    .text(sentence.source)
                    .attr('data-sentence-id', sentence.id);
            })
        );

        // Show summary in target language
        updateSummaryDisplay(article.summarySentences);
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
                },
                onSort: function(e) {
                    $('.summary-source').trigger('summaryUpdated');
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
                var $elem = $(e.item);
                $elem.trigger('removeSentence');
                $elem.remove();
            }
        });
    }

    function makeArticleInteractive() {
        // Add event handlers on stuff
        $('.summary-source')
            .on('click', '.sentence', function(e) {
                // Do nothing if already contenteditable
                if ($(this).attr('contenteditable')) {
                    return;
                }

                $(this).attr('contenteditable', true);
                $(this).focus();

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
            .on("focus", '.sentence', function(e) {
                $(this).data('on-focus-sentence', $(this).text());
            })
            .on("blur", '.sentence', function(e) {
                var $this = $(this);
                $this.removeAttr('contenteditable');

                if ($this.data('on-focus-sentence') != $this.text()) {
                    $this.trigger('change');
                }

                $this.removeData('on-focus-sentence');
            })
            .on("change", '.sentence', function(e) {
                $('.summary-source').trigger('summaryUpdated');
            })
            .on("summaryUpdated", function(e) {
                updateTargetSummary();
            });

        $('.bench-container')
            .on("blur", '.summary-target .sentence, .article-body .paragraph-target .sentence', function(e) {
                var $this = $(this);

                var sourcePath;
                var otherSourcePath;
                var otherTargetPath;
                if ($this.is('.summary-target .sentence')) {
                    sourcePath = '.summary-source';
                    otherSourcePath = '.article-body .paragraph-source';
                    otherTargetPath = '.article-body .paragraph-target';
                } else {
                    // It is '.article-body .paragraph-target .sentence'
                    sourcePath = '.article-body .paragraph-source';
                    otherSourcePath = '.summary-source';
                    otherTargetPath = '.summary-target';
                }

                var sentence = {};
                sentence.id = $this.attr('data-sentence-id');
                sentence.source = $(sourcePath + ' .sentence[data-sentence-id="' + sentence.id + '"]').text();
                sentence.editedTarget = $this.text();

                summaryTranslator.cacheTranslations([sentence]);

                // Update the translations
                var cachedSentence = summaryTranslator.getCached(sentence);
                $this
                    .removeClass("translation-edited")
                    .addClass(cachedSentence.editedTarget ? "translation-edited" : "");

                var $otherSource = $(otherSourcePath + ' .sentence[data-sentence-id="' + sentence.id + '"]');

                if (cachedSentence.source == $otherSource.text()) {
                    $(otherTargetPath + ' .sentence[data-sentence-id="' + sentence.id + '"]')
                        .text(cachedSentence.editedTarget || cachedSentence.target)
                        .removeClass("translation-edited")
                        .addClass(cachedSentence.editedTarget ? "translation-edited" : "");
                }
            });

        // To highlight linked sentences on hover or focus
        function getLinkedSentences(elem) {
            var $elem = $(elem);
            var sentenceId = $elem.attr('data-sentence-id');

            return $('.sentence[data-sentence-id="' + sentenceId + '"]').not($elem);
        }

        $('.summary')
            .on('focus', '.sentence', function(e) {
                // Scroll linked source sentence into view
                var sentenceId = $(this).attr('data-sentence-id');
                var linkedSource = $('.paragraph-source .sentence[data-sentence-id="' + sentenceId + '"]');

                var container = $('.bench-article-container');

                var sentencePosition = {};
                sentencePosition.top = linkedSource.offset().top;
                sentencePosition.bottom = sentencePosition.top + linkedSource.outerHeight();

                var containerPosition = {};
                containerPosition.top = container.offset().top;
                containerPosition.bottom = containerPosition.top + container.height();
                containerPosition.scroll = container.scrollTop();

                var visiblityTheshold = linkedSource.outerHeight() * 0.25;

                var optimalScrollTop =
                    containerPosition.scroll +
                    sentencePosition.top -
                    containerPosition.top -
                    ((container.height() - linkedSource.outerHeight()) / 2);

                if (sentencePosition.top > containerPosition.bottom - visiblityTheshold ||
                    sentencePosition.bottom < containerPosition.top + visiblityTheshold
                ) {
                    container.animate({
                        scrollTop: optimalScrollTop
                    });
                }
            });

        $('.paragraph')
            .on('mouseover', '.sentence', function(e) {
                getLinkedSentences(this).addClass('linked-hover');
            })
            .on('mouseout', '.sentence', function(e) {
                getLinkedSentences(this).removeClass('linked-hover');
            })
            .on('focus', '.sentence', function(e) {
                getLinkedSentences(this).addClass('linked-focus');
            })
            .on('blur', '.sentence', function(e) {
                getLinkedSentences(this).removeClass('linked-focus');
            });

        $('.summary-bin')
            .on('removeSentence', '.sentence', function(e) {
                getLinkedSentences(this).removeClass('linked-hover');
                getLinkedSentences(this).removeClass('linked-focus');
            });

        // Make contenteditable safe
        $('body')
            .on('paste', '.ce-text-only[contenteditable="true"]', function(e) {
                if ((e.clipboardData || e.originalEvent.clipboardData) &&
                        document.queryCommandSupported('insertText')
                ) {
                    var clipboardData = e.clipboardData || e.originalEvent.clipboardData;

                    // Only allow plain text
                    var text = clipboardData.getData('text/plain');

                    // Replace new lines with space
                    text = text.replace(/\n+/g, " ");

                    document.execCommand("insertText", false, text);

                    e.preventDefault();
                }
            })
            .on('keypress', '.ce-text-only[contenteditable="true"]', function(e) {
                // Prevent new line
                return e.which != 13;
            });

        $('.publish-btn').removeClass('hidden');
    }

    summaryTranslator.initialize(article.orignialArticle.lang, article.lang);
    summaryTranslator.cacheTranslations(article.summarySentences);
    summaryTranslator.cacheTranslations([].concat.apply([], article.bodySentences));

    showArticle(article.bodySentences);
    enableDragDrop();
    makeArticleInteractive();

    $('.bench-container').removeClass('loading');
}

function setupOptions() {
    var selectedLanguage = localStorage.getItem('news-access-language');

    if (selectedLanguage) {
        $('.select-language option[value="' + selectedLanguage + '"]').prop('selected', true);
    }

    $('.select-language').on('change', manageOptionsAndRefresh);
}

function manageOptionsAndRefresh() {
    $('.select-language').attr('disabled', 'true');

    var selectedLanguage = $('.select-language').val();

    localStorage.setItem('news-access-language', selectedLanguage);

    window.location.reload();
}

function loadArticle() {
    var selectedLanguage = $('.select-language').val();
    var selectedSummarizer = getSelectedSummarizer();
    var selectedTranslator = getSelectedTranslator();

    socket.emit('access article', articleId, [selectedLanguage], {
        'summarizer': selectedSummarizer,
        'translator': selectedTranslator
    });
}

function getSelectedTranslator() {
    return 'google-translate';
}

function getSelectedSummarizer() {
    return 'veooz';
}

function panic() {
    $('.bench-container').addClass('hidden');
    $('.error-container').removeClass('hidden');
}

var socket;

$(function () {
    socket = io({path: baseUrl + 'socket.io'});
    socket.emit('select article source', 'stored');

    socket.on('accessible articles', function (articles) {
        console.log(articles);
        prepareArticle(articles[0]);
    });

    socket.on('new error', function (err) {
        panic();
        console.log("Error", err);
    });

    setupOptions();
    loadArticle();
});
