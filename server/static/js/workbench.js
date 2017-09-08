/* globals Sortable:false */
/* globals articleSource: false, articleId:false, baseUrl: false */

var summaryTranslator = (function () {
    var translationStore = {};
    var fromLang, toLang;

    function translateSentence(sentence, callback) {
        socket.emit(
            'translate text',
            sentence.source,
            fromLang, toLang,
            getSelectedTranslator(),
            function (translation) {
                callback({
                    source: sentence.source,
                    target: translation.text
                });
            }
        );
    }

    return {
        initialize: function (sourceLang, targetLang) {
            fromLang = sourceLang;
            toLang = targetLang;
        },
        translate: function (summarySentences, callback) {
            var pendingCallbacks = 0;

            function translationCallback(sentence) {
                if (!(sentence.source in translationStore)) {
                    translationStore[sentence.source] = {};
                }

                translationStore[sentence.source].original = sentence.target;

                pendingCallbacks--;

                if (!pendingCallbacks) {
                    doneTranslations();
                }
            }

            function doneTranslations() {
                summarySentences.forEach(function (sentence) {
                    sentence.target = translationStore[sentence.source].original;

                    if (translationStore[sentence.source].edited) {
                        sentence.editedTarget = translationStore[sentence.source].edited;
                    }
                });

                callback(summarySentences);
            }

            summarySentences.map(function (sentence) {
                if (!(sentence.source in translationStore && translationStore[sentence.source].original)) {
                    pendingCallbacks++;
                    translateSentence(sentence, translationCallback);
                }
            });

            if (!pendingCallbacks) {
                doneTranslations();
            }
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

                if (!Array.isArray(translationStore[sentence.source].logs)) {
                    translationStore[sentence.source].logs = [];
                }
                cachedSentence.logs = translationStore[sentence.source].logs;

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

var globalLogs = [];

var Events = (function() {
    var id = 0;
    function getDefaultEvent(type) {
        return {
            id: id++,
            timestamp: performance.now(),
            type: type
        };
    }
    return {
        pageLoad: function() {
            var ev = getDefaultEvent('pageLoad');
            return ev;
        },
        articleLoad: function() {
            var ev = getDefaultEvent('articleLoad');
            return ev;
        },
        publishArticle: function() {
            var ev = getDefaultEvent('articlePublish');
            return ev;
        },
        publishArticleSuccess: function() {
            var ev = getDefaultEvent('articlePublishSuccess');
            return ev;
        },

        focus: function() {
            var ev = getDefaultEvent('focus');
            return ev;
        },
        blur: function() {
            var ev = getDefaultEvent('blur');
            return ev;
        },
        keydown: function() {
            var ev = getDefaultEvent('keydown');
            return ev;
        },
        input: function() {
            var ev = getDefaultEvent('input');
            return ev;
        },
    };
})();

function getEnvironment() {
    return {
        navigationStart: new Date(performance.timing.navigationStart),
        nagigator: {
            platform: navigator.platform,
            userAgent: navigator.userAgent,
            vendor: navigator.vendor,
            language: navigator.language,
            languages: navigator.languages
        }
    };
}

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
        updateTargetSummaryStatus();
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

    function updateSourceSummaryStatus() {
        var totalSize = 0;
        $('.summary-source .sentence').each(function () {
            totalSize += $(this).text().length;
        });
        $('.summary-source-status-char').text(totalSize);
    }

    function updateTargetSummaryStatus() {
        var totalSize = 0;
        $('.summary-target .sentence').each(function () {
            totalSize += $(this).text().length;
        });
        $('.summary-target-status-char').text(totalSize);
    }

    function showArticle(paragraphs) {
        var articleBody = $('.article-body');

        // Show original article in source and target languages
        articleBody.append(
            paragraphs.map(function (paragraph) {
                var paraContainer = $('<div class="flex-row">');

                var sentences =  paragraph.map(function (sentence) {
                    return $('<span class="sentence" tabindex="-1">')
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
        updateSourceSummaryStatus();

        // Show summary in target language
        updateTargetSummary();
    }

    function enableDragDrop() {
        $('.paragraph-source').each(function(i, elem) {
            Sortable.create(elem, {
                group: {
                    name: "source-sentence-list",
                    pull: "clone",
                    put: false
                },
                sort: false,
                preventOnFilter: false,
                filter: function(e, target) {
                    return $(target).is(':focus');
                },
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
        $('.paragraph-source')
            .on('click', '.sentence', function(e) {
                if ($(this).is(':focus')) {
                    return;
                }

                $(this).focus();
            });

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
            .on("input", '.sentence', function(e) {
                updateSourceSummaryStatus();
            })
            .on("change", '.sentence', function(e) {
                $('.summary-source').trigger('summaryUpdated');
            })
            .on("summaryUpdated", function(e) {
                updateSourceSummaryStatus();
                updateTargetSummary();
            });

        $('.summary-target')
            .on("input", '.sentence', function(e) {
                updateTargetSummaryStatus();
            });

        function getLinkedSentencesArray(elem) {
            var linkedSentences = getLinkedSentences(elem);
            var linkedSentencesArray = [
                linkedSentences.sourceSentence,
                linkedSentences.targetSentence,
                linkedSentences.otherSourceSentence,
                linkedSentences.otherTargetSentence
            ];

            return $(linkedSentencesArray).map(function() {
                return $(this).toArray();
            });
        }

        function getLinkedSentences(elem) {
            var $elem = $(elem);
            var $targetSentence, $sourceSentence, $otherSourceSentence, $otherTargetSentence;
            var otherSourcePath, otherTargetPath;
            var sentenceId = $elem.attr('data-sentence-id');

            if ($elem.is('.article-title-target')) {
                $sourceSentence = $('.article-title-source');
                $targetSentence = $elem;
            } else if ($elem.is('.summary-target .sentence') || $elem.is('.summary-source .sentence')) {
                var sentenceIndex;
                if ($elem.is('.summary-target .sentence')) {
                    sentenceIndex = $('.summary-target .sentence').index($elem);
                    $sourceSentence = $('.summary-source .sentence').eq(sentenceIndex);
                    $targetSentence = $elem;
                } else {
                    sentenceIndex = $('.summary-source .sentence').index($elem);
                    $sourceSentence = $elem;
                    $targetSentence = $('.summary-target .sentence').eq(sentenceIndex);
                }
                otherSourcePath = '.article-body .paragraph-source';
                otherTargetPath = '.article-body .paragraph-target';
            } else {
                // It is '.article-body .paragraph-target .sentence' or '.article-body .paragraph-source .sentence'
                if ($elem.is('.article-body .paragraph-target .sentence')) {
                    $sourceSentence = $('.article-body .paragraph-source .sentence[data-sentence-id="' + sentenceId + '"]');
                    $targetSentence = $elem;
                } else {
                    $sourceSentence = $elem;
                    $targetSentence = $('.article-body .paragraph-target .sentence[data-sentence-id="' + sentenceId + '"]');
                }
                otherSourcePath = '.summary-source';
                otherTargetPath = '.summary-target';
            }

            if (sentenceId || sentenceId === 0) {
                $otherSourceSentence = $(otherSourcePath + ' .sentence[data-sentence-id="' + sentenceId + '"]');
                $otherTargetSentence = $(otherTargetPath + ' .sentence[data-sentence-id="' + sentenceId + '"]');
            }

            return {
                sourceSentence: $sourceSentence,
                targetSentence: $targetSentence,
                otherSourceSentence: $otherSourceSentence,
                otherTargetSentence: $otherTargetSentence
            };
        }

        // For translations
        var selectorTranslatable = '.summary-target .sentence, .article-body .paragraph-target .sentence, .article-title-target';
        $('.bench-container')
            .on("focus", selectorTranslatable, function(e) {
                var linkedSentences = getLinkedSentences(this);

                var cachedSentence = summaryTranslator.getCached({
                    source: linkedSentences.sourceSentence.text()
                });

                cachedSentence.logs.push(Events.focus());
            })
            .on("blur", selectorTranslatable, function(e) {
                var $this = $(this);

                var linkedSentences = getLinkedSentences(this);

                var sentence = {};
                sentence.source = linkedSentences.sourceSentence.text();
                sentence.editedTarget = $this.text();

                summaryTranslator.cacheTranslations([sentence]);

                var cachedSentence = summaryTranslator.getCached(sentence);
                cachedSentence.logs.push(Events.blur());

                // Update the translations
                $this
                    .removeClass("translation-edited")
                    .addClass(cachedSentence.editedTarget ? "translation-edited" : "");

                if (linkedSentences.otherSourceSentence && linkedSentences.otherTargetSentence &&
                    cachedSentence.source == linkedSentences.otherSourceSentence.text()
                ) {
                    linkedSentences.otherTargetSentence
                        .text(cachedSentence.editedTarget || cachedSentence.target)
                        .removeClass("translation-edited")
                        .addClass(cachedSentence.editedTarget ? "translation-edited" : "");
                }
            });

        $('.summary')
            .on('focus', '.sentence', function(e) {
                // Scroll linked source sentence into view
                var sentenceId = $(this).attr('data-sentence-id');

                if (!sentenceId && sentenceId !== 0) {
                    return;
                }

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
                getLinkedSentencesArray(this).addClass('linked-hover');
            })
            .on('mouseout', '.sentence', function(e) {
                getLinkedSentencesArray(this).removeClass('linked-hover');
            })
            .on('focus', '.sentence', function(e) {
                getLinkedSentencesArray(this).addClass('linked-focus');
            })
            .on('blur', '.sentence', function(e) {
                getLinkedSentencesArray(this).removeClass('linked-focus');
            });

        $('.summary-bin')
            .on('removeSentence', '.sentence', function(e) {
                getLinkedSentencesArray(this).removeClass('linked-hover');
                getLinkedSentencesArray(this).removeClass('linked-focus');
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

        $('.publish-btn')
            .on('click', function (e) {
                globalLogs.push(Events.publishArticle());
                $('.bench-article-container, .bench-summary-container').addClass('hidden');
                $('.bench-container').addClass('loading');

                var editedArticle = JSON.parse(JSON.stringify(article));

                // Set title
                var targetTitle = summaryTranslator.getCached(editedArticle.titleSentence);
                editedArticle.titleSentence.editedTarget = targetTitle.editedTarget;
                editedArticle.titleSentence.logs = targetTitle.logs;

                editedArticle.title = editedArticle.titleSentence.editedTarget || editedArticle.titleSentence.target;

                // Set summarySentences
                var summarySentences = [];
                $('.summary-source .sentence').each(function () {
                    var $this = $(this);

                    var targetSentence = summaryTranslator.getCached({
                        source: $this.text()
                    });

                    summarySentences.push({
                        id: parseInt($this.attr('data-sentence-id')),
                        source: $this.text(),
                        target: targetSentence.target,
                        editedTarget: targetSentence.editedTarget,
                        logs: targetSentence.logs
                    });
                });
                editedArticle.summarySentences = summarySentences;

                // Set summary
                editedArticle.summary = editedArticle.summarySentences.map(function (sentence) {
                    return sentence.editedTarget || sentence.target;
                }).join(" ");

                // Set bodySentences
                editedArticle.bodySentences.forEach(function (paragraph) {
                    paragraph.forEach(function (sentence) {
                        var targetSentence = summaryTranslator.getCached(sentence);

                        sentence.editedTarget = targetSentence.editedTarget;
                        sentence.logs = targetSentence.logs;
                    });
                });

                // Set body
                editedArticle.body = editedArticle.bodySentences.map(function (paragraph) {
                    return paragraph.map(function (sentence) {
                        return sentence.editedTarget || sentence.target;
                    }).join(" ");
                }).join("\n");

                // Set environment
                editedArticle._meta.environment = getEnvironment();
                editedArticle._meta.logs = globalLogs;

                console.log(editedArticle);

                socket.emit('publish article', editedArticle, function () {
                    globalLogs.push(Events.publishArticleSuccess());
                    window.location.href = 'workbench';
                });
            });
    }

    summaryTranslator.initialize(article.orignialArticle.lang, article.lang);
    summaryTranslator.cacheTranslations([article.titleSentence]);
    summaryTranslator.cacheTranslations(article.summarySentences);
    summaryTranslator.cacheTranslations([].concat.apply([], article.bodySentences));

    showArticle(article.bodySentences);
    enableDragDrop();
    makeArticleInteractive();

    $('.summary-status-container').removeClass('hidden');
    $('.publish-btn').removeClass('hidden');

    $('.bench-container').removeClass('loading');
    globalLogs.push(Events.articleLoad());
}

function showWhatsNext() {
    $('.bench-container').addClass('hidden');
    $('.whats-next-container').removeClass('hidden');

    function getActionUrl (id, action) {
        return [action, articleSource, id].join("/");
    }

    var selectedLanguage = $('.select-language').val();

    socket.emit('get article list', {limit: 1, lang: selectedLanguage}, function (articles) {
        console.log(articles);
        var article = articles[0];

        if (article) {
            var $article = $("#whats-next-article");

            $article.find('.show-title').text(article.title);
            $article.find('.show-source').text(article.source);
            $article.find('.show-published-time').text(moment(article.publishedTime).fromNow());
            $article.find('.show-image').attr('src', article.picture).addClass(article.picture ? "" : "hidden");
            $article.find('.link-article').attr('href', getActionUrl(article.id, "article"));
            $article.find('.link-workbench').attr('href', getActionUrl(article.id, "workbench"));

            $('.article-list').removeClass('hidden');
            $('.whats-next-text .here-is-more').removeClass('hidden');
        } else {
            $('.whats-next-text .nothing-more').removeClass('hidden');
        }

        $('.whats-next-container').removeClass('loading');
    });
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
        summarizer: selectedSummarizer,
        translator: selectedTranslator,
        requireAuth: true
    }, function (articles) {
        console.log(articles);
        prepareArticle(articles[0]);
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
    $('.whats-next-container').addClass('hidden');
    $('.error-container').removeClass('hidden');
}

var socket;

$(function () {
    globalLogs.push(Events.pageLoad());
    socket = io({path: baseUrl + 'socket.io'});
    socket.emit('select article source', articleSource);

    socket.on('new error', function (err) {
        panic();
        console.log("Error", err);
    });

    setupOptions();

    if (articleId) {
        loadArticle();
    } else {
        showWhatsNext();
    }
});
