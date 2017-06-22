var spawn = require('child_process').spawn;
var path = require('path');
var xmlrpc = require('xmlrpc');

exports.rpcClient = new Promise(function (resolve, reject) {
    var rpcServer = spawn('python', [path.join(__dirname, 'rpc-server.py')]);

    rpcServer.stdout.on('data', function(data) {
        var lines = data.toString().split("\n");

        if (lines[0].indexOf("LOCATION:") !== 0) {
            reject("RPC_SERVER_ERROR");
            return;
        }

        var serverLocation = lines[0].replace("LOCATION: ", "").trim();

        // var client = xmlrpc.createClient({ host: 'localhost', port: 34427, path: '/'});
        var client = xmlrpc.createClient(serverLocation);

        resolve(client);
    });

    rpcServer.on('close', function(code) {
        reject("RPC_SERVER_DEAD");
    });
});
