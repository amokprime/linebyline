###### How to use:
- Install AutoHotkey v2+ if you don't have it
- Open seinopsys.ahk in a text editor and see comments for things to configure
- Use Windows Spy to remap coordinates if your screen resolution is not 1920x1080
	- Scripts use Screen coordinates under Mouse Position
- Double click seinopsys.ahk to run it (not library.ahk) and open a browser to the website
	- By default it closes when the browser does
	- If it does not, use Win+F or right click tray icon → Exit
###### Limitations: 
- Timestamp hotkeys only work in timestamp fields
- Each GUI button press has an animation time. Each AutoHotkey hotkey has a built in delay of at least 100ms to account for UI response lag. These delays add up for large timestamp shifts like +-1000ms.
- (As far as I can tell) the website can't a) batch sync all timestamps or b) use a negative `[offset: ]` metadata tag
	- When I asked Claude for a simple tool for a), it created one without prompting: lrc-offset-tool.html. I was expecting to learn yet another workaround (the last time I checked there was one involving converting between .lrc and .srt to take advantage of more powerful .srt editing options). It then occurred to me that I could add a lot of different features that way...