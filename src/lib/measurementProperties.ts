/** Behavioral metadata only. No financial amounts, categories, identifiers or free text. */
const KEYS = new Set(['period','language','has_data','action','provider','flow','stage','platform','outcome','error_code','reason','queued','status','type','entry_type','parse_source','confidence','merchant_known','day_of_week','has_note','cadence','source_screen','current_tier','tier','active','experiment_variant','trigger','band','source','step','step_name','screen','duration_bucket','notification_type']);
export function measurementProperties(input: Record<string, unknown>): Record<string, string | number | boolean | null> {
  const result: Record<string, string | number | boolean | null> = {};
  for (const [key,value] of Object.entries(input)) {
    if (!KEYS.has(key)) continue;
    if (value === null || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) result[key] = value;
    // Closed-style enum codes only; exclude prose, addresses, URLs and identifiers.
    else if (typeof value === 'string' && /^[a-z][a-z0-9_]{0,47}$/i.test(value)) result[key] = value;
  }
  return result;
}
