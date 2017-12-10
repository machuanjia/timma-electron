const electron = require('electron');
const {
    app,
    ipcMain,
    BrowserWindow,
    Menu,
    shell,
    globalShortcut
} = electron;
const unit = require('../shared/unit');
const i18n = require('../i18n');
const common = require('../common/common');


module.exports = {
    init: function () {
        let win = unit.getWindow(unit.winMap.capturer);

        if (win) {
            win.focus();
        } else {
            win = new BrowserWindow({
                title: '截图',
                titleBarStyle: 'hidden',
                skipTaskbar: false,
                show: false,
                center: true,

                webPreferences: {
                    nodeIntegration: false,
                    plugins: true,
                    preload: __dirname + '/screen.capture.r.js',
                    allowDisplayingInsecureContent: true,
                    scrollBounce: true
                }
            });
            win.loadURL(`file://${__dirname}/index.html`);

            unit.winMap.screenCapture = win.id;
        }
        globalShortcut.register(common.mHotkey.getScreenCapture(), function () {
            if (app.operational.disableGlobalShortcut) {
                return;
            }

            win && win.webContents.send('desktop-capturer');
        });

    }
};