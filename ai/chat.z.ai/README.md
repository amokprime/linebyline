#### Working with GLM (web chat Agent mode)

chat.z.ai's free tier is currently far more generous overall (than claude.ai) with some caveats
- I have noticed as many as 2k ads being blocked by uBlock Origin! It keeps ramping up over time.
- The website itself is often unresponsive even in Chromium browsers (I wonder why??). It may help to close the browser window and reopen the page (just reloading or closing the browser tab isn't always enough)
- A captcha slider randomly pops up sometimes
- Sandboxes expire after 2 hours. Typing something before it expires resets the timer to another 2 hours. If you see the "All files in task" box after the 2-hour mark, produced and even uploaded files (that don't show in the list) may still be there. Try sending a message like "Continue" to resume a cutoff chat.
- Uploads may fail to update if certain filenames like file.md and Memory.md are re-uploaded without renaming them or zipping them in a uniquely named folder
- Downgrade to a lower model, chats failing to submit or load or timing out, during peak hours. Use the 'previous flagship model' during off-peak hours to mitigate these issues.

A few issues are compensated for by my current workflow (see [[ai/chat.z.ai/Repomix snippets|Repomix snippets]] and [[ai/chat.z.ai/Vibecoding workflow|Vibecoding workflow]]) designed for GLM-5.1:
- For GLM-5.1 specifically, the ~200k context window means details may be swallowed in large uploads (e.g. a naive `repomix` of the whole repo, especially if not ignoring the massive `archive/`)
- There are no built-in skills or memory scaffolding to enforce a large amount of recurring behaviors

chat.z.ai also has a more recent bug where the same named zip file can persist across sandboxes. This prevents the agent from reading future uploaded zips of the same name. So I use [scripts](https://github.com/amokprime/linebyline/tree/main/ai/chat.z.ai/scripts/README.md) to generate the zip files with a unique name. Speculation: the bug could be related to being able to resume chats after 2 hours without losing files, which was not possible in the past.
