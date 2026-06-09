// js/tips.js
const TIPS = [
  'Senke sofort deine eigene Stimme, Kinder werden automatisch leiser, wenn du leiser wirst.',
  'Heb die Hand als stilles Signal, Kinder die es kennen, geben es weiter bis alle still sind.',
  'Klatsche ein festes Rhythmusmuster, Kinder klatschen ihn nach und werden dabei ruhiger.',
  'Wechsle die Aktivität zu etwas Ruhigem wie Malen oder Kneten.',
  'Ruf alle in einen Kreis zusammen.',
  'Starte spontan eine Runde Stille Post, das Spiel zwingt alle zum Flüstern.',
  'Zeige auf die Lärm-Ampel ohne etwas zu sagen.',
  'Schalte leise Instrumentalmusik ein.',
  'Teile die Gruppe auf und schicke einen Teil in einen anderen Raum oder in den Garten.',
  'Setz dich demonstrativ hin und warte still.',
  'Sprich einzelne laute Kinder kurz und ruhig direkt an, statt die ganze Gruppe anzusprechen.',
  'Kündige eine „Flüsterminute" an',
  'Lösche das Licht kurz für 2–3 Sekunden, die plötzliche Veränderung zieht sofort die Aufmerksamkeit aller auf sich.',
  'Starte eine kurze Entspannungsübung: «Alle schliessen die Augen und atmen dreimal tief durch.»',
  'Verlege die lautesten Kinder in eine andere Ecke des Raums.',
  'Flüstere eine spannende Geschichte oder ein Geheimnis, das die Kinder hören wollen, Neugier macht sie still.',
  'Kündige ein Spiel an: „Wer schafft es, 1 Minute komplett still zu sein?"',
  'Öffne ein Fenster oder geh kurz mit allen raus.',
  'Zähl langsam und sichtbar von 5 rückwärts, die Kinder erkennen das Signal, dass jetzt Ruhe erwartet wird.',
  'Gib jedem Kind eine kurze stille Aufgabe wie Zeichnen oder Bauen.',
  'Mach eine „Frosch-Pause": Alle hocken still wie ein Frosch.'
];

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function renderTips() {
  const container = document.getElementById('tipsGrid');
  if (!container) return;
  const selected = shuffle([...TIPS]).slice(0, 4);
  container.innerHTML = '';
  selected.forEach((tip) => {
    const card = document.createElement('div');
    card.className = 'tip-card';
    const paragraph = document.createElement('p');
    paragraph.textContent = tip;
    card.appendChild(paragraph);
    container.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderTips();
  const btn = document.getElementById('reloadTipsBtn');
  if (btn) btn.addEventListener('click', renderTips);
});
