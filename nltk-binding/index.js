var rpcClient = require('./rpc-client.js');

module.exports.splitSentences = function(text) {
    return rpcClient.methodCall('sent_tokenize', [text]);
};
