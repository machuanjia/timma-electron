const {
    ipcRenderer,
    remote,
    nativeImage,
    shell
} = require('electron');
const _ = require('lodash');
const CONFIG = require('../common/config');
const PKG = require('../../package.json');
const i18n = require('../i18n');
const globalShow = require('./global.show.r');
const analytics = require('./analytics.r'); 

window.onload = function () {
    if (CONFIG.regUrl.test(location.href)) {
        if (!CONFIG.changeUrlRegOut.test(location.href)) {
            ipcRenderer.send('latest-href-change', location.href);
        }
    }

    globalShow.init();

    // 桌面通知
    require('../common/notify');

    analytics.init();
};

window.document.onclick = function (e) {
    if (e.target && e.target.tagName && e.target.tagName.toLowerCase() === 'a') {
        if (e.target.target === '_blank' || e.target.target === '_lcsite') {
            e.stopPropagation();
            e.preventDefault();
            if (!_.isEmpty(e.target.href)) {
                shell.openExternal(e.target.href);
            }
        }
    }
};

ipcRenderer.on('download-desktop-notification', function (e, file) {
    if (file.state == 'completed') {
        var n = new Notification(`${file.name} ` + i18n.__('download.success'));
        n.onclick = function () {
            shell.showItemInFolder(file.savePath);
        }
    } else {
        new Notification(`${file.name} ` + i18n.__('download.failed'));
    }
});
