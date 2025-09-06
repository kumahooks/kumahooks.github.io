function randomExtension() {
	const extensions = [".wav", ".flac", ".mp3", ".ogg", ".aiff"];
	return extensions[Math.floor(Math.random() * extensions.length)];
}

class FilterState {
	constructor() {
		this.includeGenres = new Set();
		this.excludeGenres = new Set();
		this.filterType = "all"; // "all", "song", "album"
	}
}

class FilterButton {
	constructor(value, container, onStateChange) {
		this.value = value;
		this.state = 0; // 0: neutral, 1: include, 2: exclude
		this.element = this.createElement();
		this.onStateChange = onStateChange;

		container.appendChild(this.element);
	}

	createElement() {
		const button = document.createElement("div");
		button.className = "filter-item state-0";
		button.textContent = this.value;
		button.addEventListener("click", () => this.cycle());

		return button;
	}

	cycle() {
		this.state = (this.state + 1) % 3;
		this.element.className = `filter-item state-${this.state}`;
		this.onStateChange(this.value, this.state);
	}
}

class TypeFilterButton {
	constructor(type, container, onTypeChange, isActive = false) {
		this.type = type;
		this.isActive = isActive;
		this.element = this.createElement();
		this.onTypeChange = onTypeChange;

		container.appendChild(this.element);
	}

	createElement() {
		const button = document.createElement("div");
		button.className = `type-item state-${this.isActive ? "1" : "0"}`;
		button.textContent = this.type;
		button.addEventListener("click", () => this.activate());

		return button;
	}

	activate() {
		this.onTypeChange(this.type);
	}

	setActive(isActive) {
		this.isActive = isActive;
		this.element.className = `type-item state-${this.isActive ? "1" : "0"}`;
	}
}

class SongFilter {
	constructor(songs, containerId, filterBarId, typeBarId) {
		this.songs = songs;
		this.container = document.getElementById(containerId);
		this.filterBar = document.getElementById(filterBarId);
		this.typeBar = document.getElementById(typeBarId);
		this.state = new FilterState();
		this.genreButtons = [];
		this.typeButtons = [];

		this.initializeFilters();
		this.render();
	}

	initializeFilters() {
		// Filtering for genres
		const genresSet = new Set();
		this.songs.forEach(song => {
			const songGenres = song.genre.split(", ");
			songGenres.forEach(genre => genresSet.add(genre));
		});

		const genres = [...genresSet]

		const filterButtonOnStateChange = (value, state) => {
			this.updateGenreFilter(value, state);
			this.render();
		}

		genres.forEach(genre => {
			const filter = new FilterButton(genre, this.filterBar, (value, state) => filterButtonOnStateChange(value, state));
			this.genreButtons.push(filter);
		});

		// Filtering for Types
		const types = ["all", "song", "album"];

		const typeFilterButtonOnStateChange = (selectedType) => {
			this.updateTypeFilter(selectedType);
			this.render();
		}

		types.forEach(type => {
			const filter = new TypeFilterButton(type, this.typeBar, (selectedType) => typeFilterButtonOnStateChange(selectedType), type === "all");
			this.typeButtons.push(filter)
		});
	}

	updateGenreFilter(genre, state) {
		this.state.includeGenres.delete(genre);
		this.state.excludeGenres.delete(genre);

		if (state === 1) {
			this.state.includeGenres.add(genre);
		} else if (state === 2) {
			this.state.excludeGenres.add(genre);
		}
	}

	updateTypeFilter(selectedType) {
		this.state.filterType = selectedType;
		this.typeButtons.forEach(button => button.setActive(button.type === selectedType));
	}

	filterSongs() {
		return this.songs.filter(song => {
			// By Genre
			const songGenres = song.genre.split(", ");
			let isIncluded = false;
			for (const genre of songGenres) {
				if (this.state.excludeGenres.has(genre)) return false;
				if (this.state.includeGenres.size > 0) {
					if (this.state.includeGenres.has(genre)) isIncluded = true;
				}
			}

			if (this.state.includeGenres.size > 0 && !isIncluded) return false;

			// By Type
			if (this.state.filterType === "song" && song.type !== "song") return false;
			if (this.state.filterType === "album" && song.type !== "album") return false;

			return true;
		});
	}

	sortSongs(songs) {
		return songs.sort((a, b) => a.title.localeCompare(b.title));
	}

	render() {
		this.container.innerHTML = "";
		const filteredSongs = this.filterSongs();
		const sortedSongs = this.sortSongs(filteredSongs);

		sortedSongs.forEach(song => {
			const item = document.createElement("div");

			item.className = "song-item";
			item.innerHTML = `
				<a href="${song.url}">
					<div class="song-title">${song.title}${randomExtension()}</div>
					<div class="song-meta">
						[ ${song.genre} ]<br><br>
						author: ${song.author}<br>
						type: ${song.type}
					</div>
				</a>
			`;

			this.container.appendChild(item);
		});
	}
}

async function load() {
	const result = await fetch("/data/songs.json");
	const songs = await result.json();

	new SongFilter(songs, "song-grid", "song-filter", "song-type");
}

load();

