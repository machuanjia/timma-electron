const {
    ipcRenderer,
    shell,
    remote
} = require('electron');
const _ = require('lodash');
const storage = require('electron-json-storage');
const i18n = require('../i18n');
const unit = require('../shared/unit');
const moment = require('moment');

i18n.setLocale(remote.app.preferences.locale);

var list = [];

window.onload = function () {
    var _dateToMoment = function (date) {
        if (_.isString(date)) {
            date = parseFloat(date)
        } else if (_.isObject(date) && date.constructor == Date) {
            return moment(date)
        }
        if (_.isNumber(date)) {
            return moment(date >= 1000000000000 ? date : date * 1000);
        }
        return date;
    };
    Vue.filter('sizeDisplay', function (size) {
        let sizeMap = [
            'Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'
        ];
        let res, f, nospace, one;

        sizeMap.forEach(function (f, id) {
            if (one) {
                f = f.slice(0, 1);
            }
            let s = Math.pow(1024, id),
                fixed;
            if (size >= s) {
                fixed = String((size / s).toFixed(1));
                if (fixed.indexOf('.0') === fixed.length - 2) {
                    fixed = fixed.slice(0, -2);
                }
                res = fixed + (nospace ? '' : ' ') + f;
            }
        });
        if (!res) {
            f = (one ? sizeMap[0].slice(0, 1) : sizeMap[0]);
            res = '0' + (nospace ? '' : ' ') + f;
        }

        return res;
    });
    Vue.filter('dtAutoFullFormat', function (date) {
        if (date === undefined || date === null) {
            return;
        }
        var hasTime = true;
        var referDate;
        date = _dateToMoment(date);
        var _referDate = referDate ? _dateToMoment(referDate) : moment();
        if (!date._isAMomentObject || !_referDate._isAMomentObject) {
            throw Error("date is not moment object" + date);
        }

        var format = "";
        if (_referDate.isSame(date, "year")) {
            if (referDate && _referDate.isSame(date, 'month')) {
                format = "";
            } else {
                format = "MMM";
            }
            format += moment.locale() === 'en' ? " DD" : "Do";
            format += hasTime ? ' HH:mm' : "";
            return date.format(format);
        } else {
            return hasTime ? date.format('ll HH:mm') : date.format('ll')
        }
    });

    storage.get('downloadList', (e, res) => {
        if (res && !_.isEmpty(res.data)) {
            list = res.data;
        }
        new Vue({
            el: '.vue-app',
            data: {
                list: list,
                i18n: i18n,
                backgroundStyle: (file) => {
                    let pers = Math.floor(file.receivedSize / file.totalSize * 100);
                    if (pers === 100) {
                        return '';
                    } else {
                        return `linear-gradient(90deg, #69d0d1 ${pers - 0.1}%, transparent ${pers}%)`
                    }
                }
            },
            methods: {
                openFolder: function (file) {
                    shell.showItemInFolder(file.savePath);
                },
                deleteItem: function (file) {
                    list.splice(_.findIndex(list, {
                        id: file.id
                    }), 1);
                    saveDownloadList();
                },
                cleanAllFile: function () {
                    list.splice(0);
                    saveDownloadList();

                    let mainWin = unit.getWindow(unit.winMap.download);
                    mainWin && mainWin.webContents.send('clean-download-list');
                }
            },
            computed: {
                orderedList: function () {
                    return list.sort(function (a, b) {
                        return a.createdAt < b.createdAt;
                    })
                }
            }
        });
    });
};

//region file update
ipcRenderer.on('download-file-update', function (e, file) {
    updateFile(file);
});

function updateFile(file) {
    let index = _.findIndex(list, {
        id: file.id
    });
    if (index == -1) {
        list.unshift(file);
    } else {
        list.splice(index, 1, file)
    }
}

function saveDownloadList() {
    storage.set('downloadList', {
        data: list
    }, () => {});
}
//endregion