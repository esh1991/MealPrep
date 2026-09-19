# Giving Claude Code read-only access to the database

One minute, done once. After this I can look at the tables myself instead of asking you to run SQL and paste the output.

It is read-only. Nothing can be changed, dropped or written, in MealPrep's schema or anyone else's.

`.mcp.json` in this repo already points at the right project. All that is missing is you logging in.

---

## Step by step

**1. Open a normal terminal.**

Press the Windows key, type `terminal`, open **Windows Terminal** (or **PowerShell**, either is fine).

This has to be a real terminal window. The Claude panel inside VS Code cannot complete the login step.

**2. Go to the project folder.**

Paste this and press Enter:

```
cd "C:\Users\esh19\OneDrive\Desktop\Projects\Meal Prep"
```

**3. Start Claude Code.**

```
claude
```

If it asks whether you trust the files in this folder, choose yes.

**4. Approve the project's server.**

Because `.mcp.json` is new, Claude Code asks something like *"This project has an MCP server. Use it?"* Choose **Yes** / **Use this server**.

If no prompt appears, carry on to the next step anyway.

**5. Open the server list.**

Type this and press Enter:

```
/mcp
```

A list appears with `supabase` in it.

**6. Authenticate.**

Use the arrow keys to highlight `supabase`, press Enter, then choose **Authenticate**.

Your browser opens on a Supabase page asking you to allow access. Log in as usual and approve it.

**7. Check it worked.**

Back in the terminal, `/mcp` should now show `supabase` as **connected**.

**8. Close the terminal.**

Press `Ctrl+C` twice, or type `/exit`.

**9. Restart the Claude session in VS Code.**

Start a new chat in the VS Code panel. Connections are picked up when a session starts, so the one already running will not see it.

Then tell me it is connected and I will take it from there.

---

## If something goes wrong

**`claude` is not recognised.** The command line tool is at `C:\Users\esh19\AppData\Roaming\npm\claude`. Either use that full path, or reinstall with `npm install -g @anthropic-ai/claude-code`.

**No `supabase` entry under `/mcp`.** You are probably in the wrong folder. Check that `dir .mcp.json` finds the file.

**The browser page errors.** Make sure you are logged into the Supabase account that owns the project, in that browser.
