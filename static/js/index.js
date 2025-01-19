function choose_logo() {
    const isGif = Math.random() < 0.5;
    const logoIndex = Math.floor(Math.random() * 1) + 1;
    const extension = isGif ? 'gif' : 'png';
    document.querySelector('.logo').src = `/images/logo/${logoIndex}.${extension}`;
}

window.onload = function () {
	choose_logo();
};
