let database = {}; // database
document.id = document.getElementById;

const playerAud = document.getElementById('playerAud'),
    playerVid = document.getElementById('playerVid');

// check url expiration date
function expireCheck(url) {
    url = new URL(url)
    if (url.searchParams.get('expire') > new Date() / 1000)
        return true
    return false
}

// mode
let playerMode = 'm', playingId = ''
function toggleMode(btn) {

    let fromE, toE; // from and to element
    if (playerMode == 'm') {
        // switch to audio
        fromE = playerVid;
        toE = playerAud;
        // if src is wrong, then change the src
        if (toE.src != database[playingId].aUrl)
            toE.src = database[playingId].aUrl;

        playerMode = 'a';
        btn.innerText = 'Mode: audio';
    } else if (playerMode == 'a') {
        // switch to mix video mode
        fromE = playerAud;
        toE = playerVid;
        if (toE.src != database[playingId].url)
            toE.src = database[playingId].url;

        playerMode = 'm';
        btn.innerText = 'Mode: mix';
    }

    fromE.style.display = 'none';
    toE.style.display = 'block';

    // play time
    fromE.pause();
    toE.currentTime = fromE.currentTime;
    toE.play();

}

/**
 * Adjust display
 * @param {Element} elm Button element
 */
function toggleTab(elm) {
    ['browse', 'controls', 'info'].forEach(val => {
        if (elm.innerText.toLowerCase() == val)
            document.id(val).style.display = '';
        else
            document.id(val).style.display = 'none';
    })
}
toggleTab({ innerText: 'browse' }); // init

/**
 * Control players
 * @param {Element|String} elm Element that invoked the function
 */
function playerControls(elm) {
    if (elm == 'p' || elm.innerText == 'P') {
        if (playerMode == 'a')
            playerAud.paused ? playerAud.play() : playerAud.pause();
        else
            playerVid.paused ? playerVid.play() : playerVid.pause();
        return
    } else if (elm.innerText == 'F')
        return openFullscreen(document.id('player'))

    // sliders
    playerAud[elm.id] = elm.value;
    playerVid[elm.id] = elm.value;
}

function openFullscreen(elm) {
    if (document.fullscreenElement)
        return closeFullscreen()
    if (elm.requestFullscreen) {
        elm.requestFullscreen();
    } else if (elm.webkitRequestFullscreen) { /* Safari */
        elm.webkitRequestFullscreen();
    } else if (elm.msRequestFullscreen) { /* IE11 */
        elm.msRequestFullscreen();
    }
}
function closeFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { /* Safari */
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE11 */
        document.msExitFullscreen();
    }
}

// loop
function toggleLoop(btn) {
    playerVid.loop = !playerVid.loop;
    playerAud.loop = !playerAud.loop;
    // button color
    btn.classList.toggle('redBg')
}

// fetch database
fetch('/database').then(res => res.json())
    .then(res => {
        database = res;

        let browse = document.id('browse');
        for (const id of Object.keys(res)) {
            let div = document.createElement('div'),
                h = document.createElement('h3');

            div.innerHTML = `<img src="${res[id].thumbnail_url}">`;
            // client check links expire to reduce server load
            if (!expireCheck(res[id].url)) {
                fetch('/expire/' + id);
                // expired, red out and click event redirects
                div.classList.add('redBg');
                div.addEventListener('click', ev => {
                    window.location.href = '/' + id
                })
            } else
                div.addEventListener('click', ev => {
                    playingId = id;

                    document.id('player').style.display = 'block';
                    if (playerMode == 'a') {
                        playerAud.src = res[id].aUrl;
                        playerAud.play();
                    } else {
                        playerVid.src = res[id].url;
                        playerVid.play();
                    }

                    // controls
                    document.id('currentTime').max = res[id].length;

                    // info
                    document.id('info').innerHTML = `
                    <p><b>${res[id].author}</b></p>
                    <p>${res[id].description.replace(new RegExp('\n', 'g'), '<br>')}</p>`;
                })

            h.innerText = res[id].title

            div.append(h);
            if (id == location.hash.slice(1))
                div.click()

            browse.prepend(div);
        }
    });

// intervals
setInterval(() => {
    // move slider
    document.id('currentTime').value =
        (playerMode == 'a' ? playerAud : playerVid).currentTime;
}, 1000);