/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Camera, Copy, Check, Sparkles, X, Palette, Heart, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { toPng } from 'html-to-image';

interface ShareCardProps {
  messageText: string;
  username: string;
  onClose: () => void;
}

const GRADIENTS = [
  { name: 'Mimu Royal Glossy', class: 'from-amber-500 via-red-800 to-amber-600 text-white' },
  { name: 'Gold Gloss Shimmer', class: 'from-amber-600 via-yellow-400 to-amber-500 text-neutral-900 border border-amber-300' },
  { name: 'Bubblegum Sparkle', class: 'from-pink-500 via-purple-500 to-indigo-500 text-white' },
  { name: 'Neon Cyber', class: 'from-fuchsia-600 to-cyan-500 text-white' },
  { name: 'Warm Sunset', class: 'from-orange-500 to-rose-600 text-white' },
  { name: 'Emerald Forest', class: 'from-emerald-400 to-teal-800 text-white' },
  { name: 'Late Night Chill', class: 'from-blue-800 to-indigo-950 text-white' },
  { name: 'Midnight Aurora', class: 'from-zinc-900 via-indigo-950 to-zinc-900 text-white border border-indigo-500/20' }
];

export default function ShareCard({ messageText, username, onClose }: ShareCardProps) {
  const [selectedGradient, setSelectedGradient] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleSaveImage = async () => {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      // Create high-res PNG
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        style: {
          transform: 'scale(1)',
        }
      });
      const link = document.createElement('a');
      link.download = `mimu_sticker_${username}_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save sticker image:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="share-card-modal" className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-neutral-900/90 border border-stone-800 rounded-3xl p-6 w-full max-w-md relative shadow-2xl shadow-stone-950"
      >
        <button
          id="btn-close-share"
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-white bg-stone-800 hover:bg-stone-700 p-2 rounded-full transition-all duration-200 cursor-pointer"
          title="Close"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-4 text-amber-400 font-bold font-sans">
          <Palette size={20} />
          <span>Message</span>
        </div>

        {/* The designer sticker */}
        <div
          ref={cardRef}
          className={`relative p-8 rounded-2xl flex flex-col justify-between items-center text-center shadow-2xl aspect-video w-full bg-gradient-to-tr ${GRADIENTS[selectedGradient].class} transition-all duration-300 overflow-hidden`}
        >
          {/* Subtle overlay accent */}
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />

          {/* Sticker watermarks */}
          <div className="flex flex-col items-center gap-1 z-10">
            <span className="text-[11px] uppercase tracking-widest font-extrabold opacity-95 flex items-center gap-1 bg-black/45 px-3.5 py-1 rounded-full backdrop-blur-sm text-amber-200 font-sans shadow-lg shadow-black/10 border border-amber-500/10">
              <Sparkles size={11} className="text-amber-400 animate-spin-slow" />
              ask me anything!
            </span>
            <span className="text-[10px] opacity-80 bg-black/10 px-2 py-0.5 rounded-full mt-1">send anonymous messages on mimu</span>
          </div>

          {/* Central Quote bubble */}
          <div className="bg-stone-950/95 text-stone-100 px-6 py-6 rounded-2xl shadow-2xl max-w-xs mx-auto z-10 border border-stone-800 relative my-4 flex flex-col items-center justify-center">
            {/* Quote triangle */}
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-stone-950/95 rotate-45 border-r border-b border-stone-800 pointer-events-none" />
            <p className="text-sm font-semibold leading-relaxed break-words max-h-36 overflow-y-auto pr-1">
              "{messageText}"
            </p>
          </div>

          {/* Card footer */}
          <div className="z-10 bg-black/45 hover:bg-black/60 px-4 py-1.5 rounded-full text-[10px] font-black tracking-wider uppercase backdrop-blur-sm shadow-md flex items-center gap-1.5 hover:scale-105 transition-transform duration-200 text-amber-400 border border-amber-500/10">
            <span>mimu.app/u/{username}</span>
            <Heart size={10} className="fill-red-500 stroke-none text-red-500" />
          </div>
        </div>

        {/* Color Palette Selector */}
        <div className="my-5">
          <span className="text-xs font-semibold text-stone-400 block mb-2 font-sans">Select Story Vibe Theme:</span>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-stone-800">
            {GRADIENTS.map((grad, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedGradient(idx)}
                className={`flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-tr ${grad.class} border-2 transition-transform duration-100 cursor-pointer ${
                  selectedGradient === idx ? 'scale-110 border-amber-500 shadow-md' : 'border-stone-800 hover:scale-105'
                }`}
                title={grad.name}
              />
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col gap-2 mt-2">
          <button
            id="btn-copy-share-text"
            onClick={handleSaveImage}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 glossy-gold-btn text-black font-extrabold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-amber-900/10 active:scale-[0.98] transition-all duration-200 cursor-pointer animate-shimmer disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                <span>Creating sticker photo...</span>
              </>
            ) : saved ? (
              <>
                <Check size={18} />
                <span>Saved to your computer!</span>
              </>
            ) : (
              <>
                <Download size={18} />
                <span>Save</span>
              </>
            )}
          </button>
          
          <div className="text-center text-[11px] text-stone-400 flex items-center justify-center gap-1.5 mt-2">
            <Camera size={12} className="text-amber-400" />
            <span>This saves the sticker image above directly so you can post it to your Stories!</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
