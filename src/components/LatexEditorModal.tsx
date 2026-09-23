import React, { useState, useEffect, useMemo } from 'react';
import katex from 'katex';
import { X, Check, AlertCircle, Copy, Sparkles, BookOpen } from 'lucide-react';

interface LatexEditorModalProps {
  isOpen: boolean;
  initialLatex?: string;
  initialFontSize?: number;
  initialColor?: string;
  initialBgColor?: string;
  onSave: (latex: string, fontSize: number, color: string, bgColor: string) => void;
  onClose: () => void;
}

export const LatexEditorModal: React.FC<LatexEditorModalProps> = ({
  isOpen,
  initialLatex = '\\int_{a}^{b} f(x) \\, dx = F(b) - F(a)',
  initialFontSize = 20,
  initialColor = '#0f172a',
  initialBgColor = 'transparent',
  onSave,
  onClose,
}) => {
  const [latexCode, setLatexCode] = useState(initialLatex);
  const [fontSize, setFontSize] = useState(initialFontSize);
  const [color, setColor] = useState(initialColor);
  const [bgColor, setBgColor] = useState(initialBgColor || 'transparent');
  const [hasBorder, setHasBorder] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLatexCode(initialLatex);
      setFontSize(initialFontSize);
      setColor(initialColor);
      setBgColor(initialBgColor || 'transparent');
    }
  }, [isOpen, initialLatex, initialFontSize, initialColor, initialBgColor]);

  // Robust live KaTeX rendering with safe error catching
  const { renderedHtml, error } = useMemo(() => {
    try {
      if (!latexCode.trim()) {
        return { renderedHtml: '<span style="color: #94a3b8; font-style: italic;">Entrez votre code LaTeX ci-dessus...</span>', error: null };
      }
      const html = katex.renderToString(latexCode, {
        displayMode: true,
        throwOnError: true,
        strict: false,
      });
      return { renderedHtml: html, error: null };
    } catch (err: any) {
      // Gracefully catch syntax error so the app NEVER crashes
      return {
        renderedHtml: '',
        error: err.message || 'Erreur de syntaxe LaTeX',
      };
    }
  }, [latexCode]);

  // Quick mathematical & engineering templates
  const categories = [
    {
      category: 'Génie Électrique & Signal',
      items: [
        { label: 'Laplace', code: '\\mathcal{L}\\{f(t)\\} = \\int_{0}^{+\\infty} f(t) e^{-st} \\, dt' },
        { label: 'Fourier', code: 'F(\\omega) = \\int_{-\\infty}^{+\\infty} f(t) e^{-j\\omega t} \\, dt' },
        { label: 'Impédance Z', code: '\\underline{Z} = R + j\\left(L\\omega - \\frac{1}{C\\omega}\\right)' },
        { label: 'Euler e^jθ', code: 'e^{j\\theta} = \\cos\\theta + j\\sin\\theta' },
        { label: 'Fonction Transfert', code: 'H(s) = \\frac{K}{1 + \\frac{2\\xi}{\\omega_0}s + \\frac{s^2}{\\omega_0^2}}' },
      ],
    },
    {
      category: 'Physique, Mécanique & Maxwell',
      items: [
        { label: 'Maxwell-Gauss', code: '\\vec{\\nabla} \\cdot \\vec{E} = \\frac{\\rho}{\\varepsilon_0}' },
        { label: 'Maxwell-Faraday', code: '\\vec{\\nabla} \\times \\vec{E} = -\\frac{\\partial \\vec{B}}{\\partial t}' },
        { label: 'Navier-Stokes', code: '\\rho \\left( \\frac{\\partial \\mathbf{v}}{\\partial t} + \\mathbf{v} \\cdot \\nabla \\mathbf{v} \\right) = -\\nabla p + \\mu \\nabla^2 \\mathbf{v}' },
        { label: 'Schrödinger', code: 'i\\hbar \\frac{\\partial}{\\partial t}|\\Psi\\rangle = \\hat{H}|\\Psi\\rangle' },
        { label: 'Dérivée partielle', code: '\\frac{\\partial^2 u}{\\partial x^2} + \\frac{\\partial^2 u}{\\partial y^2} = 0' },
      ],
    },
    {
      category: 'Maths, Algèbre & Matrices',
      items: [
        { label: 'Fraction', code: '\\frac{a}{b}' },
        { label: 'Racine', code: '\\sqrt{x^2 + y^2}' },
        { label: 'Intégrale', code: '\\int_{a}^{b} f(x) \\, dx' },
        { label: 'Somme', code: '\\sum_{k=0}^{n} a_k' },
        { label: 'Matrice 3×3', code: '\\begin{pmatrix} a_{11} & a_{12} & a_{13} \\\\ a_{21} & a_{22} & a_{23} \\\\ a_{31} & a_{32} & a_{33} \\end{pmatrix}' },
        { label: 'Valeurs propres', code: '\\det(A - \\lambda I) = 0' },
        { label: 'Grec & Symboles', code: '\\alpha, \\beta, \\gamma, \\theta, \\lambda, \\omega, \\Delta, \\nabla, \\pm, \\approx, \\infty' },
      ],
    },
  ];

  const insertSnippet = (snippet: string) => {
    setLatexCode((prev) => (prev ? `${prev} ${snippet}` : snippet));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-xl bg-[#28282b] border border-[#44444a] rounded-xl shadow-2xl flex flex-col overflow-hidden text-gray-200 select-none animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="h-11 px-4 bg-[#212124] border-b border-[#38383e] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif italic font-bold text-emerald-400 text-lg">√x</span>
            <h3 className="text-sm font-semibold text-white tracking-wide">
              Éditeur de formule LaTeX vectorielle
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4">
          {/* Code Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-300">
                Code source LaTeX
              </label>
              <span className="text-[11px] text-gray-500 font-mono">
                Syntaxe KaTeX compatible AMS-LaTeX
              </span>
            </div>
            <textarea
              rows={3}
              value={latexCode}
              onChange={(e) => setLatexCode(e.target.value)}
              placeholder="Exemple: \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}"
              className="w-full bg-[#1b1b1e] border border-[#404046] focus:border-blue-500 rounded-lg p-3 font-mono text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed resize-none"
              autoFocus
            />
          </div>

          {/* Quick Engineering Snippets Bar */}
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Formules types ingénieur & prépa</span>
              </span>
              <span className="text-[10px] text-gray-500 font-normal">Cliquer pour insérer</span>
            </div>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {categories.map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <span className="text-[10px] text-gray-400 font-semibold block">{cat.category} :</span>
                  <div className="flex flex-wrap gap-1">
                    {cat.items.map((tpl) => (
                      <button
                        key={tpl.label}
                        type="button"
                        onClick={() => insertSnippet(tpl.code)}
                        className="px-2 py-0.5 rounded bg-[#333338] hover:bg-blue-600/30 hover:border-blue-500 text-gray-300 hover:text-white border border-[#47474f] text-[11px] font-medium transition-colors"
                      >
                        {tpl.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Preview Section */}
          <div>
            <div className="text-xs font-medium text-gray-300 mb-1.5 flex items-center justify-between">
              <span>Rendu vectoriel en direct (KaTeX)</span>
              {error ? (
                <span className="text-red-400 text-[11px] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Erreur de syntaxe
                </span>
              ) : (
                <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Syntaxe valide
                </span>
              )}
            </div>

            <div 
              className="min-h-24 max-h-40 overflow-auto rounded-lg p-4 flex items-center justify-center transition-all shadow-inner border"
              style={{
                backgroundColor: bgColor === 'transparent' ? '#ffffff' : bgColor,
                borderColor: error ? '#ef4444' : '#4b5563',
              }}
            >
              {error ? (
                <div className="text-red-600 text-xs font-mono p-2 bg-red-50 rounded border border-red-200 w-full text-center">
                  ⚠️ {error}
                </div>
              ) : (
                <div 
                  className="katex-preview text-center select-text"
                  style={{
                    fontSize: `${fontSize}px`,
                    color: color,
                  }}
                  dangerouslySetInnerHTML={{ __html: renderedHtml }}
                />
              )}
            </div>
          </div>

          {/* Formatting Options: Font Size, Color, Background */}
          <div className="grid grid-cols-3 gap-3 pt-1 border-t border-[#38383e]">
            {/* Font Size */}
            <div>
              <label className="text-[11px] text-gray-400 block mb-1">
                Taille de police : {fontSize} pt
              </label>
              <input
                type="range"
                min={12}
                max={40}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full accent-blue-500 h-1.5 bg-gray-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Formula Color */}
            <div>
              <label className="text-[11px] text-gray-400 block mb-1">
                Couleur de la formule
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-7 h-7 rounded border border-gray-600 bg-transparent cursor-pointer"
                />
                <span className="text-xs font-mono text-gray-300">{color}</span>
              </div>
            </div>

            {/* Background Color */}
            <div>
              <label className="text-[11px] text-gray-400 block mb-1">
                Fond (Arrière-plan)
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setBgColor('transparent')}
                  className={`text-[11px] px-2 py-1 rounded font-medium border transition-colors ${
                    bgColor === 'transparent'
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                      : 'bg-[#333338] border-gray-600 text-gray-300 hover:text-white'
                  }`}
                >
                  ✓ Transparent
                </button>
                <div className="flex items-center gap-1">
                  <input
                    type="color"
                    value={bgColor === 'transparent' ? '#ffffff' : bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-6 h-6 rounded border border-gray-600 bg-transparent cursor-pointer"
                    title="Choisir une couleur opaque"
                  />
                  {bgColor !== 'transparent' && (
                    <span className="text-[10px] font-mono text-gray-400">{bgColor}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="h-12 px-4 bg-[#212124] border-t border-[#38383e] flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md hover:bg-white/10 text-gray-300 text-xs font-medium transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              if (!error && latexCode.trim()) {
                onSave(latexCode, fontSize, color, bgColor);
                onClose();
              }
            }}
            disabled={!!error || !latexCode.trim()}
            className="px-4 py-1.5 rounded-md bg-[#3b82f6] hover:bg-[#2563eb] disabled:bg-gray-600 disabled:opacity-50 text-white text-xs font-semibold shadow transition-colors flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Insérer sur le document</span>
          </button>
        </div>
      </div>
    </div>
  );
};
