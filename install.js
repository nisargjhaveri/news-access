var path = require('path');
var fs = require('fs');
var child_process = require('child_process');

var root = process.cwd();
npm_install_recursive(root);

function npm_install_recursive(folder) {
    if (folder !== root) {
        npm_install(folder);
    }

    subfolders(folder).forEach(function(subfolder) {
        npm_install_recursive(subfolder);
    });
}

function npm_install(where) {
    if (!fs.existsSync(path.join(where, 'package.json'))) return;

    console.log(where.replace(root, "."));

    child_process.execSync('npm install', {
        cwd: where,
        env: process.env,
        stdio: 'inherit'
    });
}

function subfolders(folder) {
    return fs.readdirSync(folder)
        .filter(function(subfolder) {
            return fs.statSync(path.join(folder, subfolder)).isDirectory() &&
                (subfolder !== 'node_modules' && subfolder[0] !== '.');
        })
        .map(function(subfolder) {
            return path.join(folder, subfolder);
        });
}
