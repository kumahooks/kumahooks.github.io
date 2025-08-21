function randomExtension() {
	const extensions = [".wav", ".flac", ".mp3", ".ogg", ".aiff"];
	return extensions[Math.floor(Math.random() * extensions.length)];
}

async function load() {
	const res = await fetch("/data/songs.json");
	const songs = await res.json();
	const container = document.getElementById("song-grid");
	const filterBar = document.getElementById("song-filter");

	const includeGenres = new Set();
	const excludeGenres = new Set();

	const genres = [...new Set(songs.map(s => s.genre))];
	genres.forEach(genre => {
		const btn = document.createElement("div");
		btn.className = "filter-item";
		btn.textContent = genre;

		let state = 0;
		btn.addEventListener("click", () => {
			if (state === 0) {
				state = 1;
				includeGenres.add(genre);
				excludeGenres.delete(genre);
			} else if (state === 1) {
				state = 2;
				includeGenres.delete(genre);
				excludeGenres.add(genre);
			} else {
				state = 0;
				includeGenres.delete(genre);
				excludeGenres.delete(genre);
			}

			btn.className = `filter-item state-${state}`;

			renderSongs();
		});

		filterBar.appendChild(btn);
	});

	function renderSongs() {
		container.innerHTML = "";

		songs.forEach(song => {
			if (excludeGenres.has(song.genre)) return;
			if (includeGenres.size > 0 && !includeGenres.has(song.genre)) return;

			const item = document.createElement("div");

			item.className = "song-item";
			item.innerHTML = `
			<a href="${song.url}">
				<div class="song-title">${song.title}${randomExtension()}</div>
				<div class="song-meta">
					[ ${song.genre} ]<br><br>
					author: ${song.author}<br>
					runtime: ${song.runtime}<br>
					type: ${song.type}
				</div>
			</a>
		`;

			container.appendChild(item);
		});
	}

	renderSongs();
}

load();

