#### Working with GLM (web chat Agent mode)

chat.z.ai's free tier is currently far more generous overall (than claude.ai) with some caveats
- I have noticed as many as 2k ads being blocked by uBlock Origin! It keeps ramping up over time.
- The website itself is often unresponsive even in Chromium browsers (I wonder why??). It may help to close the browser window and reopen the page (just reloading or closing the browser tab isn't always enough)
- A captcha slider randomly pops up sometimes
- Sandboxes expire after 2 hours. Typing something before it expires resets the timer to another 2 hours. Sometimes the agent can recover generated files anyway. Try sending a message like "Continue" to resume a cutoff chat.
- Uploads may fail to update if certain filenames like file.md and Memory.md are re-uploaded without renaming them or zipping them in a uniquely named folder
- Downgrade to a lower model, chats failing to submit or load or timing out, during peak hours. Use the 'previous flagship model' during off-peak hours to mitigate these issues.

The website does not automatically inject memories, skills, project instructions, etc. — it just exposes chat messages and uploads. So my current workflow (see [[ai/chat.z.ai/Repomix snippets|Repomix snippets]] and [[ai/chat.z.ai/Vibecoding workflow|Vibecoding workflow]]) splits work into steps, each one uploading context files just-in-time with a chat instruction to read/re-read relevant files.

chat.z.ai also had a more recent bug where the same named zip file can persist across sandboxes. This prevents the agent from reading future uploaded zips of the same name. So I use [scripts](https://github.com/amokprime/linebyline/tree/main/ai/chat.z.ai/scripts/README.md) to generate the zip files with a unique name.