const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const openaiApiKey = (process.env.OPENAI_API_KEY || '').trim();
const geminiApiKey = (process.env.GEMINI_API_KEY || '').trim() || (openaiApiKey.startsWith('AIza') ? openaiApiKey : '');
const openai = openaiApiKey && !openaiApiKey.startsWith('AIza') ? new OpenAI({ apiKey: openaiApiKey }) : null;
const hasOpenAiKey = Boolean(openai);
const hasGeminiKey = Boolean(geminiApiKey);
// Try a few candidate models in order (v1beta endpoint).
const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-pro'];

// Debug at startup: which provider is configured
console.log('[moon] config', {
  hasGeminiKey,
  hasOpenAiKey,
  geminiKeyPrefix: geminiApiKey ? geminiApiKey.slice(0, 4) : '(none)',
  openaiKeyPrefix: openaiApiKey ? openaiApiKey.slice(0, 5) : '(none)',
  models: GEMINI_MODELS
});

async function askGemini(question = 'Dis bonjour.') {
  const payload = { contents: [{ parts: [{ text: question }] }] };
  let lastErr = null;
  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiApiKey)}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        const errMsg = data?.error?.message || `HTTP ${res.status}`;
        throw new Error(errMsg);
      }
      const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      const text = (answer || '').trim();
      if (text) {
        console.log('[moon] gemini success', { model });
        return text;
      }
      lastErr = new Error('Réponse vide');
    } catch (err) {
      lastErr = err;
      console.warn('[moon] gemini fallback', { model, err: err?.message || err });
    }
  }
  throw lastErr || new Error('Aucun modèle Gemini n\'a répondu');
}

function offlineReply(question = '') {
  const q = (question || '').toLowerCase();
  if (q.includes('qui es') || q.includes('toi') || q.includes('assistant')) {
    return "Je suis le guide de la Maison : je réponds avec les règles de l'expérience.";
  }
  if (q.includes('social') || q.includes('réseau') || q.includes('story') || q.includes('post') || q.includes('like') || q.includes('dm')) {
    return "Les signaux sociaux (likes, stories, DMs) servent à prédire humeur, opinions et influence. Réduis la géoloc et segmente tes audiences.";
  }
  if (q.includes('achat') || q.includes('panier') || q.includes('commerce') || q.includes('abonnement') || q.includes('prix')) {
    return "Les paniers et abonnements calculent ton pouvoir d'achat et tes routines. Varie les moyens de paiement et purge l'historique d'achat.";
  }
  if (q.includes('trajet') || q.includes('gps') || q.includes('locali') || q.includes('déplacement')) {
    return "Quelques jours de GPS suffisent pour trouver domicile et lieux sensibles. Coupe la géoloc en tâche de fond et sépare profils pro/perso.";
  }
  if (q.includes('santé') || q.includes('sommeil') || q.includes('humeur') || q.includes('sensibl') || q.includes('coeur') || q.includes('spo2')) {
    return "Les données santé/sommeil sont sensibles : vérifie les permissions, désactive le partage tiers et conserve un export chiffré seulement si besoin.";
  }
  if (q.includes('rgpd') || q.includes('droit') || q.includes('contrôle') || q.includes('export') || q.includes('effacement') || q.includes('suppression')) {
    return "Tes leviers : accès/portabilité pour récupérer, rectification pour corriger, effacement pour supprimer, opposition pour bloquer la pub ciblée.";
  }
  if (q.includes('navig') || q.includes('visiter') || q.includes('guide')) {
    return "Utilise la téléportation pour changer de pièce, ou marche avec ZQSD/flèches. Clique sur les panneaux pour déclencher les interactions.";
  }
  return "Parle-moi de réseaux, achats, trajets, santé/sensibles ou contrôle et je te répondrai.";
}

// Dans un vrai contexte, ajoute auth/rate-limit ici
app.post('/api/moon', async (req, res) => {
  const { question = '' } = req.body || {};

  // Short-circuit to offline mode when no key is configured.
  if (!hasOpenAiKey && !hasGeminiKey) {
    return res.json({ answer: offlineReply(question) });
  }

  try {
    if (hasGeminiKey) {
      console.log('[moon] provider=gemini', { models: GEMINI_MODELS, q: question });
      const answer = await askGemini(question || 'Dis bonjour.');
      if (answer) return res.json({ answer });
      // If empty, fallback to offline.
      return res.json({ answer: offlineReply(question) });
    }

    if (hasOpenAiKey) {
      console.log('[moon] provider=openai', { q: question });
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Tu es le guide de la Maison de Verre.' },
          { role: 'user', content: question }
        ],
        temperature: 0.6,
        max_tokens: 200
      });
      const answer = completion.choices?.[0]?.message?.content?.trim() || "Je n'ai pas trouvé de réponse.";
      return res.json({ answer });
    }

    // If no provider hit, return offline.
    return res.json({ answer: offlineReply(question) });
  } catch (err) {
    const status = err?.status || err?.response?.status || 500;
    const detail = err?.response?.data?.error?.message || err.message || 'Erreur inconnue';
    console.error('Moon API error', status, detail);
    // Keep UX smooth: always return 200 with a concise local reply.
    res.json({ answer: offlineReply(question) });
  }
});

// Sert les fichiers statiques si tu veux tout héberger avec le même serveur
app.use(express.static('.')); // ou `./public` selon ton setup

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Moon backend on http://localhost:${PORT}`));
