const path = require('path');
const fs = require('fs');

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

const srcFile = fs.createWriteStream(path.join(outDir, outPrefix + ".src"));
const mtFile = fs.createWriteStream(path.join(outDir, outPrefix + ".mt"));
const peFile = fs.createWriteStream(path.join(outDir, outPrefix + ".pe"));

lineReader
    .on('line', function (line) {
        var doc = JSON.parse(line);
        printSentences(doc);
    })
    .on('close', function () {
        srcFile.end();
        mtFile.end();
        peFile.end();
    });

function printSentences(doc) {
    var sentenceMap = {};
    var sentenceLogs = {};

    function handleSentence(sentence) {
        if (sentence.source in sentenceMap) return;

        srcFile.write(sentence.source + "\n");
        mtFile.write(sentence.target + "\n");
        peFile.write((sentence.editedTarget || sentence.target) + "\n");

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
