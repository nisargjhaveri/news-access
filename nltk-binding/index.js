var rpcClient = require('./rpc-client.js').rpcClient;

exports.splitSentences = function(text) {
    return new Promise(function(resolve, reject) {
        rpcClient.then(function(client) {
            client.methodCall('sent_tokenize', [text], function (error, value) {
                if (value) {
                    resolve(value);
                } else {
                    reject(error);
                }
            });
        });
    });
};
