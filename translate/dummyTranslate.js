function translate (text, from, to) {
    return Promise.resolve()
        .then(function () {
            var sentences = [];
            var sourceSentences = text.split("\n");

            for (var i = 0; i < sourceSentences.length; i++) {
                sentences.push({
                    source: sourceSentences[i].trim(),
                    target: sourceSentences[i].trim()
                });
            }

            return Promise.resolve({
                'text': sentences.map(function (sentence) {
                    return sentence.target;
                }).join("\n"),
                'sentences': sentences
            });
        });
}

module.exports = translate;
