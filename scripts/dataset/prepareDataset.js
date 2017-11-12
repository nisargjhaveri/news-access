const path = require('path');
const fs = require('fs');
const tokenizer = new (require('node-icu-tokenizer'))();

if (process.argv.length < 5) {
    console.error("Usage: js prepareDataset.js DUMP_FILENAME OUT_DIR OUT_PREFIX");
    console.error("For advance usage edit the script! :P");
    process.exit(1);
}

var filename = process.argv[2];
var outDir = process.argv[3];
var outPrefix = process.argv[4];

var lineReader = require('readline').createInterface({
    input: fs.createReadStream(filename)
});

const srcFile = fs.createWriteStream(path.join(outDir, outPrefix + ".src"), {flags: 'a'});
const mtFile = fs.createWriteStream(path.join(outDir, outPrefix + ".mt"), {flags: 'a'});
const peFile = fs.createWriteStream(path.join(outDir, outPrefix + ".pe"), {flags: 'a'});

const srcTokFile = fs.createWriteStream(path.join(outDir, outPrefix + ".src.tok"), {flags: 'a'});
const mtTokFile = fs.createWriteStream(path.join(outDir, outPrefix + ".mt.tok"), {flags: 'a'});
const peTokFile = fs.createWriteStream(path.join(outDir, outPrefix + ".pe.tok"), {flags: 'a'});

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
    });

function printSentences(doc) {
    var sentenceMap = {};
    var sentenceLogs = {};

    function sourceTokenizer(text) {
        return tokenizer.tokenize(text).map((t) => t.token).join(' ');
    }

    function targetTokenizer(text) {
        return tokenizer.tokenize(text, {locale: doc.lang}).map((t) => t.token).join(' ');
    }

    function handleSentence(sentence) {
        if (sentence.source in sentenceMap) return;

        srcFile.write(sentence.source.replace(/\n/g, "\\n") + "\n");
        mtFile.write(sentence.target.replace(/\n/g, "\\n") + "\n");
        peFile.write((sentence.editedTarget || sentence.target).replace(/\n/g, "\\n") + "\n");

        srcTokFile.write(
            sourceTokenizer(sentence.source)
                .replace(/\n/g, "\\n") + "\n"
        );
        mtTokFile.write(
            targetTokenizer(sentence.target)
                .replace(/\n/g, "\\n") + "\n"
        );
        peTokFile.write(
            targetTokenizer(sentence.editedTarget || sentence.target)
                .replace(/\n/g, "\\n") + "\n"
        );

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
