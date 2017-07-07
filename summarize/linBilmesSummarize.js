var tmp = require('tmp');
var path = require('path');
var fs = require('fs');
var spawn = require('child_process').spawn;

var config = require('./config.json');

function summarize(article) {
    return new Promise(function(resolve, reject) {
        var tmpDir = tmp.dirSync({
            unsafeCleanup: true
        });

        fs.writeFileSync(path.join(tmpDir.name, 'article'), article.body);

        var mergedEnv = process.env;
        mergedEnv.CLUTO_BIN_PATH = config.clutoBinPath;

        var run = spawn(
            'python',
            [path.join(config.linBilmesPath, 'summarizer'), '-s 400', tmpDir.name],
            {
                env: mergedEnv
            }
        );

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
