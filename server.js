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
Tu es "Moon" un guide à l'intérieur de la maison immersive "House of Glass".
Ta mission : expliquer comment les traces numériques (réseaux sociaux, achats, déplacements, données sensibles) se combinent dans chaque pièce
— Hall d'entrée, Cuisine des Achats, Chambre des Données sensibles, Couloir des Traces, Salon des Réseaux et Grenier des Souvenirs — pour dresser un profil et proposer des protections (réglages, droits RGPD, conseils pratiques).
Rappelle au besoin comment se déplacer (flèches, téléportation, interactions sur les panneaux) et encourage l'exploration des zones pertinentes.
Réponds en français, en 1 à 5 phrases maximum, ton posé, concret, sans slogan ni envolée marketing, mais couvre toutes les questions posées.
`;
const HISTORY_LIMIT = 6; // nombre de tours conservés par session
const conversations = new Map(); // sessionId -> [{ role:'user'|'assistant', content }]

// Debug at startup: which provider is configured
console.log('[moon] config', {
  hasGeminiKey,
  hasOpenAiKey,
  geminiKeyPrefix: geminiApiKey ? geminiApiKey.slice(0, 4) : '(none)',
  openaiKeyPrefix: openaiApiKey ? openaiApiKey.slice(0, 5) : '(none)',
  models: GEMINI_MODELS
});

function getHistory(sessionId) {
  if (!sessionId) return [];
  return conversations.get(sessionId) || [];
}

function rememberMessage(sessionId, role, content) {
  if (!sessionId || !content) return;
  const normalizedRole = role === 'assistant' ? 'assistant' : 'user';
  const arr = conversations.get(sessionId) || [];
  arr.push({ role: normalizedRole, content });
  const maxEntries = HISTORY_LIMIT * 2;
  if (arr.length > maxEntries) arr.splice(0, arr.length - maxEntries);
  conversations.set(sessionId, arr);
}

async function askGemini(question = 'Dis bonjour.', sessionId = 'default') {
  const history = getHistory(sessionId);
  const contents = history.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));
  const safeQuestion = question || 'Dis bonjour.';
  if (!history.length || history[history.length - 1].role !== 'user') {
    contents.push({ role: 'user', parts: [{ text: safeQuestion }] });
  }
  const payload = {
    contents,
    systemInstruction: {
      parts: [{ text: moonSystemPrompt.trim() }]
    }
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
  const { question = '', sessionId: bodySessionId } = req.body || {};
  const sessionId =
    (typeof bodySessionId === 'string' && bodySessionId.trim()) ||
    req.headers['x-client-session'] ||
    req.ip ||
    'default';
  const query = (question || '').trim();
  if (query) rememberMessage(sessionId, 'user', query);

  // Short-circuit to offline mode when no key is configured.
  if (!hasOpenAiKey && !hasGeminiKey) {
    const answer = offlineReply(query);
    rememberMessage(sessionId, 'assistant', answer);
    return res.json({ answer });
  }

  try {
    if (hasGeminiKey) {
      console.log('[moon] provider=gemini', { models: GEMINI_MODELS, q: query });
      const answer = await askGemini(query || 'Dis bonjour.', sessionId);
      if (answer) {
        rememberMessage(sessionId, 'assistant', answer);
        return res.json({ answer });
      }
      // If empty, fallback to offline.
      const fallback = offlineReply(query);
      rememberMessage(sessionId, 'assistant', fallback);
      return res.json({ answer: fallback });
    }

    if (hasOpenAiKey) {
      console.log('[moon] provider=openai', { q: query });
      const history = getHistory(sessionId).map((msg) => ({
        role: msg.role,
        content: msg.content
      }));
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: moonSystemPrompt.trim() },
          ...history
        ],
        temperature: 0.6,
        max_tokens: 200
      });
      const answer = completion.choices?.[0]?.message?.content?.trim() || "Je n'ai pas trouvé de réponse.";
      rememberMessage(sessionId, 'assistant', answer);
      return res.json({ answer });
    }

    // If no provider hit, return offline.
    const defaultAnswer = offlineReply(query);
    rememberMessage(sessionId, 'assistant', defaultAnswer);
    return res.json({ answer: defaultAnswer });
  } catch (err) {
    const status = err?.status || err?.response?.status || 500;
    const detail = err?.response?.data?.error?.message || err.message || 'Erreur inconnue';
    console.error('Moon API error', status, detail);
    // Keep UX smooth: always return 200 with a concise local reply.
    const fallback = offlineReply(query);
    rememberMessage(sessionId, 'assistant', fallback);
    res.json({ answer: fallback });
  }
});

// Sert les fichiers statiques si tu veux tout héberger avec le même serveur
app.use(express.static('.')); // ou `./public` selon ton setup

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Moon backend on http://localhost:${PORT}`));
