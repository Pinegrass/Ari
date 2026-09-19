import AsyncStorage from '@react-native-async-storage/async-storage';
import {apiRequest} from '../api/client';
import * as Crypto from 'expo-crypto';
import {measurementEpoch,setMeasurementEpoch,setMeasurementPrivate} from './measurementSession';

// First-party, explicit opt-in counts only. No third-party SDK, properties or replay.
let privateMode=true;
let privacyChoiceSet=false;
let allowed=false;
let generation=0;
let accountId:string|null=null;
// A single boot-only marker may wait for restored-session validation, never for opt-in.
let startupOpen = true;
const startupDeadline = Date.now() + 30_000;
let startupDelivery: string | null = null;
let restoredAccount: string | null = null;
let privacyInitialized = false;
function closeStartup(): void { startupOpen = false; startupDelivery = null; restoredAccount = null; }
function applyAllowed(enabled: boolean, epoch: string | null): void {
  generation++; allowed = enabled && !!epoch; setMeasurementEpoch(allowed ? epoch : null);
}
export function setMeasurementAllowed(enabled:boolean,epoch:string|null=null):void{
  closeStartup(); applyAllowed(enabled, epoch);
}
export function measurementRevision():number{return generation;}
export function applyMeasurementConsent(value:{enabled:boolean;consentEpoch:string|null},revision:number):boolean{
  if(revision!==generation)return false;
  setMeasurementAllowed(value.enabled,value.consentEpoch);return true;
}
export async function syncMeasurementConsent():Promise<void>{
  const current=++generation;
  try {
    const value=await apiRequest<{enabled:boolean;consentEpoch:string|null}>('/measurement/v2/consent');
    if(current!==generation)return;
    applyAllowed(value.enabled,value.consentEpoch);
    if(startupOpen && restoredAccount && restoredAccount===accountId && privacyInitialized){
      const delivery=startupDelivery, withinDeadline=Date.now()<=startupDeadline;
      closeStartup();
      if(delivery && withinDeadline)trackNotificationOpen({measurementDeliveryId:delivery});
    }
  } catch { if(current===generation){applyAllowed(false,null);closeStartup();} }
}
export async function initAnalytics():Promise<void>{
  try {
    const saved=await AsyncStorage.getItem('ari_private_mode');
    if(!privacyChoiceSet){privateMode=saved==='1';setMeasurementPrivate(privateMode);}
    privacyInitialized=true;
  } catch {closeStartup();return;}
  // AuthContext validates a restored identity first. Never fetch consent against
  // an unbound boot token and later apply it to an interactive login.
  if(accountId)await syncMeasurementConsent();
}
export function setPrivacyEnabled(enabled:boolean,source:'user'|'hydrate'='user'):void{
  if(source==='user')closeStartup();
  if(privateMode!==enabled)generation++;
  privacyChoiceSet=true;privateMode=enabled;setMeasurementPrivate(enabled);
}
export function isPrivacyEnabled():boolean{return privateMode;}
export function identifyUser(userId:string,_traits:Record<string,unknown>={}):void{
  closeStartup();
  if(accountId!==userId){applyAllowed(false,null);accountId=userId;}
  void syncMeasurementConsent();
}
/** Only the successful startup /auth/me path may bind the boot marker. */
export function identifyRestoredUser(userId:string):void{
  if(accountId && accountId!==userId){closeStartup();return;}
  accountId=userId;restoredAccount=startupOpen ? userId : null;applyAllowed(false,null);
  if(privacyInitialized)void syncMeasurementConsent();
}
export function resetAnalytics():void{closeStartup();accountId=null;applyAllowed(false,null);}
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
  const names:Record<string,string>={report_action_started:'report_action_started',periodic_report_viewed:'report_displayed',nudge_opened:'insight_opened',nudge_dismissed:'insight_dismissed',notification_preferences_updated:'notification_preferences_updated'};
  const epoch=measurementEpoch(),name=names[event],current=generation;
  if(!epoch||!name)return;
  const body=JSON.stringify({event:name,eventId:Crypto.randomUUID(),consentEpoch:epoch});
  // One immediate retry uses the same identity; no durable offline event queue.
  const send=()=>apiRequest('/measurement/v2/events',{method:'POST',body});
  void send().catch(error=>{
    const status=(error as {status?:number})?.status;
    if(current===generation&&measurementEpoch()===epoch&&(status===0||status===undefined||status>=500))return send().catch(()=>{});
  });
}
/** Records only a server-owned delivery marker observed while collection is allowed.
 * Local reminders and generic inbox interactions cannot supply the delivery denominator.
 * Never persist a tap or replay one after consent initialization/account changes.
 */
export function trackNotificationOpen(data: unknown): void {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return;
  const deliveryId = (data as Record<string, unknown>).measurementDeliveryId;
  if (typeof deliveryId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(deliveryId)) return;
  if (startupOpen && Date.now() <= startupDeadline && (!privacyInitialized || !restoredAccount || !allowed)) {
    if (!startupDelivery) startupDelivery = deliveryId;
    return;
  }
  if (privateMode || !allowed) return;
  const epoch = measurementEpoch(), current = generation;
  if (!epoch) return;
  const body = JSON.stringify({ deliveryId, consentEpoch: epoch });
  const send = () => apiRequest('/measurement/v2/notification-open', { method: 'POST', body });
  void send().catch(error => {
    const status = (error as { status?: number })?.status;
    if (!privateMode && allowed && current === generation && measurementEpoch() === epoch &&
        (status === 0 || status === undefined || status >= 500)) return send().catch(() => {});
  });
}
// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Legacy call-site helper. Measurement v2 discards all amount properties. */
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
