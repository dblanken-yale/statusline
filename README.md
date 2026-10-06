# statusline

A Claude Code status line that works in the terminal and the desktop app.

```
[Opus 5.5]  📁 my-project  |  🌿 main ●  |  ⚙ .claude
███░░░░░░░ 25%  |  Sess 40% ↻6:23PM  Wk 10% ↻Fri 6PM  |  +12 -3  |  ⏱  1m 5s
```

## What it shows

- **Line 1:** model, project folder, git branch with status dots (green staged, red unstaged, blue untracked), and which Claude config folder the session uses. In a Lando project it adds a clickable link to the local site.
- **Line 2:** context bar, then usage, lines changed, and session duration.
  - On a Claude subscription, usage is your 5-hour session and weekly limits, colored green, yellow, or red, with reset times.
  - With an API key or gateway, usage is dollar cost for the session, today, and this week, tracked locally in `~/.claude/cost-tracking`.

The context bar turns yellow at 60% and red at 80%, with a hint to compact or hand off.

In the desktop app the mod shows this as a single plain line under the prompt, leaving out what the app already shows (branch, context, usage limits, lines changed).

Needs `bash` and `jq`.

## Install

Run these in Claude Code:

```
/plugin marketplace add dblanken-yale/statusline
/plugin install statusline@statusline
```

Or from a terminal:

```bash
claude plugin marketplace add dblanken-yale/statusline
```

```bash
claude plugin install statusline@statusline
```

That covers the desktop app. For the terminal, also point `statusLine` in `~/.claude/settings.json` at the script the marketplace keeps:

```json
{
  "statusLine": {
    "type": "command",
    "command": "bash ~/.claude/plugins/marketplaces/statusline/statusline.sh"
  }
}
```

Start a new Claude Code session.

## Customize

Create `~/.claude/statusline.conf` (or point `CLAUDE_STATUSLINE_CONFIG` at another file). The script sources it after its defaults, so anything you set there wins and survives updates:

```bash
THRESHOLD_YELLOW=50
ICON_PROJECT="dir:"
detect_site_url() { :; }   # turn off the local site link
```

See the CONFIG block at the top of `statusline.sh` for everything you can set.

## Update

Turn on auto-update for the `statusline` marketplace in `/plugin` (Marketplaces tab), and new versions install when Claude Code starts. To update by hand:

```bash
claude plugin marketplace update statusline
```

The terminal status line reads the marketplace copy, so it updates along with it.

## Develop

```bash
git clone git@github.com:dblanken-yale/statusline.git ~/code/statusline
```

```bash
claude --plugin-dir ~/code/statusline
```

Disable the marketplace install while you do this, or the mod runs twice. To try script changes in the terminal, point `statusLine` at `~/code/statusline/statusline.sh`.

Bump `version` in `.claude-plugin/plugin.json` with every release. Installed copies only update when the version changes.

To check it after editing: `claude plugin validate ~/code/statusline` and `claude plugin test ~/code/statusline`.
