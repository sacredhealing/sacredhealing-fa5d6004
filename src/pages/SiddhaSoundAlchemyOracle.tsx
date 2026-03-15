/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  Zap,
  Activity,
  Sparkles,
  Waves,
  Info,
  Loader2,
  ChevronRight,
  Music,
  X,
  ArrowLeft,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { analyzeAudio } from '@/services/geminiService';
import { ENERGY_APOTHECARY, SCALAR_BY_CATEGORY, ScalarWave } from '@/features/siddha-sound-oracle/constants';
import { useAdminRole } from '@/hooks/useAdminRole';

type ScalarTab = 'herb' | 'place' | 'master';

const TAB_LABELS: Record<ScalarTab, string> = {
  herb: '🌿 Plant Devas',
  place: '🏛️ Holy Places',
  master: '✨ Avataric',
};

function SiddhaSoundAlchemyOracleInner() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAlchemizing, setIsAlchemizing] = useState(false);
  const [alchemyResult, setAlchemyResult] = useState<{ status: string; message: string; url?: string } | null>(null);
  const [selectedFrequency, setSelectedFrequency] = useState(ENERGY_APOTHECARY.frequencies[0]);
  const [selectedBinaural, setSelectedBinaural] = useState(ENERGY_APOTHECARY.binauralEntrainment[0]);
  const [selectedMaster, setSelectedMaster] = useState(ENERGY_APOTHECARY.masters[0]);

  const [activeScalarWaves, setActiveScalarWaves] = useState<ScalarWave[]>([]);
  const [scalarTab, setScalarTab] = useState<ScalarTab>('herb');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const base64 = await readFileAsBase64(file);
      const analysis = await analyzeAudio(base64, file.type, activeScalarWaves);
      setResult(analysis);
    } catch (err) {
      console.error(err);
      setError("The quantum link failed. Please ensure your audio signature is valid.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAlchemize = async () => {
    if (!file) return;
    setIsAlchemizing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("audio", file);
      formData.append("healingFrequencyHz", selectedFrequency.hz.toString());
      formData.append("binauralBase", selectedBinaural.base.toString());
      formData.append("binauralTarget", selectedBinaural.target.toString());
      formData.append("masterEnergyEq", selectedMaster.eq);
      formData.append("scalarWaveKeys", JSON.stringify(
        activeScalarWaves.map(w => w.metadataKey)
      ));

      const response = await fetch("/api/alchemize", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Alchemy failed");
      const data = await response.json();
      setAlchemyResult(data);
    } catch (err) {
      console.error(err);
      setError("The alchemical transmutation failed. Check your quantum connection.");
    } finally {
      setIsAlchemizing(false);
    }
  };

  const toggleScalarWave = (wave: ScalarWave) => {
    setActiveScalarWaves(prev => {
      const exists = prev.find(w => w.id === wave.id);
      if (exists) return prev.filter(w => w.id !== wave.id);
      if (prev.length >= 3) return prev;
      return [...prev, wave];
    });
  };

  const isWaveActive = (id: string) => activeScalarWaves.some(w => w.id === id);

  return (
    <div className="min-h-screen bg-[#0a0502] text-[#e0d8d0] font-sans selection:bg-[#ff4e00]/30 selection:text-white overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#3a1510] rounded-full blur-[120px] opacity-40 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#ff4e00] rounded-full blur-[150px] opacity-20" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 lg:py-24">
        <div className="mb-8">
          <button
            type="button"
            onClick={() => navigate("/creative-soul/store")}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/60 hover:text-[#ff4e00]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Creative Soul Store
          </button>
        </div>

        <header className="mb-16 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#ff4e00]/30 bg-[#ff4e00]/5 text-[#ff4e00] text-[10px] uppercase tracking-[0.2em] mb-6">
              <Zap size={12} />
              Quantum Audio Alchemy • Year 2050
            </div>
            <h1 className="text-5xl md:text-7xl font-light tracking-tighter mb-4 italic font-serif">
              Siddha Sound <span className="text-[#ff4e00]">Oracle</span>
            </h1>
            <p className="text-[#8e9299] max-w-xl mx-auto text-lg font-light leading-relaxed">
              Bridge ancient spiritual wisdom with futuristic vibrational technology.
              Scan your audio signatures for multidimensional alignment.
            </p>
          </motion.div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5 space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#151619]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              <h2 className="text-xs uppercase tracking-[0.2em] text-[#ff4e00] mb-6 flex items-center gap-2">
                <Activity size={14} />
                Input Interface
              </h2>

              <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-10 transition-all duration-500
                  ${file ? 'border-[#ff4e00]/50 bg-[#ff4e00]/5' : 'border-white/10 hover:border-[#ff4e00]/30 hover:bg-white/5'}`}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*" className="hidden" />
                <div className="flex flex-col items-center text-center gap-4">
                  <div className={`p-4 rounded-full transition-transform duration-500 group-hover:scale-110 ${file ? 'bg-[#ff4e00] text-white' : 'bg-white/5 text-[#8e9299]'}`}>
                    {file ? <Music size={32} /> : <Upload size={32} />}
                  </div>
                  <div>
                    <p className="font-medium text-lg">{file ? file.name : 'Upload Audio Signature'}</p>
                    <p className="text-sm text-[#8e9299] mt-1">MP3, WAV, or AAC (Max 2 hours)</p>
                  </div>
                </div>
              </div>

              {/* ── STEP 4: SCALAR WAVE TRANSMISSIONS ─────────────────────── */}
              <div className="mt-8 pt-8 border-t border-white/10">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-[#8e9299] uppercase tracking-[0.2em]">
                    Scalar Wave Transmissions
                  </label>
                  <span className="text-[9px] text-[#ff4e00]/60 uppercase tracking-wider">
                    {activeScalarWaves.length}/3 active
                  </span>
                </div>
                <p className="text-[10px] text-[#8e9299]/60 mb-4 leading-relaxed">
                  Not frequencies — living consciousness fields. The audio becomes a carrier vessel for the spirit of the master, place, or plant deva.
                </p>

                {activeScalarWaves.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {activeScalarWaves.map(wave => (
                      <motion.div
                        key={wave.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ff4e00]/15 border border-[#ff4e00]/40 text-[#ff4e00] text-[10px] uppercase tracking-wider"
                        style={{ boxShadow: '0 0 12px rgba(255,78,0,0.2)' }}
                      >
                        <span>{wave.icon}</span>
                        <span>{wave.name}</span>
                        <button onClick={() => toggleScalarWave(wave)} className="ml-1 opacity-60 hover:opacity-100">
                          <X size={10} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}

                <div className="flex gap-1 mb-3">
                  {(Object.keys(TAB_LABELS) as ScalarTab[]).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setScalarTab(tab)}
                      className={`flex-1 py-2 rounded-xl text-[9px] uppercase tracking-wider transition-all duration-300
                        ${scalarTab === tab
                          ? 'bg-[#ff4e00]/20 border border-[#ff4e00]/50 text-[#ff4e00]'
                          : 'bg-white/5 border border-white/5 text-[#8e9299] hover:bg-white/10'}`}
                    >
                      {TAB_LABELS[tab]}
                    </button>
                  ))}
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={scalarTab}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-2"
                    >
                      {SCALAR_BY_CATEGORY[scalarTab].map(wave => {
                        const active = isWaveActive(wave.id);
                        const maxed = activeScalarWaves.length >= 3 && !active;
                        return (
                          <button
                            key={wave.id}
                            onClick={() => !maxed && toggleScalarWave(wave)}
                            disabled={maxed}
                            className={`w-full p-3 rounded-xl text-left border transition-all duration-300
                              ${active
                                ? 'bg-[#ff4e00]/15 border-[#ff4e00]/60 text-[#ff4e00]'
                                : maxed
                                  ? 'bg-white/2 border-white/5 text-[#8e9299]/30 cursor-not-allowed'
                                  : 'bg-white/5 border-white/5 text-[#8e9299] hover:bg-white/10 hover:border-white/10'}`}
                            style={active ? { boxShadow: '0 0 16px rgba(255,78,0,0.15)' } : {}}
                          >
                            <div className="flex items-start gap-2">
                              <span className="text-base leading-none mt-0.5">{wave.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold truncate">{wave.name}</span>
                                  {active && <Sparkles size={10} className="shrink-0 ml-1" />}
                                </div>
                                <div className={`text-[9px] mt-0.5 leading-relaxed truncate ${active ? 'text-[#ff4e00]/70' : 'text-[#8e9299]/60'}`}>
                                  {wave.field}
                                </div>
                                <div className={`text-[9px] mt-1 leading-relaxed line-clamp-2 ${active ? 'text-[#ff4e00]/50' : 'text-[#8e9299]/40'}`}>
                                  {wave.nature}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              <button
                disabled={!file || isAnalyzing}
                onClick={handleAnalyze}
                className={`w-full mt-8 py-4 rounded-xl flex items-center justify-center gap-3 font-medium tracking-wide transition-all duration-500
                  ${!file || isAnalyzing
                    ? 'bg-white/5 text-[#8e9299] cursor-not-allowed'
                    : 'bg-[#ff4e00] text-white hover:bg-[#ff6a2a] shadow-[0_0_20px_rgba(255,78,0,0.3)] hover:shadow-[0_0_30px_rgba(255,78,0,0.5)]'}`}
              >
                {isAnalyzing ? (
                  <><Loader2 className="animate-spin" size={20} />Scanning Scalar Fields...</>
                ) : (
                  <><Sparkles size={20} />Initiate Siddha Scan</>
                )}
              </button>

              {error && (
                <p className="mt-4 text-red-400 text-sm text-center bg-red-400/10 py-2 rounded-lg border border-red-400/20">
                  {error}
                </p>
              )}

              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 space-y-6 pt-8 border-t border-white/10"
                >
                  <h3 className="text-xs uppercase tracking-[0.2em] text-[#ff4e00] flex items-center gap-2">
                    <Sparkles size={14} />
                    Alchemical Transmutation
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] text-[#8e9299] uppercase tracking-[0.2em] mb-3">1. Healing Frequency (Sine)</label>
                      <div className="grid grid-cols-2 gap-2">
                        {ENERGY_APOTHECARY.frequencies.map(freq => (
                          <button
                            key={freq.name}
                            onClick={() => setSelectedFrequency(freq)}
                            className={`p-3 rounded-xl text-xs transition-all duration-300 border text-left
                              ${selectedFrequency.name === freq.name
                                ? 'bg-[#ff4e00]/20 border-[#ff4e00] text-[#ff4e00]'
                                : 'bg-white/5 border-white/5 text-[#8e9299] hover:bg-white/10'}`}
                          >
                            <div className="font-bold">{freq.name}</div>
                            <div className="opacity-70">{freq.hz}Hz</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-[#8e9299] uppercase tracking-[0.2em] mb-3">2. Binaural Entrainment</label>
                      <div className="grid grid-cols-1 gap-2">
                        {ENERGY_APOTHECARY.binauralEntrainment.map(bin => (
                          <button
                            key={bin.state}
                            onClick={() => setSelectedBinaural(bin)}
                            className={`p-3 rounded-xl text-xs transition-all duration-300 border text-left flex justify-between items-center
                              ${selectedBinaural.state === bin.state
                                ? 'bg-[#ff4e00]/20 border-[#ff4e00] text-[#ff4e00]'
                                : 'bg-white/5 border-white/5 text-[#8e9299] hover:bg-white/10'}`}
                          >
                            <div>
                              <div className="font-bold">{bin.state}</div>
                              <div className="opacity-70 text-[10px]">{bin.description}</div>
                            </div>
                            <div className="text-[10px] font-mono">{bin.target}Hz</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-[#8e9299] uppercase tracking-[0.2em] mb-3">3. Master Energy Signature</label>
                      <div className="grid grid-cols-2 gap-2">
                        {ENERGY_APOTHECARY.masters.map(master => (
                          <button
                            key={master.name}
                            onClick={() => setSelectedMaster(master)}
                            className={`p-3 rounded-xl text-xs transition-all duration-300 border text-left
                              ${selectedMaster.name === master.name
                                ? 'bg-[#ff4e00]/20 border-[#ff4e00] text-[#ff4e00]'
                                : 'bg-white/5 border-white/5 text-[#8e9299] hover:bg-white/10'}`}
                          >
                            <div className="font-bold">{master.name}</div>
                            <div className="opacity-70 text-[10px]">{master.frequency}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={isAlchemizing}
                    onClick={handleAlchemize}
                    className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-medium tracking-wide transition-all duration-500
                      ${isAlchemizing
                        ? 'bg-white/5 text-[#8e9299] cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#ff4e00] to-[#f27d26] text-white hover:opacity-90 shadow-[0_0_20px_rgba(255,78,0,0.3)]'}`}
                  >
                    {isAlchemizing ? (
                      <><Loader2 className="animate-spin" size={20} />Transmuting Audio...</>
                    ) : (
                      <><Waves size={20} />Start Alchemy Process</>
                    )}
                  </button>

                  {alchemyResult && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center"
                    >
                      <p className="font-medium mb-1">{alchemyResult.message}</p>
                      {alchemyResult.url && (
                        <a href={alchemyResult.url} target="_blank" rel="noopener noreferrer" className="text-xs underline hover:text-emerald-300">
                          Download Alchemized Signature
                        </a>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-[#151619]/40 backdrop-blur-md border border-white/5 rounded-3xl p-8"
            >
              <h2 className="text-xs uppercase tracking-[0.2em] text-[#8e9299] mb-6 flex items-center gap-2">
                <Info size={14} />
                Sacred Apothecary
              </h2>
              <div className="space-y-4">
                {ENERGY_APOTHECARY.masters.slice(0, 3).map((master, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div>
                      <p className="text-sm font-medium">{master.name}</p>
                      <p className="text-[10px] text-[#8e9299] uppercase tracking-wider">{master.frequency}</p>
                    </div>
                    <ChevronRight size={14} className="text-[#ff4e00]" />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {isAnalyzing ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="h-full min-h-[400px] flex flex-col items-center justify-center text-center space-y-6"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#ff4e00] blur-3xl opacity-20 animate-pulse" />
                    <Waves className="text-[#ff4e00] animate-bounce" size={64} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-light italic font-serif">Scanning Multidimensional Geometry</h3>
                    <p className="text-[#8e9299] animate-pulse">
                      {activeScalarWaves.length > 0
                        ? `Channeling through ${activeScalarWaves.map(w => w.name).join(', ')}...`
                        : 'Aligning chakra resonance with 2050 harmonics...'}
                    </p>
                    {activeScalarWaves.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-2 mt-3">
                        {activeScalarWaves.map(w => (
                          <span key={w.id} className="text-[9px] uppercase tracking-wider px-2 py-1 rounded-full border border-[#ff4e00]/30 text-[#ff4e00]/70">
                            {w.icon} {w.field}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#151619]/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 lg:p-12 shadow-2xl h-full"
                >
                  {activeScalarWaves.length > 0 && (
                    <div className="mb-6 p-3 rounded-xl bg-[#ff4e00]/5 border border-[#ff4e00]/20">
                      <p className="text-[9px] uppercase tracking-[0.2em] text-[#ff4e00]/60 mb-2">Transmitted through</p>
                      <div className="flex flex-wrap gap-2">
                        {activeScalarWaves.map(w => (
                          <span key={w.id} className="text-[10px] text-[#ff4e00]/80">
                            {w.icon} {w.name} — <span className="italic opacity-70">{w.field}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="prose prose-invert prose-orange max-w-none">
                    <div className="markdown-body">
                      <Markdown>{result}</Markdown>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full min-h-[400px] border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-center p-12"
                >
                  <div className="p-6 rounded-full bg-white/5 text-[#8e9299] mb-6">
                    <Activity size={48} />
                  </div>
                  <h3 className="text-xl font-light mb-2">Awaiting Audio Signature</h3>
                  <p className="text-[#8e9299] max-w-xs">
                    Upload a file, select your scalar wave transmissions, and begin the Siddha Scan.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-12 mt-24">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex gap-2 text-[#8e9299] text-xs tracking-widest uppercase">
            <Zap size={14} className="text-[#ff4e00]" />
            Siddha Sound Alchemy Oracle © 2050
          </div>
          <div className="flex gap-8 text-[10px] uppercase tracking-[0.2em] text-[#8e9299]">
            <a href="#" className="hover:text-[#ff4e00] transition-colors">Quantum Protocols</a>
            <a href="#" className="hover:text-[#ff4e00] transition-colors">Sacred Frequency Library</a>
            <a href="#" className="hover:text-[#ff4e00] transition-colors">DNA Repair Nodes</a>
          </div>
        </div>
      </footer>

      <style>{`
        .markdown-body h1 {
          font-family: 'Georgia', serif; font-style: italic; font-size: 2.5rem;
          font-weight: 300; color: #ff4e00; margin-bottom: 1.5rem;
          border-bottom: 1px solid rgba(255,78,0,0.2); padding-bottom: 0.5rem;
        }
        .markdown-body h2 {
          font-family: 'Georgia', serif; font-style: italic; font-size: 1.8rem;
          font-weight: 300; color: #ff4e00; margin-top: 2.5rem; margin-bottom: 1rem;
        }
        .markdown-body p { line-height: 1.8; margin-bottom: 1.5rem; color: #e0d8d0; font-weight: 300; }
        .markdown-body ul { list-style-type: none; padding-left: 0; margin-bottom: 1.5rem; }
        .markdown-body li { position: relative; padding-left: 1.5rem; margin-bottom: 0.75rem; color: #e0d8d0; }
        .markdown-body li::before { content: "•"; position: absolute; left: 0; color: #ff4e00; font-weight: bold; }
        .markdown-body strong { color: #ff4e00; font-weight: 500; }
        .markdown-body blockquote {
          border-left: 4px solid #ff4e00; padding-left: 1.5rem;
          font-style: italic; color: #8e9299; margin: 2rem 0;
        }
        .scrollbar-thin::-webkit-scrollbar { width: 3px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,78,0,0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
}

export default function SiddhaSoundAlchemyOracle() {
  const { isAdmin, isLoading } = useAdminRole();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff4e00]" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col">
        <div className="max-w-4xl mx-auto px-6 py-10 w-full">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/60 hover:text-[#D4AF37] mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="rounded-3xl border border-red-500/30 bg-red-500/5 px-6 py-8">
            <p className="text-sm font-semibold tracking-[0.18em] uppercase text-red-300 mb-2">
              Admin Only Field
            </p>
            <p className="text-sm text-white/70">
              The Siddha Sound Alchemy Oracle is a protected creation space and can only be opened
              from an Administrator account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <SiddhaSoundAlchemyOracleInner />;
}
