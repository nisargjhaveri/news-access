const path = require('path');
const fs = require('fs');
const tokenizer = new (require('node-icu-tokenizer'))();

if (process.argv.length < 5) {
    console.error("Usage: js prepareDataset.js DUMP_FILENAME OUT_DIR OUT_PREFIX");
    console.error("You probably want to use prepareDataset.sh");
    console.error("For advance usage edit the script! :P");
    process.exit(1);
}

var filename = process.argv[2];
var outDir = process.argv[3];
var outPrefix = process.argv[4];

var lineReader = require('readline').createInterface({
    input: fs.createReadStream(filename)
});

fs.WriteStream.prototype.writeLine = function (chunk, encoding, callback) {
    this.write(chunk + "\n", encoding, callback);
};

var fileOptions = {
    // flags: 'a'
};

const srcFile = fs.createWriteStream(path.join(outDir, outPrefix + ".src"), fileOptions);
const mtFile = fs.createWriteStream(path.join(outDir, outPrefix + ".mt"), fileOptions);
const peFile = fs.createWriteStream(path.join(outDir, outPrefix + ".pe"), fileOptions);

const srcTokFile = fs.createWriteStream(path.join(outDir, outPrefix + ".src.tok"), fileOptions);
const mtTokFile = fs.createWriteStream(path.join(outDir, outPrefix + ".mt.tok"), fileOptions);
const peTokFile = fs.createWriteStream(path.join(outDir, outPrefix + ".pe.tok"), fileOptions);

const peTimeFile = fs.createWriteStream(path.join(outDir, outPrefix + ".time"), fileOptions);

srcFile.writeLine("source_sentence");
mtFile.writeLine("mt_translated_sentence");
peFile.writeLine("postedited_mt_translated_sentence");

srcTokFile.writeLine("source_sentence_tokenized");
mtTokFile.writeLine("mt_translated_sentence_tokenized");
peTokFile.writeLine("postedited_mt_translated_sentence_tokenized");

peTimeFile.writeLine(["time_ms", "focus_count", "input_count", "cut_count", "copy_count", "paste_count"].join("\t"));

lineReader
    .on('line', function (line) {
        var doc = JSON.parse(line);
        printSentences(doc);
    })
    .on('close', function () {
        srcFile.end();
        mtFile.end();
        peFile.end();

        srcTokFile.end();
        mtTokFile.end();
        peTokFile.end();

        peTimeFile.end();
    });

var docIdCounts = {};
function getDocId(doc) {
    if (!(doc.id in docIdCounts)) {
        docIdCounts[doc.id] = 1;
    }

    return [doc.id, docIdCounts[doc.id]++].join('_');
}

function printSentences(doc) {
    var sentenceMap = {};
    var sentenceLogs = {};

    function sourceTokenizer(text) {
        return tokenizer.tokenize(text).map((t) => t.token).join(' ');
    }

    function targetTokenizer(text) {
        return tokenizer.tokenize(text, {locale: doc.lang}).map((t) => t.token).join(' ');
    }

    function cleanText(text) {
        return text
            .replace(/\u200b/g, " ")
            .replace(/\s+/g, " ");
    }

    function getExtraParams(sentence) {
        var lastFocused = -1;
        var totalFocusTime = 0;

        var countFocus = 0;
        var countInput = 0;
        var countCut = 0;
        var countCopy = 0;
        var countPaste = 0;

        if (sentence.source in sentenceLogs) {
            sentenceLogs[sentence.source].forEach(function (event) {
                if (event.type == 'focus' && lastFocused == -1) {
                    lastFocused = event.timestamp;
                    countFocus++;
                } else if (event.type == 'blur' && lastFocused >= 0) {
                    totalFocusTime += event.timestamp - lastFocused;
                    lastFocused = -1;
                } else if (event.type == 'focus' || event.type == 'blur') {
                    console.error("Error!", lastFocused, event.type);
                } else if (event.type == 'input') {
                    countInput++;
                } else if (event.type == 'cut') {
                    countCut++;
                } else if (event.type == 'copy') {
                    countCopy++;
                } else if (event.type == 'paste') {
                    countPaste++;
                }
            });
        }

        if (lastFocused >= 0) {
            console.error("Didn't blur!", doc.id);
        } else if (totalFocusTime == 0 && sentence.editedTarget && sentence.editedTarget != sentence.target) {
            console.error("Edited in no time!");
        }

        return [totalFocusTime, countFocus, countInput, countCut, countCopy, countPaste];
    }

    var sentenceCount = 1;
    var docId = getDocId(doc);

    function handleSentence(sentence) {
        if (sentence.source in sentenceMap) return;

        var sentenceId = "\t" + "(" + docId + "_" + sentenceCount++ + ")";

        srcFile.writeLine(cleanText(sentence.source) + sentenceId);
        mtFile.writeLine(cleanText(sentence.target) + sentenceId);
        peFile.writeLine(cleanText(sentence.editedTarget || sentence.target) + sentenceId);

        srcTokFile.writeLine(cleanText(sourceTokenizer(sentence.source)) + sentenceId);
        mtTokFile.writeLine(cleanText(targetTokenizer(sentence.target)) + sentenceId);
        peTokFile.writeLine(cleanText(targetTokenizer(sentence.editedTarget || sentence.target)) + sentenceId);

        peTimeFile.writeLine(getExtraParams(sentence).join("\t") + sentenceId);

        sentenceMap[sentence.source] = 1;
    }

    doc._meta.logger.translationSentencesLogs.forEach(function(sentenceLog) {
        sentenceLogs[sentenceLog.key] = sentenceLog.logs;
    });

    doc.bodySentences.forEach(function(para) {
        para.forEach(handleSentence);
    });

    doc.summarySentences.forEach(handleSentence);

    return doc;
}

function propagateError(err) {
    return Promise.reject(err);
}

function logError(err) {
    console.error("Error:", err);
}
