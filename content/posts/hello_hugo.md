---
title: 'Hello, Hugo!'
date: '2025-01-19T12:00:00'
draft: false
---

After using Jekyll for this blog, I decided to migrate to Hugo, and I was very surprised by how straightforward it was.
Hugo's content structure is somewhat similar to Jekyll, which of course helped with the transition. Both uses markdown, metadatas and a simple structure for posts and pages. The key difference is relying on Github Actions for deployment, but even then all it took was a copy and paste solution from Hugo's documentation.

With this change, I also took the opportunity to create templates for my styling and basic html structure. I had some problems because I'm goofy, but once I debugged a little bit, everything worked flawlessly. I've also taken the opportunity to stop using a third party syntax highlighter, for the built-in markup Hugo offers. I've never been very fond of the way my code syntax looked like with the previous solution, but now I feel it's pretty decent. For example:
```js
function chooseLogo() {
	const isGif = Math.random() < 0.5;
	const logoIndex = Math.floor(Math.random() * 1) + 1;
	const extension = isGif ? 'gif' : 'png';
	document.querySelector('.logo').src = `/images/logo/${logoIndex}.${extension}`;
}

window.onload = function () {
	chooseLogo();
};
```

Overall, it took me around three hours to completely transition, and a bit extra more in order to refactor some old bad code. I feel my matrix solution for the Lain page looks much more elegant now.

Anyway, on a side note, it's been harder and harder for me to find time and energy to post more in here. I'm looking forward to this year though - I have some very cool projects in mind I plan to share in future posts.

Let's all love Lain!