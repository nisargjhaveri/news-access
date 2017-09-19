function wrapLog(log) {
    return function () {
        var args = [].slice.call(arguments);
        args.unshift(new Date().toString());
        log.apply(null, args);
    };
}

console.log = wrapLog(console.log);
console.error = wrapLog(console.error);
console.info = wrapLog(console.info);
