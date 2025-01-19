function change_brightness(hex_color, percentage)
{
	// Extract red, green, and blue values from hex color
	let red = parseInt(hex_color.slice(1, 3), 16);
	let green = parseInt(hex_color.slice(3, 5), 16);
	let blue = parseInt(hex_color.slice(5, 7), 16);

	// Adjust intensity of red, green, and blue values
	red = Math.round(red * percentage);
	green = Math.round(green * percentage);
	blue = Math.round(blue * percentage);

	// Convert red, green, and blue values back to hex
	hex = "#" + ((1 << 24) + (red << 16) + (green << 8) + blue).toString(16).slice(1);

	return hex;
}

class Matrix
{
	constructor()
	{
		this.grid_x = window.innerWidth;
		this.grid_y = window.innerHeight;

		// Config
		this.fontSize = 14;
		this.color = "#d2738a";
		this.char_set = "0123456789abcdefghijklmnopqrstuvwxyz$+*/=%\"'#&-(),.;:?!\\|{}<>[]^~";
		this.column_chance = 0.015; // Chance to start raining a column
		this.brightness_chance = 0.3 // Chance to change a character's brightness

		// Columns
		this.columns = [];
		this.ignored_columns = [];
		this.create_columns();

		// Sentence
		this.sentence = "Let's all love Lain!";
		this.sentence_x = Math.floor(((this.grid_x / this.fontSize) / 2) - this.sentence.length/2);
	}

	create_sentence(i)
	{
		let x = this.sentence_x;
		let y = (this.grid_y) / 2;
		let column = this.columns[i];
		let element = document.createElement("div");
		element.className = "sentence-character";
		element.style.position = "absolute";
		element.style.top = `${y}px`;
		element.style.color = "#ffffff";
		element.style.fontFamily = "Times, Times New Roman, serif";
		element.innerHTML = this.sentence[i - this.sentence_x];

		this.clear_column(column);
		this.ignored_columns.push(i);
		column.appendChild(element);
	}

	create_columns()
	{
		this.columns = []
		for (let x = 0; x < this.grid_x / this.fontSize; ++x) {
			let column = document.createElement("div");
			column.className = "matrix-column";
			column.style.position = "absolute";
			column.style.left = `${x * this.fontSize}px`;
			document.body.appendChild(column);
			this.columns.push(column);
		}
	}

	clear_column(column)
	{
		while (column.children.length > 0) column.removeChild(column.firstChild);
	}

	create_element(column)
	{
		// Add new character
		let character = this.char_set.charAt(Math.floor(Math.random() * this.char_set.length));
		let element = document.createElement("div");
		element.className = "matrix-character";
		element.style.position = "absolute";
		element.style.top = `${column.children.length * this.fontSize}px`;

		let hex = this.color;
		// Randomize brightness of a few characters
		if (Math.random() < this.brightness_chance) {
			hex = change_brightness(hex, 0.5);
		}

		element.style.color = hex;

		element.innerHTML = character;
		return element;
	}

	draw() 
	{
		// Loop through the columns
		for (let x = 0; x < this.grid_x / this.fontSize; ++x) {
			// Check if this column isn't being ignored
			if (this.ignored_columns.includes(x)) continue;

			let column = this.columns[x];

			// Decide rather it will create a column there or not
			if (column.children.length == 0) {
				if (this.ignored_columns.length == this.sentence.length) {
					continue;
				}

				if (Math.random() > this.column_chance) continue;
				// Avoiding two equal columns side to side
				x += 2;
			}

			// Check if the bottom character has reached the middle of the screen
			if (x >= this.sentence_x && x < this.sentence_x + this.sentence.length) {
				if (column.children.length > 0) {
					let bottomCharacter = column.children[column.children.length - 1];
					let bottom = parseInt(bottomCharacter.style.top) + this.fontSize;

					if (Math.floor(bottom/this.fontSize) == Math.floor((this.grid_y/this.fontSize)/2)) {
						this.create_sentence(x);
						continue;
					}
				}
			}

			// Check if the bottom character has reached the bottom of the screen
			if (column.children.length > 0) {
				let bottomCharacter = column.children[column.children.length - 1];
				let bottom = parseInt(bottomCharacter.style.top) + this.fontSize;

				// Giving some time before it deletes itself
				if (bottom/this.fontSize >= this.grid_y/this.fontSize + 10) {
					this.clear_column(column);
					continue;
				}
			}

			// Add new character
			column.appendChild(this.create_element(column));
		}
	}
}

let matrix = new Matrix();

function update() {
	matrix.draw();
	setTimeout(update, 45);
}

update();
