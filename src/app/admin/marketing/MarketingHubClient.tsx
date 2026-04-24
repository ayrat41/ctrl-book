"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone,
  BarChart3,
  Plus,
  X,
  Tag,
  TrendingUp,
  Users,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createMarketingCampaign } from "./marketing-actions";

type Campaign = {
  id: string;
  name: string;
  code: string | null;
  channel: string | null;
  adjustmentType: string;
  adjustmentValue: number;
  currentUses: number;
  maxUses: number | null;
  isActive: boolean;
  validFrom: string | null;
  validTo: string | null;
};

type AnalyticsRow = {
  source: string;
  bookings: number;
  revenue: number;
};

const CHANNEL_OPTIONS = [
  "Instagram",
  "Google",
  "Facebook",
  "TikTok",
  "Email",
  "Referral",
  "Other",
];

export default function MarketingHubClient({
  campaigns,
  analytics,
}: {
  campaigns: Campaign[];
  analytics: AnalyticsRow[];
}) {
  const [activeTab, setActiveTab] = useState<"campaigns" | "analytics">(
    "campaigns",
  );
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [localCampaigns, setLocalCampaigns] = useState<Campaign[]>(campaigns);

  const totalRevenue = analytics.reduce((acc, r) => acc + r.revenue, 0);
  const totalBookings = analytics.reduce((acc, r) => acc + r.bookings, 0);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateCampaign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    const form = e.currentTarget;
    const fd = new FormData(form);

    const result = await createMarketingCampaign(fd);
    if (result.success && result.rule) {
      setLocalCampaigns((prev) => [result.rule as Campaign, ...prev]);
      setShowModal(false);
      form.reset();
    } else {
      setSaveError(result.error || "Failed to create campaign.");
    }
    setSaving(false);
  };

  const formatAdjustment = (type: string, value: number) => {
    if (type === "percentage") {
      return value < 0 ? `${Math.abs(value)}% off` : `+${value}%`;
    }
    if (type === "fixed_amount") {
      return value < 0 ? `-$${Math.abs(value).toFixed(0)}` : `+$${value.toFixed(0)}`;
    }
    return `$${value.toFixed(0)} fixed`;
  };

  const getUsagePct = (current: number, max: number | null) => {
    if (!max) return null;
    return Math.round((current / max) * 100);
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
              <Megaphone className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">
              Marketing Hub
            </h1>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 ml-14">
            Manage campaigns and track attribution
          </p>
        </div>

        {activeTab === "campaigns" && (
          <button
            id="new-campaign-btn"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-black dark:bg-brand-latte text-brand-latte dark:text-brand-black font-bold text-sm rounded-xl shadow-lg hover:opacity-80 transition-all"
          >
            <Plus className="w-4 h-4" /> New Campaign
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-white/40 dark:bg-brand-latte/5 p-1 rounded-2xl w-fit shadow-inner border border-white/20 dark:border-white/5">
        {(["campaigns", "analytics"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all capitalize",
              activeTab === tab
                ? "bg-brand-black text-brand-latte dark:bg-brand-latte dark:text-brand-black shadow-md"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100",
            )}
          >
            {tab === "campaigns" ? (
              <Tag className="w-4 h-4" />
            ) : (
              <BarChart3 className="w-4 h-4" />
            )}
            {tab === "campaigns" ? "Campaigns" : "Performance Analytics"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* CAMPAIGNS TAB */}
        {activeTab === "campaigns" && (
          <motion.div
            key="campaigns"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {localCampaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-black/10 dark:border-white/10 rounded-3xl">
                <Tag className="w-10 h-10 opacity-20 mb-4" />
                <p className="font-bold opacity-40 text-lg">
                  No campaigns yet
                </p>
                <p className="text-sm opacity-30 mt-1">
                  Click &ldquo;New Campaign&rdquo; to get started
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/60 dark:bg-brand-latte/5 border-b border-black/5 dark:border-white/5">
                      <th className="text-left px-6 py-4 font-black text-xs uppercase tracking-widest opacity-50">
                        Campaign
                      </th>
                      <th className="text-left px-6 py-4 font-black text-xs uppercase tracking-widest opacity-50">
                        Code
                      </th>
                      <th className="text-left px-6 py-4 font-black text-xs uppercase tracking-widest opacity-50">
                        Channel
                      </th>
                      <th className="text-left px-6 py-4 font-black text-xs uppercase tracking-widest opacity-50">
                        Discount
                      </th>
                      <th className="text-left px-6 py-4 font-black text-xs uppercase tracking-widest opacity-50">
                        Usage
                      </th>
                      <th className="text-left px-6 py-4 font-black text-xs uppercase tracking-widest opacity-50">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {localCampaigns.map((campaign, i) => {
                      const usagePct = getUsagePct(
                        campaign.currentUses,
                        campaign.maxUses,
                      );
                      return (
                        <tr
                          key={campaign.id}
                          className={cn(
                            "border-b border-black/5 dark:border-white/5 hover:bg-white/50 dark:hover:bg-white/5 transition-colors",
                            i % 2 === 0
                              ? "bg-white/20 dark:bg-transparent"
                              : "bg-transparent",
                          )}
                        >
                          <td className="px-6 py-4 font-bold">{campaign.name}</td>
                          <td className="px-6 py-4">
                            {campaign.code ? (
                              <button
                                onClick={() => handleCopyCode(campaign.code!)}
                                className="flex items-center gap-2 font-mono bg-black/5 dark:bg-white/10 px-3 py-1.5 rounded-lg hover:bg-black/10 transition-colors group"
                                title="Copy code"
                              >
                                <span className="font-bold tracking-widest text-xs">
                                  {campaign.code}
                                </span>
                                {copiedCode === campaign.code ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                ) : (
                                  <Copy className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                                )}
                              </button>
                            ) : (
                              <span className="opacity-30">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {campaign.channel ? (
                              <span className="px-2.5 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold text-xs rounded-full">
                                {campaign.channel}
                              </span>
                            ) : (
                              <span className="opacity-30">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-green-600 dark:text-green-400">
                              {formatAdjustment(
                                campaign.adjustmentType,
                                campaign.adjustmentValue,
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-sm">
                                {campaign.currentUses}
                                {campaign.maxUses
                                  ? ` / ${campaign.maxUses}`
                                  : " / ∞"}
                              </span>
                              {usagePct !== null && (
                                <div className="w-20 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                                  <div
                                    className={cn(
                                      "h-full rounded-full transition-all",
                                      usagePct >= 90
                                        ? "bg-red-500"
                                        : usagePct >= 60
                                          ? "bg-amber-500"
                                          : "bg-green-500",
                                    )}
                                    style={{ width: `${usagePct}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={cn(
                                "px-2.5 py-1 text-xs font-bold rounded-full",
                                campaign.isActive
                                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                  : "bg-red-500/10 text-red-600 dark:text-red-400",
                              )}
                            >
                              {campaign.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: DollarSign,
                  label: "Total Revenue",
                  value: `$${totalRevenue.toFixed(0)}`,
                  color: "from-green-500 to-emerald-600",
                },
                {
                  icon: Users,
                  label: "Attributed Bookings",
                  value: totalBookings.toString(),
                  color: "from-blue-500 to-indigo-600",
                },
                {
                  icon: TrendingUp,
                  label: "Active Channels",
                  value: analytics.length.toString(),
                  color: "from-purple-500 to-pink-600",
                },
              ].map(({ icon: Icon, label, value, color }) => (
                <div
                  key={label}
                  className="bg-white/40 dark:bg-brand-latte/5 border border-white/30 dark:border-white/5 rounded-2xl p-6 shadow-sm"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-md",
                      color,
                    )}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest opacity-50 mb-1">
                    {label}
                  </p>
                  <p className="text-3xl font-black">{value}</p>
                </div>
              ))}
            </div>

            {/* Analytics Table */}
            {analytics.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-black/10 dark:border-white/10 rounded-3xl">
                <BarChart3 className="w-10 h-10 opacity-20 mb-4" />
                <p className="font-bold opacity-40 text-lg">
                  No attribution data yet
                </p>
                <p className="text-sm opacity-30 mt-1">
                  Bookings with UTM parameters will appear here
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/60 dark:bg-brand-latte/5 border-b border-black/5 dark:border-white/5">
                      <th className="text-left px-6 py-4 font-black text-xs uppercase tracking-widest opacity-50">
                        Channel / Source
                      </th>
                      <th className="text-right px-6 py-4 font-black text-xs uppercase tracking-widest opacity-50">
                        Bookings
                      </th>
                      <th className="text-right px-6 py-4 font-black text-xs uppercase tracking-widest opacity-50">
                        Revenue
                      </th>
                      <th className="text-right px-6 py-4 font-black text-xs uppercase tracking-widest opacity-50">
                        Avg. Order
                      </th>
                      <th className="text-right px-6 py-4 font-black text-xs uppercase tracking-widest opacity-50">
                        Share
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.map((row, i) => {
                      const share =
                        totalRevenue > 0
                          ? (row.revenue / totalRevenue) * 100
                          : 0;
                      const avg =
                        row.bookings > 0 ? row.revenue / row.bookings : 0;
                      return (
                        <tr
                          key={row.source}
                          className={cn(
                            "border-b border-black/5 dark:border-white/5 hover:bg-white/50 dark:hover:bg-white/5 transition-colors",
                            i % 2 === 0
                              ? "bg-white/20 dark:bg-transparent"
                              : "bg-transparent",
                          )}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-2 h-8 rounded-full"
                                style={{
                                  background: `hsl(${(i * 47) % 360}, 70%, 55%)`,
                                }}
                              />
                              <span className="font-bold capitalize">
                                {row.source}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-semibold">
                            {row.bookings}
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-bold text-green-600 dark:text-green-400">
                            ${row.revenue.toFixed(0)}
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-semibold opacity-70">
                            ${avg.toFixed(0)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <div className="w-24 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${share}%`,
                                    background: `hsl(${(i * 47) % 360}, 70%, 55%)`,
                                  }}
                                />
                              </div>
                              <span className="font-bold text-xs w-12 text-right">
                                {share.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Campaign Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg border border-black/5 dark:border-white/10 overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/10">
                <h2 className="text-xl font-black">New Campaign</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCampaign} className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-widest opacity-60 mb-1.5">
                      Campaign Name *
                    </label>
                    <input
                      name="name"
                      required
                      placeholder="Summer Promo 2026"
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest opacity-60 mb-1.5">
                      Promo Code *
                    </label>
                    <input
                      name="code"
                      required
                      placeholder="SUMMER20"
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 font-mono font-bold text-sm uppercase focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest opacity-60 mb-1.5">
                      Channel
                    </label>
                    <select
                      name="channel"
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                    >
                      <option value="">— None —</option>
                      {CHANNEL_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest opacity-60 mb-1.5">
                      Discount Type *
                    </label>
                    <select
                      name="adjustmentType"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed_amount">Fixed Amount ($)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest opacity-60 mb-1.5">
                      Discount Value *
                    </label>
                    <input
                      name="adjustmentValue"
                      type="number"
                      required
                      step="0.01"
                      placeholder="e.g. 20 for 20% off"
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                    />
                    <p className="text-[10px] opacity-50 mt-1">
                      Enter positive number (20 = 20% off)
                    </p>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-widest opacity-60 mb-1.5">
                      Max Uses (optional)
                    </label>
                    <input
                      name="maxUses"
                      type="number"
                      placeholder="Leave blank for unlimited"
                      min="1"
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest opacity-60 mb-1.5">
                      Valid From
                    </label>
                    <input
                      name="validFrom"
                      type="date"
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest opacity-60 mb-1.5">
                      Valid To
                    </label>
                    <input
                      name="validTo"
                      type="date"
                      className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                    />
                  </div>
                </div>

                {saveError && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {saveError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 rounded-xl border border-black/10 dark:border-white/10 font-bold text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    id="save-campaign-btn"
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 rounded-xl bg-brand-black dark:bg-brand-latte text-brand-latte dark:text-brand-black font-bold text-sm disabled:opacity-50 hover:opacity-80 transition-all"
                  >
                    {saving ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      "Create Campaign"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
