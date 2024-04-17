let database = {}; // database
document.id = document.getElementById;

const playerAud = document.getElementById('playerAud'),
    playerVid = document.getElementById('playerVid');

let playerMode = 'm',
    playingId = '', // the id of the playing video
    currentPlayer = playerVid,
    playerRandom = false; // if the player is random next song

// check url expiration date
function expireCheck(url) {
    url = new URL(url)
    if (url.searchParams.get('expire') > new Date() / 1000)
        return true
    return false
}

// mode
function toggleMode(btn) {
    let fromE, toE; // from and to element
    if (playerMode == 'm') {
        // switch to audio
        fromE = playerVid;
        toE = playerAud;
        // if src is wrong, then change the src
        if (toE.src != database[playingId].aUrl)
            toE.src = database[playingId].aUrl;

        playerVid.style.display = 'none'; // no display
        document.id('fullscreen').style.display = 'none'; // remove control

        playerMode = 'a';
        btn.innerText = 'Mode: audio';
    } else if (playerMode == 'a') {
        // switch to mix video mode
        fromE = playerAud;
        toE = playerVid;
        if (playerVid.src != database[playingId].url)
            playerVid.src = database[playingId].url;

        playerVid.style.display = 'block'
        document.id('fullscreen').style.display = 'block';

        playerMode = 'm';
        btn.innerText = 'Mode: mix';
    }
    currentPlayer = toE;

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
    if (elm == 'p' || elm.innerText == 'P')
        return currentPlayer.paused ?
            currentPlayer.play()
            : currentPlayer.pause();
    else if (elm == 'f' || elm.innerText == 'F')
        return openFullscreen(document.id('player'))

    // sliders
    playerAud[elm.id] = elm.value;
    playerVid[elm.id] = elm.value;
}

function openFullscreen(elm) {
    // close if fullscreen
    if (document.fullscreenElement) closeFullscreen();
    else if (elm.requestFullscreen) elm.requestFullscreen();
    // Safari
    else if (elm.webkitRequestFullscreen) elm.webkitRequestFullscreen();
    // IE11
    else if (elm.msRequestFullscreen) elm.msRequestFullscreen();
}
function closeFullscreen() {
    if (document.exitFullscreen) document.exitFullscreen();
    // Safari
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    // IE11
    else if (document.msExitFullscreen) document.msExitFullscreen();
}

// controls
function toggleList(btn) {
    switch (btn.innerText) {
        case 'Loop':
            playerVid.loop = !playerVid.loop;
            playerAud.loop = !playerAud.loop;
            // button color
            break;

        case 'Random':
            playerRandom = !playerRandom;
            break;
    }
    btn.classList.toggle('redBg')
}

/**
 * Mark an ID as expired. This function will be called either when init or when a function delete a video
 * @param {string} id The ID of the media to mark expired
 * @param {HTMLDivElement} div To indicate that this function was called as a part of initialization and the div was not present in the DOM tree yet
 */
function markExpired(id, div) {
    fetch('/expire/' + id);
    (
        div
        || document.getElementById(id)
    ).classList.add('redBg');
    if (!div) playerOnended(); // move to the next song
}

// fetch database
(async () => {
    database = await fetch('/database').then(res => res.json());

    let browse = document.id('browse'),
        idList = Object.keys(database);

    if (idList.length != 0) browse.innerHTML = ''; // clear no message

    for (const id of idList) {
        let div = document.createElement('div'),
            h = document.createElement('h3');

        div.id = id;
        div.innerHTML = `<img src="${database[id].thumbnail_url}" loading="lazy">`;

        // client check links expire to reduce server load
        if (!expireCheck(database[id].url)) {
            markExpired(id, div);
            // recovery function
            div.addEventListener('click', async ev => {
                div.style.cursor = 'wait';
                await fetch('/' + id);
                database = await fetch('/database').then(res => res.json());
                div.classList.remove('redBg');
                div.style.cursor = '';
                openVid();
                div.onclick = openVid; // overwrite event listener
            })
        } else
            div.addEventListener('click', openVid)

        function openVid() {
            if (playingId) document.id(playingId).classList.remove('playing');
            document.id(id).classList.add('playing');

            playingId = id;

            document.id('player').style.display = 'block';
            currentPlayer.src = database[id][playerMode == 'a'? 'aUrl' : 'url'];
            currentPlayer.play();

            document.title = database[id].title

            // controls
            document.id('tabs').style.display = '';
            window.location.hash = '#' + id;
            document.id('currentTime').max = database[id].length;

            // info
            document.id('info').innerHTML = `
                <a class="btn" target="_blank" href="${database[id].url}">Video link</a>
                <a class="btn" target="_blank" href="${database[id].aUrl}">Audio link</a>
                <h2><a target="_blank" href="https://youtu.be/${id}">
                    ${database[id].title}
                </a></h2>
                <h3><a target="_blank" href="${database[id].author_url}">
                    ${database[id].author}
                </a></h3>
                <p>${database[id].description.replace(new RegExp('\n', 'g'), '<br>')}</p>`;
        }

        h.innerText = database[id].title

        div.append(h);
        browse.prepend(div);

        if (id == location.hash.slice(1)) div.click(); // click after prepend
    }
})();

function playerOnended() {
    let ids = Object.keys(database);
    if (playerRandom) {
        // if random next song
        ids = ids.filter(val => val != playingId);
        document.id(ids[~~(Math.random() * ids.length)]).click();
    } else {
        // auto play next
        let next = ids.indexOf(playingId) - 1; // display order is reversed
        if (next < 0) next = ids.length - 1; // return overflow
        document.id(ids[next]).click();
    }
}
playerAud.addEventListener('ended', playerOnended);
playerVid.addEventListener('ended', playerOnended);

// shortcuts
document.onkeydown = (ev) => {
    switch (ev.key) {
        case ' ': playerControls('p'); break;

        case 'ArrowLeft':
        case 'ArrowRight':
            document.id('currentTime').value =
                ~~document.id('currentTime').value
                + (ev.key[5] == 'L'? -5 : 5); // minus when left
            playerControls(document.id('currentTime'));
            break;

        case 'ArrowUp':
        case 'ArrowDown':
            document.id('volume').value =
                Number(document.id('volume').value)
                + (ev.key[5] == 'U'? 0.05 : -0.05); // add when up
            playerControls(document.id('volume'));
            break;

        case 'f':
            playerControls('f')
            break;

        case 'm':
            document.id('volume').value =
                Number(document.id('volume').value) != 0? 0 : 100;
            playerControls(document.id('volume'));
            break;
    }
}

// intervals
setInterval(() => {
    // move slider
    document.id('currentTime').value =
        currentPlayer.currentTime;
}, 1000);