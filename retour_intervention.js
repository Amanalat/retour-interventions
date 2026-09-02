// ── Web3Forms ─────────────────────────────────────────────────────────────────
const WEB3FORMS_KEY = "ef1fe549-c616-4a27-a6c2-97f06caa913d";

// ── Google Sheets (Apps Script) ───────────────────────────────────────────────
// Collez ici l'URL de déploiement de votre Apps Script (voir SETUP_SHEETS.txt)
const SHEETS_URL = "https://hook.eu1.make.com/l15ckvxewndw5sp7aady0rux6kyy1khl";

// ── Helpers ──────────────────────────────────────────────────────────────────
function getTypeLieu() {
  return document.querySelector('input[name="lieu"]:checked')?.value || "scolaire";
}

function isScolaire() { return getTypeLieu() === "scolaire"; }

function getProfil() {
  if (isScolaire()) return document.querySelector('input[name="profil-scolaire"]:checked')?.value || "élève";
  return document.querySelector('input[name="profil-hors-scolaire"]:checked')?.value || "spectateur";
}

function isMajeur() {
  return document.querySelector('input[name="majeur"]:checked')?.value === "oui";
}

// Peut donner son nom : professeur (scolaire) ou majeur (hors scolaire) — les autres restent anonymes
function canIdentify() {
  return isScolaire() ? getProfil() === "professeur" : isMajeur();
}

function getIntervention() {
  const sel = document.getElementById('f-intervention').value;
  if (sel === "Autre") return document.getElementById('f-intervention-autre').value.trim() || "Autre";
  return sel;
}

const MODALITE_LABELS = { presentiel: "Pr\u00e9sentiel", distanciel: "Distanciel" };

function getModalite() {
  const val = document.querySelector('input[name="modalite"]:checked')?.value || "presentiel";
  return MODALITE_LABELS[val];
}

function getDate() {
  const val = document.getElementById('f-date').value; // YYYY-MM-DD
  if (!val) return "Non renseignée";
  const [y, m, d] = val.split('-');
  const mois = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
  return `${parseInt(d)} ${mois[parseInt(m) - 1]} ${y}`;
}

// ── Réaction au changement de lieu / profil ──────────────────────────────────
function onTypeLieuChange() {
  const scolaire = isScolaire();
  document.getElementById('profil-scolaire').classList.toggle('hidden', !scolaire);
  document.getElementById('profil-hors-scolaire').classList.toggle('hidden', scolaire);
  onProfilChange();
}

function onProfilChange() {
  // Message anonymat : masqué seulement quand le rôle garantit déjà une identification (professeur)
  const identifieDoffice = isScolaire() && getProfil() === "professeur";
  document.getElementById('intro-anon').style.display = identifieDoffice ? 'none' : '';
}

function onMajeurChange() {
  document.getElementById('prof-fields').classList.toggle('hidden', !isMajeur());
}

// ── Navigation ───────────────────────────────────────────────────────────────
function goToStep(n) {
  if (n === 1 && !validateStep0()) return;
  if (n === 2 && !validateStep1()) return;

  document.querySelectorAll('.step').forEach(s => s.classList.add('hidden'));
  document.getElementById('step-' + n).classList.remove('hidden');

  if (n === 1) setupStep1();
  if (n === 3) setupStep3();
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
  document.getElementById('label-modalite').textContent = multiple
    ? 'Les séances se sont-elles faites en présentiel ou en distanciel ?'
    : 'L\'intervention s\'est-elle faite en présentiel ou en distanciel ?';
}

function setupStep1() {
  const scolaire = isScolaire();
  const lieu = getTypeLieu();
  const role = getProfil();
  const interv = getIntervention();

  // Titre dynamique
  document.getElementById('step1-titre').textContent = interv;

  // Libellé du champ établissement selon le lieu
  const labelEtabText = {
    scolaire: "Quel est le nom de votre établissement ?",
    mediatheque: "Quel est le nom de la médiathèque ?",
    centre_social: "Quel est le nom du centre social ?",
  }[lieu];
  document.getElementById('label-etablissement').innerHTML = labelEtabText + ' <span class="required">*</span>';

  // Intro dynamique
  document.getElementById('step1-intro').textContent = scolaire
    ? (role === 'professeur'
        ? 'Quelques infos sur vous, votre établissement et les séances effectuées.'
        : 'Quelques infos sur votre établissement et la date de l\'intervention.')
    : 'Quelques infos sur la structure et la date de l\'intervention.';

  // Champs classe / type d'intervention : établissement scolaire uniquement
  document.getElementById('field-classe').classList.toggle('hidden', !scolaire);
  document.getElementById('field-seance-type').classList.toggle('hidden', !scolaire);

  // Question de majorité : hors établissement scolaire uniquement
  document.getElementById('field-majeur').classList.toggle('hidden', scolaire);

  if (scolaire) {
    // Champs d'identification (nom, prénom) réservés au professeur
    document.getElementById('prof-fields').classList.toggle('hidden', role !== 'professeur');
  } else {
    // Réinitialise la question de majorité à chaque entrée dans l'étape
    document.querySelectorAll('input[name="majeur"]').forEach(el => el.checked = false);
    document.getElementById('prof-fields').classList.add('hidden');
  }

  // Réinitialise le radio séance + champs dépendants
  document.querySelector('input[name="seance"][value="unique"]').checked = true;
  onSeanceChange();
}

// ── Étape 3 : témoignage ──────────────────────────────────────────────────────
function setupStep3() {
  const identified = canIdentify();
  // Non identifiable (élève, mineur…) : message toujours anonyme — Sinon : case à cocher d'anonymat
  document.getElementById('temoignage-note-eleve').style.display = identified ? 'none' : '';
  document.getElementById('temoignage-anon-prof').style.display  = identified ? '' : 'none';
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

  if (isScolaire()) {
    if (getProfil() === 'professeur') {
      const nom = document.getElementById('f-nom').value.trim();
      if (!nom) { alert("Veuillez indiquer votre nom."); return false; }
    }
  } else {
    if (!document.querySelector('input[name="majeur"]:checked')) {
      alert("Veuillez indiquer si vous êtes majeur(e).");
      return false;
    }
    if (isMajeur()) {
      const nom = document.getElementById('f-nom').value.trim();
      if (!nom) { alert("Veuillez indiquer votre nom."); return false; }
    }
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
const LIEU_LABELS = { scolaire: "Établissement scolaire", mediatheque: "Médiathèque", centre_social: "Centre social" };
const ROLE_LABELS = { "élève": "Élève", "professeur": "Professeur", "spectateur": "Spectateur", "organisateur": "Organisateur" };

function collectData() {
  const scolaire = isScolaire();
  const identified = canIdentify();
  return {
    typeLieu     : LIEU_LABELS[getTypeLieu()],
    profil       : ROLE_LABELS[getProfil()],
    intervention : getIntervention(),
    nom          : identified ? document.getElementById('f-nom').value.trim()    : "",
    prenom       : identified ? document.getElementById('f-prenom').value.trim() : "",
    etablissement: document.getElementById('f-etablissement').value.trim(),
    classe       : scolaire ? (document.getElementById('f-classe').value.trim() || "Non renseigné") : "",
    nb_seances   : scolaire && isSeanceMultiple() ? (document.getElementById('f-nb-seances').value || "Non renseigné") : "",
    seance_type  : scolaire ? (isSeanceMultiple() ? "Séances multiples" : "Séance unique") : "",
    majeur       : scolaire ? "" : (isMajeur() ? "Oui" : "Non"),
    date         : getDate(),
    modalite     : getModalite(),
    note         : document.getElementById('f-note-slider').value + " / 20",
    impression   : document.getElementById('f-impression').value.trim()   || "—",
    preferes     : document.getElementById('f-preferes').value.trim()     || "—",
    ameliorations: document.getElementById('f-ameliorations').value.trim()|| "—",
    retenir      : document.getElementById('f-retenir').value.trim()      || "—",
    temoignage   : document.getElementById('f-temoignage').value.trim(),
    // Non identifiable (élève, mineur…) : toujours anonyme. Sinon : selon la case cochée.
    temoignage_anon: identified ? document.getElementById('f-temoignage-anon').checked : true,
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
  const badgeColor = ["Professeur", "Organisateur"].includes(data.profil) ? [15, 52, 96] : [233, 69, 96];
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
  qa('Cadre', data.typeLieu);
  qa('Intervention', data.intervention);
  if (data.nom)    qa('Nom', data.nom + (data.prenom ? ' ' + data.prenom : ''));
  qa('Établissement', data.etablissement);
  if (data.classe) qa('Classe', data.classe);
  if (data.seance_type) qa('Format', data.seance_type);
  if (data.nb_seances) qa('Nombre de séances', data.nb_seances);
  if (data.majeur) qa('Majeur(e)', data.majeur);
  qa('Date de l\'intervention', data.date);
  qa('Modalit\u00e9', data.modalite);

  // Retour qualitatif
  sectionBar('Retour qualitatif');
  qa('Opinion générale', data.impression);
  qa('Points pertinents et clairs', data.preferes);
  qa('Points à améliorer', data.ameliorations);
  qa('UNE chose à retenir', data.retenir);

  // Message pour le site (témoignage)
  if (data.temoignage) {
    sectionBar('Message pour le site');
    const signature = data.temoignage_anon ? 'Anonyme' : (`${data.nom}${data.prenom ? ' ' + data.prenom : ''}`.trim() || 'Anonyme');
    qa('Signature souhaitée', signature);
    qa('Message', data.temoignage);
  }

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
  console.log('postToSheets appelé', SHEETS_URL);
  fetch(SHEETS_URL, {
    method  : 'POST',
    headers : { 'Content-Type': 'application/json' },
    body    : JSON.stringify(data),
  })
  .then(r => console.log('Make réponse:', r.status))
  .catch(e => console.error('Make erreur:', e));
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
  corps += `Cadre        : ${data.typeLieu}\n`;
  corps += `Intervention : ${data.intervention}\n`;
  if (data.nom) corps += `Nom          : ${data.nom}${data.prenom ? ' ' + data.prenom : ''}\n`;
  corps += `Établissement: ${data.etablissement}\n`;
  if (data.classe) corps += `Classe       : ${data.classe}\n`;
  if (data.seance_type) corps += `Format       : ${data.seance_type}\n`;
  if (data.nb_seances) corps += `Nb séances   : ${data.nb_seances}\n`;
  if (data.majeur) corps += `Majeur(e)    : ${data.majeur}\n`;
  corps += `Date         : ${data.date}\n`;
  corps += `Modalité     : ${data.modalite}\n`;
  corps += `Note         : ${data.note}\n\n`;
  corps += `${sep}\n\n`;
  corps += `Opinion générale :\n${data.impression}\n\n`;
  corps += `Points pertinents et clairs :\n${data.preferes}\n\n`;
  corps += `À améliorer :\n${data.ameliorations}\n\n`;
  corps += `UNE chose à retenir :\n${data.retenir}\n\n`;
  if (data.temoignage) {
    corps += `${sep}\n\n`;
    const signature = data.temoignage_anon ? 'Anonyme' : (`${data.nom}${data.prenom ? ' ' + data.prenom : ''}`.trim() || 'Anonyme');
    corps += `MESSAGE POUR LE SITE (${signature}) :\n${data.temoignage}\n\n`;
  }
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
  document.querySelector('input[name="modalite"][value="presentiel"]').checked = true;
  document.getElementById('field-nb-seances').classList.add('hidden');
  document.getElementById('f-note-slider').value = 14;
  document.getElementById('f-note-display').textContent = '14 / 20';
  document.getElementById('f-temoignage-anon').checked = false;
  document.getElementById('field-intervention-autre').classList.add('hidden');
  document.getElementById('prof-fields').classList.add('hidden');
  document.querySelectorAll('input[name="majeur"]').forEach(el => el.checked = false);
  document.getElementById('intro-anon').style.display = '';
  document.querySelector('input[name="lieu"][value="scolaire"]').checked = true;
  document.querySelector('input[name="profil-scolaire"][value="élève"]').checked = true;
  document.querySelector('input[name="profil-hors-scolaire"][value="spectateur"]').checked = true;
  onTypeLieuChange();
  goToStep(0);
}
