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
const moonReplies = require('./moonReplies.json');
const moonSystemPrompt = `
Tu es "un assistant", guide dans l'expérience immersive "House of Glass".
Réponds en français, en 1 à 3 phrases maximum, directement à la question.
Si la question est vague ("je fais quoi ?"), propose immédiatement 2-3 actions précises sans refaire l'introduction.
Ne fais pas de slogans ni de longs discours, pas de disclaimer technique mais répond à toutes les questions.
`;

// Debug at startup: which provider is configured
console.log('[moon] config', {
  hasGeminiKey,
  hasOpenAiKey,
  geminiKeyPrefix: geminiApiKey ? geminiApiKey.slice(0, 4) : '(none)',
  openaiKeyPrefix: openaiApiKey ? openaiApiKey.slice(0, 5) : '(none)',
  models: GEMINI_MODELS
});

async function askGemini(question = 'Dis bonjour.') {
  const payload = {
    contents: [
      {
        parts: [
          { text: moonSystemPrompt.trim() },
          { text: question }
        ]
      }
    ]
  };
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
  if (!moonReplies || !moonReplies.entries) return moonReplies?.default || '';
  for (const entry of moonReplies.entries) {
    if (!entry || !entry.triggers || !entry.response) continue;
    for (const trig of entry.triggers) {
      if (q.includes(trig.toLowerCase())) return entry.response;
    }
  }
  return moonReplies.default || '';
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
          { role: 'system', content: 'Tu es le guide de la House of Glass.' },
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
