export const TOGGLE_AI_FINDER_EVENT = 'coolsafe:toggle-ai-finder'

export function toggleAIFinder() {
  window.dispatchEvent(new CustomEvent(TOGGLE_AI_FINDER_EVENT))
}
