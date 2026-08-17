"use client";

import React, { useState, useEffect } from "react";
import { TenantConfig, ThemePreset, THEME_PRESETS } from "@/lib/models/tenant";

// ── Real SVG Icon System (Zero Emojis, Uniform 1.5px Stroke) ──
function IconPalette(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.5 17.5 2 12 2Z" />
    </svg>
  );
}

function IconShoppingBag(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function IconSliders(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="4" x2="4" y1="21" y2="14" />
      <line x1="4" x2="4" y1="10" y2="3" />
      <line x1="12" x2="12" y1="21" y2="12" />
      <line x1="12" x2="12" y1="8" y2="3" />
      <line x1="20" x2="20" y1="21" y2="16" />
      <line x1="20" x2="20" y1="12" y2="3" />
      <line x1="1" x2="7" y1="14" y2="14" />
      <line x1="9" x2="15" y1="8" y2="8" />
      <line x1="17" x2="23" y1="16" y2="16" />
    </svg>
  );
}

function IconCheck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconActivity(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function IconKey(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 2-9.6 9.6" />
      <path d="m15.5 7.5 3 3L22 7l-3-3" />
    </svg>
  );
}

function IconSparkles(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    </svg>
  );
}

// ── Realistic Sample Fandom Merch Data for Preview ──
const SAMPLE_PRODUCTS = [
  {
    id: "p-1",
    title: "Official World Tour Box Set",
    subtitle: "Includes 120p Photobook + 8 Photocards",
    price: "$140.00",
    comparePrice: "$165.00",
    badge: "LIMITED",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "p-2",
    title: "Ver. 2 Bluetooth Lightstick",
    subtitle: "Concert Sync Mode & Custom Grip Ring",
    price: "$65.00",
    comparePrice: null,
    badge: "TOUR MERCH",
    image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "p-3",
    title: "Limited 1st Press Holographic Vinyl",
    subtitle: "Heavyweight 180g Pink Marble Edition",
    price: "$45.00",
    comparePrice: null,
    badge: "EXCLUSIVE",
    image: "https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "p-4",
    title: "Photocard Binder & Archival Sleeves",
    subtitle: "Embossed Foil Cover, Holds 240 Cards",
    price: "$28.00",
    comparePrice: "$34.00",
    badge: "FANDOM",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
  },
];

export default function AdminDashboard() {
  const [tenants, setTenants] = useState<TenantConfig[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("k-luxe");
  const [activeTab, setActiveTab] = useState<"theme" | "shopify" | "features">("theme");
  const [previewScreen, setPreviewScreen] = useState<"home" | "pdp" | "cart">("home");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Form Configuration State
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
        setSaveMessage("Published live to mobile storefront");
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
      <div className="flex h-screen w-full items-center justify-center bg-[#121316] text-[#E2E4E9]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E5A93C] border-t-transparent"></div>
          <span className="font-mono text-[11px] tracking-widest text-[#9095A2] uppercase">Loading Studio Control...</span>
        </div>
      </div>
    );
  }

  const { branding, features } = currentConfig;

  return (
    <div className="min-h-screen bg-[#121316] text-[#E2E4E9] antialiased selection:bg-[#E5A93C] selection:text-black">
      
      {/* ── Studio Header ── */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-[#363B45] bg-[#1A1C20]/95 px-6 backdrop-blur-md">
        
        {/* Left: Wordmark + Tenant Switcher */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center tracking-tight">
              <span className="font-bold text-sm text-[#E2E4E9] tracking-wider">K-LUXE</span>
              <span className="ml-1.5 font-mono text-[10px] text-[#9095A2]">STUDIO</span>
            </div>
            <span className="h-3 w-px bg-[#363B45]"></span>
            <span className="font-mono text-[10px] text-[#9095A2] uppercase tracking-widest">
              Merch App Builder
            </span>
          </div>

          <div className="h-4 w-px bg-[#363B45]"></div>

          {/* Merchant Dropdown */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-[#9095A2]">STORE:</span>
            <div className="relative">
              <select
                value={selectedTenantId}
                onChange={(e) => handleSelectTenant(e.target.value)}
                className="appearance-none rounded-md border border-[#363B45] bg-[#24272E] pl-2.5 pr-7 py-1 font-mono text-xs text-[#E2E4E9] transition hover:border-[#9095A2] focus:border-[#E5A93C] focus:outline-none focus:ring-1 focus:ring-[#E5A93C]"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.slug})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#9095A2] text-[10px]">
                ▼
              </div>
            </div>
          </div>
        </div>

        {/* Right: Publish Controls */}
        <div className="flex items-center gap-3">
          {saveMessage && (
            <div className="flex items-center gap-1.5 font-mono text-xs text-emerald-400">
              <IconCheck className="h-3.5 w-3.5" />
              <span>{saveMessage}</span>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-md bg-[#E5A93C] px-4 py-1.5 font-medium text-xs text-black transition-all hover:bg-[#D4982E] active:scale-[0.98] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#E5A93C] focus:ring-offset-2 focus:ring-offset-[#1A1C20]"
          >
            {saving ? (
              <>
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-black border-t-transparent" />
                <span>Deploying...</span>
              </>
            ) : (
              <>
                <IconSparkles className="h-3.5 w-3.5" />
                <span>Publish to App</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* ── Main Studio Grid: Configuration Panel (Left) + Live Mobile Frame (Right) ── */}
      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-8 p-6 lg:grid-cols-12 lg:p-8">
        
        {/* ── LEFT: Studio Configuration Area (7 cols) ── */}
        <section className="space-y-6 lg:col-span-7">
          
          {/* Sub-Header Navigation Tabs */}
          <div className="flex border-b border-[#363B45]">
            <button
              onClick={() => setActiveTab("theme")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-medium transition ${
                activeTab === "theme"
                  ? "border-[#E5A93C] text-[#E2E4E9]"
                  : "border-transparent text-[#9095A2] hover:text-[#E2E4E9]"
              }`}
            >
              <IconPalette className="h-4 w-4" />
              <span>Theme & Dynamic Styling</span>
            </button>
            <button
              onClick={() => setActiveTab("shopify")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-medium transition ${
                activeTab === "shopify"
                  ? "border-[#E5A93C] text-[#E2E4E9]"
                  : "border-transparent text-[#9095A2] hover:text-[#E2E4E9]"
              }`}
            >
              <IconShoppingBag className="h-4 w-4" />
              <span>Shopify Storefront API</span>
            </button>
            <button
              onClick={() => setActiveTab("features")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-medium transition ${
                activeTab === "features"
                  ? "border-[#E5A93C] text-[#E2E4E9]"
                  : "border-transparent text-[#9095A2] hover:text-[#E2E4E9]"
              }`}
            >
              <IconSliders className="h-4 w-4" />
              <span>Native Features</span>
            </button>
          </div>

          {/* ── TAB 1: THEME & DYNAMIC STYLING ── */}
          {activeTab === "theme" && (
            <div className="space-y-8">
              
              {/* 🎴 Signature Element: Photocard Theme Presets Deck */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-mono text-xs uppercase tracking-wider text-[#9095A2]">Theme Presets</h3>
                    <p className="text-xs text-[#9095A2]">Pre-configured aesthetics inspired by K-pop tour drops and album eras.</p>
                  </div>
                  <span className="font-mono text-[10px] text-[#9095A2] bg-[#1A1C20] px-2 py-0.5 rounded border border-[#363B45]">
                    4 STYLES
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    {
                      key: "bold_dark",
                      name: "Bold Dark",
                      subtitle: "Luxury Tour",
                      primary: "#E5A93C",
                      secondary: "#9D4EDD",
                      bg: "#0A0A0C",
                      surface: "#16161A",
                      font: "Cinzel",
                    },
                    {
                      key: "minimal_light",
                      name: "Minimal Light",
                      subtitle: "Clean Gallery",
                      primary: "#111111",
                      secondary: "#666666",
                      bg: "#FAFAFA",
                      surface: "#FFFFFF",
                      font: "Inter",
                    },
                    {
                      key: "editorial_serif",
                      name: "Editorial",
                      subtitle: "Magazine Era",
                      primary: "#8B1E1E",
                      secondary: "#C59B27",
                      bg: "#FBF9F5",
                      surface: "#FFFFFF",
                      font: "Playfair",
                    },
                    {
                      key: "playful_neon",
                      name: "Cyber Pop",
                      subtitle: "Stage Visuals",
                      primary: "#FF007F",
                      secondary: "#00F5D4",
                      bg: "#0D0221",
                      surface: "#1A0933",
                      font: "Montserrat",
                    },
                  ].map((p) => {
                    const isSelected = currentConfig.themePreset === p.key;
                    return (
                      <button
                        key={p.key}
                        onClick={() => handleApplyPreset(p.key as ThemePreset)}
                        className={`group relative flex flex-col overflow-hidden rounded-xl border p-2.5 text-left transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-[#E5A93C] ${
                          isSelected
                            ? "border-[#E5A93C] bg-[#1A1C20] shadow-lg shadow-[#E5A93C]/10 ring-1 ring-[#E5A93C]"
                            : "border-[#363B45] bg-[#1A1C20]/70 hover:border-[#9095A2] hover:bg-[#1A1C20]"
                        }`}
                      >
                        {/* Perforated Ticket Notch Visual */}
                        <div className="flex items-center justify-between border-b border-dashed border-[#363B45] pb-1.5 mb-2">
                          <span className="font-mono text-[9px] text-[#9095A2] uppercase tracking-wider">{p.subtitle}</span>
                          {isSelected && (
                            <span className="h-1.5 w-1.5 rounded-full bg-[#E5A93C]"></span>
                          )}
                        </div>

                        {/* Mini Photocard Layout Preview */}
                        <div
                          className="h-20 w-full rounded-md p-1.5 flex flex-col justify-between overflow-hidden border border-black/20"
                          style={{ backgroundColor: p.bg }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="h-2 w-6 rounded-sm" style={{ backgroundColor: p.primary }}></div>
                            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.secondary }}></div>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <div className="h-7 rounded-sm p-1 flex flex-col justify-end" style={{ backgroundColor: p.surface }}>
                              <div className="h-1 w-full rounded-xs" style={{ backgroundColor: p.primary, opacity: 0.6 }}></div>
                            </div>
                            <div className="h-7 rounded-sm p-1 flex flex-col justify-end" style={{ backgroundColor: p.surface }}>
                              <div className="h-1 w-3/4 rounded-xs" style={{ backgroundColor: p.secondary, opacity: 0.6 }}></div>
                            </div>
                          </div>
                        </div>

                        {/* Title & Metadata */}
                        <div className="mt-2.5">
                          <div className="text-xs font-semibold text-[#E2E4E9] group-hover:text-white">{p.name}</div>
                          <div className="font-mono text-[10px] text-[#9095A2]">{p.font}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 🎨 Brand Color Tokens (Grouped System) */}
              <div className="rounded-xl border border-[#363B45] bg-[#1A1C20] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#363B45] pb-3">
                  <div>
                    <h3 className="font-mono text-xs uppercase tracking-wider text-[#9095A2]">Brand Color Tokens</h3>
                    <p className="text-xs text-[#9095A2]">Applied dynamically to buttons, badges, surface containers, and cards.</p>
                  </div>
                  <span className="font-mono text-[10px] text-[#9095A2]">HEX / RGB</span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  
                  {/* Primary Accent */}
                  <div className="rounded-lg border border-[#363B45] bg-[#24272E] p-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-[#E2E4E9]">Primary Accent</label>
                      <span className="font-mono text-[10px] text-[#9095A2]">Buttons & Highlights</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="color"
                        value={branding.primaryColor}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            branding: { ...branding, primaryColor: e.target.value },
                          })
                        }
                        className="h-8 w-8 cursor-pointer rounded border border-[#363B45] bg-transparent p-0.5"
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
                        className="w-full rounded-md border border-[#363B45] bg-[#121316] px-3 py-1.5 font-mono text-xs text-[#E2E4E9] focus:border-[#E5A93C] focus:outline-none focus:ring-1 focus:ring-[#E5A93C]"
                      />
                    </div>
                  </div>

                  {/* Secondary Accent */}
                  <div className="rounded-lg border border-[#363B45] bg-[#24272E] p-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-[#E2E4E9]">Secondary Accent</label>
                      <span className="font-mono text-[10px] text-[#9095A2]">Badges & Statuses</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="color"
                        value={branding.secondaryColor}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            branding: { ...branding, secondaryColor: e.target.value },
                          })
                        }
                        className="h-8 w-8 cursor-pointer rounded border border-[#363B45] bg-transparent p-0.5"
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
                        className="w-full rounded-md border border-[#363B45] bg-[#121316] px-3 py-1.5 font-mono text-xs text-[#E2E4E9] focus:border-[#E5A93C] focus:outline-none focus:ring-1 focus:ring-[#E5A93C]"
                      />
                    </div>
                  </div>

                  {/* Background Color */}
                  <div className="rounded-lg border border-[#363B45] bg-[#24272E] p-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-[#E2E4E9]">Canvas Background</label>
                      <span className="font-mono text-[10px] text-[#9095A2]">Screen Base</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="color"
                        value={branding.backgroundColor}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            branding: { ...branding, backgroundColor: e.target.value },
                          })
                        }
                        className="h-8 w-8 cursor-pointer rounded border border-[#363B45] bg-transparent p-0.5"
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
                        className="w-full rounded-md border border-[#363B45] bg-[#121316] px-3 py-1.5 font-mono text-xs text-[#E2E4E9] focus:border-[#E5A93C] focus:outline-none focus:ring-1 focus:ring-[#E5A93C]"
                      />
                    </div>
                  </div>

                  {/* Surface Color */}
                  <div className="rounded-lg border border-[#363B45] bg-[#24272E] p-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-[#E2E4E9]">Surface & Cards</label>
                      <span className="font-mono text-[10px] text-[#9095A2]">Product Tiles</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="color"
                        value={branding.surfaceColor}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            branding: { ...branding, surfaceColor: e.target.value },
                          })
                        }
                        className="h-8 w-8 cursor-pointer rounded border border-[#363B45] bg-transparent p-0.5"
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
                        className="w-full rounded-md border border-[#363B45] bg-[#121316] px-3 py-1.5 font-mono text-xs text-[#E2E4E9] focus:border-[#E5A93C] focus:outline-none focus:ring-1 focus:ring-[#E5A93C]"
                      />
                    </div>
                  </div>

                </div>
              </div>

              {/* 🏷️ Brand Assets & Typography */}
              <div className="rounded-xl border border-[#363B45] bg-[#1A1C20] p-5 space-y-4">
                <div className="border-b border-[#363B45] pb-3">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-[#9095A2]">Typography & Identity</h3>
                  <p className="text-xs text-[#9095A2]">App title, typography scale, and header media displayed to fans.</p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-[#E2E4E9]">Store Name (App Header)</label>
                    <input
                      type="text"
                      value={branding.appTitle}
                      onChange={(e) =>
                        setCurrentConfig({
                          ...currentConfig,
                          branding: { ...branding, appTitle: e.target.value },
                        })
                      }
                      className="mt-1.5 w-full rounded-md border border-[#363B45] bg-[#24272E] px-3 py-2 text-xs text-[#E2E4E9] focus:border-[#E5A93C] focus:outline-none focus:ring-1 focus:ring-[#E5A93C]"
                    />
                    <span className="mt-1 block text-[11px] text-[#9095A2]">
                      Shown in the app header and login screens.
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#E2E4E9]">Typography Family</label>
                    <select
                      value={branding.fontFamily}
                      onChange={(e) =>
                        setCurrentConfig({
                          ...currentConfig,
                          branding: { ...branding, fontFamily: e.target.value },
                        })
                      }
                      className="mt-1.5 w-full rounded-md border border-[#363B45] bg-[#24272E] px-3 py-2 text-xs text-[#E2E4E9] focus:border-[#E5A93C] focus:outline-none focus:ring-1 focus:ring-[#E5A93C]"
                    >
                      <option value="Cinzel">Cinzel (Luxury Tour Serif)</option>
                      <option value="Playfair Display">Playfair Display (High-Fashion Editorial)</option>
                      <option value="Montserrat">Montserrat (Modern Concert Sans)</option>
                      <option value="Inter">Inter (Clean Utility Sans)</option>
                      <option value="Space Grotesk">Space Grotesk (Cyber Tech)</option>
                    </select>
                    <span className="mt-1 block text-[11px] text-[#9095A2]">
                      Governs heading, card title, and product prices.
                    </span>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-[#E2E4E9]">Store Logo Asset URL</label>
                    <input
                      type="text"
                      value={branding.logoUrl}
                      onChange={(e) =>
                        setCurrentConfig({
                          ...currentConfig,
                          branding: { ...branding, logoUrl: e.target.value },
                        })
                      }
                      placeholder="https://cdn.shopify.com/s/files/.../logo.png"
                      className="mt-1.5 w-full rounded-md border border-[#363B45] bg-[#24272E] px-3 py-2 font-mono text-xs text-[#E2E4E9] focus:border-[#E5A93C] focus:outline-none focus:ring-1 focus:ring-[#E5A93C]"
                    />
                    <span className="mt-1 block text-[11px] text-[#9095A2]">
                      Square or circular icon URL (recommended 512×512 PNG).
                    </span>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-[#E2E4E9]">Hero Drop Banner URL</label>
                    <input
                      type="text"
                      value={branding.bannerUrl}
                      onChange={(e) =>
                        setCurrentConfig({
                          ...currentConfig,
                          branding: { ...branding, bannerUrl: e.target.value },
                        })
                      }
                      placeholder="https://cdn.shopify.com/s/files/.../tour-banner.jpg"
                      className="mt-1.5 w-full rounded-md border border-[#363B45] bg-[#24272E] px-3 py-2 font-mono text-xs text-[#E2E4E9] focus:border-[#E5A93C] focus:outline-none focus:ring-1 focus:ring-[#E5A93C]"
                    />
                    <span className="mt-1 block text-[11px] text-[#9095A2]">
                      Featured hero carousel image for active merch drops.
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ── TAB 2: SHOPIFY STOREFRONT API ── */}
          {activeTab === "shopify" && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                
                {/* Left: Credentials Form (7 cols) */}
                <div className="space-y-4 rounded-xl border border-[#363B45] bg-[#1A1C20] p-5 lg:col-span-7">
                  <div className="border-b border-[#363B45] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#E5A93C]"></span>
                      <h3 className="font-mono text-xs uppercase tracking-wider text-[#E2E4E9]">Storefront API Access</h3>
                    </div>
                    <p className="mt-1 text-xs text-[#9095A2]">
                      Enter your store domain and token to enable native GraphQL product fetching & checkout bridging.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#E2E4E9]">Shopify Store Domain</label>
                    <input
                      type="text"
                      value={currentConfig.shopifyStoreDomain}
                      onChange={(e) =>
                        setCurrentConfig({
                          ...currentConfig,
                          shopifyStoreDomain: e.target.value,
                        })
                      }
                      placeholder="your-merch-store.myshopify.com"
                      className="mt-1.5 w-full rounded-md border border-[#363B45] bg-[#24272E] px-3 py-2 font-mono text-xs text-[#E2E4E9] focus:border-[#E5A93C] focus:outline-none focus:ring-1 focus:ring-[#E5A93C]"
                    />
                    <span className="mt-1 block text-[11px] text-[#9095A2]">
                      Your myshopify domain or connected custom domain.
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#E2E4E9]">Storefront Access Token</label>
                    <input
                      type="password"
                      value={currentConfig.storefrontAccessToken}
                      onChange={(e) =>
                        setCurrentConfig({
                          ...currentConfig,
                          storefrontAccessToken: e.target.value,
                        })
                      }
                      placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxx"
                      className="mt-1.5 w-full rounded-md border border-[#363B45] bg-[#24272E] px-3 py-2 font-mono text-xs text-[#E2E4E9] focus:border-[#E5A93C] focus:outline-none focus:ring-1 focus:ring-[#E5A93C]"
                    />
                    <span className="mt-1 block text-[11px] text-[#9095A2]">
                      Obtained under Shopify Admin &gt; Apps &gt; Headless Channel.
                    </span>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleTestShopify}
                      disabled={testingShopify}
                      className="flex items-center gap-2 rounded-md border border-[#363B45] bg-[#24272E] px-4 py-2 text-xs font-medium text-[#E2E4E9] transition hover:border-[#9095A2] hover:bg-[#2C3038] active:scale-95 disabled:opacity-50"
                    >
                      <IconKey className="h-3.5 w-3.5 text-[#E5A93C]" />
                      <span>{testingShopify ? "Probing GraphQL..." : "Test Storefront Connection"}</span>
                    </button>
                  </div>

                  {/* Test Result Message */}
                  {shopifyTestResult && (
                    <div
                      className={`rounded-lg border p-3.5 text-xs ${
                        shopifyTestResult.success
                          ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
                          : "border-rose-500/40 bg-rose-950/30 text-rose-300"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-medium">
                        {shopifyTestResult.success ? <IconCheck className="h-4 w-4 text-emerald-400" /> : "✕"}
                        <span>{shopifyTestResult.success ? "GraphQL Handshake Verified" : "Connection Check Failed"}</span>
                      </div>
                      <div className="mt-1 font-mono text-[11px] opacity-80">
                        {shopifyTestResult.message || shopifyTestResult.error}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Live Connection Health Panel (5 cols) */}
                <div className="space-y-4 rounded-xl border border-[#363B45] bg-[#1A1C20] p-5 lg:col-span-5">
                  <div className="border-b border-[#363B45] pb-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-mono text-xs uppercase tracking-wider text-[#9095A2]">Connection Health</h4>
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-400 border border-emerald-500/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        READY
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex justify-between py-1.5 border-b border-[#363B45]/50">
                      <span className="text-[#9095A2]">API Version</span>
                      <span className="text-[#E2E4E9]">2024-04 (Stable)</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[#363B45]/50">
                      <span className="text-[#9095A2]">Protocol</span>
                      <span className="text-[#E2E4E9]">GraphQL POST</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[#363B45]/50">
                      <span className="text-[#9095A2]">Checkout Bridge</span>
                      <span className="text-[#E5A93C]">Sheet Kit v3</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-[#9095A2]">Webhooks</span>
                      <span className="text-emerald-400">orders/create</span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-[#24272E] p-3 text-[11px] text-[#9095A2] leading-relaxed">
                    <strong className="text-[#E2E4E9]">Shopify Checkout Note:</strong> When fans click checkout in the mobile app, Shopify Checkout Sheet Kit embeds the live Shopify checkout in a native sheet without external web redirects.
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ── TAB 3: NATIVE FEATURES & CAPABILITIES ── */}
          {activeTab === "features" && (
            <div className="space-y-6">
              
              <div className="rounded-xl border border-[#363B45] bg-[#1A1C20] p-5 space-y-4">
                <div className="border-b border-[#363B45] pb-3">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-[#9095A2]">Mobile Feature Toggles</h3>
                  <p className="text-xs text-[#9095A2]">Enable or disable native mobile SDK modules for this merchant storefront.</p>
                </div>

                <div className="divide-y divide-[#363B45]/60">
                  {[
                    {
                      key: "enableApplePay",
                      title: "Apple Pay & Google Pay Express Sheet",
                      desc: "Allows fans to buy merch drops in 1 tap using device biometric authentication.",
                    },
                    {
                      key: "enableWishlist",
                      title: "Fandom Photocard & Merch Wishlist",
                      desc: "Enables fans to bookmark unreleased drops and receive stock notifications.",
                    },
                    {
                      key: "enableReviews",
                      title: "Verified Fan Reviews & Photo Unboxing",
                      desc: "Lets fans submit verified order reviews with unboxing photos.",
                    },
                    {
                      key: "enableLoyaltyRewards",
                      title: "VIP Fan Club Tier & Rewards Points",
                      desc: "Awards points on purchases redeemable for exclusive presale access.",
                    },
                    {
                      key: "enableOrderTracking",
                      title: "Live Tour Merch Tracking",
                      desc: "Real-time delivery progress updates and push notifications.",
                    },
                  ].map((f) => {
                    const isChecked = (features as any)[f.key];
                    return (
                      <div key={f.key} className="flex items-center justify-between py-4">
                        <div className="pr-4">
                          <div className="text-xs font-semibold text-[#E2E4E9]">{f.title}</div>
                          <div className="mt-0.5 text-[11px] text-[#9095A2]">{f.desc}</div>
                        </div>

                        {/* ♿ Custom Accessible Toggle Switch (Clear Visual State + Focus Rings) */}
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isChecked}
                          onClick={() =>
                            setCurrentConfig({
                              ...currentConfig,
                              features: {
                                ...features,
                                [f.key]: !isChecked,
                              },
                            })
                          }
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#E5A93C] focus:ring-offset-2 focus:ring-offset-[#1A1C20] ${
                            isChecked ? "bg-[#E5A93C]" : "bg-[#24272E]"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white text-[9px] font-bold shadow transition duration-200 ease-in-out ${
                              isChecked ? "translate-x-5 text-[#E5A93C]" : "translate-x-0 text-[#9095A2]"
                            }`}
                          >
                            {isChecked ? "✓" : "–"}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </section>

        {/* ── RIGHT: Live Mobile Phone Preview (5 cols) ── */}
        <section className="lg:col-span-5">
          <div className="sticky top-20 flex flex-col items-center">
            
            {/* Screen Selector Controls */}
            <div className="mb-3 flex w-full max-w-[320px] items-center justify-between">
              <span className="font-mono text-[10px] tracking-widest text-[#9095A2] uppercase">Live Customer App</span>
              
              <div className="flex rounded-md border border-[#363B45] bg-[#1A1C20] p-0.5">
                {(["home", "pdp", "cart"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setPreviewScreen(s)}
                    className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase transition ${
                      previewScreen === s
                        ? "bg-[#E5A93C] text-black font-semibold"
                        : "text-[#9095A2] hover:text-[#E2E4E9]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* 📱 Realistic Smartphone Device Frame (iPhone 16 Pro Style) */}
            <div className="relative h-[660px] w-[320px] overflow-hidden rounded-[46px] border-[6px] border-[#24272E] bg-black shadow-2xl shadow-black/90 ring-1 ring-white/10">
              
              {/* Dynamic Island Pill */}
              <div className="absolute left-1/2 top-2.5 z-30 h-5 w-24 -translate-x-1/2 rounded-full bg-black"></div>

              {/* Dynamic Customer App Canvas (180ms ease-out transition on token changes) */}
              <div
                className="h-full w-full overflow-y-auto px-4 pt-10 pb-16 transition-colors duration-200 ease-out"
                style={{
                  backgroundColor: branding.backgroundColor,
                  color: branding.textColor,
                  fontFamily: branding.fontFamily,
                }}
              >
                {/* App Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    {branding.logoUrl ? (
                      <img src={branding.logoUrl} alt="Logo" className="h-6 w-6 rounded-full object-cover shadow-sm" />
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
                  <div className="flex items-center gap-3 text-xs opacity-90">
                    <span className="cursor-pointer">🔍</span>
                    <span className="cursor-pointer">🛒</span>
                  </div>
                </div>

                {/* ── SCREEN 1: HOME PREVIEW ── */}
                {previewScreen === "home" && (
                  <div className="space-y-4 pt-2">
                    {/* Hero Promo Drop Banner */}
                    <div
                      className="relative h-32 overflow-hidden rounded-xl p-3 shadow-md"
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
                          className="w-fit rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black shadow-sm"
                          style={{ backgroundColor: branding.primaryColor }}
                        >
                          TOUR MERCH DROP
                        </span>
                        <h4 className="mt-1 text-sm font-bold leading-tight">World Tour 2026</h4>
                      </div>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex gap-1.5 overflow-x-hidden text-[10px]">
                      {["All Merch", "Albums", "Lightsticks", "Apparel"].map((cat, i) => (
                        <span
                          key={cat}
                          className="rounded-full px-2.5 py-0.5 font-medium transition"
                          style={{
                            backgroundColor: i === 0 ? branding.primaryColor : branding.surfaceColor,
                            color: i === 0 ? "#000000" : branding.textColor,
                          }}
                        >
                          {cat}
                        </span>
                      ))}
                    </div>

                    {/* Realistic Product Grid (No Placeholders) */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {SAMPLE_PRODUCTS.slice(0, 2).map((item) => (
                        <div
                          key={item.id}
                          className="group flex flex-col overflow-hidden p-2 shadow-sm transition"
                          style={{
                            backgroundColor: branding.surfaceColor,
                            borderRadius: `${branding.borderRadius}px`,
                          }}
                        >
                          <div className="relative h-24 w-full overflow-hidden rounded bg-black/40">
                            <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                            <span
                              className="absolute right-1 top-1 rounded px-1 text-[8px] font-bold uppercase tracking-wider"
                              style={{
                                backgroundColor: branding.secondaryColor,
                                color: "#000000",
                              }}
                            >
                              {item.badge}
                            </span>
                          </div>
                          
                          <span className="mt-2 text-[11px] font-bold line-clamp-1 leading-tight">{item.title}</span>
                          <span className="text-[9px] opacity-60 line-clamp-1">{item.subtitle}</span>
                          
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs font-bold" style={{ color: branding.primaryColor }}>
                              {item.price}
                            </span>
                            <button
                              className="rounded px-2 py-0.5 text-[9px] font-bold uppercase text-black"
                              style={{ backgroundColor: branding.primaryColor }}
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── SCREEN 2: PDP (PRODUCT DETAIL) PREVIEW ── */}
                {previewScreen === "pdp" && (
                  <div className="space-y-3 pt-2">
                    <div className="relative h-44 w-full overflow-hidden rounded-xl bg-black/50 shadow-md">
                      <img src={SAMPLE_PRODUCTS[0].image} alt="PDP" className="h-full w-full object-cover" />
                      <span
                        className="absolute left-2 top-2 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase text-black"
                        style={{ backgroundColor: branding.secondaryColor }}
                      >
                        TOUR EXCLUSIVE
                      </span>
                    </div>

                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold leading-tight">{SAMPLE_PRODUCTS[0].title}</h4>
                        <span className="text-[10px] opacity-70">{SAMPLE_PRODUCTS[0].subtitle}</span>
                      </div>
                      <span className="text-sm font-bold" style={{ color: branding.primaryColor }}>
                        {SAMPLE_PRODUCTS[0].price}
                      </span>
                    </div>

                    {/* Variant Selector */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Select Edition</span>
                      <div className="flex gap-2 text-[10px]">
                        <span
                          className="rounded px-2.5 py-1 font-semibold"
                          style={{ backgroundColor: branding.primaryColor, color: "#000" }}
                        >
                          Deluxe Box
                        </span>
                        <span
                          className="rounded px-2.5 py-1 font-semibold opacity-70"
                          style={{ backgroundColor: branding.surfaceColor }}
                        >
                          Standard
                        </span>
                      </div>
                    </div>

                    {/* Primary CTA Button */}
                    <button
                      className="mt-2 w-full py-2.5 text-center text-xs font-bold uppercase tracking-wider text-black shadow-md transition active:scale-95"
                      style={{
                        backgroundColor: branding.primaryColor,
                        borderRadius: `${branding.borderRadius}px`,
                      }}
                    >
                      Add to Tour Bag
                    </button>
                  </div>
                )}

                {/* ── SCREEN 3: CART / CHECKOUT PREVIEW ── */}
                {previewScreen === "cart" && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider">Your Fan Bag (1)</span>
                      <span className="text-[10px] opacity-70">Express Checkout</span>
                    </div>

                    <div
                      className="flex items-center gap-2.5 p-2.5 shadow-sm"
                      style={{
                        backgroundColor: branding.surfaceColor,
                        borderRadius: `${branding.borderRadius}px`,
                      }}
                    >
                      <img src={SAMPLE_PRODUCTS[0].image} alt="Cart" className="h-12 w-12 rounded object-cover" />
                      <div className="flex-1">
                        <div className="text-[11px] font-bold line-clamp-1">{SAMPLE_PRODUCTS[0].title}</div>
                        <div className="text-[10px] opacity-60">Deluxe Box • Qty 1</div>
                        <div className="mt-0.5 text-xs font-bold" style={{ color: branding.primaryColor }}>
                          {SAMPLE_PRODUCTS[0].price}
                        </div>
                      </div>
                    </div>

                    {/* Subtotal summary */}
                    <div className="space-y-1 rounded-lg bg-black/20 p-2.5 text-[11px]">
                      <div className="flex justify-between opacity-70">
                        <span>Subtotal</span>
                        <span>$140.00</span>
                      </div>
                      <div className="flex justify-between opacity-70">
                        <span>Est. Shipping</span>
                        <span>$5.95</span>
                      </div>
                      <div className="flex justify-between font-bold pt-1 border-t border-white/10">
                        <span>Total</span>
                        <span style={{ color: branding.primaryColor }}>$145.95</span>
                      </div>
                    </div>

                    {/* Native Shopify Checkout Sheet Bridge Button */}
                    <button
                      className="w-full py-2.5 text-center text-xs font-bold uppercase tracking-wider text-black shadow-md transition active:scale-95"
                      style={{
                        backgroundColor: branding.primaryColor,
                        borderRadius: `${branding.borderRadius}px`,
                      }}
                    >
                      ⚡ Shopify 1-Click Checkout
                    </button>
                  </div>
                )}

              </div>

              {/* Bottom Home Indicator */}
              <div className="absolute bottom-1.5 left-1/2 h-1 w-28 -translate-x-1/2 rounded-full bg-white/20"></div>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
}
