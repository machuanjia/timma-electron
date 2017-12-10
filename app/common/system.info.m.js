const {
    app,
    remote
} = require('electron');
const os = require('os');
const PKG = require('../../package.json');

module.exports = function () {
    return new Promise(function (resolve, reject) {
        let _app = app || remote.app;
        let result = {
            version: PKG.version,
            os: {
                platform: os.platform(),
                arch: os.arch(),
                version: os.release(),
                locale: _app.getLocale()
            },
            preferences: _app.preferences
        };
        resolve(result);
    });
};