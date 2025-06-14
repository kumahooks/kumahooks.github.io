const CONFIG = {
	FONT_SIZE: 14,
	BASE_COLOR: "#d2738a",
	CHAR_SET: "0123456789abcdefghijklmnopqrstuvwxyz$+*/=%\"'#&-(),.;:?!\\|{}<>[]^~",
	COLUMN_CHANCE: 0.015,
	BRIGHTNESS_CHANCE: 0.3,
	SENTENCE: "Let's all love Lain!",
	FRAME_RATE: 30,
	COLUMN_SPACING: 2,
	CLEANUP_THRESHOLD: 10
};

class ColorUtils {
	static changeBrightness(hexColor, percentage) {
		const rgb = ColorUtils.hexToRgb(hexColor);
		const adjustedRgb = rgb.map(value => Math.round(value * percentage));
		return ColorUtils.rgbToHex(adjustedRgb);
	}

	static hexToRgb(hex) {
		return [
			parseInt(hex.slice(1, 3), 16),
			parseInt(hex.slice(3, 5), 16),
			parseInt(hex.slice(5, 7), 16)
		];
	}

	static rgbToHex([r, g, b]) {
		return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
	}
}

class MatrixElement {
	#element;

	constructor(className, top, color, content) {
		this.#element = document.createElement("div");
		this.#element.className = className;
		this.#element.style.position = "absolute";
		this.#element.style.top = `${top}px`;
		this.#element.style.color = color;
		this.#element.innerHTML = content;
	}

	get element() {
		return this.#element;
	}
}

class MatrixColumn {
	#column;
	#fontSize;
	#color;
	#charSet;
	#brightnessChance;

	constructor(x, fontSize, color, charSet, brightnessChance) {
		this.#column = document.createElement("div");
		this.#column.className = "matrix-column";
		this.#column.style.position = "absolute";
		this.#column.style.left = `${x * fontSize}px`;
		this.#fontSize = fontSize;
		this.#color = color;
		this.#charSet = charSet;
		this.#brightnessChance = brightnessChance;
	}

	get element() {
		return this.#column;
	}

	get childCount() {
		return this.#column.children.length;
	}

	get bottomPosition() {
		if (this.childCount === 0) return 0;
		const bottomChild = this.#column.children[this.childCount - 1];
		return parseInt(bottomChild.style.top) + this.#fontSize;
	}

	clear() {
		while (this.#column.firstChild) {
			this.#column.removeChild(this.#column.firstChild);
		}
	}

	addCharacter() {
		const char = this.#charSet[Math.floor(Math.random() * this.#charSet.length)];
		const color = Math.random() < this.#brightnessChance ? 
			ColorUtils.changeBrightness(this.#color, 0.5) : 
			this.#color;

		const element = new MatrixElement(
			"matrix-character",
			this.childCount * this.#fontSize,
			color,
			char
		);

		this.#column.appendChild(element.element);
	}
}

class Matrix {
	#columns;
	#ignoredColumns;
	#gridX;
	#gridY;
	#sentenceX;
	#animationFrame;

	constructor() {
		this.#gridX = window.innerWidth;
		this.#gridY = window.innerHeight;
		this.#columns = [];
		this.#ignoredColumns = new Set();
		this.#sentenceX = Math.floor(
			(this.#gridX / CONFIG.FONT_SIZE/2) - CONFIG.SENTENCE.length/2
		);

		this.#initialize();
		this.#setupResizeHandler();
	}

	start() {
		let lastUpdate = 0;
		const frameInterval = 1000 / CONFIG.FRAME_RATE;

		const update = (timestamp) => {
			const elapsed = timestamp - lastUpdate;
			
			if (elapsed >= frameInterval) {
				const columnCount = Math.floor(this.#gridX / CONFIG.FONT_SIZE);
				for (let x = 0; x < columnCount; x++) {
					this.#updateColumn(x);
				}

				lastUpdate = timestamp;
			}
			
			this.#animationFrame = requestAnimationFrame(update);
		};

		this.#animationFrame = requestAnimationFrame(update);
	}

	stop() {
		if (this.#animationFrame) {
			cancelAnimationFrame(this.#animationFrame);
		}
	}

	#initialize() {
		const columnCount = Math.floor(this.#gridX / CONFIG.FONT_SIZE);
		
		for (let x = 0; x < columnCount; x++) {
			const column = new MatrixColumn(
				x,
				CONFIG.FONT_SIZE,
				CONFIG.BASE_COLOR,
				CONFIG.CHAR_SET,
				CONFIG.BRIGHTNESS_CHANCE
			);

			document.body.appendChild(column.element);
			this.#columns.push(column);
		}
	}

	#setupResizeHandler() {
		window.addEventListener('resize', () => {
			this.#gridX = window.innerWidth;
			this.#gridY = window.innerHeight;
			this.#sentenceX = Math.floor(
				(this.#gridX / CONFIG.FONT_SIZE / 2) - CONFIG.SENTENCE.length / 2
			);

			// Clean up existing columns
			this.#columns.forEach(column => column.element.remove());
			this.#columns = [];
			this.#ignoredColumns.clear();

			// Reinitialize
			this.#initialize();
		}, { passive: true });
	}

	#createSentenceElement(x, index) {
		const y = this.#gridY / 2;
		const element = new MatrixElement(
			"sentence-character",
			y,
			"#ffffff",
			CONFIG.SENTENCE[index]
		);

		element.element.style.fontFamily = "Times, Times New Roman, serif";
		
		const column = this.#columns[x];
		column.clear();
		this.#ignoredColumns.add(x);
		column.element.appendChild(element.element);
	}

	#updateColumn(x) {
		if (this.#ignoredColumns.has(x)) return;

		const column = this.#columns[x];

		// Initialize new column
		if (column.childCount === 0) {
			if (this.#ignoredColumns.size === CONFIG.SENTENCE.length) return;
			if (Math.random() > CONFIG.COLUMN_CHANCE) return;
			x += CONFIG.COLUMN_SPACING;
		}

		// Check for sentence creation
		if (x >= this.#sentenceX && x < this.#sentenceX + CONFIG.SENTENCE.length) {
			const bottom = column.bottomPosition;
			const midPoint = Math.floor(this.#gridY / CONFIG.FONT_SIZE / 2);

			if (Math.floor(bottom / CONFIG.FONT_SIZE) === midPoint) {
				this.#createSentenceElement(x, x - this.#sentenceX);
				return;
			}
		}

		// Check for column cleanup
		if (column.childCount > 0) {
			const bottom = column.bottomPosition;
			const threshold = this.#gridY + (CONFIG.CLEANUP_THRESHOLD * CONFIG.FONT_SIZE);

			if (bottom >= threshold) {
				column.clear();
				return;
			}
		}

		column.addCharacter();
	}
}

const matrix = new Matrix();
matrix.start();
