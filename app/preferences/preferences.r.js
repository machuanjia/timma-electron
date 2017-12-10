const {
    ipcRenderer,
    shell,
    remote
} = require('electron');
const _ = require('lodash');
const i18n = require('../i18n');
const storage = require('electron-json-storage');
const config = require('../common/config');
const unit = require('../shared/unit');
const common = require('../common/common');

i18n.setLocale(remote.app.preferences.locale);

let navMap = {
    locale: 'locale',
    private: 'private',
    hotkey: 'hotkey'
};
let navList = [
    // {id: navMap.locale, name: i18n.__('preferences.locale'), desc: i18n.__('preferences.localeDesc')},
    {
        id: navMap.private,
        name: i18n.__('preferences.private'),
        desc: i18n.__('preferences.privateDesc')
    },
    {
        id: navMap.hotkey,
        name: i18n.__('preferences.hotkey'),
        desc: i18n.__('preferences.hotkeyDesc')
    },
];

window.onload = function () {
    new Vue({
        el: '.vue-app',
        data: {
            searchText: '',
            navMap: navMap,
            navList: navList,
            i18n: i18n,
            navData: {
                private: {
                    enable: remote.app.preferences.defaultLoadUrlEnable,
                    url: remote.app.preferences.defaultLoadUrl
                },
                hotkey: {
                    app: common.mHotkey.getApp(),
                    screenCapture: common.mHotkey.getScreenCapture()
                }
            },
            hotkeyPlaceholder: {
                text: 'Type shortcut',
                key: '',
                value: ''
            },
            isNeedRestart: remote.app.operational.isNeedRestart
        },
        methods: {
            hotkeyTypeShortcutBegin: function (key) {
                this.hotkeyPlaceholder.key = key;
                this.hotkeyPlaceholder.value = this.navData.hotkey[key];

                this.navData.hotkey[key] = this.hotkeyPlaceholder.text;
            },
            hotkeyTypeShortcutDone: function () {
                this.navData.hotkey[this.hotkeyPlaceholder.key] = this.hotkeyPlaceholder.value;
            },
            hotkeyReset: function () {
                var _hotkey = _.cloneDeep(config.hotkey);
                _.map(_hotkey, (value, key) => {
                    this.navData.hotkey[key] = value;
                });
                remote.app.preferences.hotkey = _hotkey;

                this.setNeedRestart();
            },
            inputShortcut: function (e, key) {
                let shortcutString = getTypeShortcutString(e, () => {
                    this.hotkeyTypeShortcutDone();
                });
                if (shortcutString) {
                    this.navData.hotkey[key] = shortcutString;
                    this.hotkeyPlaceholder.value = shortcutString;

                    this.setNeedRestart();

                    remote.app.preferences.hotkey[key] = shortcutString;
                }
            },
            saveLatestEnable: function () {
                remote.app.preferences.defaultLoadUrlEnable = this.navData.private.enable;

                this.setNeedRestart();
            },
            saveLatestUrl: function () {
                remote.app.preferences.defaultLoadUrl = this.navData.private.url;
            },
            setNeedRestart: function () {
                this.isNeedRestart = true;

                remote.app.operational.isNeedRestart = true;
            },
            restartApp: function () {
                remote.app.relaunch();
                remote.app.quit();
            }
        },
        computed: {}
    });
};

function pageUE() {
    var lastItem = document.querySelectorAll('.main-side .section-item:last-child')[0];
    lastItem.style.paddingBottom = (window.innerHeight - lastItem.clientHeight - 20) + 'px';
}

function getTypeShortcutString(e, callback) {
    if (e.key == 'Escape') {
        callback && callback();
        return;
    }

    let comb = [];
    if (e.metaKey) {
        comb.push('Command');
    }
    if (e.ctrlKey) {
        comb.push('Ctrl');
    }
    if (e.shiftKey) {
        comb.push('Shift');
    }
    if ((48 <= e.keyCode && e.keyCode <= 47) ||
        (65 <= e.keyCode && e.keyCode <= 90)) {
        comb.push(e.key.toLocaleUpperCase());
    }
    let combValue = comb.join('+');
    if (combValue.replace(/Command|Ctrl|Shift|\+/g, '').length > 0) {
        if ([
                'Ctrl+Command+F',
                'Command+Q',
                'Ctrl+C',
                'Command+C',
                'Ctrl+V',
                'Command+V',
                'Ctrl+A',
                'Command+A',
            ].indexOf(combValue) == -1) {
            return combValue;
        }
    }
}