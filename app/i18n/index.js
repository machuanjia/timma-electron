/*global __dirname*/
const i18n = require('i18n');
const path = require('path');
const _ = require('lodash');

i18n.configure({
    locales       : ['en-us', 'zh-cn', 'zh-tw', 'ja-jp'],
    directory     : path.resolve(__dirname, './locales'),
    defaultLocale : 'zh-cn',
    objectNotation: true
});

module.exports = {
    __       : i18n.__.bind(i18n),
    setLocale: function (locale) {
        if (locale) {
            i18n.setLocale(locale.toLocaleLowerCase());
        }
    },
    getLocale: function () {
        return i18n.getLocale();
    }
};