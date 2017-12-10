// 因为变量，需要在 Main Process 中声明，Renderer Process 中才能正常使用
module.exports = {
    preferences: {
        defaultLoadUrlEnable: false,
        defaultLoadUrl: '',
        latestUrl: '',
        locale: '',
        hotkey: {
            app: '',
            screenCapture: ''
        }
    },
    operational: {
        isNeedRestart: false,
        disableGlobalShortcut: false,
    }
};