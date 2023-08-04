var fs = require('fs')
var readline = require('readline')

var NavFile = function(path, callback) {
    var f //first reading
    var l //last reading
    const rl = readline.createInterface({
        input: fs.createReadStream(path)
    });
    rl.on('line', function(line) {
        line = line.trim().split(/\s+/)
        if (line.length > 4) {
            if (line[1].length == 2 && line[2].length == 2 && line[3].length == 2) {
                if (!f) {
                    f = line
                }
                l = line
            }
        }


    });
    rl.on('close', function(line) {
        this.startTime = new Date(parseInt(f[1]) + 2000, f[2], f[3], f[4], f[5])
        this.endTime = new Date(parseInt(l[1]) + 2000, l[2], l[3], l[4], l[5])
        callback(this)
    })

}

module.exports = NavFile
