// 神策

class Analytics {
    init() {
        if (window.sa) {
            window.sa.track('wt_pro_client_visit', {
                type: process.platform,
                version: PKG.version
            });
        }
    }
}

module.exports = new Analytics();