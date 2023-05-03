/* TODO:
 * Fix item's base types search
 * Show divine:chaos rate
*/

// Loading recipes from recipes.json
let recipes;
fetch('poe/recipes.json')
	.then(response => response.json())
	.then(data => {
		recipes = data.category;
	})
	.catch(error => console.error(error));

// Class for items used later
class Item {
	constructor(name, price) {
		this.name = name;
		this.price = price;
	}
}

// Class for the recipes used later
class Recipe {
	constructor(name, cost, num_of_trades, value) {
		this.name = name;
		this.cost = cost;
		this.num_of_trades = num_of_trades;
		this.value = value;
	}
}

let current_league = "Crucible"

async function get_all_items_poewatch()
{
	const all_items = {};
	const categories = ['card', 'currency', 'accessory', 'armour', 'weapon'];

	for (const category of categories) {
		const url = "https://corsproxy.io/?" + encodeURIComponent(`https://api.poe.watch/get?category=${category}&league=${current_league}`);
		const my_headers = { 'user-agent': 'currency-flipper/0.0.1' };
		const response = await fetch(url, { headers: my_headers });
		const data = await response.json();
		try {
			var error = eval(response.text).error;
		} catch (e) {
			var error = "";
		}

		if (response.status === 200) {
			if (data) {
				for (const item of data) {
					// Get ID
					let item_id;
					if ('id' in item) {
						item_id = String(item.id);
					} else {
						continue;
					}

					// Get name
					let item_name;
					if ('name' in item) {
						item_name = item.name;
					} else {
						continue;
					}

					// Get price
					let item_price;
					if ('min' in item) {
						item_price = parseFloat(item.min);
					} else {
						continue;
					}

					all_items[item_id] = new Item(item_name, item_price);
				}
			}
		} else if (error === 'unknown category') {
			continue;
		} else {
			throw new Error(`Could not get data from ${url}.`);
		}

		await new Promise(resolve => setTimeout(resolve, 3000));
	}

	return all_items;
}

async function get_all_items_poeninja()
{
	// A CORS proxy is needed otherwise the browser will block the request
	const links = [
		"https://corsproxy.io/?" + encodeURIComponent("https://poe.ninja/api/data/currencyoverview?league=Crucible&type=Currency&language=en"),
		"https://corsproxy.io/?" + encodeURIComponent("https://poe.ninja/api/data/itemoverview?league=Crucible&type=DivinationCard&language=en"),
		"https://corsproxy.io/?" + encodeURIComponent("https://poe.ninja/api/data/itemoverview?league=Crucible&type=UniqueWeapon&language=en"),
		"https://corsproxy.io/?" + encodeURIComponent("https://poe.ninja/api/data/itemoverview?league=Crucible&type=UniqueArmour&language=en"),
		"https://corsproxy.io/?" + encodeURIComponent("https://poe.ninja/api/data/itemoverview?league=Crucible&type=UniqueAccessory&language=en"),
		"https://corsproxy.io/?" + encodeURIComponent("https://poe.ninja/api/data/currencyoverview?league=Crucible&type=Fragment&language=en"),
	];

	const all_items = {};
	for (const url of links) {
		const my_headers = { 'user-agent': 'currency-flipper/0.0.1' };
		const response = await fetch(url, { headers: my_headers });
		if (response.status === 200) {
			const data = await response.json();
			const lines = data.lines;
			for (const item of lines) {
				// Get ID
				let item_id;
				if ('detailsId' in item) {
					item_id = item.detailsId;
				} else {
					continue;
				}

				// Get name
				let item_name;
				if ('currencyTypeName' in item) {
					item_name = item.currencyTypeName;
				} else if ('name' in item) {
					item_name = item.name;
				} else {
					continue;
				}

				// Get price
				let item_price;
				if ('receive' in item && 'value' in item.receive) {
					item_price = parseFloat(item.receive.value);
				} else if ('chaosValue' in item) {
					item_price = parseFloat(item.chaosValue);
				} else {
					continue;
				}

				if (item_id && item_name && item_price) {
					all_items[item_id] = new Item(item_name, item_price);
				}
			}
		} else {
			throw new Error(`Could not get data from ${url}.`);
		}

		await new Promise(resolve => setTimeout(resolve, 3000));
	}

	return all_items;
}

async function get_all_items() {
	const poewatch_items = await get_all_items_poewatch();
	const poeninja_items = await get_all_items_poeninja();

	const result = { ...poeninja_items, ...poewatch_items };

	return result;
}

// It can't properly find item names because at recipes.json the names have their base type too
// Meanwhile items fetched at all_items hide their base type
function cost_of_ingredients(all_items, ingredients)
{
	let ingredients_list = [];
	for (let index in ingredients) {
		let ingredient_url = ingredients[index].url;
		ingredient_url = ingredient_url.split('/').slice(-1)[0];
		ingredient_url = ingredient_url.replaceAll("-", " ");
		ingredient_url = ingredient_url.toLowerCase();

		ingredients_list.push([ingredient_url, ingredients[index].count]);
	}

	let total_price = 0;
	let ingredients_done = [];

	for (let i in all_items) {
		if (ingredients_done.includes(all_items[i].name)) continue;

		for (let j in ingredients_list) {
			if (all_items[i].name == ingredients_list[j][0]) {
				total_price += all_items[i].price * ingredients_list[j][1]; // price*count
				ingredients_done.push(all_items[i].name);
			}
		}
	}

	return total_price;
}

function cost_of_item(all_items, outcomes)
{
	let count = outcomes.count
	let item_name = outcomes.url
	item_name = item_name.split('/').slice(-1)[0];
	item_name = item_name.replaceAll("-", " ");
	item_name = item_name.toLowerCase();

	for (let i in all_items) {
		if (all_items[i].name == item_name) {
			return all_items[i].price * count;
		}
	}

	return null;
}

function calculate_number_of_trades(itemList)
{
	let totalTrades = 0;
	for (const item of itemList) {
		totalTrades += item['count'];
	}

	return totalTrades;
}


function add_to_table(img_source, name, cost, trades, value, profit)
{
	// Get the table body
	const tableBody = document.querySelector(".column-items tbody");
	
	const newRow = `
		<tr>
			<td><img src="${img_source}" alt="Icon"></td>
			<td>${name}</td>
			<td>${cost}</td>
			<td>${trades}</td>
			<td>${value}</td>
			<td>${profit}</td>
		</tr>
	`;

	tableBody.innerHTML += newRow;
}

function reset_table()
{
	// Get the table body
	const tableBody = document.querySelector(".column-items tbody");
	tableBody.innerHTML = "";
}

const loadingOverlay = document.querySelector('#loading-overlay');
const navLinks = document.querySelectorAll(".nav-link");
// Loop through each nav link
navLinks.forEach(link => {
	link.addEventListener("click", function() {
		const activeLink = document.querySelector('.nav a.active');
		if (activeLink) {
			activeLink.classList.remove('active');
		}

		// Add the active class
		this.classList.add("active");

		console.log("Fetching all items...");
		loadingOverlay.style.display = 'block'; // Show the loading overlay

		// Fetch items
		let all_items;
		get_all_items().then(function(result)
		{
			all_items = result;
			for (let i in all_items) {
				if (all_items[i].name) {
					// Getting everything lower case to not mess up checks later
					all_items[i].name = all_items[i].name.toLowerCase();

					// Remove ' from names
					all_items[i].name = all_items[i].name.replaceAll("'", "");
				}
			}

			const all_recipes = {};
			for (const category in recipes) {
				all_recipes[category] = [];

				for (const recipe_name in recipes[category]) {
					const recipe_items = recipes[category][recipe_name];
					let recipe_cost = cost_of_ingredients(all_items, recipe_items.ingredients);
					recipe_cost = recipe_cost ? recipe_cost.toFixed(2) : 0;
					let recipe_value = cost_of_item(all_items, recipe_items.outcomes[0]);
					recipe_value = recipe_value ? recipe_value.toFixed(2) : 0;
					const trades_total = calculate_number_of_trades(recipe_items.ingredients);
					if (recipe_cost <= 0 || recipe_value <= 0) continue; // Skip items that weren't properly fetched
					all_recipes[category].push(new Recipe(recipe_name, recipe_cost, trades_total, recipe_value));
				}
			}

			// Sort recipes by (recipe_value-recipe_cost) within each category
			for (const category in all_recipes) {
				const recipesArr = all_recipes[category];
				recipesArr.sort((a, b) => (b.value - b.cost) - (a.value - a.cost));
				all_recipes[category] = recipesArr;
			}


			// Clear table
			reset_table();
			for (const category in all_recipes) {
				if (category == link.id) {
					for (let i = 0; i < all_recipes[category].length; ++i) {
						const img_source = "https://web.poecdn.com/gen/image/WzI1LDE0LHsiZiI6IjJESXRlbXMvRGl2aW5hdGlvbi9JbnZlbnRvcnlJY29uIiwidyI6MSwiaCI6MSwic2NhbGUiOjF9XQ/f34bf8cbb5/InventoryIcon.png";
						add_to_table(img_source, all_recipes[category][i].name, all_recipes[category][i].cost, all_recipes[category][i].num_of_trades, all_recipes[category][i].value, (all_recipes[category][i].value - all_recipes[category][i].cost).toFixed(2));
					}
				}
			}

			loadingOverlay.style.display = 'none'; // Hide the loading overlay when done
		});
	});
});
