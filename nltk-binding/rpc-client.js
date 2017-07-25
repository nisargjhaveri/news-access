var spawn = require('child_process').spawn;
var path = require('path');

var xmlrpc = require('xmlrpc');
var PromiseQueue = require('promise-queue');

var rpcClient = new Promise(function (resolve, reject) {
    var rpcServer = spawn(
        'python', [path.join(__dirname, 'rpc-server.py')],
        {
            stdio: ['ignore', 'pipe', 'ignore']
        }
    );

    rpcServer.stdout.on('data', function(data) {
        var lines = data.toString().split("\n");

        if (lines[0].indexOf("LOCATION:") !== 0) {
            reject("RPC_SERVER_ERROR");
            return;
        }

        var serverLocation = lines[0].replace("LOCATION: ", "").trim();

        var client = xmlrpc.createClient(serverLocation);

        console.log("Started python rpc server at:", serverLocation);

        resolve(client);
    });

    rpcServer.on('exit', function(code) {
        console.log("Python rpc server is dead");
        reject("RPC_SERVER_DEAD");
    });
});

var rpcQueue = new PromiseQueue(2, Infinity);

function methodCall(method, args) {
    return rpcQueue.add(function() {
        return new Promise(function(resolve, reject) {
            rpcClient.then(function (client) {
                client.methodCall(method, args, function (error, value) {
                    if (value) {
                        resolve(value);
                    } else {
                        console.log("RPC ERRPR", error);
                        reject(error);
                    }
                });
            });
        });
    });
}

module.exports = {
    methodCall
};
