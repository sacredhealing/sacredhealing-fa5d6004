import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Music, ChevronRight, FileText, History, User, Cpu, Waves, ShieldCheck, Database, Sparkles, Brain } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import DigitalNadiScanner from '@/components/soul-scan/DigitalNadiScanner';
import { generateTransformationDoc, saveHealingReport, fetchHealingReports } from '@/services/transformationDocService';
import type { TransformationDoc } from '@/types/soulScan';
import { SESSION_MODALITIES, type SessionModality } from '@/types/soulScan';
import { useAuth } from '@/hooks/useAuth';

const glassCard = 'rounded-[40px] border border-white/10 bg-white/[0.02] backdrop-blur-xl';

export default function SoulScan() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedModality, setSelectedModality] = useState<SessionModality>(SESSION_MODALITIES[0]);
  const [healerStep, setHealerStep] = useState<'idle' | 'pre-scan' | 'healing' | 'post-scan' | 'generating'>('idle');
  const [preScanResults, setPreScanResults] = useState<unknown>(null);
  const [postScanResults, setPostScanResults] = useState<unknown>(null);
  const [currentDoc, setCurrentDoc] = useState<TransformationDoc | null>(null);
  const [history, setHistory] = useState<TransformationDoc[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'scanner' | 'history'>('scanner');

  useEffect(() => {
    if (!user?.id) return;
    fetchHealingReports(user.id)
      .then(setHistory)
      .catch((err) => console.error('Failed to fetch history:', err));
  }, [user?.id]);

  const saveReport = async (doc: TransformationDoc) => {
    if (!user?.id) return;
    try {
      await saveHealingReport(user.id, doc);
      setHistory((prev) => [doc, ...prev]);
    } catch (e) {
      console.error('Failed to save report:', e);
    }
  };

  const handleScanComplete = async (results: unknown) => {
    if (!selectedModality.isMasterHealer) {
      setIsGenerating(true);
      try {
        const doc = await generateTransformationDoc(
          selectedModality.isMasterHealer ? 'Healer Session' : 'Mantra',
          results
        );
        setCurrentDoc(doc);
        await saveReport(doc);
      } catch (e) {
        console.error('Error generating doc:', e);
      } finally {
        setIsGenerating(false);
      }
    } else {
      if (healerStep === 'pre-scan') {
        setPreScanResults(results);
        setHealerStep('healing');
      } else if (healerStep === 'post-scan') {
        setPostScanResults(results);
        setHealerStep('generating');
        setIsGenerating(true);
        try {
          const doc = await generateTransformationDoc(
            'Healer Session',
            preScanResults,
            results
          );
          setCurrentDoc(doc);
          await saveReport(doc);
        } catch (e) {
          console.error('Error generating comparison doc:', e);
        } finally {
          setIsGenerating(false);
          setHealerStep('idle');
        }
      }
    }
  };

  const startHealerSession = () => {
    setHealerStep('pre-scan');
    setPreScanResults(null);
    setPostScanResults(null);
    setCurrentDoc(null);
  };

  const finishHealing = () => setHealerStep('post-scan');

  const categories = Array.from(new Set(SESSION_MODALITIES.map((m) => m.category)));

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[#D4AF37]/30">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#D4AF37] rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.3)]">
              <Cpu className="w-6 h-6 text-black" />
            </div>
            <span className="text-xl font-black tracking-tight text-[#D4AF37]">SIDDHA 2050</span>
          </div>
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={() => setActiveTab('scanner')}
              className={`text-[8px] font-extrabold tracking-[0.5em] uppercase transition-colors ${activeTab === 'scanner' ? 'text-[#D4AF37]' : 'text-white/40 hover:text-white'}`}
            >
              Scanner
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`text-[8px] font-extrabold tracking-[0.5em] uppercase transition-colors ${activeTab === 'history' ? 'text-[#D4AF37]' : 'text-white/40 hover:text-white'}`}
            >
              Archive
            </button>
            <button type="button" onClick={() => navigate('/profile')} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center">
              <User className="w-5 h-5 text-white/40" />
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 max-w-5xl mx-auto px-6">
        <AnimatePresence mode="wait">
          {activeTab === 'scanner' && (
            <motion.div
              key="scanner-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-12"
            >
              <div className="lg:col-span-5 space-y-10">
                <section>
                  <h1 className="text-5xl font-black tracking-tight mb-6 leading-[0.9]">
                    BHAKTI <br /> <span className="text-[#D4AF37]">ALGORITHMS</span>
                  </h1>
                  <p className="text-white/40 text-sm leading-relaxed mb-10">
                    Access the Akasha-Neural Archive. Deploy Prema-Pulse Transmissions and Vedic Light-Codes to synchronize your bio-field with Avataric Blueprints.
                  </p>
                  <div className="space-y-6">
                    <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-white/40">Neural Modality Selection</div>
                    <div className="space-y-8 max-h-[400px] overflow-y-auto pr-2">
                      {categories.map((category) => (
                        <div key={category} className="space-y-3">
                          <div className="text-[10px] font-extrabold tracking-[0.5em] uppercase text-[#D4AF37]/60 flex items-center gap-2">
                            <div className="h-px flex-1 bg-[#D4AF37]/10" />
                            {category}
                            <div className="h-px flex-1 bg-[#D4AF37]/10" />
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            {SESSION_MODALITIES.filter((m) => m.category === category).map((modality) => (
                              <button
                                key={modality.id}
                                type="button"
                                onClick={() => {
                                  setSelectedModality(modality);
                                  setHealerStep('idle');
                                  if (modality.isMasterHealer) startHealerSession();
                                }}
                                className={`p-4 ${glassCard} transition-all flex items-center justify-between group text-left ${
                                  selectedModality.id === modality.id ? 'border-[#D4AF37]/40 bg-[#D4AF37]/5' : 'hover:border-white/20'
                                }`}
                              >
                                <div className="flex items-center gap-4">
                                  <div
                                    className={`p-2 rounded-xl ${
                                      selectedModality.id === modality.id ? 'bg-[#D4AF37] text-black' : 'bg-white/5 text-white/40'
                                    }`}
                                  >
                                    {modality.isMasterHealer ? <Zap className="w-4 h-4" /> : <Music className="w-4 h-4" />}
                                  </div>
                                  <div>
                                    <div className="font-black text-sm">{modality.name}</div>
                                    <div className="text-[9px] text-white/40 mt-0.5 line-clamp-1">{modality.description}</div>
                                  </div>
                                </div>
                                <ChevronRight
                                  className={`w-4 h-4 transition-transform ${
                                    selectedModality.id === modality.id ? 'text-[#D4AF37]' : 'text-white/20 group-hover:translate-x-1'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={`p-6 ${glassCard} border-[#D4AF37]/10 bg-[#D4AF37]/5`}>
                    <div className="flex items-center gap-3 mb-4">
                      <Waves className="w-5 h-5 text-[#D4AF37]" />
                      <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-[#D4AF37]">Anahata Scalar Activation</div>
                    </div>
                    <p className="text-[10px] text-white/40 leading-relaxed">
                      Every session automatically triggers a Prema-Pulse Transmission to open the Anahata center and activate your audio assets with Vedic Light-Codes.
                    </p>
                  </div>
                </section>

                <AnimatePresence mode="wait">
                  {selectedModality.isMasterHealer && healerStep === 'healing' ? (
                    <motion.div
                      key="healing-step"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`p-10 ${glassCard} text-center space-y-8 border-[#D4AF37]/20`}
                    >
                      <div className="relative inline-block">
                        <div className="w-24 h-24 border-2 border-[#D4AF37]/10 rounded-full" />
                        <div className="absolute inset-0 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                        <Zap className="absolute inset-0 m-auto w-10 h-10 text-[#D4AF37] animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-white uppercase">{selectedModality.name}</h3>
                        <p className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-[#D4AF37] mt-3">HEALING IN PROGRESS</p>
                        <p className="text-[10px] text-white/40 mt-2">Siddha 2050 Actor: Active Intervention</p>
                      </div>
                      <button
                        type="button"
                        onClick={finishHealing}
                        className="w-full py-5 bg-[#D4AF37] text-black font-black tracking-tighter rounded-2xl hover:brightness-110 transition-all shadow-[0_0_30px_rgba(212,175,55,0.3)]"
                      >
                        HEALING FINISHED
                      </button>
                    </motion.div>
                  ) : (
                    <DigitalNadiScanner
                      key="scanner"
                      isHealerPresent={selectedModality.isMasterHealer}
                      onScanComplete={handleScanComplete}
                      modalityName={selectedModality.name}
                      label={
                        selectedModality.isMasterHealer
                          ? healerStep === 'pre-scan'
                            ? 'PRE-SESSION SCAN'
                            : 'POST-SESSION SCAN'
                          : `SCAN FOR ${selectedModality.name.toUpperCase()}`
                      }
                    />
                  )}
                </AnimatePresence>
              </div>

              <div className="lg:col-span-7">
                <div className={`min-h-[600px] ${glassCard} p-10 relative overflow-hidden`}>
                  <AnimatePresence mode="wait">
                    {isGenerating ? (
                      <motion.div
                        key="generating"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505]/60 backdrop-blur-sm z-20"
                      >
                        <div className="w-16 h-16 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-6" />
                        <p className="text-[8px] font-extrabold tracking-[0.5em] uppercase animate-pulse">Synthesizing Transformation Doc...</p>
                      </motion.div>
                    ) : currentDoc ? (
                      <motion.div key="doc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-white/40 mb-2">Deep Transformation Document</div>
                            <h2 className="text-3xl font-black text-white">{currentDoc.title}</h2>
                          </div>
                          <div className="text-right">
                            <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-white/40">Quantum Timestamp</div>
                            <div className="text-[10px] text-white/40 font-mono mt-1">
                              {new Date(currentDoc.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                          {currentDoc.technicalMetrics.map((metric, i) => (
                            <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                              <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-white/40 mb-2">{metric.label}</div>
                              <div className="text-lg font-bold text-[#D4AF37]">{metric.value}</div>
                            </div>
                          ))}
                        </div>
                        <div className="prose prose-invert prose-stone max-w-none">
                          <ReactMarkdown>{currentDoc.documentContent}</ReactMarkdown>
                        </div>
                        <div className="pt-8 border-t border-white/5 flex justify-between items-center">
                          <div className="flex items-center gap-3 text-[8px] font-extrabold tracking-[0.5em] uppercase text-white/40">
                            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                            VERIFIED BY SIDDHA 2050 CORE
                          </div>
                          <button
                            type="button"
                            className="px-6 py-3 bg-white/5 text-[#D4AF37] text-[8px] font-extrabold tracking-[0.5em] uppercase rounded-2xl hover:bg-white/10 transition-colors border border-white/10"
                          >
                            Export PDF
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-20"
                      >
                        <FileText className="w-16 h-16 text-[#D4AF37]" />
                        <div>
                          <p className="font-black text-xl uppercase">Waiting for Scan</p>
                          <p className="text-sm mt-2">Initialize the scanner to generate your transformation document.</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history-tab"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-4xl font-black flex items-center gap-4">
                  <History className="w-10 h-10 text-[#D4AF37]" />
                  AKASHIC ARCHIVE
                </h2>
                <div className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-white/40">{history.length} Records Found</div>
              </div>
              {history.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {history.map((doc, i) => (
                    <motion.div
                      key={doc.id ?? i}
                      whileHover={{ y: -8 }}
                      className={`p-8 ${glassCard} hover:border-[#D4AF37]/30 transition-all cursor-pointer group`}
                      onClick={() => {
                        setCurrentDoc(doc);
                        setActiveTab('scanner');
                      }}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div
                          className={`p-3 rounded-2xl ${
                            doc.sessionType === 'Healer Session' ? 'bg-[#D4AF37] text-black' : 'bg-white/5 text-white/40'
                          }`}
                        >
                          {doc.sessionType === 'Healer Session' ? <Zap className="w-5 h-5" /> : <Music className="w-5 h-5" />}
                        </div>
                        <div className="text-[10px] text-white/20 font-mono">
                          {new Date(doc.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      <h3 className="text-xl font-black text-white mb-3 group-hover:text-[#D4AF37] transition-colors">{doc.title}</h3>
                      <p className="text-[8px] font-extrabold tracking-[0.5em] uppercase text-white/40 mb-6">{doc.sessionType}</p>
                      <div className="flex items-center gap-2 text-[8px] font-extrabold tracking-[0.5em] uppercase text-[#D4AF37]">
                        VIEW RECORD <ChevronRight className="w-3 h-3" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="h-96 flex flex-col items-center justify-center text-white/10">
                  <Database className="w-20 h-20 mb-6 opacity-20" />
                  <p className="font-black text-xl uppercase">No records found in the Causal Body</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 h-12 bg-[#050505]/80 backdrop-blur-md border-t border-white/5 flex items-center px-8 text-[8px] font-extrabold tracking-[0.5em] uppercase text-white/40">
        <div className="max-w-5xl mx-auto w-full flex justify-between">
          <div className="flex gap-10">
            <span className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-[#D4AF37]" /> Quantum Coherence: Stable
            </span>
            <span className="flex items-center gap-2">
              <Waves className="w-3 h-3 text-[#D4AF37]" /> Scalar Field: Active
            </span>
            <span className="flex items-center gap-2">
              <Brain className="w-3 h-3 text-[#D4AF37]" /> Neural Sync: 99.4%
            </span>
          </div>
          <div className="text-white/20">EST. 2050 // OPERATIONAL 2026</div>
        </div>
      </footer>
    </div>
  );
}
