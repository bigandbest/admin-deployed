// src/Pages/Referral/Config/index.jsx
import { useState, useEffect } from "react";
import { getConfig, updateConfig } from "../../../utils/adminReferralApi";
import { Save, AlertCircle, CheckCircle } from "lucide-react";

export default function ReferralConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await getConfig();
      setConfig(res.config);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (field, value) => setConfig(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true); setError(""); setSuccess("");
    try {
      await updateConfig(config);
      setSuccess("Configuration saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Referral Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure the Refer & Earn program rules</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {success && (
        <div className="mb-5 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />{success}
        </div>
      )}
      {error && (
        <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}

      <div className="space-y-5">
        {/* Program */}
        <Card title="Program" desc="Enable or disable the entire referral program">
          <Row label="Enable Program" hint="Turns referral program on or off globally">
            <Toggle value={config?.is_enabled} onChange={v => set("is_enabled", v)} />
          </Row>
          <Row label="Program Name">
            <TextInput value={config?.program_name} onChange={v => set("program_name", v)} />
          </Row>
        </Card>

        {/* Rewards */}
        <Card title="Reward Amounts" desc="Cash credited to referrer and referee on successful referral">
          <Row label="Referrer Reward (₹)" hint="Amount credited to the person who referred">
            <NumInput value={config?.referrer_reward_amount} onChange={v => set("referrer_reward_amount", v)} />
          </Row>
          <Row label="Referee Reward (₹)" hint="Amount credited to the new user who signed up">
            <NumInput value={config?.referee_reward_amount} onChange={v => set("referee_reward_amount", v)} />
          </Row>
          <Row label="Max Earning Per User (₹)" hint="Lifetime cap on referral earnings per user">
            <NumInput value={config?.max_earning_per_user} onChange={v => set("max_earning_per_user", v)} />
          </Row>
          <Row label="Reward Validity (Days)" hint="Rewards expire after this many days">
            <NumInput value={config?.reward_validity_days} onChange={v => set("reward_validity_days", v)} min={1} />
          </Row>
        </Card>

        {/* Order */}
        <Card title="Order Requirements" desc="Rules for qualifying orders">
          <Row label="Minimum Order Value (₹)" hint="Referred friend's order must be at least this amount">
            <NumInput value={config?.min_order_value} onChange={v => set("min_order_value", v)} />
          </Row>
          <Row label="First Order Only" hint="Only credit reward when referee places their first order">
            <Toggle value={config?.applicable_first_order} onChange={v => set("applicable_first_order", v)} />
          </Row>
          <Row label="Return Window (Days)" hint="Rewards are credited after this window passes post-delivery">
            <NumInput value={config?.return_window_days} onChange={v => set("return_window_days", v)} min={0} />
          </Row>
        </Card>

        {/* Withdrawal */}
        <Card title="Withdrawal Settings" desc="Control how users can withdraw their referral earnings">
          <Row label="Enable Withdrawals" hint="If disabled, users cannot request withdrawals from the frontend">
            <Toggle value={config?.withdrawal_enabled !== false} onChange={v => set("withdrawal_enabled", v)} />
          </Row>
          <Row label="Minimum Withdrawal (₹)" hint="Users must have at least this much to withdraw">
            <NumInput value={config?.min_withdrawal_amount} onChange={v => set("min_withdrawal_amount", v)} />
          </Row>
          <Row label="Max Withdrawals Per Month" hint="Maximum withdrawal requests allowed per user per month">
            <NumInput value={config?.max_withdrawals_per_month} onChange={v => set("max_withdrawals_per_month", v)} min={1} />
          </Row>
        </Card>

        {/* Fraud */}
        <Card title="Fraud Prevention" desc="Protect the program from abuse">
          <Row label="Enable IP Tracking">
            <Toggle value={config?.enable_ip_tracking} onChange={v => set("enable_ip_tracking", v)} />
          </Row>
          <Row label="Max Referrals Per IP" hint="Maximum referral sign-ups allowed from one IP">
            <NumInput value={config?.max_referrals_per_ip} onChange={v => set("max_referrals_per_ip", v)} min={1} />
          </Row>
          <Row label="Cooldown Hours" hint="Hours between referral sign-ups from same IP">
            <NumInput value={config?.cooldown_hours} onChange={v => set("cooldown_hours", v)} min={0} />
          </Row>
        </Card>

        {/* Notifications */}
        <Card title="Notifications">
          <Row label="Enable Notifications">
            <Toggle value={config?.enable_notifications} onChange={v => set("enable_notifications", v)} />
          </Row>
          <Row label="Expiry Reminder (Hours Before)" hint="Send notification this many hours before reward expires">
            <NumInput value={config?.reminder_before_expiry} onChange={v => set("reminder_before_expiry", v)} />
          </Row>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, desc, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
        <h2 className="font-semibold text-gray-900 text-sm">{title}</h2>
        {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
      </div>
      <div className="divide-y divide-gray-50">{children}</div>
    </div>
  );
}

function Row({ label, hint, children }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 ${value ? "bg-gray-900" : "bg-gray-200"}`}
    >
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? "translate-x-7" : "translate-x-1"}`} />
    </button>
  );
}

function TextInput({ value, onChange }) {
  return (
    <input
      type="text"
      value={value || ""}
      onChange={e => onChange(e.target.value)}
      className="px-3 py-2 border border-gray-200 rounded-xl text-sm w-52 focus:outline-none focus:ring-2 focus:ring-gray-400"
    />
  );
}

function NumInput({ value, onChange, min = 0 }) {
  return (
    <input
      type="number"
      value={value ?? 0}
      min={min}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      className="px-3 py-2 border border-gray-200 rounded-xl text-sm w-32 focus:outline-none focus:ring-2 focus:ring-gray-400 text-right"
    />
  );
}
