"use client";

import React, { useState, useEffect } from "react";
import { TenantConfig, ThemePreset, THEME_PRESETS } from "@/lib/models/tenant";

export default function AdminDashboard() {
  const [tenants, setTenants] = useState<TenantConfig[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("k-luxe");
  const [activeTab, setActiveTab] = useState<"theme" | "shopify" | "features">("theme");
  const [previewScreen, setPreviewScreen] = useState<"home" | "pdp" | "cart">("home");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Form State
  const [currentConfig, setCurrentConfig] = useState<TenantConfig | null>(null);

  // Shopify Connection Test State
  const [testingShopify, setTestingShopify] = useState<boolean>(false);
  const [shopifyTestResult, setShopifyTestResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    shop?: any;
  } | null>(null);

  // Fetch Tenants on Mount
  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/tenants");
      const data = await res.json();
      if (data.success && data.tenants.length > 0) {
        setTenants(data.tenants);
        const current = data.tenants.find((t: TenantConfig) => t.id === selectedTenantId) || data.tenants[0];
        setSelectedTenantId(current.id);
        setCurrentConfig(current);
      }
    } catch (err) {
      console.error("Failed to load tenants", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTenant = (id: string) => {
    setSelectedTenantId(id);
    const found = tenants.find((t) => t.id === id);
    if (found) {
      setCurrentConfig(found);
      setShopifyTestResult(null);
    }
  };

  const handleApplyPreset = (presetKey: ThemePreset) => {
    if (!currentConfig) return;
    const preset = THEME_PRESETS[presetKey];
    setCurrentConfig({
      ...currentConfig,
      themePreset: presetKey,
      branding: {
        ...currentConfig.branding,
        ...preset,
      },
    });
  };

  const handleSave = async () => {
    if (!currentConfig) return;
    try {
      setSaving(true);
      setSaveMessage(null);
      const res = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentConfig),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMessage("✓ Settings saved and deployed live!");
        fetchTenants();
        setTimeout(() => setSaveMessage(null), 4000);
      } else {
        alert("Failed to save: " + data.error);
      }
    } catch (err: any) {
      alert("Error saving: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestShopify = async () => {
    if (!currentConfig?.shopifyStoreDomain || !currentConfig?.storefrontAccessToken) {
      alert("Please enter both Shopify Store Domain and Storefront Access Token.");
      return;
    }

    try {
      setTestingShopify(true);
      setShopifyTestResult(null);
      const res = await fetch("/api/admin/shopify/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeDomain: currentConfig.shopifyStoreDomain,
          storefrontAccessToken: currentConfig.storefrontAccessToken,
        }),
      });
      const data = await res.json();
      setShopifyTestResult(data);
    } catch (err: any) {
      setShopifyTestResult({
        success: false,
        message: "Failed to probe Shopify: " + err.message,
      });
    } finally {
      setTestingShopify(false);
    }
  };

  if (loading || !currentConfig) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0C0D0E] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E5A93C] border-t-transparent"></div>
          <span className="text-xs uppercase tracking-widest text-zinc-400">Loading BFF Control Center...</span>
        </div>
      </div>
    );
  }

  const { branding, features } = currentConfig;

  return (
    <div className="min-h-screen bg-[#0C0D0E] text-zinc-100 antialiased">
      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-zinc-800 bg-[#121316]/90 px-6 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#E5A93C] to-[#9D4EDD] font-bold text-black shadow-lg shadow-[#E5A93C]/10">
              ⚡
            </div>
            <div>
              <span className="font-bold tracking-tight text-white">K-LUXE</span>
              <span className="ml-2 rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">BFF DASHBOARD</span>
            </div>
          </div>

          <div className="hidden h-5 w-px bg-zinc-800 md:block"></div>

          {/* Tenant Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-400">Merchant Store:</span>
            <select
              value={selectedTenantId}
              onChange={(e) => handleSelectTenant(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#E5A93C]"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.slug})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className="animate-fade-in text-xs font-semibold text-emerald-400">
              {saveMessage}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E5A93C] to-[#DF9626] px-5 py-2 text-xs font-bold uppercase tracking-wider text-black shadow-md shadow-[#E5A93C]/20 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
          >
            {saving ? "Deploying..." : "Save & Publish"}
          </button>
        </div>
      </header>

      {/* ── Main Layout: Controls (Left) + Phone Mockup (Right) ── */}
      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-8 p-6 lg:grid-cols-12 lg:p-8">
        
        {/* Left Settings Panel (7 Cols) */}
        <section className="space-y-6 lg:col-span-7">
          
          {/* Tab Navigation */}
          <div className="flex border-b border-zinc-800 pb-1">
            <button
              onClick={() => setActiveTab("theme")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
                activeTab === "theme"
                  ? "border-[#E5A93C] text-white"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              🎨 Theme & Dynamic Styling
            </button>
            <button
              onClick={() => setActiveTab("shopify")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
                activeTab === "shopify"
                  ? "border-[#E5A93C] text-white"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              🛍️ Shopify Storefront API
            </button>
            <button
              onClick={() => setActiveTab("features")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
                activeTab === "features"
                  ? "border-[#E5A93C] text-white"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              ⚙️ Native App Features
            </button>
          </div>

          {/* ── TAB 1: THEME & STYLING ── */}
          {activeTab === "theme" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* Presets */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Select Theme Preset
                </label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { key: "bold_dark", name: "Bold Dark", color: "#E5A93C", bg: "#0A0A0C" },
                    { key: "minimal_light", name: "Minimal Light", color: "#111111", bg: "#FAFAFA" },
                    { key: "editorial_serif", name: "Editorial Serif", color: "#8B1E1E", bg: "#FBF9F5" },
                    { key: "playful_neon", name: "Playful Neon", color: "#FF007F", bg: "#0D0221" },
                  ].map((p) => (
                    <button
                      key={p.key}
                      onClick={() => handleApplyPreset(p.key as ThemePreset)}
                      className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                        currentConfig.themePreset === p.key
                          ? "border-[#E5A93C] bg-zinc-800/80 shadow-md ring-1 ring-[#E5A93C]"
                          : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex h-5 w-full items-center gap-1.5">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }}></span>
                        <span className="h-3 w-3 rounded-full border border-zinc-700" style={{ backgroundColor: p.bg }}></span>
                      </div>
                      <span className="mt-2 text-xs font-semibold text-white">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Customizer */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Custom Color Palette
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  
                  {/* Primary Accent */}
                  <div>
                    <label className="text-xs font-medium text-zinc-400">Primary Accent</label>
                    <div className="mt-1.5 flex items-center gap-2">
                      <input
                        type="color"
                        value={branding.primaryColor}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            branding: { ...branding, primaryColor: e.target.value },
                          })
                        }
                        className="h-9 w-10 cursor-pointer rounded border border-zinc-700 bg-transparent p-0.5"
                      />
                      <input
                        type="text"
                        value={branding.primaryColor}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            branding: { ...branding, primaryColor: e.target.value },
                          })
                        }
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-[#E5A93C]"
                      />
                    </div>
                  </div>

                  {/* Secondary Accent */}
                  <div>
                    <label className="text-xs font-medium text-zinc-400">Secondary Accent</label>
                    <div className="mt-1.5 flex items-center gap-2">
                      <input
                        type="color"
                        value={branding.secondaryColor}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            branding: { ...branding, secondaryColor: e.target.value },
                          })
                        }
                        className="h-9 w-10 cursor-pointer rounded border border-zinc-700 bg-transparent p-0.5"
                      />
                      <input
                        type="text"
                        value={branding.secondaryColor}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            branding: { ...branding, secondaryColor: e.target.value },
                          })
                        }
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-[#E5A93C]"
                      />
                    </div>
                  </div>

                  {/* Background Color */}
                  <div>
                    <label className="text-xs font-medium text-zinc-400">App Background</label>
                    <div className="mt-1.5 flex items-center gap-2">
                      <input
                        type="color"
                        value={branding.backgroundColor}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            branding: { ...branding, backgroundColor: e.target.value },
                          })
                        }
                        className="h-9 w-10 cursor-pointer rounded border border-zinc-700 bg-transparent p-0.5"
                      />
                      <input
                        type="text"
                        value={branding.backgroundColor}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            branding: { ...branding, backgroundColor: e.target.value },
                          })
                        }
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-[#E5A93C]"
                      />
                    </div>
                  </div>

                  {/* Surface / Card Color */}
                  <div>
                    <label className="text-xs font-medium text-zinc-400">Card / Surface Color</label>
                    <div className="mt-1.5 flex items-center gap-2">
                      <input
                        type="color"
                        value={branding.surfaceColor}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            branding: { ...branding, surfaceColor: e.target.value },
                          })
                        }
                        className="h-9 w-10 cursor-pointer rounded border border-zinc-700 bg-transparent p-0.5"
                      />
                      <input
                        type="text"
                        value={branding.surfaceColor}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            branding: { ...branding, surfaceColor: e.target.value },
                          })
                        }
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-[#E5A93C]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Typography & Brand Assets */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Branding & Typography
                </h3>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-zinc-400">App Display Name</label>
                    <input
                      type="text"
                      value={branding.appTitle}
                      onChange={(e) =>
                        setCurrentConfig({
                          ...currentConfig,
                          branding: { ...branding, appTitle: e.target.value },
                        })
                      }
                      className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#E5A93C]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-400">Font Family</label>
                    <select
                      value={branding.fontFamily}
                      onChange={(e) =>
                        setCurrentConfig({
                          ...currentConfig,
                          branding: { ...branding, fontFamily: e.target.value },
                        })
                      }
                      className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#E5A93C]"
                    >
                      <option value="Cinzel">Cinzel (Luxury Serif)</option>
                      <option value="Playfair Display">Playfair Display (Editorial)</option>
                      <option value="Montserrat">Montserrat (Modern Sans)</option>
                      <option value="Inter">Inter (Clean UI)</option>
                      <option value="Space Grotesk">Space Grotesk (Tech/Futuristic)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-zinc-400">Store Logo URL</label>
                    <input
                      type="text"
                      value={branding.logoUrl}
                      onChange={(e) =>
                        setCurrentConfig({
                          ...currentConfig,
                          branding: { ...branding, logoUrl: e.target.value },
                        })
                      }
                      className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#E5A93C]"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-zinc-400">Hero Promo Banner URL</label>
                    <input
                      type="text"
                      value={branding.bannerUrl}
                      onChange={(e) =>
                        setCurrentConfig({
                          ...currentConfig,
                          branding: { ...branding, bannerUrl: e.target.value },
                        })
                      }
                      className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#E5A93C]"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: SHOPIFY CREDENTIALS ── */}
          {activeTab === "shopify" && (
            <div className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 animate-in fade-in duration-300">
              <div>
                <h3 className="text-sm font-bold text-white">Shopify Storefront Integration</h3>
                <p className="mt-1 text-xs text-zinc-400">
                  Connect your Shopify store using the Storefront GraphQL API to enable direct native product queries and native checkout URLs.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300">Shopify Store Domain</label>
                  <input
                    type="text"
                    value={currentConfig.shopifyStoreDomain}
                    onChange={(e) =>
                      setCurrentConfig({
                        ...currentConfig,
                        shopifyStoreDomain: e.target.value,
                      })
                    }
                    className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#E5A93C]"
                    placeholder="example.myshopify.com"
                  />
                  <span className="mt-1 block text-[11px] text-zinc-500">
                    Your myshopify.com store domain (or custom domain).
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">Storefront API Access Token</label>
                  <input
                    type="password"
                    value={currentConfig.storefrontAccessToken}
                    onChange={(e) =>
                      setCurrentConfig({
                        ...currentConfig,
                        storefrontAccessToken: e.target.value,
                      })
                    }
                    className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#E5A93C]"
                    placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                  <span className="mt-1 block text-[11px] text-zinc-500">
                    Generated under Shopify Admin &gt; Apps &gt; Headless / Storefront API.
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleTestShopify}
                    disabled={testingShopify}
                    className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-zinc-700 active:scale-95 disabled:opacity-50"
                  >
                    {testingShopify ? "Probing GraphQL Endpoint..." : "⚡ Test Shopify Connection"}
                  </button>
                </div>

                {/* Test Result Callout */}
                {shopifyTestResult && (
                  <div
                    className={`mt-4 rounded-xl border p-4 text-xs ${
                      shopifyTestResult.success
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-rose-500/30 bg-rose-500/10 text-rose-300"
                    }`}
                  >
                    <div className="font-bold">
                      {shopifyTestResult.success ? "✓ Connection Successful" : "✗ Connection Failed"}
                    </div>
                    <div className="mt-1">{shopifyTestResult.message || shopifyTestResult.error}</div>
                    {shopifyTestResult.shop && (
                      <div className="mt-2 text-[11px] text-emerald-400">
                        Shop: <strong>{shopifyTestResult.shop.name}</strong> (Currency: {shopifyTestResult.shop.paymentSettings?.currencyCode})
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB 3: FEATURES ── */}
          {activeTab === "features" && (
            <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 animate-in fade-in duration-300">
              <div>
                <h3 className="text-sm font-bold text-white">Native Mobile Features</h3>
                <p className="mt-1 text-xs text-zinc-400">
                  Toggle native SDK capabilities enabled for this merchant application.
                </p>
              </div>

              <div className="divide-y divide-zinc-800/80">
                {[
                  { key: "enableApplePay", label: "Apple Pay & Google Pay", desc: "Native sheet one-click payments via Shopify Payments" },
                  { key: "enableReviews", label: "Product Ratings & Reviews", desc: "Customer review submission and verified badges" },
                  { key: "enableWishlist", label: "Wishlist / Saved Items", desc: "Save favorite merch across device sessions" },
                  { key: "enableLoyaltyRewards", label: "VIP Loyalty Rewards Points", desc: "Earn points with purchases to unlock discounts" },
                  { key: "enableOrderTracking", label: "Live Order Status & Tracking", desc: "Real-time delivery progress and notifications" },
                ].map((f) => (
                  <div key={f.key} className="flex items-center justify-between py-3.5">
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">{f.label}</div>
                      <div className="text-[11px] text-zinc-500">{f.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={(features as any)[f.key]}
                      onChange={(e) =>
                        setCurrentConfig({
                          ...currentConfig,
                          features: {
                            ...features,
                            [f.key]: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-[#E5A93C] focus:ring-[#E5A93C]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Right Phone Mockup Preview (5 Cols) */}
        <section className="lg:col-span-5">
          <div className="sticky top-24 flex flex-col items-center">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Live Phone Preview</span>
              <div className="flex rounded-lg bg-zinc-900 p-1">
                {(["home", "pdp", "cart"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setPreviewScreen(s)}
                    className={`rounded px-2.5 py-0.5 text-[10px] font-bold uppercase transition ${
                      previewScreen === s ? "bg-[#E5A93C] text-black" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* 📱 Smartphone Device Frame */}
            <div className="relative h-[650px] w-[320px] overflow-hidden rounded-[44px] border-[8px] border-[#22242A] bg-black shadow-2xl shadow-black/80 ring-1 ring-white/10">
              
              {/* Dynamic Island / Notch */}
              <div className="absolute left-1/2 top-2.5 z-30 h-5 w-24 -translate-x-1/2 rounded-full bg-black"></div>

              {/* Dynamic App Content Screen */}
              <div
                className="h-full w-full overflow-y-auto px-4 pt-10 pb-16 transition-colors duration-300"
                style={{
                  backgroundColor: branding.backgroundColor,
                  color: branding.textColor,
                  fontFamily: branding.fontFamily,
                }}
              >
                {/* Simulated Header */}
                <div className="flex items-center justify-between pb-3">
                  <div className="flex items-center gap-2">
                    {branding.logoUrl ? (
                      <img src={branding.logoUrl} alt="Logo" className="h-6 w-6 rounded-full object-cover" />
                    ) : (
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-black"
                        style={{ backgroundColor: branding.primaryColor }}
                      >
                        {branding.appTitle[0]}
                      </div>
                    )}
                    <span className="text-xs font-bold tracking-wider">{branding.appTitle}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span>🔍</span>
                    <span>🛒</span>
                  </div>
                </div>

                {/* ── HOME SCREEN PREVIEW ── */}
                {previewScreen === "home" && (
                  <div className="space-y-4">
                    {/* Hero Banner */}
                    <div
                      className="relative h-32 overflow-hidden rounded-2xl p-3 shadow-md"
                      style={{
                        backgroundColor: branding.surfaceColor,
                        borderRadius: `${branding.borderRadius}px`,
                      }}
                    >
                      {branding.bannerUrl && (
                        <img
                          src={branding.bannerUrl}
                          alt="Banner"
                          className="absolute inset-0 h-full w-full object-cover opacity-60"
                        />
                      )}
                      <div className="relative z-10 flex h-full flex-col justify-end">
                        <span
                          className="w-fit rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black"
                          style={{ backgroundColor: branding.primaryColor }}
                        >
                          Exclusive Drop
                        </span>
                        <h4 className="mt-1 text-sm font-bold leading-tight">World Tour Collection</h4>
                      </div>
                    </div>

                    {/* Category Badges */}
                    <div className="flex gap-2 overflow-x-hidden text-[10px]">
                      {["Albums", "Lightsticks", "Apparel", "Vinyl"].map((cat, i) => (
                        <span
                          key={cat}
                          className="rounded-full px-2.5 py-1 font-semibold"
                          style={{
                            backgroundColor: i === 0 ? branding.primaryColor : branding.surfaceColor,
                            color: i === 0 ? "#000" : branding.textColor,
                          }}
                        >
                          {cat}
                        </span>
                      ))}
                    </div>

                    {/* Product Cards Grid */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { title: "Tour Box Set", price: "$140", badge: "HOT" },
                        { title: "Special CD", price: "$30", badge: "NEW" },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="flex flex-col p-2.5 shadow-sm"
                          style={{
                            backgroundColor: branding.surfaceColor,
                            borderRadius: `${branding.borderRadius}px`,
                          }}
                        >
                          <div className="h-20 w-full rounded bg-zinc-800/80 flex items-center justify-center text-xs opacity-80">
                            🎵 Merch
                          </div>
                          <span className="mt-2 text-[11px] font-bold line-clamp-1">{item.title}</span>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-xs font-bold" style={{ color: branding.primaryColor }}>
                              {item.price}
                            </span>
                            <span
                              className="rounded px-1 text-[9px] font-bold"
                              style={{
                                backgroundColor: `${branding.secondaryColor}30`,
                                color: branding.secondaryColor,
                              }}
                            >
                              {item.badge}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── PDP SCREEN PREVIEW ── */}
                {previewScreen === "pdp" && (
                  <div className="space-y-3">
                    <div className="h-40 w-full rounded-2xl bg-zinc-800/80 flex items-center justify-center text-lg">
                      💿 Product Image
                    </div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold">World Tour Box Set</h4>
                        <span className="text-[10px] opacity-60">Paris Limited Edition</span>
                      </div>
                      <span className="text-sm font-bold" style={{ color: branding.primaryColor }}>
                        $140.00
                      </span>
                    </div>
                    <button
                      className="w-full py-2.5 text-center text-xs font-bold uppercase tracking-wider text-black shadow-md"
                      style={{
                        backgroundColor: branding.primaryColor,
                        borderRadius: `${branding.borderRadius}px`,
                      }}
                    >
                      Add to Cart
                    </button>
                  </div>
                )}

                {/* ── CART PREVIEW ── */}
                {previewScreen === "cart" && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider">Your Cart (1)</h4>
                    <div
                      className="flex items-center gap-2 p-2"
                      style={{
                        backgroundColor: branding.surfaceColor,
                        borderRadius: `${branding.borderRadius}px`,
                      }}
                    >
                      <div className="h-10 w-10 rounded bg-zinc-800 flex items-center justify-center text-xs">📦</div>
                      <div className="flex-1">
                        <div className="text-[11px] font-bold">World Tour Box Set</div>
                        <div className="text-[10px]" style={{ color: branding.primaryColor }}>$140.00</div>
                      </div>
                    </div>
                    <button
                      className="w-full py-2.5 text-center text-xs font-bold uppercase tracking-wider text-black shadow-md"
                      style={{
                        backgroundColor: branding.primaryColor,
                        borderRadius: `${branding.borderRadius}px`,
                      }}
                    >
                      ⚡ Native Shopify Checkout
                    </button>
                  </div>
                )}

              </div>

              {/* Bottom Nav Bar Indicator */}
              <div className="absolute bottom-1 left-1/2 h-1 w-28 -translate-x-1/2 rounded-full bg-white/30"></div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
