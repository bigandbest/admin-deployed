import { useState, useEffect } from "react";
import { getConfig, updateConfig } from "../../../utils/adminAffiliateApi";
import { Save, RefreshCw } from "lucide-react";

export default function AffiliateConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getConfig();
      setConfig(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateConfig(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const set = (key, val) => setConfig((c) => ({ ...c, [key]: val }));

  if (loading || !config) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const Field = ({ label, desc, children }) => (
    <div className="flex items-start justify-between py-4 border-b border-gray-50 last:border-0">
      <div className="flex-1 pr-8">
        <div className="text-sm font-medium text-gray-900">{label}</div>
        {desc && <div className="text-xs text-gray-500 mt-0.5">{desc}</div>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );

  const Toggle = ({ value, onChange }) => (
    <button onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors ${value ? "bg-gray-900" : "bg-gray-200"}`}>
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );

  const NumInput = ({ value, onChange, min, max, step = 1 }) => (
    <input type="number" value={value} onChange={(e) => onChange(e.target.value)} min={min} max={max} step={step}
      className="w-28 border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-gray-300" />
  );

  return (
    <div className="p-6 space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Program Settings</h1>
          <p className="text-sm text-gray-500">Configure the affiliate program</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={handleSave} disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors
              ${saved ? "bg-green-600 text-white" : "bg-gray-900 text-white hover:bg-gray-800"} disabled:opacity-50`}>
            <Save className="w-4 h-4" /> {saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 px-5 py-2">
        <h2 className="text-xs font-semibold text-gray-400 uppercase py-3">General</h2>
        <Field label="Program Enabled" desc="Enable or disable the affiliate program">
          <Toggle value={config.is_enabled} onChange={(v) => set("is_enabled", v)} />
        </Field>
        <Field label="Program Name" desc="Displayed to affiliates">
          <input value={config.program_name || ""} onChange={(e) => set("program_name", e.target.value)}
            className="w-48 border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
        </Field>
        <Field label="Auto-Approve Applications" desc="Automatically approve all applications">
          <Toggle value={config.auto_approve} onChange={(v) => set("auto_approve", v)} />
        </Field>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 px-5 py-2">
        <h2 className="text-xs font-semibold text-gray-400 uppercase py-3">Commission</h2>
        <Field label="Default Commission Rate (%)" desc="Applied to categories without a custom rate">
          <NumInput value={config.default_commission_rate} onChange={(v) => set("default_commission_rate", v)} min={0} max={50} step={0.5} />
        </Field>
        <Field label="Enable Tier Bonuses" desc="Add bonus % based on affiliate tier">
          <Toggle value={config.enable_tier_bonuses} onChange={(v) => set("enable_tier_bonuses", v)} />
        </Field>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 px-5 py-2">
        <h2 className="text-xs font-semibold text-gray-400 uppercase py-3">Tracking</h2>
        <Field label="Cookie Duration (hours)" desc="How long the affiliate cookie lasts">
          <NumInput value={config.cookie_duration_hours} onChange={(v) => set("cookie_duration_hours", parseInt(v))} min={1} max={720} />
        </Field>
        <Field label="Block Self-Referral" desc="Prevent affiliates from earning on their own purchases">
          <Toggle value={config.block_self_referral} onChange={(v) => set("block_self_referral", v)} />
        </Field>
        <Field label="Commission Hold Days" desc="Days after delivery before commission is approved">
          <NumInput value={config.commission_hold_days} onChange={(v) => set("commission_hold_days", parseInt(v))} min={0} max={30} />
        </Field>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 px-5 py-2">
        <h2 className="text-xs font-semibold text-gray-400 uppercase py-3">Payouts</h2>
        <Field label="Minimum Payout (₹)" desc="Minimum balance to request a payout">
          <NumInput value={config.minimum_payout_amount} onChange={(v) => set("minimum_payout_amount", v)} min={0} step={50} />
        </Field>
        <Field label="Payout Day of Month" desc="Day each month when payouts are processed">
          <NumInput value={config.payout_day_of_month} onChange={(v) => set("payout_day_of_month", parseInt(v))} min={1} max={28} />
        </Field>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 px-5 py-2">
        <h2 className="text-xs font-semibold text-gray-400 uppercase py-3">Tax (TDS)</h2>
        <Field label="Enable TDS" desc="Deduct TDS from commission payouts">
          <Toggle value={config.enable_tds} onChange={(v) => set("enable_tds", v)} />
        </Field>
        <Field label="TDS Threshold (₹/year)" desc="Yearly earnings above which TDS applies">
          <NumInput value={config.tds_threshold} onChange={(v) => set("tds_threshold", v)} min={0} step={1000} />
        </Field>
        <Field label="TDS Rate with PAN (%)" desc="">
          <NumInput value={config.tds_rate_with_pan} onChange={(v) => set("tds_rate_with_pan", v)} min={0} max={30} step={0.5} />
        </Field>
        <Field label="TDS Rate without PAN (%)" desc="">
          <NumInput value={config.tds_rate_without_pan} onChange={(v) => set("tds_rate_without_pan", v)} min={0} max={30} step={0.5} />
        </Field>
      </div>
    </div>
  );
}
