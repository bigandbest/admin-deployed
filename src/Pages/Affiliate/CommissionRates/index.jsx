import { useState, useEffect } from "react";
import { getCommissionRates, upsertCommissionRate, deleteCommissionRate, getConfig } from "../../../utils/adminAffiliateApi";
import { Plus, Trash2, Save, RefreshCw, Percent } from "lucide-react";

export default function CommissionRates() {
  const [categories, setCategories] = useState([]);
  const [defaultRate, setDefaultRate] = useState(5);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editRate, setEditRate] = useState("");
  const [addMode, setAddMode] = useState(false);
  const [newRate, setNewRate] = useState({ category_id: "", category_name: "", base_commission_rate: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [ratesRes, configRes] = await Promise.all([getCommissionRates(), getConfig()]);
      setCategories(ratesRes.data || []);
      setDefaultRate(configRes.data?.default_commission_rate || 5);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSave = async (cat) => {
    setSaving(true);
    try {
      await upsertCommissionRate({
        category_id: cat.id,
        category_name: cat.name,
        category_level: "category",
        base_commission_rate: parseFloat(editRate),
      });
      setEditingId(null);
      load();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (rateId) => {
    if (!window.confirm("Remove this commission rate? Default rate will apply.")) return;
    try {
      await deleteCommissionRate(rateId);
      load();
    } catch (e) { alert(e.message); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commission Rates</h1>
          <p className="text-sm text-gray-500">Set per-category commission rates. Default rate: <strong>{defaultRate}%</strong></p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Default rate info */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
        <Percent className="w-5 h-5 text-blue-500 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-800">Default Commission Rate: {defaultRate}%</p>
          <p className="text-xs text-blue-600 mt-0.5">Applied to categories without a custom rate. Change in Program Settings.</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-700">{categories.filter(c => c.commission).length} custom rates configured</span>
          <button onClick={() => setAddMode(!addMode)}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800">
            <Plus className="w-4 h-4" /> Add Rate
          </button>
        </div>

        {addMode && (
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Category</label>
              <select value={newRate.category_id}
                onChange={(e) => {
                  const cat = categories.find(c => c.id === e.target.value);
                  setNewRate(r => ({ ...r, category_id: e.target.value, category_name: cat?.name || "" }));
                }}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300">
                <option value="">Select category...</option>
                {categories.filter(c => !c.commission).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="w-32">
              <label className="text-xs text-gray-500 mb-1 block">Rate (%)</label>
              <input type="number" min="0" max="50" step="0.5"
                value={newRate.base_commission_rate}
                onChange={(e) => setNewRate(r => ({ ...r, base_commission_rate: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                placeholder="e.g. 8" />
            </div>
            <button disabled={saving || !newRate.category_id || !newRate.base_commission_rate}
              onClick={async () => {
                setSaving(true);
                try {
                  await upsertCommissionRate({ ...newRate, category_level: "category", base_commission_rate: parseFloat(newRate.base_commission_rate) });
                  setNewRate({ category_id: "", category_name: "", base_commission_rate: "" });
                  setAddMode(false);
                  load();
                } catch (e) { alert(e.message); }
                finally { setSaving(false); }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50">
              Save
            </button>
            <button onClick={() => setAddMode(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
          </div>
        )}

        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Category", "Commission Rate", "Status", "Actions"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {categories.filter(c => c.commission).map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-900">{cat.name}</td>
                <td className="px-5 py-3">
                  {editingId === cat.id ? (
                    <input type="number" min="0" max="50" step="0.5" value={editRate}
                      onChange={(e) => setEditRate(e.target.value)}
                      className="w-24 border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
                  ) : (
                    <span className="font-semibold text-gray-900">{cat.commission.base_commission_rate}%</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cat.commission.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {cat.commission.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {editingId === cat.id ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleSave(cat)} disabled={saving}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-xl text-xs font-medium hover:bg-green-700 disabled:opacity-50">
                        <Save className="w-3 h-3" /> Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs hover:bg-gray-50">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingId(cat.id); setEditRate(cat.commission.base_commission_rate); }}
                        className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs hover:bg-gray-50">Edit</button>
                      <button onClick={() => handleDelete(cat.commission.id)}
                        className="p-1.5 hover:bg-red-50 rounded-xl">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {categories.filter(c => c.commission).length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            No custom rates configured. All categories use the default {defaultRate}% rate.
          </div>
        )}
      </div>
    </div>
  );
}
