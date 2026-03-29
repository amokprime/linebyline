### Input
- linebyline-0.34.0.html
### Output
- linebyline-0.34.1.html and update version number
### Bugs
- The Main "( )" checkbox is right aligned unlike the Secondary "( )" - see checkbox.png
- Pressing Esc to cancel setting a hotkey allows setting Esc as a hotkey. Add Esc to the list of restricted keys and hardcode its current uses (including canceling setting a hotkey)
- Adjusting the volume increment Setting with the up/down tick arrow buttons still moves the volume slider. Adjusting it by typing a number in the field does not do this.
### Refinements
- Focus the main field after startup so users can Ctrl+V paste lyrics as soon as they Alt+Tab into LineByLine
- Rename "Mark as translation" to "Mark line as translation" and make it only affect one selected line in Hotkey mode, not just Typing mode; if multiple lines are selected, it should only
- Secondary "( )" checkboxes have no tooltip. Add one like "Wrap all secondary lines in parentheses"