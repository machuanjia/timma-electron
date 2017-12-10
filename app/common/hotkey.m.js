const {
    app,
    remote
} = require('electron');
const CONFIG = require('./config');
const platform = require('./platform.m');
let _app = app || remote.app;

function platformTranslateMiddleware(value) {
    if (platform.isWin) {
        if (value.indexOf('Ctrl') == -1) {
            return value.replace('Command', 'Ctrl');
        } else {
            return value.replace('Command', 'Alt');
        }
    } else {
        return value;
    }
}

module.exports = {
    getApp: function () {
        return platformTranslateMiddleware(_app.preferences.hotkey.app || CONFIG.hotkey.app);
    },
    getScreenCapture: function () {
        return platformTranslateMiddleware(_app.preferences.hotkey.screenCapture || CONFIG.hotkey.screenCapture);
    }
}