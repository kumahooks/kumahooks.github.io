// Supporting random png/gifs
function choose_logo() {
	if (Math.floor(Math.random() * 2) == 0) {
		let random_logo = Math.floor(Math.random() * 1); // 1x .png waifu
		document.getElementsByClassName('logo')[0].src = `images/logo/${random_logo+1}.png`;
	} else {
		let random_logo = Math.floor(Math.random() * 1); // 1x .gif waifu
		document.getElementsByClassName('logo')[0].src = `images/logo/${random_logo+1}.gif`;
	}
}

function play_sound()
{
	var audio = new Audio('audio\\.mp3');
	audio.addEventListener('ended', function() {
		this.currentTime = 0;
		this.play();
	}, false);
	audio.volume = 0.7;
	audio.play();
}

function set_stuff()
{
	var file = location.pathname.split("/").pop();
	var link = document.createElement("link");

	link.type = "text/css";
	link.rel = "stylesheet";
	link.media = "screen,print";

	link.href = "style\\index.css";

	//play_sound();

	/* Trying it not hidden
	$(function() {
		$("#separation").show();
		$("#love_lain").show();
		$("#eye").show();
	})
	*/

	document.getElementsByTagName("head")[0].appendChild(link);
}

window.onload = function () {
	set_stuff();
	choose_logo();
};
