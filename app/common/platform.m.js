let type;
if (process.platform === 'darwin') {
    type = 'mac';
} else if (process.platform === 'win32') {
    type = 'windows';
} else {
    type = 'mac';
}

module.exports = {
    type: type,
    isMac: process.platform === 'darwin',
    isWin: process.platform === 'win32',
}