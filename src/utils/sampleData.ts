import { LoadedDocument, AnyAnnotation } from '../types';

export function createSampleDocument(): LoadedDocument {
  // We generate 3 beautifully rendered sample pages in an A4 aspect ratio (595 x 842 points)
  const pageWidth = 640;
  const pageHeight = 905;

  const page1 = renderSamplePage1(pageWidth, pageHeight);
  const page2 = renderSamplePage2(pageWidth, pageHeight);
  const page3 = renderSamplePage3(pageWidth, pageHeight);

  return {
    id: 'doc-sample-1',
    filename: 'Mécanique_Quantique_et_Calcul_Tensoriel.pdf',
    fileType: 'pdf',
    fileSize: 1420500, // ~1.4 MB
    lastModified: Date.now() - 3600000 * 24,
    pageCount: 3,
    pages: [
      {
        index: 0,
        width: pageWidth,
        height: pageHeight,
        title: '1. Introduction et Postulats Fondamentaux',
        canvasImage: page1,
        textLines: [
          { text: 'Fondements de la Mécanique Quantique', x: 50, y: 95, fontSize: 22, fontWeight: 'bold' },
          { text: 'Une approche unifiée par les formalismes de Dirac et de Schrödinger', x: 50, y: 125, fontSize: 13 },
          { text: 'Prof. G. Baudelet — Laboratoire de Physique Mathématique — 2026', x: 50, y: 150, fontSize: 11 },
          { text: 'RÉSUMÉ EXÉCUTIF', x: 65, y: 195, fontSize: 10, fontWeight: 'bold' },
          { text: 'Ce document présente la dérivation des équations fondamentales régissant les états', x: 65, y: 212, fontSize: 11 },
          { text: 'quantiques dans un espace de Hilbert complexe séparable. Les superpositions d’états', x: 65, y: 228, fontSize: 11 },
          { text: 'et l’évolution unitaire sont examinées à travers les opérateurs autoadjoints.', x: 65, y: 244, fontSize: 11 },
          { text: '1. Les Postulats et la Représentation d\'États', x: 50, y: 278, fontSize: 15, fontWeight: 'bold' },
          { text: 'Le premier postulat stipule qu’à tout système physique isolé est associé un espace vectoriel complexe', x: 50, y: 308, fontSize: 12 },
          { text: 'muni d’un produit scalaire hermitien : l’espace de Hilbert H. L’état du système à un instant t donné est', x: 50, y: 326, fontSize: 12 },
          { text: 'parfaitement décrit par un vecteur unitaire normé, traditionnellement noté sous la notation ket |Ψ(t)⟩.', x: 50, y: 344, fontSize: 12 },
          { text: 'Toute grandeur physique mesurable est représentée par un opérateur linéaire autoadjoint (hermitien) A', x: 50, y: 380, fontSize: 12 },
          { text: 'agissant sur l’espace H. Les valeurs propres de cet opérateur correspondent aux seuls résultats', x: 50, y: 398, fontSize: 12 },
          { text: 'possibles d’une mesure expérimentale directe de cette grandeur.', x: 50, y: 416, fontSize: 12 },
          { text: 'Lorsque le système subit une mesure projective, l’état s’effondre instantanément sur l’espace propre', x: 50, y: 452, fontSize: 12 },
          { text: 'associé à la valeur propre mesurée (postulat de réduction du paquet d’ondes).', x: 50, y: 470, fontSize: 12 },
          { text: '2. Évolution Temporelle Dynamique', x: 50, y: 485, fontSize: 15, fontWeight: 'bold' },
        ],
      },
      {
        index: 1,
        width: pageWidth,
        height: pageHeight,
        title: '2. Équation de Schrödinger & Opérateurs',
        canvasImage: page2,
        textLines: [
          { text: '2. Équation Fondamentale de Schrödinger', x: 50, y: 95, fontSize: 20, fontWeight: 'bold' },
          { text: 'L’équation d’onde dépendante du temps décrit l’évolution unitaire et causale du ket d’état :', x: 50, y: 125, fontSize: 12 },
          { text: 'L’hamiltonien H représente le générateur infinitésimal des translations dans le temps.', x: 50, y: 175, fontSize: 12 },
          { text: 'Pour un système conservatif invariant par translation temporelle, la solution générale', x: 50, y: 195, fontSize: 12 },
          { text: 's’exprime comme une superposition linéaire d’états stationnaires propres :', x: 50, y: 215, fontSize: 12 },
          { text: '3. Condition de Normalisation et Densité de Probabilité', x: 50, y: 350, fontSize: 15, fontWeight: 'bold' },
          { text: 'L’interprétation probabiliste de Max Born impose la conservation de la norme au cours du temps :', x: 50, y: 380, fontSize: 12 },
        ],
      },
      {
        index: 2,
        width: pageWidth,
        height: pageHeight,
        title: '3. Analyse Tensorielle & Espaces de Hilbert',
        canvasImage: page3,
        textLines: [
          { text: '3. Produit Tensoriel et Systèmes Composés', x: 50, y: 95, fontSize: 20, fontWeight: 'bold' },
          { text: 'Pour un système bipartite formé de deux sous-systèmes A et B, l’espace d’états global est', x: 50, y: 125, fontSize: 12 },
          { text: 'le produit tensoriel de leurs espaces respectifs : H_total = H_A ⊗ H_B.', x: 50, y: 145, fontSize: 12 },
          { text: 'Un état intriqué (état de Bell) ne peut pas être factorisé sous la forme d’un produit simple :', x: 50, y: 185, fontSize: 12 },
          { text: '4. Synthèse et Applications pour l’Ingénieur', x: 50, y: 340, fontSize: 15, fontWeight: 'bold' },
          { text: 'Ces principes trouvent une application directe en informatique quantique et en cryptographie.', x: 50, y: 370, fontSize: 12 },
        ],
      },
    ],
  };
}

export function createInitialAnnotations(): AnyAnnotation[] {
  return [
    {
      id: 'annot-latex-1',
      pageIndex: 0,
      type: 'latex',
      latex: 'i\\hbar \\frac{\\partial}{\\partial t} |\\Psi(t)\\rangle = \\hat{\\mathcal{H}} |\\Psi(t)\\rangle',
      fontSize: 22,
      color: '#1d4ed8',
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 0,
      padding: 6,
      x: 75,
      y: 510,
      width: 480,
      height: 60,
      createdAt: Date.now() - 50000,
    },
    {
      id: 'annot-latex-2',
      pageIndex: 1,
      type: 'latex',
      latex: '\\int_{-\\infty}^{+\\infty} |\\psi(x)|^2 \\, dx = 1 \\quad \\Longleftrightarrow \\quad \\langle \\psi | \\psi \\rangle = 1',
      fontSize: 18,
      color: '#15803d',
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 0,
      padding: 6,
      x: 80,
      y: 440,
      width: 470,
      height: 50,
      createdAt: Date.now() - 40000,
    },
    {
      id: 'annot-note-1',
      pageIndex: 0,
      type: 'note',
      text: 'Note de cours : Vérifier la commutativité des opérateurs [x, p] = iℏ.',
      color: '#fef08a',
      x: 520,
      y: 180,
      width: 32,
      height: 32,
      isOpen: false,
      createdAt: Date.now() - 30000,
    }
  ];
}

// Generate realistic crisp canvas backgrounds for the sample document pages
function renderSamplePage1(width: number, height: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width * 2;
  canvas.height = height * 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.scale(2, 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Subtle header rule
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 60);
  ctx.lineTo(width - 50, 60);
  ctx.stroke();

  // Header title
  ctx.fillStyle = '#64748b';
  ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText('FACULTÉ DES SCIENCES — DÉPARTEMENT DE PHYSIQUE THÉORIQUE', 50, 50);
  ctx.fillText('PAGE 1 / 3', width - 100, 50);

  // Article Title
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText('Fondements de la Mécanique Quantique', 50, 115);

  // Subtitle
  ctx.fillStyle = '#475569';
  ctx.font = 'italic 13px Georgia, serif';
  ctx.fillText('Une approche unifiée par les formalismes de Dirac et de Schrödinger', 50, 140);

  // Authors & Date
  ctx.fillStyle = '#64748b';
  ctx.font = '11px -apple-system, sans-serif';
  ctx.fillText('Prof. G. Baudelet — Laboratoire de Physique Mathématique — 2026', 50, 165);

  // Abstract Box
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(50, 185, width - 100, 75);
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(50, 185, width - 100, 75);

  ctx.fillStyle = '#334155';
  ctx.font = 'bold 10px -apple-system, sans-serif';
  ctx.fillText('RÉSUMÉ EXÉCUTIF', 65, 205);
  ctx.font = '11px Georgia, serif';
  ctx.fillText('Ce document présente la dérivation des équations fondamentales régissant les états', 65, 224);
  ctx.fillText('quantiques dans un espace de Hilbert complexe séparable. Les superpositions d’états', 65, 240);
  ctx.fillText('et l’évolution unitaire sont examinées à travers les opérateurs autoadjoints.', 65, 256);

  // Section 1
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 15px -apple-system, sans-serif';
  ctx.fillText('1. Les Postulats et la Représentation d\'États', 50, 295);

  ctx.font = '12px/1.6 Georgia, serif';
  ctx.fillStyle = '#334155';
  const paragraphs = [
    'Le premier postulat stipule qu’à tout système physique isolé est associé un espace vectoriel complexe',
    'muni d’un produit scalaire hermitien : l’espace de Hilbert H. L’état du système à un instant t donné est',
    'parfaitement décrit par un vecteur unitaire normé, traditionnellement noté sous la notation ket |Ψ(t)⟩.',
    '',
    'Toute grandeur physique mesurable est représentée par un opérateur linéaire autoadjoint (hermitien) A',
    'agissant sur l’espace H. Les valeurs propres de cet opérateur correspondent aux seuls résultats',
    'possibles d’une mesure expérimentale directe de cette grandeur.',
    '',
    'Lorsque le système subit une mesure projective, l’état s’effondre instantanément sur l’espace propre',
    'associé à la valeur propre mesurée (postulat de réduction du paquet d’ondes).'
  ];

  let y = 320;
  for (const line of paragraphs) {
    if (line) ctx.fillText(line, 50, y);
    y += 18;
  }

  // Section 2 Header
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 15px -apple-system, sans-serif';
  ctx.fillText('2. Évolution Temporelle Dynamique', 50, 485);

  // Diagram placeholder / decorative box
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(50, 600, width - 100, 180);
  ctx.strokeStyle = '#94a3b8';
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(50, 600, width - 100, 180);
  ctx.setLineDash([]);

  // Draw a schematic wave function curve
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x <= width - 120; x += 2) {
    const normX = x / (width - 120);
    const envelope = Math.exp(-Math.pow((normX - 0.5) * 4, 2));
    const wave = Math.sin(normX * 24 * Math.PI) * envelope * 55;
    const canvasY = 690 + wave;
    if (x === 0) ctx.moveTo(60 + x, canvasY);
    else ctx.lineTo(60 + x, canvasY);
  }
  ctx.stroke();

  // Axis and legend
  ctx.fillStyle = '#475569';
  ctx.font = '10px -apple-system, sans-serif';
  ctx.fillText('Figure 1.1 — Paquet d’ondes gaussien se propageant dans un potentiel harmonique nul', 90, 765);

  // Footer
  ctx.fillStyle = '#94a3b8';
  ctx.font = '9px -apple-system, sans-serif';
  ctx.fillText('DOCUMENT CONFIDENTIEL DE TRAVAIL — RECHERCHE APERÇU 2026', 50, height - 30);
  ctx.fillText('PAGE 1', width - 80, height - 30);

  return canvas.toDataURL('image/png');
}

function renderSamplePage2(width: number, height: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width * 2;
  canvas.height = height * 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.scale(2, 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 60);
  ctx.lineTo(width - 50, 60);
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = '10px -apple-system, sans-serif';
  ctx.fillText('FONDEMENTS DE LA MÉCANIQUE QUANTIQUE — CHAPITRE II', 50, 50);
  ctx.fillText('PAGE 2 / 3', width - 100, 50);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px Georgia, serif';
  ctx.fillText('2. Formalisme des Opérateurs et Densité de Probabilité', 50, 110);

  ctx.fillStyle = '#334155';
  ctx.font = '12px/1.6 Georgia, serif';
  const text = [
    'Dans la représentation de Schrödinger, la fonction d’onde ψ(x, t) représente l’amplitude de probabilité',
    'de présence de la particule au point x de l’espace physique tridimensionnel.',
    'La densité de probabilité associée est donnée par le carré du module de cette fonction d\'onde.',
    'Par conséquent, pour conserver l\'interprétation probabiliste globale de Born, la condition de normalisation',
    'doit être strictement préservée pour tout instant t.'
  ];
  let y = 140;
  for (const line of text) {
    ctx.fillText(line, 50, y);
    y += 18;
  }

  // Draw 2 columns layout
  const colWidth = (width - 120) / 2;
  
  // Left Column
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px -apple-system, sans-serif';
  ctx.fillText('A. Relations de commutation', 50, 260);
  ctx.font = '11px Georgia, serif';
  ctx.fillStyle = '#334155';
  ctx.fillText('L’invariance par translation spatiale engendre', 50, 285);
  ctx.fillText('l’opérateur impulsion p = -iℏ ∇. Le commutateur', 50, 302);
  ctx.fillText('fondamental s’écrit [x_j, p_k] = iℏ δ_jk 1.', 50, 319);
  ctx.fillText('Cette non-commutativité interdit toute simultanéité', 50, 336);
  ctx.fillText('dans la précision des observables conjuguées.', 50, 353);

  // Right Column
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px -apple-system, sans-serif';
  ctx.fillText('B. Principe d\'indétermination', 50 + colWidth + 20, 260);
  ctx.font = '11px Georgia, serif';
  ctx.fillStyle = '#334155';
  ctx.fillText('Formulé par Heisenberg en 1927 :', 50 + colWidth + 20, 285);
  ctx.fillText('Δx · Δp ≥ ℏ / 2', 50 + colWidth + 20, 305);
  ctx.fillText('L’écart quadratique moyen ne peut être annulé', 50 + colWidth + 20, 325);
  ctx.fillText('simultanément pour la position et la quantité', 50 + colWidth + 20, 342);
  ctx.fillText('de mouvement d’une entité microscopique.', 50 + colWidth + 20, 359);

  // Section 3
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 15px -apple-system, sans-serif';
  ctx.fillText('3. Normalisation et Espace L²(R³)', 50, 410);

  // Footer
  ctx.fillStyle = '#94a3b8';
  ctx.font = '9px -apple-system, sans-serif';
  ctx.fillText('DOCUMENT CONFIDENTIEL DE TRAVAIL — RECHERCHE APERÇU 2026', 50, height - 30);
  ctx.fillText('PAGE 2', width - 80, height - 30);

  return canvas.toDataURL('image/png');
}

function renderSamplePage3(width: number, height: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width * 2;
  canvas.height = height * 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.scale(2, 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 60);
  ctx.lineTo(width - 50, 60);
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = '10px -apple-system, sans-serif';
  ctx.fillText('FONDEMENTS DE LA MÉCANIQUE QUANTIQUE — CHAPITRE III', 50, 50);
  ctx.fillText('PAGE 3 / 3', width - 100, 50);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px Georgia, serif';
  ctx.fillText('3. Tenseurs, Intrication et Théorème de Bell', 50, 110);

  ctx.fillStyle = '#334155';
  ctx.font = '12px/1.6 Georgia, serif';
  const text = [
    'Pour deux sous-systèmes A et B, l’espace des états global est le produit tensoriel H_A ⊗ H_B.',
    'Un état pur |Ψ⟩ est dit intriqué s’il ne peut être factorisé sous la forme simple |φ_A⟩ ⊗ |χ_B⟩.',
    'Cette propriété non locale est à la base de la cryptographie quantique et du calcul quantique moderne.',
    'Les inégalités de Bell et l’expérience d’Aspect (1982) ont définitivement réfuté les théories réalistes',
    'locales à variables cachées.'
  ];
  let y = 140;
  for (const line of text) {
    ctx.fillText(line, 50, y);
    y += 18;
  }

  // Draw sample tensor diagram
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(50, 260, width - 100, 220);
  ctx.strokeStyle = '#e2e8f0';
  ctx.strokeRect(50, 260, width - 100, 220);

  // Spheres representing Bloch spheres
  drawBlochSphere(ctx, 160, 360, 65, 'Sous-système A');
  drawBlochSphere(ctx, width - 160, 360, 65, 'Sous-système B');

  // Wavy entangled link between spheres
  ctx.strokeStyle = '#8b5cf6';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(230, 360);
  ctx.bezierCurveTo(280, 320, 360, 400, width - 230, 360);
  ctx.stroke();

  ctx.fillStyle = '#7c3aed';
  ctx.font = 'bold 11px -apple-system, sans-serif';
  ctx.fillText('État EPR Intriqué (|00⟩ + |11⟩)/√2', 260, 350);

  // Footer
  ctx.fillStyle = '#94a3b8';
  ctx.font = '9px -apple-system, sans-serif';
  ctx.fillText('DOCUMENT CONFIDENTIEL DE TRAVAIL — RECHERCHE APERÇU 2026', 50, height - 30);
  ctx.fillText('PAGE 3', width - 80, height - 30);

  return canvas.toDataURL('image/png');
}

function drawBlochSphere(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, label: string) {
  // Sphere outline
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Equator ellipse
  ctx.strokeStyle = '#93c5fd';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * 0.35, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Z axis
  ctx.strokeStyle = '#64748b';
  ctx.beginPath();
  ctx.moveTo(cx, cy - r - 10);
  ctx.lineTo(cx, cy + r + 10);
  ctx.stroke();

  // State vector
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + r * 0.6, cy - r * 0.7);
  ctx.stroke();

  // Label
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 11px -apple-system, sans-serif';
  ctx.fillText(label, cx - 40, cy + r + 28);
  ctx.fillStyle = '#64748b';
  ctx.font = '10px -apple-system, sans-serif';
  ctx.fillText('|0⟩', cx - 8, cy - r - 14);
  ctx.fillText('|1⟩', cx - 8, cy + r + 16);
}
