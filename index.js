const fs = require('fs'),
    http = require('http'),
    https = require('https'),
    URL = require('url').URL,
    ytdl = require('ytdl-core');

const database = {
    data: {},
    save: () =>
        fs.writeFileSync(
            'database.json',
            JSON.stringify(database.data, null, '    '),
            'utf-8'
        )
}
try {
    database.data = JSON.parse(fs.readFileSync('database.json', 'utf-8'));
} catch (err) {
    console.log('Cannot read database, asssume empty')
}

http.createServer((req, res) => {
    let data = '';
    req.on('data', c => data += c);

    req.on('end', () => {
        let url = new URL(req.url, `http://${req.headers.host}`);

        // static client files
        if (
            url.pathname == '/'
            || url.pathname.startsWith('/client')
        ) {
            res.write(fs.readFileSync('.' + url.pathname, 'utf-8'));
            return res.end();
        }

        let id = url.pathname.slice(1); // slice the slash

        if (!ytdl.validateID(id)) {
            res.writeHead(404, 'URL not found');
            res.write('URL not found');
            return res.end();
        }

        if (database.data[id]) {
            // if id exists in database, parse expire
            let vid = new URL(database.data[id])
            console.log(vid.searchParams.get('expire'));
            if (vid.searchParams.get('expire') > new Date() / 1000) {
                res.writeHead(302, {
                    'Location': database.data[id]
                })
                return res.end()
            }
        }

        return

        ytdl.getInfo(`https://youtube.com/watch?v=${id}`).then(info => {
            console.log(info.videoDetails.title)
            let urls = []
            info.formats.forEach(vid => {
                if (
                    vid.hasAudio && vid.hasVideo
                    && vid.container == 'mp4'
                )
                    urls.push(vid.url)
            });
            urls.forEach(value => res.write(value + '\n\n'));
            res.end();

            database.data[id] = urls[0];
            database.save();
        })
    })
}).listen(8080);