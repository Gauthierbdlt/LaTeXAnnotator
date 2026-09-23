import React, { useState } from 'react';
import { X, Tablet, Wifi, Copy, Check, ExternalLink, Sparkles, Pencil, ArrowRight } from 'lucide-react';

interface CompanionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCompanionView: () => void;
  isCompanionConnected: boolean;
}

export const CompanionModal: React.FC<CompanionModalProps> = ({
  isOpen,
  onClose,
  onOpenCompanionView,
  isCompanionConnected,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl = window.location.href.split('?')[0];
  const companionUrl = `${currentUrl}?mode=ipad-companion`;

  const handleCopy = () => {
    navigator.clipboard.writeText(companionUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#242426] border border-[#3e3e42] rounded-2xl shadow-2xl overflow-hidden text-gray-200">
        {/* Header */}
        <div className="h-12 px-5 bg-[#1e1e20] border-b border-[#333336] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Tablet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Mode Compagnon iPad & Mac en Direct
              </h3>
              <p className="text-[11px] text-gray-400">Dessiner sur iPad, taper et annoter sur Mac en même temps</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Status Badge */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#1b1b1e] border border-[#333338]">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isCompanionConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400 animate-ping'}`} />
              <div>
                <div className="text-xs font-medium text-white">
                  {isCompanionConnected ? 'iPad connecté en direct !' : 'En attente de connexion iPad'}
                </div>
                <div className="text-[11px] text-gray-400">
                  {isCompanionConnected
                    ? 'Les tracés Apple Pencil sont transmis instantanément.'
                    : 'Ouvrez ce lien ou testez l’écran iPad dans un nouvel onglet.'}
                </div>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 font-medium border border-blue-500/30 flex items-center gap-1">
              <Wifi className="w-3 h-3" />
              P2P Sync
            </span>
          </div>

          {/* Explanation for Engineering Note-taking */}
          <div className="bg-gradient-to-br from-blue-950/30 to-indigo-950/20 p-4 rounded-xl border border-blue-900/40 text-xs space-y-2">
            <div className="font-semibold text-blue-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Comment ça fonctionne pour vos cours d'ingénieur ?
            </div>
            <ul className="space-y-1.5 text-gray-300 text-[11.5px] leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">1.</span>
                <span><strong>Sur votre MacBook :</strong> vous affichez le cours en grand, tapez rapidement les formules mathématiques en LaTeX vectoriel et collez des schémas / captures.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">2.</span>
                <span><strong>Sur votre iPad :</strong> l’interface se transforme en ardoise épurée. Vous utilisez l’<strong>Apple Pencil</strong> pour dessiner des circuits électriques, des vecteurs ou surligner des passages.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">3.</span>
                <span>Tout ce que vous tracez au stylet apparaît <strong>en direct à l’écran du Mac</strong> sans recharger la page !</span>
              </li>
            </ul>
          </div>

          {/* Link sharing */}
          <div>
            <label className="text-xs font-medium text-gray-300 block mb-1.5">
              Lien de synchronisation pour l'iPad :
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={companionUrl}
                className="w-full bg-[#171719] border border-[#3e3e44] rounded-lg px-3 py-2 text-xs text-gray-300 font-mono focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-lg bg-[#333338] hover:bg-[#3f3f46] text-white text-xs font-medium border border-[#484850] flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copié !' : 'Copier'}</span>
              </button>
            </div>
          </div>

          {/* Test in New Window or Switch View */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                onOpenCompanionView();
                onClose();
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Pencil className="w-4 h-4" />
              <span>Tester la vue Tablette iPad ici</span>
            </button>

            <button
              onClick={() => {
                window.open(companionUrl, '_blank', 'width=900,height=700');
              }}
              className="py-2.5 px-4 rounded-xl bg-[#2e2e32] hover:bg-[#38383e] text-gray-200 border border-[#44444a] font-medium text-xs transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Ouvrir dans une fenêtre iPad</span>
            </button>
          </div>
        </div>

        {/* Footer info about Xcode Native */}
        <div className="px-5 py-3 bg-[#19191b] border-t border-[#2d2d30] flex items-center justify-between text-[11px] text-gray-400">
          <span>Dans Xcode : géré automatiquement par <code className="text-blue-300">MultipeerConnectivity</code></span>
          <span className="text-gray-500">Zéro latence</span>
        </div>
      </div>
    </div>
  );
};
