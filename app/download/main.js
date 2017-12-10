const {app, ipcMain, BrowserWindow, Menu, shell, Tray} = require('electron');
const unit = require('../shared/unit');
const i18n = require('../i18n');


module.exports = {
    open: function () {

        i18n.setLocale(app.preferences.locale);

        let win = unit.getWindow(unit.winMap.download);
        if (win) {
            win.focus();
        } else {
            win = new BrowserWindow({
                title: i18n.__('download.manage'),
                width: 550,
                height: 400,
                center: true,
                webPreferences: {
                    nodeIntegration: false,
                    plugins: true,
                    preload: __dirname + '/renderer.js',
                    allowDisplayingInsecureContent: true,
                    scrollBounce: true
                }
            });
            win.loadURL(`file://${__dirname}/download.html`);

            win.setMenuBarVisibility(false);

            unit.winMap.download = win.id;
        }

    }
};