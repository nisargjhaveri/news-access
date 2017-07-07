var tmp = require('tmp');
var path = require('path');
var fs = require('fs');
var spawn = require('child_process').spawn;

var config = require('./config.json');

function summarize(article) {
    return new Promise(function(resolve, reject) {
        var articleXML = "<DOC>" +
            "\n<DATETIME>2017-1-1 0:0:0</DATETIME>" +
            "\n<TITLE>" + article.title + "</TITLE>" +
            "\n<TEXT>\n" + article.body + "\n</TEXT>" +
            "\n</DOC>\n";

        var tmpDir = tmp.dirSync({
            unsafeCleanup: true
        });
        var originalPath = path.join(tmpDir.name, 'original');

        fs.mkdirSync(originalPath);
        fs.writeFileSync(path.join(originalPath, 'article.xml'), articleXML);

        var run = spawn(path.join(config.gFlowPath, 'run.sh'), [tmpDir.name, path.join(tmpDir.name, 'summary.txt')]);

        var summary = "";

        run.stdout.on('data', function (data) {
            summary += data.toString();
        });

        run.stderr.on('data', function (data) {
            console.log('stderr:', data.toString());
        });

        run.on('close', function (code) {
            console.log('Summarizer exited with code', code);
            if (code) {
                reject("EXIT_CODE_NOT_ZERO");
            } else {
                article.summary = summary.trim();

                article.summarySentences =
                    article.summary.split("\n").map(function (sentence) {
                        return {
                            source: sentence
                        };
                    });

                resolve(article);
            }
            tmpDir.removeCallback();
        });
    });
}

module.exports = summarize;
