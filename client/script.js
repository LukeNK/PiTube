let database = {}; // database
document.id = document.getElementById;

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
        fromE = document.id('playerVid');
        toE = document.id('playerAud');
        // if src is wrong, then change the src
        if (toE.src != database[playingId].aUrl)
            toE.src = database[playingId].aUrl;

        playerMode = 'a';
        btn.innerText = 'Mode: audio';
    } else if (playerMode == 'a') {
        // switch to mix video mode
        fromE = document.id('playerAud');
        toE = document.id('playerVid');
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

// loop
function toggleLoop(btn) {
    document.id('playerVid').loop = !document.id('playerVid').loop;
    document.id('playerAud').loop = !document.id('playerAud').loop;
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
        } else {
            div.addEventListener('click', ev => {
                playingId = id;
                document.id('player').style.display = 'block';
                if (playerMode == 'a') {
                    document.id('playerAud').src = res[id].aUrl;
                    document.id('playerAud').play();
                } else {
                    document.id('playerVid').src = res[id].url;
                    document.id('playerVid').play();
                }
            })
        }

        h.innerText = res[id].title

        div.append(h);
        if (id == location.hash.slice(1))
            div.click()

        browse.prepend(div);
    }
});