import AsyncStorage from '@react-native-async-storage/async-storage';
import {apiRequest} from '../api/client';

// First-party, explicit opt-in counts only. No third-party SDK, properties or replay.
let privateMode=true;
let privacyChoiceSet=false;
let allowed=false;
let generation=0;
let accountId:string|null=null;
export function setMeasurementAllowed(enabled:boolean):void{generation++;allowed=enabled;}
export async function syncMeasurementConsent():Promise<void>{
  const current=++generation;
  try{const value=await apiRequest<{enabled:boolean}>('/measurement/consent');if(current===generation)setMeasurementAllowed(value.enabled);}catch{if(current===generation)setMeasurementAllowed(false);}
}
export async function initAnalytics():Promise<void>{
  try{const saved=await AsyncStorage.getItem('ari_private_mode');if(!privacyChoiceSet)privateMode=saved==='1';}catch{return;}
  await syncMeasurementConsent();
}
export function setPrivacyEnabled(enabled:boolean):void{privacyChoiceSet=true;privateMode=enabled;}
export function isPrivacyEnabled():boolean{return privateMode;}
export function identifyUser(userId:string,_traits:Record<string,unknown>={}):void{
  if(accountId!==userId){setMeasurementAllowed(false);accountId=userId;}
  void syncMeasurementConsent();
}
export function resetAnalytics():void{accountId=null;setMeasurementAllowed(false);}
export type AnalyticsEvent =
  | 'app_opened'
  | 'app_foregrounded'
  | 'app_backgrounded'
  | 'auth_attempt'
  | 'auth_result'
  | 'login_success'
  | 'register_success'
  | 'consent_accepted'
  | 'account_deleted'
  | 'transaction_logged'
  | 'transaction_save_failed'
  | 'transaction_edited'
  | 'expense_logged'
  | 'expense_logged_voice'
  | 'expense_parsed_local'
  | 'expense_parsed_ai'
  | 'budget_created'
  | 'goal_created'
  | 'bill_created'
  | 'bill_updated'
  | 'bill_deleted'
  | 'bill_reminder_opened'
  | 'push_opened'
  | 'onboarding_started'
  | 'onboarding_step_completed'
  | 'onboarding_step_skipped'
  | 'onboarding_completed'
  | 'onboarding_first_transaction'
  | 'paywall_viewed'
  | 'pro_purchase_initiated'
  | 'pro_purchase_completed'
  | 'pro_purchase_failed'
  | 'pro_purchase_cancelled'
  | 'subscription_started'
  | 'tomo_message_sent'
  | 'tomo_response_received'
  | 'group_created'
  | 'group_joined'
  | 'group_expense_added'
  | 'split_settled_upi'
  | 'split_settled_cash'
  | 'brief_opened'
  | 'brief_dismissed'
  | 'nudge_presented'
  | 'nudge_opened'
  | 'nudge_action_started'
  | 'nudge_action_completed'
  | 'nudge_dismissed'
  | 'nudge_checkins_enabled'
  | 'nudge_checkins_disabled'
  | 'engagement_card_opened'
  | 'report_action_started'
  | 'planning_saved'
  | 'trial_started'
  | 'language_changed'
  | 'notification_preferences_updated'
  | 'periodic_report_viewed'
  | 'referral_shared'
  | 'referral_redeemed'
  | 'private_mode_toggled'
  | 'country_changed'
  | 'aa_consent_started'
  | 'aa_consent_completed'
  | 'ota_check_started'
  | 'ota_check_uptodate'
  | 'ota_update_available'
  | 'ota_update_staged'
  | 'ota_check_failed'
  | 'ota_update_applied'
  | 'ssl_pin_validation_failed'
  | 'sync_failed'
  | 'sync_stuck'
  | 'sync_queue_depth';

export function track(event:AnalyticsEvent,_props:Record<string,unknown>={}):void{
  if(privateMode||!allowed)return;
  const names:Record<string,string>={report_action_started:'report_action_started',planning_saved:'planning_saved',trial_started:'trial_started',periodic_report_viewed:'report_opened',nudge_opened:'insight_opened',nudge_dismissed:'insight_dismissed',transaction_logged:'transaction_logged',notification_preferences_updated:'notification_preferences_updated'};
  if(names[event])void apiRequest('/measurement/events',{method:'POST',body:JSON.stringify({event:names[event]})}).catch(()=>{});
}
// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Bucket an amount into a coarse band. Buckets are calibrated to cover
 * typical personal-finance ranges so the histogram across users is balanced and
 * actionable — most expenses fall in 100–2k, salaries land in 50k+.
 *
 * Reasons we bucket instead of sending raw amounts:
 *   1. PII minimisation (DPDPA-friendly)
 *   2. Cohort-friendly aggregation in PostHog
 *   3. Compresses the long tail of vehicle / rent / EMI amounts
 */
export function bucketAmount(amount: number): string {
  if (amount < 100) return '0-100';
  if (amount < 500) return '100-500';
  if (amount < 2_000) return '500-2k';
  if (amount < 10_000) return '2k-10k';
  if (amount < 50_000) return '10k-50k';
  if (amount < 2_00_000) return '50k-2L';
  if (amount < 10_00_000) return '2L-10L';
  return '10L+';
}
