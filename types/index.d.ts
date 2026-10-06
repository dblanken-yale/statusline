declare module 'claude-code' {
  interface PluginState {
    statusline: {
      /** Sum of main-loop turn durations, in ms (desktop only). */
      activeMs: number
    }
  }
}
