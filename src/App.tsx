/**
 * Nestimator | OrlandoNest
 * Real Broker LLC
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Home, 
  Bed, 
  Bath, 
  Maximize, 
  TrendingUp, 
  MapPin, 
  Globe, 
  ArrowRightLeft,
  Loader2,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeProperty, PropertyAnalysis } from './services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CONDITION_LEVELS = [
  'Handyman Special',
  'Complete Renovation',
  'Needs some TLC',
  'Average',
  'Good',
  'Turn-key'
];

export default function App() {
  const [address, setAddress] = useState('');
  const [userCondition, setUserCondition] = useState('Average');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PropertyAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [priceAdjustment, setPriceAdjustment] = useState(0);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    setIsAnalyzing(true);
    setError(null);
    setPriceAdjustment(0);
    try {
      const result = await analyzeProperty(address, userCondition);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
      setError("Nestimator couldn't complete this analysis. Please verify the address and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const adjustedData = useMemo(() => {
    if (!analysis) return null;
    const currentPrice = analysis.baselinePrice * (1 + priceAdjustment / 100);
    const sensitivityFactor = analysis.priceSensitivity / 100;
    const adjustedDemand = Math.max(0, Math.min(100, 
      analysis.demandScore * (1 - (priceAdjustment / 100) * sensitivityFactor)
    ));
    const adjustedMigration = analysis.migrationPatterns.map(p => {
      const elasticityFactor = p.priceElasticity || 1;
      const rawNewPercentage = p.basePercentage * (1 - (priceAdjustment / 100) * (elasticityFactor - 1));
      return { ...p, percentage: Math.max(1, Math.round(rawNewPercentage)) };
    });
    const total = adjustedMigration.reduce((sum, p) => sum + p.percentage, 0);
    const normalizedMigration = adjustedMigration.map(p => ({
      ...p,
      percentage: Math.round((p.percentage / total) * 100)
    }));
    return { currentPrice, adjustedDemand: Math.round(adjustedDemand), normalizedMigration };
  }, [analysis, priceAdjustment]);

  return (
    <div className="min-h-screen font-sans" style={{ background: '#0B1120', color: '#E2E8F0' }}>

      {/* Header */}
      <header style={{ background: '#0F1729', borderBottom: '1px solid rgba(59,130,246,0.2)' }} className="sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#1D4ED8' }}>
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ color: '#F1F5F9' }}>Nestimator</h1>
              <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#3B82F6' }}>By OrlandoNest · Real Broker LLC</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="https://marketlens.orlandonest.com" 
              className="hidden md:flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full transition-all"
              style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', color: '#60A5FA' }}
            >
              Also: MarketLens
            </a>
            <div 
              className="hidden md:flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', color: '#60A5FA' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse inline-block" />
              Live Data
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Input Section */}
        <section className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl p-6" style={{ background: '#111827', border: '1px solid rgba(59,130,246,0.15)' }}>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#3B82F6' }}>// Property Analysis</span>
            </div>
            <form onSubmit={handleAnalyze} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] uppercase font-bold" style={{ color: '#64748B' }}>Property Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#475569' }} />
                  <input 
                    type="text" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter full address..."
                    className="w-full rounded-xl p-3 pl-10 focus:outline-none transition-all"
                    style={{ 
                      background: '#0B1120', 
                      border: '1px solid rgba(59,130,246,0.2)', 
                      color: '#E2E8F0' 
                    }}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] uppercase font-bold" style={{ color: '#64748B' }}>Current Condition</label>
                <div className="relative">
                  <select 
                    value={userCondition}
                    onChange={(e) => setUserCondition(e.target.value)}
                    className="w-full rounded-xl p-3 focus:outline-none appearance-none cursor-pointer transition-all"
                    style={{ 
                      background: '#0B1120', 
                      border: '1px solid rgba(59,130,246,0.2)', 
                      color: '#60A5FA' 
                    }}
                  >
                    {CONDITION_LEVELS.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 pointer-events-none" style={{ color: '#475569' }} />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isAnalyzing}
                className="w-full text-white p-4 rounded-xl uppercase font-bold tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: '#1D4ED8' }}
              >
                {isAnalyzing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Analyzing...</>
                ) : (
                  <><Search className="w-4 h-4" />Run Analysis</>
                )}
              </button>
            </form>
          </div>

          {analysis && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-6"
              style={{ background: '#111827', border: '1px solid rgba(59,130,246,0.15)' }}
            >
              <span className="text-[10px] uppercase tracking-widest font-bold mb-6 block" style={{ color: '#3B82F6' }}>// Interactive Pricing</span>
              <div className="space-y-8">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] uppercase font-bold mb-1" style={{ color: '#64748B' }}>Target Price</p>
                    <p className="text-3xl font-bold tracking-tight" style={{ color: '#F1F5F9' }}>
                      ${adjustedData?.currentPrice.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold mb-1" style={{ color: '#64748B' }}>Adjustment</p>
                    <p className={cn(
                      "text-sm font-bold",
                      priceAdjustment > 0 ? "text-rose-400" : priceAdjustment < 0 ? "text-emerald-400" : "text-slate-500"
                    )}>
                      {priceAdjustment > 0 ? '+' : ''}{priceAdjustment}%
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="relative h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <input 
                      type="range" 
                      min="-30" max="30" step="1"
                      value={priceAdjustment}
                      onChange={(e) => setPriceAdjustment(Number(e.target.value))}
                      className="absolute inset-0 w-full h-2 bg-transparent appearance-none cursor-pointer z-10"
                      style={{ accentColor: '#2563EB' }}
                    />
                    <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2" style={{ background: 'rgba(255,255,255,0.1)' }} />
                  </div>
                  <div className="flex justify-between text-[9px] uppercase font-bold" style={{ color: '#475569' }}>
                    <span>Aggressive</span><span>Baseline</span><span>Premium</span>
                  </div>
                </div>

                <div className="pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[10px] uppercase font-bold mb-4" style={{ color: '#64748B' }}>Property Profile</p>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                    {[
                      { icon: <Bed className="w-3 h-3" style={{ color: '#3B82F6' }} />, label: `${analysis.propertyDetails.beds} Beds` },
                      { icon: <Bath className="w-3 h-3" style={{ color: '#3B82F6' }} />, label: `${analysis.propertyDetails.baths} Baths` },
                      { icon: <Maximize className="w-3 h-3" style={{ color: '#3B82F6' }} />, label: `${analysis.propertyDetails.sqft.toLocaleString()} Sqft` },
                      { icon: <Home className="w-3 h-3" style={{ color: '#3B82F6' }} />, label: analysis.propertyDetails.propertyType },
                    ].map(({ icon, label }) => (
                      <div key={label} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: '#0B1120' }}>
                        {icon}
                        <span className="text-xs font-bold truncate" style={{ color: '#94A3B8' }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {error && (
            <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171' }}>
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
        </section>

        {/* Results Section */}
        <section className="lg:col-span-8 space-y-8">
          <AnimatePresence mode="wait">
            {!analysis && !isAnalyzing ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full min-h-[500px] flex flex-col items-center justify-center rounded-3xl p-12 text-center"
                style={{ background: '#111827', border: '1px solid rgba(59,130,246,0.15)' }}
              >
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: '#0B1120' }}>
                  <Home className="w-10 h-10" style={{ color: '#1E3A5F' }} />
                </div>
                <h3 className="text-2xl font-serif italic mb-2" style={{ color: '#F1F5F9' }}>Ready for Intelligence?</h3>
                <p style={{ color: '#475569' }} className="max-w-md mx-auto">Enter a property address to pull public records and analyze buyer demand patterns across the Orlando market.</p>
              </motion.div>
            ) : isAnalyzing ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="h-64 rounded-3xl animate-pulse" style={{ background: '#111827', border: '1px solid rgba(59,130,246,0.1)' }} />
                <div className="grid grid-cols-2 gap-8">
                  <div className="h-48 rounded-3xl animate-pulse" style={{ background: '#111827', border: '1px solid rgba(59,130,246,0.1)' }} />
                  <div className="h-48 rounded-3xl animate-pulse" style={{ background: '#111827', border: '1px solid rgba(59,130,246,0.1)' }} />
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8 pb-12"
              >
                {/* Demand Score Card */}
                <div className="rounded-3xl p-8 overflow-hidden relative" style={{ background: '#111827', border: '1px solid rgba(59,130,246,0.15)' }}>
                  <div className="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/2 translate-x-1/2 opacity-10 blur-3xl" style={{ background: '#1D4ED8' }} />
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <p className="text-xs uppercase tracking-widest font-bold mb-2" style={{ color: '#3B82F6' }}>// Buyer Pool Strength</p>
                        <p className="text-3xl font-serif italic font-bold" style={{ color: '#F1F5F9' }}>
                          {(adjustedData?.adjustedDemand ?? 0) > 70 ? 'High Liquidity' : 
                           (adjustedData?.adjustedDemand ?? 0) > 40 ? 'Stable Interest' : 'Limited Pool'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-widest font-bold mb-2" style={{ color: '#64748B' }}>Demand Score</p>
                        <p className="text-5xl font-bold tracking-tighter" style={{ color: '#3B82F6' }}>
                          {adjustedData?.adjustedDemand}
                          <span className="text-sm ml-1" style={{ color: '#334155' }}>/100</span>
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="relative h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${adjustedData?.adjustedDemand}%` }}
                          className="h-full transition-all duration-1000 ease-out rounded-full"
                          style={{ 
                            background: (adjustedData?.adjustedDemand ?? 0) > 70 ? '#10B981' : 
                                        (adjustedData?.adjustedDemand ?? 0) > 40 ? '#1D4ED8' : '#EF4444'
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] uppercase font-bold" style={{ color: '#475569' }}>
                        <span>Low Velocity</span><span>Market Average</span><span>Peak Demand</span>
                      </div>
                    </div>
                    <p className="mt-8 leading-relaxed max-w-2xl" style={{ color: '#64748B' }}>
                      Based on current search volume and migration trends, this property attracts a 
                      <span className="font-bold" style={{ color: '#F1F5F9' }}> {adjustedData?.adjustedDemand}% </span> 
                      relative buyer pool. At this price point, the liquidity is 
                      <span className="font-bold" style={{ color: '#F1F5F9' }}> {(adjustedData?.adjustedDemand ?? 0) > 50 ? 'above' : 'below'} </span> 
                      the 90-day neighborhood average.
                    </p>
                  </div>
                </div>

                {/* Search Trends & Migration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="rounded-3xl p-8" style={{ background: '#111827', border: '1px solid rgba(59,130,246,0.15)' }}>
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(29,78,216,0.15)' }}>
                          <TrendingUp className="w-4 h-4" style={{ color: '#3B82F6' }} />
                        </div>
                        <span className="text-xs uppercase tracking-widest font-bold" style={{ color: '#F1F5F9' }}>Search Interest</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase" style={{ color: '#475569' }}>Last 6 Months</span>
                    </div>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analysis.localSearchTrends}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} />
                          <YAxis hide />
                          <Tooltip 
                            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                            contentStyle={{ backgroundColor: '#0F1729', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '12px', color: '#E2E8F0', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                          />
                          <Bar dataKey="interest" radius={[4, 4, 0, 0]}>
                            {analysis.localSearchTrends.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index === analysis.localSearchTrends.length - 1 ? '#2563EB' : '#1E3A5F'} fillOpacity={0.6 + (index / analysis.localSearchTrends.length) * 0.4} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="rounded-3xl p-8" style={{ background: '#111827', border: '1px solid rgba(59,130,246,0.15)' }}>
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(29,78,216,0.15)' }}>
                          <ArrowRightLeft className="w-4 h-4" style={{ color: '#3B82F6' }} />
                        </div>
                        <span className="text-xs uppercase tracking-widest font-bold" style={{ color: '#F1F5F9' }}>Buyer Origins</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase" style={{ color: '#475569' }}>Migration Flow</span>
                    </div>
                    <div className="space-y-5">
                      {adjustedData?.normalizedMigration.map((pattern) => (
                        <div key={pattern.origin} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold" style={{ color: '#E2E8F0' }}>{pattern.origin}</span>
                              <span className={cn(
                                "text-[8px] px-1.5 py-0.5 rounded-full uppercase font-bold",
                                pattern.trend === 'increasing' ? "bg-emerald-900/50 text-emerald-400" :
                                pattern.trend === 'decreasing' ? "bg-red-900/50 text-red-400" :
                                "bg-slate-800 text-slate-500"
                              )}>
                                {pattern.trend}
                              </span>
                            </div>
                            <span className="text-sm font-bold" style={{ color: '#F1F5F9' }}>{pattern.percentage}%</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${pattern.percentage}%` }}
                              className="h-full rounded-full"
                              style={{ background: '#1D4ED8' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Global Interest & Summary */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  <div className="md:col-span-4 rounded-3xl p-8" style={{ background: '#0F1729', border: '1px solid rgba(59,130,246,0.2)' }}>
                    <div className="flex items-center gap-2 mb-8">
                      <Globe className="w-5 h-5" style={{ color: '#3B82F6' }} />
                      <span className="text-xs uppercase tracking-widest font-bold" style={{ color: '#3B82F6' }}>// Global Scale</span>
                    </div>
                    <div className="space-y-6">
                      {analysis.globalInterest.map((item) => (
                        <div key={item.region} className="space-y-2">
                          <div className="flex justify-between text-[10px] uppercase font-bold" style={{ color: '#475569' }}>
                            <span>{item.region}</span>
                            <span style={{ color: '#3B82F6' }}>{item.level}</span>
                          </div>
                          <div className="h-1 rounded-full w-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: item.level === 'High' ? '90%' : item.level === 'Medium' ? '50%' : '20%' }}
                              className="h-full rounded-full"
                              style={{ background: '#1D4ED8' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-8 rounded-3xl p-8" style={{ background: '#111827', border: '1px solid rgba(59,130,246,0.15)' }}>
                    <span className="text-xs uppercase tracking-widest font-bold mb-6 block" style={{ color: '#3B82F6' }}>// Market Summary</span>
                    <p className="text-xl font-serif italic leading-relaxed" style={{ color: '#94A3B8' }}>
                      "{analysis.marketSummary}"
                    </p>
                    <div className="mt-10 flex justify-end pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <button 
                        onClick={() => {
                          const text = `Nestimator Report for ${address}\nPrice: $${adjustedData?.currentPrice.toLocaleString()}\nDemand Score: ${adjustedData?.adjustedDemand}/100\n\nSummary: ${analysis.marketSummary}`;
                          navigator.clipboard.writeText(text);
                          alert('Report copied to clipboard!');
                        }}
                        className="flex items-center gap-2 text-[11px] uppercase font-bold tracking-widest px-6 py-3 rounded-xl transition-all"
                        style={{ background: '#0B1120', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.2)' }}
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        Copy Report
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Footer */}
      <footer className="p-12 mt-12" style={{ background: '#0F1729', borderTop: '1px solid rgba(59,130,246,0.15)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#1D4ED8' }}>
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold tracking-tight" style={{ color: '#F1F5F9' }}>Nestimator</span>
          </div>
          <div className="flex gap-10 text-[11px] uppercase font-bold tracking-widest" style={{ color: '#334155' }}>
            <span>Methodology</span>
            <span>Data Sources</span>
            <span>Privacy</span>
          </div>
          <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#334155' }}>
            © 2026 OrlandoNest · Real Broker LLC
          </div>
        </div>
      </footer>
    </div>
  );
}
