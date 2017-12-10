const {
    app,
    dialog,
    shell,
    BrowserWindow,
    remote
} = require('electron');
const _ = require('lodash');
const i18n = require('./../i18n/index');
const storage = require('electron-json-storage');
const request = require('request');
const os = require('os');
const path = require('path');
const CONFIG = require('../common/config');
const pkg = require('../../package.json');
const variables = require('../common/variables');

var _unit = {
    winMap: {},
    isMac: process.platform === 'darwin',
    isWin: process.platform === 'win32',
    checkUrl: function (url) {
        return CONFIG.regUrl.test(url) || CONFIG.regIP.test(url);
    },
   
    createID: function (name) {
        return `${name}-${Math.floor(Math.random() * 1000000000)}`
    },
    getWindow: function (id) {
        if (id) {
            let win = BrowserWindow.fromId(id);
            if (win) {
                return win;
            }
        }
    },
    storage: {
        getPreferences: function (callback) {
            let _app = app || remote.app;
            storage.get('preferences', function (error, result) {
                _app.preferences = _.merge(variables.preferences, result);
                callback && callback(error);
            });
        },
        savePreferences: function (callback) {
            let _app = app || remote.app;
            storage.setSync('preferences', _app.preferences, function (error) {
                callback && callback(error);
            });
        }
    }
};
module.exports = _unit;