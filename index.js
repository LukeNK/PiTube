const fs = require('fs'),
    http = require('http'),
    URL = require('url').URL,
    ytdl = require('ytdl-core');

let database = {
    save: () => {
        fs.writeFileSync(
            'database.json',
            JSON.stringify(
                database,
                (key, value) => {
                    if (key == 'save') return undefined;
                    else return value;
                },
                '    '
            ),
            'utf-8'
        )
    }
}
try {
    database = {
        ...database,
        ...JSON.parse(fs.readFileSync('database.json', 'utf-8'))
    };
} catch (err) {
    console.error(err)
    console.log('Cannot read database, asssume empty')
}

/**
 * Redirect the response to the loc
 * @param {http.ServerResponse} res Server respond
 * @param {String} loc Location to redirect
 */
function redirect(res, loc) {
    res.writeHead(302, {
        'Location': loc
    });
    res.end()
}

/**
 * Check if the URL is expired
 * @param {String} url URL to check
 * @returns {Boolean} True if the link is still valid
 */
function expireCheck(url) {
    url = new URL(url)
    if (url.searchParams.get('expire') > new Date() / 1000)
        return true
    return false
}

http.createServer((req, res) => {
    let data = '';
    req.on('data', c => data += c);

    req.on('end', () => {
        let url = new URL(req.url, `http://${req.headers.host}`);

        if (url.pathname == '/')
            return redirect(res, '/client/index.html'); // home page
        else if (url.pathname == '/database') {
            res.write(JSON.stringify(
                database,
                (key, value) => {
                    if (key == 'save') return undefined;
                    else return value;
                }
            ));
            return res.end();
        } else if (url.pathname.startsWith('/client')) {
            // static client files
            res.write(fs.readFileSync('.' + url.pathname, 'utf-8'));
            return res.end();
        } else if (url.pathname.startsWith('/watch'))
            // video param, use for simple replace Youtube links
            url = new URL('/' + url.searchParams.get('v'), `http://${req.headers.host}`);
        else if (url.pathname.startsWith('/expire/')) {
            let id = url.pathname.split('/')[2];
            console.log('[Expire] ' + id)
            database[id] = undefined;
            database.save();
            return res.end();
        }

        // id handling
        let id = url.pathname.slice(1); // slice the slash

        // validate id
        if (!ytdl.validateID(id)) {
            res.writeHead(404, 'URL not found');
            res.write('URL not found');
            return res.end();
        }

        // if id exists in database, parse expire
        if (database[id] && expireCheck(database[id].url))
            return redirect(res, `/client/index.html#` + id);

        // get download link
        console.log('[Download] ' + id);
        ytdl.getInfo(`https://youtube.com/watch?v=${id}`).then(info => {
            database[id] = {
                title: info.videoDetails.title,
                description: info.videoDetails.description,
                author: info.videoDetails.author.name,
                length: info.videoDetails.lengthSeconds,
                thumbnail_url: info.videoDetails.thumbnails[0].url,
            }

            info.formats.forEach(vid => {
                if (
                    vid.hasAudio && vid.hasVideo
                    && vid.container == 'mp4'
                    && !database[id].url // empty
                )
                    database[id].url = vid.url;
                if (
                    vid.hasAudio && !vid.hasVideo
                    && vid.container == 'mp4' // added to support my old phone
                    && !database[id].aUrl
                )
                    database[id].aUrl = vid.url;
            });

            redirect(res, `/client/index.html#` + id);
            database.save();
        });
    })
}).listen(8080);