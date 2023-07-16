---
title: Achieving Address Stability in Binary Hooking
description: Explanation and PoF of pattern matching techniques
---

# The Problem
Okay, so you're into reverse engineering. You found a cool function, maybe you're writing a cheat for a game, or maybe you were just poking around a binary. Writing a solution that will leverage whatever information you found is somewhat pointless: if you want to change parts of code in a binary, you will quickly notice that it's not easily accessible at the same address you initially stumbled upon.

One reason behind this hurdle is a security mechanism known as Address Space Layout Randomization (ASLR) which may be enabled when a program is compiled. ASLR introduces a level of unpredictability by randomizing the base addresses of modules within a process's address space. As a result, each time the binary is loaded, the addresses of functions and other code segments can vary. This dynamic nature makes it impractical to hardcode addresses when attempting to hook and modify functions within a binary. Furthermore, recompiling the binary can introduce alterations in the code structure, leading to changes in the addresses of critical functions. Consequently, relying on hard-coded addresses becomes impractical and unreliable, as they may no longer correspond to the correct function locations.

But fear not! There's a solution to this problem: pattern matching. By employing pattern matching techniques, we can dynamically locate the target function within the binary's memory, regardless of its randomized address. This approach allows us to achieve what we desire — consistent and reliable function hooking.


# Achieving Stability
Here we'll dive into the code solution of mine developed for the game Grandline Adventures. This code serves as a practical example to illustrate how address stability can be achieved using pattern matching techniques.

## Locating the Target Function
To effectively locate the target function within the binary's memory, we employ a multi-step process.

First, we utilize the `GetSectionHeaderInfo` function to retrieve valuable information about the `.text` section of the game binary. This section contains the executable code of the program.

```cpp
bool GetSectionHeaderInfo(LPCSTR moduleName, LPCSTR sectionName, PIMAGE_SECTION_HEADER& dest)
{
    // Retrieve the base address of the module
    const DWORD_PTR dwBaseAddress = reinterpret_cast<DWORD_PTR>(GetModuleHandle(moduleName));

    // Return false if the base address is NULL
    if (dwBaseAddress == NULL)
        return false;

    // Obtain a pointer to the NT headers of the module
    PIMAGE_NT_HEADERS64 ntHeader = reinterpret_cast<PIMAGE_NT_HEADERS64>(dwBaseAddress + reinterpret_cast<PIMAGE_DOS_HEADER>(dwBaseAddress)->e_lfanew);

    // Get the first section header
    PIMAGE_SECTION_HEADER section = IMAGE_FIRST_SECTION(ntHeader);

    // Iterate through the section headers
    uint32_t sectionCount = 0;
    while (sectionCount <= ntHeader->FileHeader.NumberOfSections)
    {
        // Check if the section name matches the desired section
        if (strstr(sectionName, reinterpret_cast<LPSTR>(section->Name)))
        {
            dest = section;
            return true;
        }

        // Move to the next section header
        section = IMAGE_FIRST_SECTION(ntHeader) + sectionCount;
        sectionCount++;
    }

    // Return false if the section is not found
    return false;
}
```

By utilizing the function above, we can obtain the necessary information about the desired section, such as its base address and size. This information is vital for subsequent steps.

Next, we calculate the base memory address of the `.text` section. We obtain the current module's base address using the `GetModuleHandle` function and add the virtual address of the `.text` section to it. The resulting value, stored in `pCodeMemory`, represents the starting address of the code within the binary.
```cpp
PIMAGE_SECTION_HEADER pCodeSection;

if (!GetSectionHeaderInfo(nullptr, ".text", pCodeSection)) return 0;

const DWORD_PTR pCodeMemory = reinterpret_cast<DWORD_PTR>(GetModuleHandle(nullptr)) + pCodeSection->VirtualAddress;
```

Using the obtained `pCodeMemory` address, we create an instance of `Pattern` called `codeData`. This is responsible for performing pattern matching on the code within the `.text` section. We pass the following parameters to the Pattern constructor:
* The binary data, represented as a `LPSTR` and obtained through the reinterpretation of `pCodeMemory`;
* The `pCodeMemory` value itself, which serves as the base address;
* The size of the `.text` section, obtained from the `SizeOfRawData` field of the `pCodeSection` structure.

```cpp
	Pattern codeData = Pattern(reinterpret_cast<LPSTR>(pCodeMemory), pCodeMemory, pCodeSection->SizeOfRawData);
```

To pinpoint the exact address of the target function within the binary's memory, we utilize the `Find` method of the `Pattern` class. This method takes several parameters:
* The first parameter is the binary mask, represented as a sequence of bytes, that corresponds to the desired instruction sequence. In our case, this is `\x8D\x5D\xD0\x8B\x45\xB0\x83\xEC\x04\x89\x9D\x6C\xFF\xFF\xFF\x8B\x55\xCC\x39\xD9\x0F\x84\xA7\x01\x00\x00\x8D\x75\xB8\x8B\x5D\xD0\x39\xF0\x0F\x84`;
* The second parameter is the string mask, which defines the expected pattern of the bytes in the instruction sequence. It helps to differentiate between bytes that must match exactly (x) and bytes that can have any value (?). In our case, the string mask is `xx?xx?xx?xx????xx?xxxx????xx?xx?xxxx`;
* The third and fourth parameters aren't exactly relevant to us, but findType is about how we will interpret the returning address, and matchNumber stats what order of occurence we want to rely on.

```cpp
DWORD_PTR Pattern::Find(LPCSTR bMask, LPCSTR szMask, FindType findType, int32_t matchNumber)
{
	int32_t match = 0;

	// Iterate through the binary's memory
	for (DWORD_PTR i = 0; i < m_size; i++)
	{
		// Check if the current memory location matches the provided pattern
		if (!MatchSequence(m_data + i, bMask, szMask)) continue;

		// If the match number is not reached yet, skip to the next iteration
		if (match != matchNumber)
		{
			match++;
			continue;
		}

		// Depending on the find type, handle the result differently
		switch (findType)
		{
			case PointerRelative:
			{
				// Returns an address that's found at pattern location offset by the current data position. 
				int32_t pointer = 0;
				memcpy(&pointer, m_data + i, sizeof(int));

				return pointer + m_baseAddress + i + sizeof(int);
			}
			case PointerRelativeLast4:
			{
				// Returns an address that's found at pattern location offset by the last 4 bytes of the pattern.
				int32_t pointer = 0;
				memcpy(&pointer, m_data + i + strlen(szMask), sizeof(int));

				return pointer + m_baseAddress + i + strlen(szMask) + sizeof(int);
			}
			case PointerAbsolute:
			{
				// Returns an absolute address that's found at pattern location.
				int32_t pointer = 0;
				memcpy(&pointer, m_data + i, sizeof(int));

				return pointer;
			}
			default:
			{
				// Returns the absolute address of the found pattern.
				return m_baseAddress + i;
			}
		}
	}

	// Return NULL if the target pattern is not found
	return NULL;
}
```

The `Find` method performs the pattern matching algorithm on the code data within the `.text` section of the binary. If it successfully finds the desired pattern, it returns the address of the target function as `pParseWorldBossData`. However, if the pattern is not found, the value of `pParseWorldBossData` will be `NULL`.

```cpp
const DWORD_PTR pParseWorldBossData = codeData.Find("\x8D\x5D\xD0\x8B\x45\xB0\x83\xEC\x04\x89\x9D\x6C\xFF\xFF\xFF\x8B\x55\xCC\x39\xD9\x0F\x84\xA7\x01\x00\x00\x8D\x75\xB8\x8B\x5D\xD0\x39\xF0\x0F\x84", "xx?xx?xx?xx????xx?xxxx????xx?xx?xxxx", Pattern::Default, 1);

if (pParseWorldBossData == NULL) {
	MessageBox(nullptr, "Word Boss Data pattern was not found in the .text", "Failure", MB_ICONINFORMATION);
	return -1;
}
```

## Establishing the Hook
Once we have identified the address of the target function using pattern matching, we store it in the variable `pParseWorldBossData`. With the address in hand, we can proceed to set up a function pointer that will be used for detouring and redirecting the execution flow.

This is how our code looks like applying everything above:

```cpp
// This is our function where we interpret the detoured data
void __cdecl pMyParseWorldBossData(BYTE* packetData, int32_t packetSize);

DWORD WINAPI MainThread(LPVOID param)
{
	PIMAGE_SECTION_HEADER pCodeSection;

	if (!GetSectionHeaderInfo(nullptr, ".text", pCodeSection)) return 0;

	const DWORD_PTR pCodeMemory = reinterpret_cast<DWORD_PTR>(GetModuleHandle(nullptr)) + pCodeSection->VirtualAddress;
	Pattern codeData = Pattern(reinterpret_cast<LPSTR>(pCodeMemory), pCodeMemory, pCodeSection->SizeOfRawData);

	// Pattern for the hooked function in .text
	const DWORD_PTR pParseWorldBossData = codeData.Find("\x8D\x5D\xD0\x8B\x45\xB0\x83\xEC\x04\x89\x9D\x6C\xFF\xFF\xFF\x8B\x55\xCC\x39\xD9\x0F\x84\xA7\x01\x00\x00\x8D\x75\xB8\x8B\x5D\xD0\x39\xF0\x0F\x84", "xx?xx?xx?xx????xx?xxxx????xx?xx?xxxx", Pattern::Default, 1);

	if (pParseWorldBossData == NULL) {
		MessageBox(nullptr, "Word Boss Data pattern was not found in the .text", "Failure", MB_ICONINFORMATION);
		return -1;
	}

	// We can now hook at pParseWorldBossData address and proceed with our haxx0r things

	return 0;
}
```


# And there it is
In the realm of reverse engineering and binary hooking, ensuring address stability is a fundamental challenge. The dynamic nature of address variations caused by factors like ASLR and code recompilation makes it impractical to rely on hard-coded addresses. By dynamically locating the target function within the binary's memory, we can reliably hook and modify functions, regardless of address variations.

I might give detouring a deeper focus in a next post, sooo... yeah :)