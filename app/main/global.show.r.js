const {
    ipcRenderer,
    remote,
    nativeImage,
    shell
} = require('electron');

// 获取消息未读数
class GlobalShow {
    init() {
        var intervalGlobalShowCounter = 0;
        var intervalGlobalShow = setInterval(function () {
            getGlobalShow(function () {
                console.log(intervalGlobalShowCounter);
                clearInterval(intervalGlobalShow);
            });
            intervalGlobalShowCounter++;
            if (intervalGlobalShowCounter > 10) {
                clearInterval(intervalGlobalShow);
            }
        }, 1000);

        function getGlobalShow(callback) {
            if (window.angular) {
                if (window.angular.element(document).scope) {
                    var scope = window.angular.element(document).scope();
                    if (scope) {
                        setBadge(scope.global && scope.global.show);
                        setTray(scope.global && scope.global.show);

                        scope.$watch('global.show', function (newValue) {
                            setBadge(newValue || '');
                            setTray(newValue || '');
                        });
                        callback && callback();
                    }
                }
            }
        }
    }
}

function setBadge(text) {
    if (process.platform === "darwin") {
        ipcRenderer.send('set-badge', text || '');
        //app.dock.setBadge("" + text);
    } else if (process.platform === "win32") {
        var win = remote.getCurrentWindow();

        if (text === "") {
            win.setOverlayIcon(null, "");
            return;
        }
        return;
        // Create badge
        var canvas = document.createElement("canvas");
        canvas.height = 140;
        canvas.width = 140;
        var ctx = canvas.getContext("2d");
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.ellipse(70, 70, 70, 70, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.textAlign = "center";
        ctx.fillStyle = "white";

        if (text.length > 2) {
            ctx.font = "75px sans-serif";
            ctx.fillText("" + text, 70, 98);
        } else if (text.length > 1) {
            ctx.font = "100px sans-serif";
            ctx.fillText("" + text, 70, 105);
        } else {
            ctx.font = "125px sans-serif";
            ctx.fillText("" + text, 70, 112);
        }

        var badgeDataURL = canvas.toDataURL();
        var img = nativeImage.createFromDataURL(badgeDataURL);
        win.setOverlayIcon(img, text);
    }
}

function setTray(text) {
    ipcRenderer.send('set-tray', text || '');
}

module.exports = new GlobalShow();