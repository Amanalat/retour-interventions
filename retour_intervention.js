// ── Web3Forms ─────────────────────────────────────────────────────────────────
const WEB3FORMS_KEY = "ef1fe549-c616-4a27-a6c2-97f06caa913d";

// ── Google Sheets (Apps Script) ───────────────────────────────────────────────
// Collez ici l'URL de déploiement de votre Apps Script (voir SETUP_SHEETS.txt)
const SHEETS_URL = "https://hook.eu1.make.com/l15ckvxewndw5sp7aady0rux6kyy1khl";

// ── Helpers ──────────────────────────────────────────────────────────────────
function getProfil() {
  return document.querySelector('input[name="profil"]:checked')?.value || "élève";
}

function isProf() { return getProfil() === "professeur"; }

function getIntervention() {
  const sel = document.getElementById('f-intervention').value;
  if (sel === "Autre") return document.getElementById('f-intervention-autre').value.trim() || "Autre";
  return sel;
}

function getDate() {
  const val = document.getElementById('f-date').value; // YYYY-MM-DD
  if (!val) return "Non renseignée";
  const [y, m, d] = val.split('-');
  const mois = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
  return `${parseInt(d)} ${mois[parseInt(m) - 1]} ${y}`;
}

// ── Réaction au changement de profil ─────────────────────────────────────────
function onProfilChange() {
  const prof = isProf();
  // Message anonymat : affiché seulement pour les élèves
  document.getElementById('intro-anon').style.display = prof ? 'none' : '';
}

// ── Navigation ───────────────────────────────────────────────────────────────
function goToStep(n) {
  if (n === 1 && !validateStep0()) return;
  if (n === 2 && !validateStep1()) return;

  document.querySelectorAll('.step').forEach(s => s.classList.add('hidden'));
  document.getElementById('step-' + n).classList.remove('hidden');

  if (n === 1) setupStep1();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showScreen(id) {
  document.querySelectorAll('.step').forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function isSeanceMultiple() {
  return document.querySelector('input[name="seance"]:checked')?.value === 'multiple';
}

function onSeanceChange() {
  const multiple = isSeanceMultiple();
  document.getElementById('field-nb-seances').classList.toggle('hidden', !multiple);
  document.getElementById('label-date').textContent = multiple
    ? 'À quelle date a eu lieu la dernière intervention ?'
    : 'Quand a eu lieu l\'intervention ?';
}

function setupStep1() {
  const prof = isProf();
  const interv = getIntervention();

  // Titre et intro dynamiques
  document.getElementById('step1-titre').textContent = interv;
  document.getElementById('step1-intro').textContent = prof
    ? 'Quelques infos sur vous, votre établissement et les séances effectuées.'
    : 'Quelques infos sur votre établissement et la date de l\'intervention.';

  // Champs prof uniquement (nom, prénom)
  document.getElementById('prof-fields').classList.toggle('hidden', !prof);

  // Réinitialise le radio séance + champs dépendants
  document.querySelector('input[name="seance"][value="unique"]').checked = true;
  onSeanceChange();
}

// ── Validation ───────────────────────────────────────────────────────────────
function validateStep0() {
  if (!getIntervention()) {
    alert("Veuillez sélectionner une intervention.");
    return false;
  }
  return true;
}

function validateStep1() {
  const etab = document.getElementById('f-etablissement').value.trim();
  if (!etab) { alert("Veuillez indiquer le nom de l'établissement."); return false; }
  if (isProf()) {
    const nom = document.getElementById('f-nom').value.trim();
    if (!nom) { alert("Veuillez indiquer votre nom."); return false; }
  }
  return true;
}

// ── Afficher/masquer "Autre" ──────────────────────────────────────────────────
document.getElementById('f-intervention').addEventListener('change', function () {
  document.getElementById('field-intervention-autre').classList.toggle('hidden', this.value !== 'Autre');
});

// ── Note slider ──────────────────────────────────────────────────────────────
function updateNote(val) {
  document.getElementById('f-note-display').textContent = val + " / 20";
}

// ── Collecte des données ──────────────────────────────────────────────────────
function collectData() {
  const prof = isProf();
  return {
    profil       : prof ? "Professeur" : "Élève",
    intervention : getIntervention(),
    nom          : prof ? document.getElementById('f-nom').value.trim()    : "",
    prenom       : prof ? document.getElementById('f-prenom').value.trim() : "",
    etablissement: document.getElementById('f-etablissement').value.trim(),
    classe       : document.getElementById('f-classe').value.trim() || "Non renseigné",
    nb_seances   : isSeanceMultiple() ? (document.getElementById('f-nb-seances').value || "Non renseigné") : "",
    seance_type  : isSeanceMultiple() ? "Séances multiples" : "Séance unique",
    date         : getDate(),
    note         : document.getElementById('f-note-slider').value + " / 20",
    impression   : document.getElementById('f-impression').value.trim()   || "—",
    preferes     : document.getElementById('f-preferes').value.trim()     || "—",
    ameliorations: document.getElementById('f-ameliorations').value.trim()|| "—",
    retenir      : document.getElementById('f-retenir').value.trim()      || "—",
  };
}

// ── PDF — variable globale pour téléchargement post-envoi ────────────────────
let _lastPdfDoc = null;

function downloadPDF() {
  if (!_lastPdfDoc) return;
  const data = collectData();
  const filename = `retour_${data.etablissement.replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}.pdf`;
  _lastPdfDoc.save(filename);
}

// ── Génération PDF ────────────────────────────────────────────────────────────
function generatePDF(data) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, margin = 18, maxW = W - margin * 2;
  let y = 0;

  function wrap(text, x, size, style, color) {
    doc.setFontSize(size);
    doc.setFont('helvetica', style || 'normal');
    doc.setTextColor(...(color || [60, 60, 60]));
    const lines = doc.splitTextToSize(String(text), maxW);
    doc.text(lines, x, y);
    y += lines.length * (size * 0.35) + 2;
  }

  function nextLine(gap) { y += gap || 6; }

  function hRule() {
    doc.setDrawColor(220, 224, 238);
    doc.line(margin, y, W - margin, y);
    nextLine(4);
  }

  function sectionBar(label) {
    nextLine(4);
    doc.setFillColor(15, 52, 96);
    doc.roundedRect(margin, y - 4, maxW, 8, 2, 2, 'F');
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
    doc.text(label.toUpperCase(), margin + 3, y + 1.5);
    nextLine(10);
  }

  function qa(question, reponse) {
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 80);
    doc.text(question, margin, y); nextLine(5);
    wrap(reponse || '—', margin, 10, 'normal', [50, 50, 50]);
    nextLine(1); hRule();
  }

  // En-tête
  y = 14;
  doc.setFillColor(26, 26, 46);
  doc.rect(0, 0, W, 30, 'F');
  doc.setFontSize(15); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
  doc.text('Retour d\'intervention', margin, y);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(200, 210, 230);
  doc.text('Antonin Atger', margin, y + 8);

  // Badge profil
  const badgeColor = data.profil === "Professeur" ? [15, 52, 96] : [233, 69, 96];
  doc.setFillColor(...badgeColor);
  doc.roundedRect(W - margin - 32, 5, 32, 10, 2, 2, 'F');
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
  doc.text(data.profil.toUpperCase(), W - margin - 16, 11.5, { align: 'center' });

  // Badge note
  doc.setFillColor(233, 69, 96);
  doc.roundedRect(W - margin - 32, 17, 32, 10, 2, 2, 'F');
  doc.setFontSize(13); doc.setFont('helvetica', 'bold');
  doc.text(data.note.split('/')[0].trim(), W - margin - 20, 24);
  doc.setFontSize(7); doc.setFont('helvetica', 'normal');
  doc.text('/ 20', W - margin - 5, 24);

  y = 36;

  // Infos générales
  sectionBar('Informations générales');
  qa('Intervention', data.intervention);
  if (data.nom)    qa('Nom', data.nom + (data.prenom ? ' ' + data.prenom : ''));
  qa('Établissement', data.etablissement);
  qa('Classe', data.classe);
  qa('Format', data.seance_type);
  if (data.nb_seances) qa('Nombre de séances', data.nb_seances);
  qa('Date de l\'intervention', data.date);

  // Retour qualitatif
  sectionBar('Retour qualitatif');
  qa('Opinion générale', data.impression);
  qa('Points pertinents et clairs', data.preferes);
  qa('Points à améliorer', data.ameliorations);
  qa('UNE chose à retenir', data.retenir);

  // Pied de page
  const now = new Date();
  doc.setFontSize(7.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(170, 170, 190);
  doc.text(
    `Réponse reçue le ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
    margin, 290
  );
  doc.text('Antonin Atger — Formulaire de retour', W - margin, 290, { align: 'right' });

  _lastPdfDoc = doc;
  return doc.output('datauristring');
}

// ── Envoi vers Google Sheets ──────────────────────────────────────────────────
function postToSheets(data) {
  if (!SHEETS_URL || SHEETS_URL === "VOTRE_URL_APPS_SCRIPT") return;
  fetch(SHEETS_URL, {
    method   : 'POST',
    mode     : 'no-cors',
    body     : JSON.stringify(data),
  }).catch(() => {}); // silencieux — l'email reste la source principale
}

// ── Soumission ────────────────────────────────────────────────────────────────
async function submitForm() {
  const btn = document.getElementById('btn-submit');
  btn.disabled = true;
  showScreen('step-sending');

  const data = collectData();
  generatePDF(data); // stocke dans _lastPdfDoc

  // Corps texte de l'email
  const sep = '─────────────────────────────';
  let corps = `RETOUR D'INTERVENTION — ${data.profil.toUpperCase()}\n${sep}\n\n`;
  corps += `Intervention : ${data.intervention}\n`;
  if (data.nom) corps += `Nom          : ${data.nom}${data.prenom ? ' ' + data.prenom : ''}\n`;
  corps += `Établissement: ${data.etablissement}\n`;
  corps += `Classe       : ${data.classe}\n`;
  corps += `Format       : ${data.seance_type}\n`;
  if (data.nb_seances) corps += `Nb séances   : ${data.nb_seances}\n`;
  corps += `Date         : ${data.date}\n`;
  corps += `Note         : ${data.note}\n\n`;
  corps += `${sep}\n\n`;
  corps += `Opinion générale :\n${data.impression}\n\n`;
  corps += `Points pertinents et clairs :\n${data.preferes}\n\n`;
  corps += `À améliorer :\n${data.ameliorations}\n\n`;
  corps += `UNE chose à retenir :\n${data.retenir}\n\n`;
  corps += `${sep}\n`;
  corps += `Reçu le ${new Date().toLocaleString('fr-FR')}`;

  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body   : JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject   : `[Retour ${data.profil}] ${data.intervention} | ${data.etablissement}`,
        name      : data.nom || 'Anonyme',
        email     : 'noreply@antoninatger.com',
        message   : corps,
        botcheck  : '',
      }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Erreur Web3Forms');

    postToSheets(data);
    document.getElementById('done-actions').classList.remove('hidden');
    showScreen('step-done');
  } catch (err) {
    console.error('Erreur envoi :', err);
    document.getElementById('error-msg').textContent = 'L\'envoi a échoué : ' + err.message;
    showScreen('step-error');
    btn.disabled = false;
  }
}

// ── Reset ─────────────────────────────────────────────────────────────────────
function resetForm() {
  _lastPdfDoc = null;
  document.querySelectorAll('input[type="text"], textarea').forEach(el => el.value = '');
  document.getElementById('f-intervention').value = '';
  document.getElementById('f-date').value = '';
  document.getElementById('f-nb-seances').value = '';
  document.querySelector('input[name="seance"][value="unique"]').checked = true;
  document.getElementById('field-nb-seances').classList.add('hidden');
  document.getElementById('f-note-slider').value = 14;
  document.getElementById('f-note-display').textContent = '14 / 20';
  document.getElementById('field-intervention-autre').classList.add('hidden');
  document.getElementById('prof-fields').classList.add('hidden');
  document.getElementById('field-nb-seances').classList.add('hidden');
  document.getElementById('intro-anon').style.display = '';
  document.querySelector('input[name="profil"][value="élève"]').checked = true;
  goToStep(0);
}
