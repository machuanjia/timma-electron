const {
    app,
    ipcMain,
    BrowserWindow,
    Menu,
    shell,
    Tray,
    remote
} = require('electron');
const unit = require('../shared/unit');
const i18n = require('../i18n');

module.exports = {
    open: function () {
        app.operational.disableGlobalShortcut = true;

        i18n.setLocale(app.preferences.locale);

        let win = unit.getWindow(unit.winMap.preferences);
        if (win) {
            win.focus();
        } else {
            win = new BrowserWindow({
                title: i18n.__('preferences.preferences'),
                width: 800,
                height: 500,
                center: true,
                webPreferences: {
                    nodeIntegration: false,
                    plugins: true,
                    preload: __dirname + '/preferences.r.js',
                    allowDisplayingInsecureContent: true,
                    scrollBounce: true
                }
            });
            win.loadURL(`file://${__dirname}/preferences.html`);

            win.on('page-title-updated', function (event) {
                event.preventDefault();
            })

            win.setMenuBarVisibility(false);

            unit.winMap.preferences = win.id;

            win.on('close', function (e) {
                app.operational.disableGlobalShortcut = false;
            });
        }

    }
};