---
title: Reversing Sublime Text
description: I decided to check how Sublime Text works
---

## Reversing Sublime Text

#### Attention
```
This was done to satiate my scientific curiosity. 
This is posted with the intention of education and nothing more.
```

Recently I was messing with discord bots, mostly to troll friends; like how I made a bot change a friend's nickname everytime he tried to change it back to his original :)
Anyway, I've always used Sublime Text and to write my bot's code I was of course using it too. While at it, I kept getting bugged by the unregistered screen that kept showing every now and then and, while I've always used Sublime Text, I've never officially registered because reasons.
Having said that, I decided to reverse it to see how easy it was and how it was done.

I found two ways of doing the job, one that instantly does it once you open the editor and one by entering any key in the input box.


#### 1. Run and done
I started checking the "About Sublime Text" window, that showed whether it was registered or not. Poking with the code around that part I found out it checks if a specific address is 0 or not.

![image](https://i.imgur.com/CEbVOe9.png)


My solution was to just set that address to 0x100 :^)

![image](https://i.imgur.com/zNcVOxd.png)


Binary code:
```66 C7 05 1E B0 84 00 00 01 90 90 90 90 90 90```


#### 2. Use any key
This one is the way I usually like to do it because it feels cooler. I reached this solution by analyzing where it chose the wrong texts to send on screen. Turns out at some point if the entered code is valid, a function must return 0, otherwise it fails.

![image](https://i.imgur.com/lPZpmJl.png)


My solution was to simply xor eax with eax at the end of the given function:

![image](https://i.imgur.com/Cg9020I.png)



Again, I was purely curious when I did this and if you really want a registered Sublime Text you should pay for it, if you can afford. The editor is free and amazing, the developers definitely deserve the money if you can spare it!