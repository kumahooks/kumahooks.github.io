---
title: Goldbug Etiquette Challenge
description: My solution for this year's Challenge called "Etiquette"
---

# Etiquette
Life has been pulling me away from challenges as I get busier with real-life stuff. This has been bothering me for the last couple of months, so I’ve been looking for something fun to do. Recently, I stumbled upon a video talking about this year’s Defcon [Gold Bug](https://bbs.goldbug.cryptovillage.org/puzzles.html) challenges. Etiquette caught a lot my attention, because initially, I couldn't tell how I would solve that programmatically. That feeling started to nag at me, so I decided to tackle it. Once I managed to visualize the solution, it turned out to be surprisingly easy to implement.

## The Problem
The challenge simply introduces us with a random text about a dialogue with your granny, and a PDF in the end. This PDF is about etiquette - and each page has two lines drawn. The twitter page posted a very good tip for how the challenge is supposed to be solved:

![image](https://github.com/user-attachments/assets/aaea8e29-3777-4022-b289-be90c417af02)

So it turns out, we are supposed to programmatically fold these pages and see the word that comes out once we do that. This is what intrigued me - how could I even do that?! Visualizing a solution was initially weird and difficult, but once I started thinking more and more about it, it became quite simple really. 
Think about it: Each page that sticks out corresponds to a Y coordinate, with the maximum size being the max height of each page in the book. When we fold along the two lines, only a portion of that Y coordinate would be exposed for each page. If we plot a graph with the vertical lines, showing each part that sticks out, we could potentially form the word in the end. Let's try it, shall we?

## Tackling the Problem
I'm using `PyMuPDF` to read the drawn lines on each page, and then `matplotlib` to visualize the vertical lines we create once each page is folded.

For starters, I wanted to see if I could properly see the lines of a page, so I wrote a quick code to prove my theory:
```python
import pymupdf

doc = pymupdf.open("Etiquette_Book.pdf")

for page_num in range(len(doc)):
	if page_num < 2: # we skip the first two pages since they got no lines drawn
		continue

	page = doc.load_page(page_num)
	path_objects = page.get_drawings()

	for path in path_objects:
		for item in path["items"]:
			print(item)

	break
```
The output we get from that is the coordinates of each line drawn on the third page of the book:

![image](https://github.com/user-attachments/assets/6372410d-3e77-4927-9785-d8cb806be7ba)

As we can see, the third line is simply the second with inverted points, and honestly, I have no idea why it caught that. Either way, what we care about are the first two lines on every page. If other pages behave the same way, then this logic should work for all pages. If not, we might have to add some guards to ignore these repeating lines.

Anyway, I plotted these lines to see if it was how I expected them to be:
```py
import pymupdf
import matplotlib.pyplot as plt

doc = pymupdf.open("Etiquette_Book.pdf")

for page_num in range(len(doc)):
	if page_num < 2:
		continue

	page = doc.load_page(page_num)
	path_objects = page.get_drawings()

	page_width, page_height = page.rect.width, page.rect.height

	plt.figure()

	for path in path_objects:
		for item in path["items"]:
			if item[0] == 'l': # This means the drawing is a line - I don't think we will have any trouble without that, but anyway
				start_point = item[1]
				end_point = item[2]

				start_y_corrected = page_height - start_point.y
				end_y_corrected = page_height - end_point.y

				plt.plot([start_point.x, end_point.x], [start_y_corrected, end_y_corrected], 'r-')

	plt.gca().set_aspect('equal', adjustable='box')
	plt.xlim(0, page_width)
	plt.ylim(0, page_height)

	plt.title(f'Extracted Lines on Page {page_num}')
	plt.xlabel('X')
	plt.ylabel('Y')

	plt.show()

	break
```
I used the page’s dimensions for the graph, and I had to adjust the Y values to plot them correctly. Here's the result:

![image](https://github.com/user-attachments/assets/9baaf3ca-0d3f-4e7d-b5a8-9751cef49024)

I managed to plot the lines correctly! Now, we need to find the vertical line between these two folds, which represents what is sticking out, and plot every vertical line at once, hopefully revealing a word in the end.

My final solution was this:
```py
import pymupdf
import matplotlib.pyplot as plt

doc = pymupdf.open("Etiquette_Book.pdf")

page_width = 700
page_height = 600

vertical_lines = []
for page_num in range(len(doc)):
	if page_num < 2: # No lines drawn before this point
		continue

	page = doc.load_page(page_num)
	path_objects = page.get_drawings()

	extreme_points = []
	for path in path_objects:
		for item_index in range(0, len(path["items"]) - 1):
			current_item = path["items"][item_index]
			start_point = current_item[1]
			start_y_corrected = page_height - start_point.y

			if page_num % 2 == 0:
				extreme_points.append((start_point.x, page_height - start_point.y))
			else:
				extreme_points.append((0, start_y_corrected))

	if page_num > 439: # No lines drawn past this point
		break

	print("Page ", page_num, ": ", (extreme_points[0][1], extreme_points[1][1]))
	vertical_lines.append((extreme_points[0][1], extreme_points[1][1]))

plt.figure()

for i, line in enumerate(vertical_lines):
	plt.plot([i, i], [line[0], line[1]], 'b-')

plt.gca().set_aspect('equal', adjustable='box')
plt.xlim(0, page_width)
plt.ylim(0, page_height)

plt.title(f'Extracted Lines')
plt.xlabel('X')
plt.ylabel('Y')

plt.show()
```
The code isn’t great, and I’m not going to bother polishing it just for a writeup. The goal was simply to solve the challenge and get the word in the end. And hey, after a few minutes processing each page, we finally got our beautiful plot:

![image](https://github.com/user-attachments/assets/562caa94-cffb-430b-aa71-68323ec8c990)

I faced some problems with the vertical line plotting at first, especially with this difference in coordinates between each alternate page. I'm also sure there's a much more elegant way to solve this, but hey, when you have a problem that you are that curious to finally solve, any solution that works feels like a victory.
It feels refreshing to tackle a challenge like that after so long, and despite the solution itself being simple, taking my time to visualize how I would write the word in the end was a very fun process.
