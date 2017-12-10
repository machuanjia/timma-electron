/*global process,__dirname*/
const electron = require('electron');
const {
    Tray,
    Menu,
    ipcMain,
    app,
    shell,
    dialog
} = require('electron');
const path = require('path');
const storage = require('electron-json-storage');
const i18n = require('./../i18n/index');
const unit = require('./../shared/unit');
const config = require('./config');
const pkg = require('../../package.json');
const checkVersionDialog = require('./check.version.m');
const systemInfoDialog = require('./system.info.m');
const downloadWindow = require('./../download/main');
const preferencesWindow = require('./../preferences/preferences.m');

var createMenu = function () {
    const name = pkg.productName;
    const template = [{
            id: 'about',
            label: name,
            submenu: [{
                label: i18n.__('menu.update'),
                click: function () {
                    checkVersionDialog(true);
                }
            }, {
                type: 'separator'
            }, {
                id: 'preferences',
                label: i18n.__('menu.preferences'),
                accelerator: 'CmdOrCtrl+,',
                click: function () {
                    preferencesWindow.open();
                }
            }, {
                label: i18n.__('menu.quit'),
                accelerator: 'Command+Q',
                click: function () {
                    app.quit();
                }
            }]
        },
        {
            id: 'edit',
            label: i18n.__('menu.edit'),
            submenu: [{
                label: i18n.__('menu.undo'),
                accelerator: 'CmdOrCtrl+Z',
                role: 'undo'
            }, {
                label: i18n.__('menu.redo'),
                accelerator: 'CmdOrCtrl+Shift+Z',
                role: 'redo'
            }, {
                type: 'separator'
            }, {
                label: i18n.__('menu.cut'),
                accelerator: 'CmdOrCtrl+X',
                role: 'cut'
            }, {
                label: i18n.__('menu.copy'),
                accelerator: 'CmdOrCtrl+C',
                role: 'copy'
            }, {
                label: i18n.__('menu.paste'),
                accelerator: 'CmdOrCtrl+V',
                role: 'paste'
            }, {
                label: i18n.__('menu.selectAll'),
                accelerator: 'CmdOrCtrl+A',
                role: 'selectall'
            }]
        },
        {
            id: 'view',
            label: i18n.__('menu.view'),
            submenu: [{
                    label: i18n.__('menu.reload'),
                    accelerator: 'CmdOrCtrl+R',
                    click: function (item, focusedWindow) {
                        if (focusedWindow) {
                            focusedWindow.reload();
                        }
                    }
                },
                {
                    type: 'separator'
                },
                {
                    label: i18n.__('menu.toggleFullScreen'),
                    accelerator: (function () {
                        if (process.platform === 'darwin')
                            return 'Ctrl+Command+F';
                        else
                            return 'F11';
                    })(),
                    click: function (item, focusedWindow) {
                        if (focusedWindow) {
                            focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
                        }
                    }
                },
                {
                    type: 'separator'
                },
                {
                    label: i18n.__('menu.toggleDeveloperTools'),
                    accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
                    click: function (item, focusedWindow) {
                        if (focusedWindow)
                            focusedWindow.toggleDevTools();
                    }
                },
                {
                    type: 'separator'
                },
                {
                    label: i18n.__('menu.resetzoom'),
                    role: 'resetzoom'
                },
                {
                    label: i18n.__('menu.zoomin'),
                    accelerator: process.platform === 'darwin' ? 'Command+Plus' : 'Control+=',
                    role: 'zoomin'
                },
                {
                    label: i18n.__('menu.zoomout'),
                    role: 'zoomout'
                }
            ]
        },
        {
            label: i18n.__('menu.history'),
            submenu: [{
                    label: i18n.__('menu.back'),
                    accelerator: process.platform === 'darwin' ? 'Command+[' : 'Alt+Left',
                    click: function (item, focusedWindow) {
                        if (focusedWindow) {
                            focusedWindow.webContents.goBack();
                        }
                    }
                },
                {
                    label: i18n.__('menu.forward'),
                    accelerator: process.platform === 'darwin' ? 'Command+]' : 'Alt+Right',
                    click: function (item, focusedWindow) {
                        if (focusedWindow) {
                            focusedWindow.webContents.goForward();
                        }
                    }
                }
            ]
        },
        {
            id: 'tools',
            label: i18n.__('menu.tools'),
            submenu: [{
                    label: i18n.__('menu.screenCapture'),
                    accelerator: (function () {
                        if (process.platform === 'darwin') {
                            return 'Command+Ctrl+A';
                        } else {
                            return 'Ctrl+Alt+A';
                        }
                    })(),
                    click: function () {
                        let _screenCapture = unit.getWindow(unit.winMap.screenCapture);
                        _screenCapture && _screenCapture.webContents.send('desktop-capturer');
                    }
                },
                {
                    label: i18n.__('menu.downloadManage'),
                    accelerator: (function () {
                        if (process.platform === 'darwin')
                            return 'Alt+Command+J';
                        else
                            return 'Ctrl+Shift+J';
                    })(),
                    click: function () {
                        downloadWindow.open();
                    }
                }
            ]
        },
        {
            id: 'window',
            label: i18n.__('menu.window'),
            role: 'window',
            submenu: [{
                    label: i18n.__('menu.minimize'),
                    accelerator: 'CmdOrCtrl+M',
                    role: 'minimize'
                },
                {
                    label: i18n.__('menu.close'),
                    accelerator: 'CmdOrCtrl+W',
                    role: 'close',
                    id: 'mini'
                },
                {
                    type: 'separator'
                },
                {
                    id: 'sign-in',
                    label: i18n.__('menu.signin'),
                    click: function (item, focusedWindow) {
                        if (focusedWindow) {
                            focusedWindow.loadURL(config.defaultSignInURL);
                            app.preferences.latestUrl = config.defaultSignInURL;
                        }

                    }
                }
            ]
        },
        {
            id: 'help',
            label: i18n.__('menu.help'),
            role: 'help',
            submenu: [{
                    label: i18n.__('menu.bugHelper'),
                    click: function () {
                        systemInfoDialog().then((value) => {
                            dialog.showMessageBox({
                                type: 'info',
                                title: i18n.__('menu.bugHelper'),
                                message: i18n.__('menu.systemInfo'),
                                detail: app.getPath('userData') + '\n' + JSON.stringify(value, null, 4),
                                buttons: [i18n.__('menu.ok')]
                            })
                        });
                    }
                },
                {
                    label: i18n.__('menu.huatuo'),
                    click: function () {
                        shell.openExternal(config.huatuoURL)
                    }
                },
                {
                    label: i18n.__('menu.helper'),
                    click: function () {
                        shell.openExternal(config.helpURL)
                    }
                }
            ]
        }
    ];

    if (unit.isMac) {

        template[0].submenu.unshift({
            label: i18n.__('menu.about') + ' ' + name,
            role: 'about'
        });
        template[0].submenu.push({
            type: 'separator',
            position: 'after=preferences'
        }, {
            label: i18n.__('menu.services'),
            role: 'services',
            submenu: []
        }, {
            type: 'separator'
        }, {
            label: i18n.__('menu.hide') + ' ' + name,
            accelerator: 'Command+H',
            role: 'hide'
        }, {
            label: i18n.__('menu.hideOthers'),
            accelerator: 'Command+Shift+H',
            role: 'hideothers'
        }, {
            label: i18n.__('menu.showAll'),
            role: 'unhide'
        });

        const windowMenu = template.find(function (m) {
            return m.role === 'window'
        });
        if (windowMenu) {
            windowMenu.submenu.push({
                type: 'separator',
                position: 'after=mini'
            }, {
                label: i18n.__('menu.bringAllToFront'),
                role: 'front'
            });
        }
    } else if (unit.isWin) {

    }

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};

module.exports = function () {
    createMenu();
};