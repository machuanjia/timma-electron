const {
    ipcRenderer,
    nativeImage,
    desktopCapturer,
    clipboard
} = require('electron');

ipcRenderer.on('desktop-capturer', function (e, data) {
    desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: {
            width: window.screen.width,
            height: window.screen.height
        }
    }, (error, sources) => {
        if (error) throw error

        clipboard.writeImage(sources[0].thumbnail);
    });

    function handleStream(stream) {
        let video = document.createElement('video');
        video.src = URL.createObjectURL(stream);


        var captureImage = function () {
            var canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

            var img = document.createElement("img");
            img.src = canvas.toDataURL("image/png");


            video = null;
            canvas = null;


            let _nativeImage = nativeImage.createFromBuffer(new Buffer(img.src.replace(/^data:image\/\w+;base64,/, ""), 'base64'))

            clipboard.writeImage(_nativeImage);

            img = null;
        };

        video.addEventListener('loadeddata', captureImage);


    }

    function handleError(e) {

    }
});