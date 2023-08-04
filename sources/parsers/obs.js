var fs = require('fs')
var readline = require('readline')

var ObsFile = function(path, callback) {
    var lrh //lastReadingHeader
    const rl = readline.createInterface({
        input: fs.createReadStream(path)
    });
    rl.on('line', function(line) {
        if (line.includes("TIME OF FIRST OBS")) {
            var arr = line.trim().split(/\s+/)
            this.startTime = new Date(arr[0], arr[1], arr[2], arr[3], arr[4], arr[5])
        }
        if (this.startTime) {
            var ln = line.trim().split(/\s+/)
            if (ln[0] == this.startTime.getFullYear() % 100 || line[0] == this.startTime.getFullYear() % 100 + 1) {
                lrh = ln
            }
        }
    });
    rl.on('close', function(line) {
        this.endTime = new Date(parseInt(lrh[0]) + 2000, lrh[1], lrh[2], lrh[3], parseInt(lrh[4]) + 1)
        callback(this)
    })

}

module.exports = ObsFile
