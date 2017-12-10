//处理windows 应用安装以及更新时刻的默认事件  
if (require('electron-squirrel-startup')) return;

const {
    app,
    ipcMain,
    BrowserWindow,
    Menu,
    shell,
    Tray,
    globalShortcut
} = require('electron');
const path = require('path');
const storage = require('electron-json-storage');
const cp = require('child_process');
const _ = require('lodash');
const windowStateKeeper = require('electron-window-state');
const fs = require('fs');
const PKG = require('../../package.json');
const i18n = require('../i18n');
const CONFIG = require('../common/config');
const unit = require('../shared/unit');
const screenCapture = require('../screen.capture/screen.capture.m');
const common = require('../common/common');
const variables = require('../common/variables');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let willQuitApp = false;
// 运行时全局变量
app.operational = variables.operational;

global.tray = {};
global.mainWindowSize = [];
global.mainWindowPosition = [];
global.downloadFileList = [];


function init() {
    unit.storage.getPreferences(function (error) {
        if (process.env.NODE_ENV === 'dev') {
            setTimeout(function () {
                createWindow();
            }, 3000);
        } else {
            createWindow();
        }
    });
}

function createWindow() {
    let mainWindowState = windowStateKeeper({
        defaultWidth: 1000,
        defaultHeight: 800
    });

    mainWindow = new BrowserWindow({
        title: PKG.title,
        fullscreenable: true,
        x: mainWindowState.x < 0 ? 0 : mainWindowState.x,
        y: mainWindowState.y < 0 ? 0 : mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
        webPreferences: {
            nodeIntegration: false,
            plugins: true,
            preload: __dirname + '/main.r.js',
            allowDisplayingInsecureContent: true,
            scrollBounce: false
        }
    });
    mainWindowState.manage(mainWindow);

    unit.winMap.main = mainWindow.id;

    mainWindow.once('ready-to-show', () => {
        if (mainWindow && mainWindow.show) {
            mainWindow.show();
        }
    });

    mainWindow.on('close', function (e) {
        if (willQuitApp) {
            mainWindow = null;
        } else {
            e.preventDefault();
            if (mainWindow.isFullScreen()) {
                mainWindow.setFullScreen(false);
                setTimeout(function () {
                    mainWindow.hide();
                }, 1000);
            } else {
                mainWindow.hide();
            }
        }


    });

    mainWindow.on('closed', function () {
        unit.storage.savePreferences(function (error) {
            mainWindow = null;
            app.quit();
        });
    });

    //region Load URL
    if (process.env.NODE_ENV === 'local') {
        mainWindow.loadURL(`https://machuanjia.github.io/`);
        mainWindow.webContents.openDevTools();
    } else {
        // i18n
        if (!app.preferences.locale) {
            app.preferences.locale = app.getLocale() || 'zh-CN';
        }
        i18n.setLocale(app.preferences.locale);

        // load url
        let _url;
        if (app.preferences.defaultLoadUrlEnable) {
            _url = app.preferences.defaultLoadUrl;
        } else {
            _url = app.preferences.latestUrl;
        }
        if (!unit.checkUrl(_url)) {
            _url = 'http://' + _url;
        }
        if (!unit.checkUrl(_url)) {
            _url = CONFIG.defaultLoadURL;
        }
        mainWindow.loadURL(_url + '');

        // menu
        common.mMenu();

        // check version
        common.mCheckVersion();
    }
    //endregion

    //region tray
    if (unit.isMac) {
        global.tray = new Tray(path.join(__dirname, '../resources/tray-icon-mac.png'));
    } else if (unit.isWin) {
        global.tray = new Tray(path.join(__dirname, '../resources/tray-icon-windows.png'));
        const contextMenu = Menu.buildFromTemplate([{
            label: i18n.__('menu.quit'),
            click: function () {
                app.quit();
            }
        }]);
        global.tray.setToolTip('Worktile');
        global.tray.setContextMenu(contextMenu);
    }
    global.tray.on('click', () => {
        if (!mainWindow) {
            return;
        }

        mainWindow.show && mainWindow.show();

        if (unit.isWin) {
            mainWindow.focus && mainWindow.focus();
            global.isTrayFlicker = false;
        }

    });
    //endregion

    //region download manage
    storage.get('downloadList', (e, res) => {
        if (res && !_.isEmpty(res.data)) {
            global.downloadFileList = res.data;
        }
    });

    mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
        let file = {
            id: unit.createID('download-file'),
            name: item.getFilename(),
            totalSize: item.getTotalBytes(),
            url: item.getURL(),
            savePath: item.getSavePath(),
            state: '',
            createdAt: new Date().getTime()
        };
        global.downloadFileList.push(file);

        item.on('updated', (event, state) => {
            if (state === 'interrupted') {

            } else if (state === 'progressing') {
                if (item.isPaused()) {

                } else {
                    file.savePath = item.getSavePath();
                    file.receivedSize = item.getReceivedBytes();

                    var downloadWindow = unit.getWindow(unit.winMap.download);
                    downloadWindow && downloadWindow.webContents.send('download-file-update', file);
                    updateFile(file);
                }
            }
        });
        item.once('done', (event, state) => {
            file.state = state;
            file.isDone = true;

            if (file.savePath.slice(file.savePath.lastIndexOf('/') + 1).indexOf('.') == -1) {
                let _newPath = file.savePath + file.name.slice(file.name.lastIndexOf('.'));
                fs.rename(file.savePath, _newPath, function (err) {
                    file.savePath = _newPath;
                    next();
                })
            } else {
                next();
            }

            function next() {
                webContents.send('download-desktop-notification', file)

                var downloadWindow = unit.getWindow(unit.winMap.download);
                downloadWindow && downloadWindow.webContents.send('download-file-update', file);
                updateFile(file);
            }
        });
    });

    //endregion

    //region globalShortcut

    let ret = globalShortcut.register(common.mHotkey.getApp(), function () {
        if (app.operational.disableGlobalShortcut) {
            return;
        }

        if (!mainWindow) {
            return;
        }

        if (mainWindow.isVisible()) {
            mainWindow.hide();

        } else {
            mainWindow.show && mainWindow.show();
            if (unit.isWin) {
                mainWindow.focus && mainWindow.focus();
                global.isTrayFlicker = false;
            }
        }
    });

    if (!ret) {
        console.log('registration failed')
    }

    //endregion


    screenCapture.init();
}

function updateFile(file) {
    let index = _.findIndex(global.downloadFileList, {
        id: file.id
    });
    if (index == -1) {
        global.downloadFileList.unshift(file);
    } else {
        global.downloadFileList.splice(index, 1, file)
    }
    storage.set('downloadList', {
        data: global.downloadFileList
    }, () => {});
}

app.on('ready', init);

// 在应用程序开始关闭它的窗口的时候被触发
app.on('before-quit', function () {
    willQuitApp = true;
});

// 当所有的窗口已经被关闭，应用即将退出时被触发
app.on('will-quit', function () {
    globalShortcut.unregisterAll();
});

// 当应用被激活时触发
app.on('activate', function () {
    if (!mainWindow) {
        if (app.isReady()) {
            createWindow();
        }
    } else if (mainWindow && mainWindow.show) {
        mainWindow.show();
    }
});

//endregion

//region ipc
ipcMain.on('latest-href-change', function (sender, href) {
    if (process.env.NODE_ENV !== 'local') {
        if (!app.preferences.defaultLoadUrlEnable) {
            app.preferences.latestUrl = href;
        }
    }
});

ipcMain.on('close-main-window', function (e) {
    if (willQuitApp) {
        mainWindow = null;
    } else {
        e.preventDefault();
        mainWindow.hide();
    }
});

ipcMain.on('clean-download-list', () => {
    global.downloadFileList.length = 0;
});

ipcMain.on('set-badge', function (sender, text) {
    if (process.platform === "darwin") {
        app.dock.setBadge("" + text);
    }
});

ipcMain.on('set-tray', function (sender, text) {
    if (unit.isMac) {
        //mac
        global.tray.setTitle('' + text);

    } else if (unit.isWin) {
        //windows
        if (!global.isTrayFlicker) {
            global.isTrayFlicker = true;
            var isShow = true;
            var interval = setInterval(function () {
                isShow = !isShow;
                if (isShow) {
                    global.tray.setImage(path.join(__dirname, '../resources/tray-icon-windows-empty.png'));
                } else {
                    global.tray.setImage(path.join(__dirname, '../resources/tray-icon-windows.png'));
                }

                //end
                if (global.isTrayFlicker == false) {
                    clearInterval(interval);
                    global.tray.setImage(path.join(__dirname, '../resources/tray-icon-windows.png'));
                }
            }, 400)
        }

        if (text == '') {
            global.isTrayFlicker = false;
        } else {
            // taskbar lighter
            mainWindow.flashFrame(true);
        }

    }
});
//endregion

// //region 安装、卸载
// let handleSquirrelEvent = function () {
//     if (process.platform != 'win32') {
//         return false;
//     }

//     function executeSquirrelCommand(args, done) {
//         let updateDotExe = path.resolve(path.dirname(process.execPath), '..', 'update.exe');
//         let child = cp.spawn(updateDotExe, args, {
//             detached: true
//         });
//         child.on('close', function (code) {
//             done();
//         });
//     }

//     function install(done) {
//         let target = path.basename(process.execPath);
//         executeSquirrelCommand(["--createShortcut", target], done);
//     }

//     function uninstall(done) {
//         let target = path.basename(process.execPath);
//         executeSquirrelCommand(["--removeShortcut", target], done);
//     }

//     let squirrelEvent = process.argv[1];
//     switch (squirrelEvent) {
//         case '--squirrel-install':
//             install(app.quit);
//             return true;
//         case '--squirrel-updated':
//             install(app.quit);
//             return true;
//         case '--squirrel-obsolete':
//             app.quit();
//             return true;
//         case '--squirrel-uninstall':
//             uninstall(app.quit);
//             return true;
//     }
//     return false;
// };

// if (handleSquirrelEvent()) {
//     return;
// }
// //endregion