/** Supabase Realtime channel names must be unique per subscription; reused names return an already-subscribed channel and `.on()` fails after `subscribe()`. */
export function uniqueRealtimeTopic(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
