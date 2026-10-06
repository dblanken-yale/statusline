// Shows the bundled statusline.sh output through $.ui.status on the desktop app.
const ANSI = /\x1b\[[0-9;]*m/g
const OSC8 = /\x1b\]8;;[^\x07]*\x07/g
// Segments the desktop app already shows (git branch, context bar, Sess/Wk usage), the
// +N -N count, which we cannot supply, and the site link, which plain status text cannot
// make clickable.
const DROP = /^(🌿 |[█░]+ \d+%|(Sess|Wk) |\+\d+ -\d+$|🔗 )/
const MODEL = /^\[[^\]]*\]\s*/

let startedAt

async function refresh($, usage) {
  try {
    // The terminal already runs the script through settings.json statusLine.
    if ((await $.session.surfaces()).includes('terminal')) return
    const { context, rateLimits, cost } = usage
    const percent = context?.percent
    const input = {
      workspace: { current_dir: await $.session.cwd() },
      model: { display_name: await $.session.model() },
      session_id: await $.session.id(),
      cost: {
        total_cost_usd: cost?.usd ?? 0,
        total_duration_ms: (await $.clock.now()) - (usage.startedAt ?? startedAt ?? 0),
      },
      context_window: {
        ...(percent !== undefined && { used_percentage: percent, remaining_percentage: 100 - percent }),
      },
    }
    const limits = {}
    for (const r of rateLimits ?? []) {
      if (r.kind !== 'five_hour' && r.kind !== 'seven_day') continue
      limits[r.kind] = { used_percentage: r.percentUsed }
      if (r.resetsAt) limits[r.kind].resets_at = Math.floor(Date.parse(r.resetsAt) / 1000)
    }
    if (Object.keys(limits).length) input.rate_limits = limits

    const res = await $.process.run(['bash', `${$.plugin.root}/statusline.sh`], {
      stdin: JSON.stringify(input),
      timeoutMs: 5000,
    })
    if (res.exitCode !== 0) return
    const text = res.stdout
      .replace(OSC8, '')
      .replace(ANSI, '')
      .split(/\n|\s+\|\s+/)
      .map(seg => seg.trim().replace(MODEL, ''))
      .filter(seg => seg && !DROP.test(seg))
      .join('  |  ')
    await $.ui.status(text || undefined)
  } catch {
    // keep the previous status
  }
}

export function register(on) {
  on('session.start', async ($, e, next) => {
    try {
      const usage = await $.session.usage()
      startedAt = usage.startedAt
      await refresh($, usage)
    } catch {}
    return next(e)
  })
  on('session.measure', async ($, e, next) => {
    await refresh($, e)
    return next(e)
  })
}
