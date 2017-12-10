const {
    app,
    dialog,
    shell,
    BrowserWindow,
    remote
} = require('electron');
const i18n = require('../i18n');
const storage = require('electron-json-storage');
const request = require('request');
const CONFIG = require('./config');
const PACKAGE = require('../../package.json');
const platform = require('./platform.m');

function checkVersion(isMenuClick) {
    let downloadUrl, version, desc, type;
    platform.isMac && (type = 'mac');
    platform.isWin && (type = 'windows');

    request(`${CONFIG.checkVersionURL}?type=${type}`, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            version = JSON.parse(body).data.version_name;
            desc = JSON.parse(body).data.desc;
            var oldVersion = app.getVersion().replace('v', '').split('.');
            var newVersion = JSON.parse(body).data.version_name.replace('v', '').split('.');
            downloadUrl = JSON.parse(body).data.path;

            var isNeedUpdate = false;
            if (newVersion[0] > oldVersion[0]) {
                isNeedUpdate = true;
            } else if (newVersion[0] == oldVersion[0]) {
                if (newVersion[1] > oldVersion[1]) {
                    isNeedUpdate = true;
                } else if (newVersion[1] == oldVersion[1]) {
                    if (newVersion[2] > oldVersion[2]) {
                        isNeedUpdate = true;
                    }
                }
            }

            //需要更新
            if (isNeedUpdate) {
                if (isMenuClick) {
                    checkDialog();
                } else {
                    storage.get('ignoreVersion', function (err, data) {
                        if (data) {
                            if (data.version != version) {
                                checkDialog();
                            }
                        }
                    });
                }
            } else {
                if (isMenuClick) {
                    //no new version
                    dialog.showMessageBox({
                        title: i18n.__('dialog.checkVersion'),
                        message: i18n.__('dialog.isNewVersion'),
                        detail: i18n.__('dialog.currentVersion') + `: ${PACKAGE.version}`,
                        buttons: [i18n.__('dialog.ok')]
                    }, function (index) {})
                }
            }
        }
    });

    function checkDialog() {
        const options = {
            type: 'info',
            title: i18n.__('dialog.needUpdate'),
            message: i18n.__('dialog.needUpdateText'),
            detail: desc,
            buttons: [i18n.__('dialog.nowToUpdate'), i18n.__('dialog.no'), '取消']
        };
        dialog.showMessageBox(options, function (index) {
            if (index === 0) {
                shell.openExternal(downloadUrl)
            } else if (index === 1) {
                storage.set('ignoreVersion', {
                    version: version
                }, function (err, data) {});
            }
        })
    }
}

module.exports = checkVersion;