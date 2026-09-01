-- Engagement lifecycle signals and a lightweight, non-monetary referral loop.
-- Referral attribution is one-to-one: an account can name one inviter only.
ALTER TABLE ari_users
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_reactivation_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reactivation_stage INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_code TEXT,
  ADD COLUMN IF NOT EXISTS referred_by_user_id UUID REFERENCES ari_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_share_count INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS ari_users_referral_code_key
  ON ari_users (referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS ari_users_referred_by_idx
  ON ari_users (referred_by_user_id) WHERE referred_by_user_id IS NOT NULL;

ALTER TABLE ari_users
  DROP CONSTRAINT IF EXISTS ari_users_no_self_referral;
ALTER TABLE ari_users
  ADD CONSTRAINT ari_users_no_self_referral
  CHECK (referred_by_user_id IS NULL OR referred_by_user_id <> id);
