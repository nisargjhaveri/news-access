// This is dummy summarizer, assumes summary is already there in the origianl article

function summarize(article) {
    return Promise.resolve(article);
}

module.exports = summarize;
