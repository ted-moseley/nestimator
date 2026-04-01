/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Home, 
  Bed, 
  Bath, 
  Maximize, 
  Waves, 
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
  Cell,
  PieChart,
  Pie
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
  const [priceAdjustment, setPriceAdjustment] = useState(0); // Percentage adjustment from baseline

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
      setError('Failed to analyze property. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const adjustedData = useMemo(() => {
    if (!analysis) return null;

    const currentPrice = analysis.baselinePrice * (1 + priceAdjustment / 100);
    
    // Total demand score adjustment
    // Higher price = lower demand. Sensitivity determines the drop rate.
    const sensitivityFactor = analysis.priceSensitivity / 100;
    const adjustedDemand = Math.max(0, Math.min(100, 
      analysis.demandScore * (1 - (priceAdjustment / 100) * sensitivityFactor)
    ));

    // Migration patterns adjustment
    const adjustedMigration = analysis.migrationPatterns.map(p => {
      // Each origin has its own elasticity
      const elasticityFactor = p.priceElasticity || 1;
      const rawNewPercentage = p.basePercentage * (1 - (priceAdjustment / 100) * (elasticityFactor - 1));
      return {
        ...p,
        percentage: Math.max(1, Math.round(rawNewPercentage))
      };
    });

    // Normalize migration percentages to sum to ~100 if needed, or just show relative shifts
    const total = adjustedMigration.reduce((sum, p) => sum + p.percentage, 0);
    const normalizedMigration = adjustedMigration.map(p => ({
      ...p,
      percentage: Math.round((p.percentage / total) * 100)
    }));

    return {
      currentPrice,
      adjustedDemand: Math.round(adjustedDemand),
      normalizedMigration
    };
  }, [analysis, priceAdjustment]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Nestimator</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">By Orlando Nest</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-[11px] uppercase tracking-widest font-bold text-slate-500">
            <span className="flex items-center gap-2"><Globe className="w-3 h-3" /> Global Intelligence</span>
            <span className="flex items-center gap-2"><Search className="w-3 h-3" /> Real-Time Data</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Section */}
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <h2 className="text-xs uppercase tracking-widest font-bold text-slate-400">Market Analysis</h2>
            </div>
            <form onSubmit={handleAnalyze} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] uppercase font-bold text-slate-500">Property Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter full address..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] uppercase font-bold text-slate-500">Current Condition</label>
                <div className="relative">
                  <select 
                    value={userCondition}
                    onChange={(e) => setUserCondition(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer transition-all"
                  >
                    {CONDITION_LEVELS.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isAnalyzing}
                className="w-full bg-slate-900 text-white p-4 rounded-xl uppercase font-bold tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-slate-200"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Run Analysis
                  </>
                )}
              </button>
            </form>
          </div>

          {analysis && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
            >
              <h2 className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-6">Interactive Pricing</h2>
              <div className="space-y-8">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Target Price</p>
                    <p className="text-3xl font-bold tracking-tight text-slate-900">
                      ${adjustedData?.currentPrice.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Adjustment</p>
                    <p className={cn(
                      "text-sm font-bold",
                      priceAdjustment > 0 ? "text-rose-500" : priceAdjustment < 0 ? "text-emerald-500" : "text-slate-400"
                    )}>
                      {priceAdjustment > 0 ? '+' : ''}{priceAdjustment}%
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="relative h-2 bg-slate-100 rounded-full">
                    <input 
                      type="range" 
                      min="-30" 
                      max="30" 
                      step="1"
                      value={priceAdjustment}
                      onChange={(e) => setPriceAdjustment(Number(e.target.value))}
                      className="absolute inset-0 w-full h-2 bg-transparent appearance-none cursor-pointer accent-blue-600 z-10"
                    />
                    <div 
                      className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-300 -translate-x-1/2" 
                    />
                  </div>
                  <div className="flex justify-between text-[9px] uppercase font-bold text-slate-400">
                    <span>Aggressive</span>
                    <span>Baseline</span>
                    <span>Premium</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-4">Property Profile</p>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                      <Bed className="w-3 h-3 text-blue-600" />
                      <span className="text-xs font-bold text-slate-700">{analysis.propertyDetails.beds} Beds</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                      <Bath className="w-3 h-3 text-blue-600" />
                      <span className="text-xs font-bold text-slate-700">{analysis.propertyDetails.baths} Baths</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                      <Maximize className="w-3 h-3 text-blue-600" />
                      <span className="text-xs font-bold text-slate-700">{analysis.propertyDetails.sqft.toLocaleString()} Sqft</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                      <Home className="w-3 h-3 text-blue-600" />
                      <span className="text-xs font-bold text-slate-700 truncate">{analysis.propertyDetails.propertyType}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-rose-700">
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
                className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center"
              >
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                  <Home className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-2xl font-serif italic text-slate-800 mb-2">Ready for Intelligence?</h3>
                <p className="text-slate-500 max-w-md mx-auto">Enter a property address to pull public records and analyze buyer demand patterns across the Orlando market.</p>
              </motion.div>
            ) : isAnalyzing ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div className="h-64 bg-white rounded-3xl border border-slate-200 animate-pulse" />
                <div className="grid grid-cols-2 gap-8">
                  <div className="h-48 bg-white rounded-3xl border border-slate-200 animate-pulse" />
                  <div className="h-48 bg-white rounded-3xl border border-slate-200 animate-pulse" />
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8 pb-12"
              >
                {/* Demand Score Card */}
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 blur-3xl" />
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <h2 className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-2">Buyer Pool Strength</h2>
                        <p className="text-3xl font-serif italic font-bold text-slate-900">
                          {adjustedData?.adjustedDemand && adjustedData.adjustedDemand > 70 ? 'High Liquidity' : 
                           adjustedData?.adjustedDemand && adjustedData.adjustedDemand > 40 ? 'Stable Interest' : 'Limited Pool'}
                        </p>
                      </div>
                      <div className="text-right">
                        <h2 className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-2">Demand Score</h2>
                        <p className="text-5xl font-bold tracking-tighter text-blue-600">
                          {adjustedData?.adjustedDemand}
                          <span className="text-sm text-slate-300 ml-1">/100</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${adjustedData?.adjustedDemand}%` }}
                          className={cn(
                            "h-full transition-all duration-1000 ease-out",
                            (adjustedData?.adjustedDemand || 0) > 70 ? "bg-emerald-500" : 
                            (adjustedData?.adjustedDemand || 0) > 40 ? "bg-blue-600" : "bg-rose-500"
                          )}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                        <span>Low Velocity</span>
                        <span>Market Average</span>
                        <span>Peak Demand</span>
                      </div>
                    </div>

                    <p className="mt-8 text-slate-600 leading-relaxed max-w-2xl">
                      Based on current search volume and migration trends, this property attracts a 
                      <span className="font-bold text-slate-900"> {adjustedData?.adjustedDemand}% </span> 
                      relative buyer pool. At this price point, the liquidity is 
                      <span className="font-bold text-slate-900"> {adjustedData?.adjustedDemand && adjustedData.adjustedDemand > 50 ? 'above' : 'below'} </span> 
                      the 90-day neighborhood average.
                    </p>
                  </div>
                </div>

                {/* Search Trends & Migration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Local Search Trends */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                        </div>
                        <h2 className="text-xs uppercase tracking-widest font-bold text-slate-900">Search Interest</h2>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Last 6 Months</span>
                    </div>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analysis.localSearchTrends}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis 
                            dataKey="period" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }} 
                          />
                          <YAxis hide />
                          <Tooltip 
                            cursor={{ fill: '#F1F5F9' }}
                            contentStyle={{ 
                              backgroundColor: '#1E293B', 
                              border: 'none', 
                              borderRadius: '12px',
                              color: '#F8FAFC',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              textTransform: 'uppercase'
                            }}
                          />
                          <Bar dataKey="interest" radius={[4, 4, 0, 0]}>
                            {analysis.localSearchTrends.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={index === analysis.localSearchTrends.length - 1 ? '#2563EB' : '#94A3B8'} 
                                fillOpacity={0.6 + (index / analysis.localSearchTrends.length) * 0.4}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Migration Origins */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                          <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                        </div>
                        <h2 className="text-xs uppercase tracking-widest font-bold text-slate-900">Buyer Origins</h2>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Migration Flow</span>
                    </div>
                    <div className="space-y-5">
                      {adjustedData?.normalizedMigration.map((pattern) => (
                        <div key={pattern.origin} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-700">{pattern.origin}</span>
                              <span className={cn(
                                "text-[8px] px-1.5 py-0.5 rounded-full uppercase font-bold",
                                pattern.trend === 'increasing' ? "bg-emerald-50 text-emerald-600" :
                                pattern.trend === 'decreasing' ? "bg-rose-50 text-rose-600" :
                                "bg-slate-50 text-slate-500"
                              )}>
                                {pattern.trend}
                              </span>
                            </div>
                            <span className="text-sm font-bold text-slate-900">{pattern.percentage}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${pattern.percentage}%` }}
                              className="h-full bg-slate-300 rounded-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Global Interest & Summary */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  <div className="md:col-span-4 bg-slate-900 rounded-3xl p-8 text-white shadow-xl shadow-slate-200">
                    <div className="flex items-center gap-2 mb-8">
                      <Globe className="w-5 h-5 text-blue-400" />
                      <h2 className="text-xs uppercase tracking-widest font-bold">Global Scale</h2>
                    </div>
                    <div className="space-y-6">
                      {analysis.globalInterest.map((item) => (
                        <div key={item.region} className="space-y-2">
                          <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                            <span>{item.region}</span>
                            <span className="text-blue-400">{item.level}</span>
                          </div>
                          <div className="h-1 bg-white/10 rounded-full w-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: item.level === 'High' ? '90%' : item.level === 'Medium' ? '50%' : '20%' }}
                              className="h-full bg-blue-500 rounded-full" 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-8 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                    <h2 className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-6">Market Summary</h2>
                    <div className="prose prose-slate max-w-none">
                      <p className="text-xl font-serif italic leading-relaxed text-slate-800">
                        "{analysis.marketSummary}"
                      </p>
                    </div>
                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-slate-100 pt-8">
                      <div className="flex items-center gap-4">
                        <div className="flex -space-x-3">
                          {[1, 2, 3, 4].map(i => (
                            <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden shadow-sm">
                              <img src={`https://picsum.photos/seed/${i + 20}/40/40`} alt="user" referrerPolicy="no-referrer" />
                            </div>
                          ))}
                        </div>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                          <span className="text-slate-900">1,240+ Investors</span> tracking this zip code
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          const text = `Nestimator Report for ${address}\nPrice: $${adjustedData?.currentPrice.toLocaleString()}\nDemand Score: ${adjustedData?.adjustedDemand}/100\n\nSummary: ${analysis.marketSummary}`;
                          navigator.clipboard.writeText(text);
                          alert('Report copied to clipboard!');
                        }}
                        className="flex items-center gap-2 bg-slate-50 text-slate-900 text-[11px] uppercase font-bold tracking-widest px-6 py-3 rounded-xl hover:bg-slate-100 transition-all border border-slate-200"
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
      <footer className="bg-white border-t border-slate-200 p-12 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="font-bold tracking-tight text-slate-900">Nestimator</span>
          </div>
          <div className="flex gap-10 text-[11px] uppercase font-bold tracking-widest text-slate-400">
            <a href="#" className="hover:text-blue-600 transition-colors">Methodology</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Data Sources</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
          </div>
          <div className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">
            © 2026 ORLANDO NEST.
          </div>
        </div>
      </footer>
    </div>
  );
}
