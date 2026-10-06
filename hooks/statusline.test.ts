import { test, expect } from 'claude-code/testing'

const STDOUT =
  '\x1b[33m[Fable 5.1]\x1b[0m  📁 proj  |  🌿 main \x1b[31m●\x1b[0m  |  ⚙ .claude  |  🔗 \x1b]8;;http://x\x07http://x\x1b]8;;\x07\n' +
  '\x1b[32m███░░░░░░░\x1b[0m 25%  \x1b[33m↯ consider compacting\x1b[0m  |  \x1b[32mSess 40%\x1b[0m ↻6:23PM  Wk 10% ↻Fri 6PM  |  \x1b[32m+0\x1b[0m \x1b[31m-0\x1b[0m  |  ⏱  1m 5s\n'

function setup($: any, on: any, surfaces: string[] = ['desktop']) {
  const seen: { stdin?: string; status?: string; argv?: string[] } = {}
  on('session.surfaces', () => ({ value: surfaces }))
  on('session.cwd', () => ({ value: '/work' }))
  on('session.model', () => ({ value: 'opus' }))
  on('session.id', () => ({ value: 'sid' }))
  on('clock.now', () => ({ value: 5000 }))
  on('process.run', (_$: any, e: any) => {
    seen.stdin = e.init?.stdin
    seen.argv = e.argv
    return { value: { exitCode: 0, stdout: STDOUT, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('ui.status', (_$: any, e: any) => { seen.status = e.text; return { value: undefined } })
  on('session.measure', (_$: any, e: any) => ({ changed: e.changed }))
  return seen
}

const measure = (rateLimits: any[]) => ({
  context: { window: 200000, percent: 25 },
  rateLimits,
  changed: ['rateLimits'] as any,
})

test('five_hour limit gets epoch-seconds resets_at and clean status', async ($, on) => {
  const seen = setup($, on)
  await $.session.measure(measure([{ kind: 'five_hour', percentUsed: 40, resetsAt: '2026-10-01T12:00:00Z' }]))
  const input = JSON.parse(seen.stdin!)
  expect(input.rate_limits.five_hour.resets_at).toBe(Date.parse('2026-10-01T12:00:00Z') / 1000)
  expect(input.context_window.remaining_percentage).toBe(75)
  expect(seen.argv![1]).toMatch(/\/statusline\.sh$/)
  expect(seen.status).toBe('📁 proj  |  ⚙ .claude  |  ⏱  1m 5s')
})

test('empty rateLimits omits rate_limits', async ($, on) => {
  const seen = setup($, on)
  await $.session.measure(measure([]))
  expect('rate_limits' in JSON.parse(seen.stdin!)).toBe(false)
})

test('terminal session leaves the status to settings.json', async ($, on) => {
  const seen = setup($, on, ['terminal'])
  await $.session.measure(measure([]))
  expect(seen.stdin).toBeUndefined()
  expect(seen.status).toBeUndefined()
})

test('active_duration_ms sums main-loop turns and ignores subagents', async ($, on) => {
  const seen = setup($, on)
  on('session.usage', () => ({ value: { context: { window: 200000, percent: 25 } } }))
  on('turn.complete', () => ({ text: '' }) as any)
  for (const t of [{ durationMs: 30000 }, { durationMs: 45000 }, { durationMs: 99000, agentId: 'a' }]) {
    await $.turn.complete({ turnId: 't', answer: '', ...t } as any)
  }
  expect(JSON.parse(seen.stdin!).cost.active_duration_ms).toBe(75000)
})
