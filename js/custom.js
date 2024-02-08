/*gere le bouton musique on off*/
var audio = document.getElementById("audio");
var playPauseBTN = document.getElementById("playPauseBTN");
var count = 0;
audioElement.play();


function playPause() {
    if (count == 0) {
        count = 1;
        audio.play();
        playPauseBTN.innerHTML = "Pause &#9208;";
    } else {
        count = 0;
        audio.pause();
        playPauseBTN.innerHTML = "Play &#9658;";
    }
}

function ch_zoom() {
    document.body.style.zoom = "100%";
    setTimeout(ch_zoom, 100);
}
