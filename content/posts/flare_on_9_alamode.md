---
title: 'Flare-On 9 Alamode'
date: '2022-11-18T12:00:00'
draft: false
---

I decided to post in here my writeup for this challenge because it's one I enjoyed. The broken modules addresses and piping were fun! My solution is nothing fancy but, yeah. :)

## Solution
The challenge's text is as follows:
```
FLARE FACT #824: Disregard flare fact #823 if you are a .NET Reverser too.

We will now reward your fantastic effort with a small binary challenge. You've earned it kid!
```

From the text above my first instinct is to check the binary in dnSpy. Opening it reveals only one class called `Flag`:

![image](https://user-images.githubusercontent.com/69819027/202642556-9a03bc66-1b45-48fb-914b-a89bdb27837f.png)

The code is simple and easy to understand. It's connecting to a named pipe and passes the password to it. Seems like it expects an answer from the pipe because it receives a string as a response.

There's nothing more we can do with that information though, so I opened the binary in x32. Running the dll normally it either exits or crashes without doing anything. My first thoughts are that I'm supposed to have a FlareOn named pipe and since I don't have it, it exits.

Looking at the string references, there are some encrypted strings which so far I am not quite sure what they are for yet. Breaking at one of them (in my case I bp'd at `0x10015070` on access for the string `TxyyrtcYvzrsG~gr`), we get two new pieces of information when it hits:
1. The strings are accessed in a function inside `sub_100012F1`. They are decrypting the strings to function names, like `CloseHandle`, `ConnectedNamedPipe`, etc. The way they are encrypted doesn't matter to me, at least not now.
2. `sub_100012F1` is called in `sub_10001163`, which seems to be our DllMain.

For reasons beyond me x32 started failing me when I started to one-step through the function at `sub_10001094` (function in DllMain being run in a thread). So at this moment, I switched to good ol' Olly.

While one-stepping `sub_10001094` the first problem we have is a call attempting to run a NULL function. This function has as one of its arguments the pipe's address, so I assume this was supposed to be `CreateNamedPipeA`.

![image](https://user-images.githubusercontent.com/69819027/202642594-de51638f-3208-4104-aff9-1e7b5e928f54.png)

My assumption is quickly proven true when I look for references to the given function's address, finding it is one of the functions decrypted by `sub_100012F1`. The problem is, `sub_100012F1` not only decrypts the function names but also finds in the given module the function's address (`sub_1000125C`) and stores it in what seems to be a struct. While trying to find the function `CreateNamedPipeA` in the kernel dll, it can't, thus storing 0 and causing the error.

![image](https://user-images.githubusercontent.com/69819027/202642608-0b7b0ccc-a0f4-4d64-9bb6-973c94501dd9.png)

I am not sure if this was intentional (I assume so?) or if it was a problem with my environment or whatnot, but well, that happened. Anyway, this happens because it's trying to find the function at KernelBase but it's at Kernel32 instead.
The solution is simple, at around the start of `sub_100012F1`, it calls a function `sub_100012DB`, responsible to return at EAX the KernelBase address. 

As you can see from the picture below, just nopping the last `MOV EAX,DWORD PTR DS:[EAX]` is enough to make it stop at Kernel32 in the list.

![image](https://user-images.githubusercontent.com/69819027/202642654-5df795d6-1088-49f7-ba7c-16d9a7315bca.png)

After that, we can make a simple C# program to connect to the pipe stream. The code is just:
```cs
using FlareOn;

Console.WriteLine(new Flag().GetFlag("WeAreDoingFlareOn!"));
```
With our dll loaded as a dependency. (Gotta rename it to FlareOn_x86.dll from HowDoesThisWork.dll)

Anyway after running both the .dll and then our code, our execution past the function in the thread `sub_10001094` continues. At some point, it then calls `sub_10001000` which checks if the entered flag is valid. The function is rather simple and seems to give us the answer right away: our password seems to be `MyV0ic3!`.

After running both of the apps with the argument above, `sub_10001000` gives us the flag:

![image](https://user-images.githubusercontent.com/69819027/202642677-9cbdb3e5-8a54-4f8a-aa38-7d4e93416443.png)
