const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// Helper to get GoogleGenAI client
function getGenAIClient(customApiKey) {
  const key = customApiKey || process.env.GEMINI_API_KEY;
  if (!key || key.trim() === '' || key === 'your_gemini_api_key_here') {
    return null;
  }
  return new GoogleGenAI({ apiKey: key.trim() });
}

// Call Gemini API with model fallback
async function callGemini(prompt, systemInstruction = '', customApiKey = null) {
  const ai = getGenAIClient(customApiKey);
  if (!ai) {
    return null; // Signals fallback to simulated AI
  }

  const modelsToTry = ['gemini-4-hydrogen', 'gemini-2.5-flash', 'gemini-1.5-flash'];
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: systemInstruction ? { systemInstruction } : undefined
      });
      if (response && response.text) {
        return { text: response.text, model, simulated: false };
      }
    } catch (err) {
      console.warn(`Gemini model ${model} failed, trying fallback:`, err.message);
      lastError = err;
    }
  }

  console.error('All Gemini model attempts failed:', lastError?.message);
  return null;
}

// Check AI status
router.get('/status', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');
  return res.json({
    configured: hasKey,
    model: 'gemini-4-hydrogen (with auto-fallback)',
    mode: hasKey ? 'live' : 'demo-simulation'
  });
});

// 1. Summarize content
router.post('/summarize', async (req, res) => {
  try {
    const { content, title, customApiKey } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Please provide note content to summarize.' });
    }

    const prompt = `Please provide a clear, concise executive summary of the following note titled "${title || 'Untitled'}":\n\n${content}\n\nFormat your output with:\n- 2-3 high-impact bullet points\n- A one-sentence key takeaway at the end.`;

    const geminiResult = await callGemini(
      prompt,
      'You are MindFlow AI, an intelligent executive summarizer. Be concise, sharp, and structured.',
      customApiKey
    );

    let summaryText;
    let isSimulated = false;

    if (geminiResult) {
      summaryText = geminiResult.text;
    } else {
      isSimulated = true;
      const preview = content.length > 120 ? content.slice(0, 120) + '...' : content;
      summaryText = `📌 **Executive Summary**:\n• Core Focus: High-level synthesis of "${title || 'this note'}".\n• Key Point: Addresses primary workflows and critical action steps.\n• Practical Impact: Outlines clear deliverables and strategic direction.\n\n💡 **Key Takeaway**: ${preview.replace(/\n/g, ' ')}`;
    }

    return res.json({
      summary: summaryText,
      simulated: isSimulated
    });
  } catch (error) {
    console.error('AI Summarize error:', error);
    return res.status(500).json({ error: 'Failed to generate summary.' });
  }
});

// 2. Extract Action Items (Todos)
router.post('/action-items', async (req, res) => {
  try {
    const { content, customApiKey } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Please provide note content to extract action items from.' });
    }

    const prompt = `Analyze this note and extract all actionable tasks, to-dos, or next steps.
Return ONLY a valid JSON array of objects, with each object having "text" (string description) and "completed" (boolean, false).
Do not wrap in markdown quotes or backticks if possible, just raw JSON array.
Note content:
${content}`;

    const geminiResult = await callGemini(
      prompt,
      'You are an expert productivity assistant. Extract concrete, verb-driven action items. Respond ONLY with a valid JSON array: [{"text": "...", "completed": false}].',
      customApiKey
    );

    let items = [];
    let isSimulated = false;

    if (geminiResult) {
      try {
        const clean = geminiResult.text.replace(/```json/g, '').replace(/```/g, '').trim();
        items = JSON.parse(clean);
      } catch (parseErr) {
        // Fallback parsing lines
        items = geminiResult.text
          .split('\n')
          .filter(line => line.trim().startsWith('-') || line.trim().match(/^\d+\./))
          .map((line, idx) => ({
            id: String(Date.now() + idx),
            text: line.replace(/^[-*\d.]\s*/, '').trim(),
            completed: false
          }));
      }
    }

    if (!items || items.length === 0) {
      isSimulated = true;
      // Smart extraction simulation
      const lines = content.split('\n').filter(l => l.trim().length > 5);
      items = [
        { id: String(Date.now() + 1), text: `Review and finalize ${lines[0]?.slice(0, 40) || 'note draft'}`, completed: false },
        { id: String(Date.now() + 2), text: 'Verify cross-team alignment and deliverables', completed: false },
        { id: String(Date.now() + 3), text: 'Set reminders for upcoming review milestones', completed: false }
      ];
    } else {
      // Ensure all items have an id
      items = items.map((it, idx) => ({
        id: String(Date.now() + idx),
        text: typeof it === 'string' ? it : it.text,
        completed: Boolean(it.completed)
      }));
    }

    return res.json({
      action_items: items,
      simulated: isSimulated
    });
  } catch (error) {
    console.error('AI Action items error:', error);
    return res.status(500).json({ error: 'Failed to extract action items.' });
  }
});

// 3. Expand & Brainstorm
router.post('/expand', async (req, res) => {
  try {
    const { content, title, customApiKey } = req.body;
    if (!content && !title) {
      return res.status(400).json({ error: 'Please provide a topic or draft to expand.' });
    }

    const prompt = `Take this concept/note titled "${title || 'Idea'}" and expand it into a well-structured document:
Current content:
${content}

Structure your response with:
1. Executive Overview
2. Key Pillars / Strategy
3. Potential Obstacles & Mitigation
4. Next Steps & Recommended Experiments`;

    const geminiResult = await callGemini(
      prompt,
      'You are MindFlow AI, a visionary product and thought partner. Expand concepts with depth, structured formatting, and practical suggestions.',
      customApiKey
    );

    let expandedText;
    let isSimulated = false;

    if (geminiResult) {
      expandedText = geminiResult.text;
    } else {
      isSimulated = true;
      expandedText = `## 🌟 Expanded Strategy for: ${title || 'Your Idea'}\n\n### 1. Executive Overview\nThis initiative bridges core workflow bottlenecks by introducing streamlined, modular execution patterns.\n\n### 2. Strategic Pillars\n- **User Velocity**: Simplify repetitive friction into 1-click interactions.\n- **Scalable Architecture**: Decouple frontend UI state from persistent database transactions.\n- **Continuous AI Feedback**: Keep the intelligence loop real-time and contextual.\n\n### 3. Anticipated Challenges\n- Edge-case handling for offline or low-connectivity environments.\n- Mitigation: Maintain optimistic UI updates with background synchronization.\n\n### 4. Recommended Next Steps\n1. Prototype the core interaction loop with target users.\n2. Benchmark latency under multi-tenant load.\n3. Deploy continuous integration checks on the cloud pipeline.`;
    }

    return res.json({
      expanded: expandedText,
      simulated: isSimulated
    });
  } catch (error) {
    console.error('AI Expand error:', error);
    return res.status(500).json({ error: 'Failed to expand content.' });
  }
});

// 4. Tone Transformer / Rewrite
router.post('/rewrite', async (req, res) => {
  try {
    const { content, tone = 'professional', customApiKey } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required for rewriting.' });
    }

    const toneDescriptions = {
      professional: 'polished, executive, articulate, and business-ready',
      concise: 'ultra-concise, eliminating fluff while keeping essential facts',
      bullet_points: 'a clean, scannable list of clear bullet points with bold prefixes',
      creative: 'inspiring, engaging, narrative-driven, and memorable',
      casual: 'friendly, approachable, clear, and relaxed'
    };

    const targetTone = toneDescriptions[tone] || toneDescriptions.professional;
    const prompt = `Rewrite the following text so that it is ${targetTone}. Do not add meta-commentary, just return the rewritten text:\n\n${content}`;

    const geminiResult = await callGemini(
      prompt,
      `You are a professional editor. Rewrite the text precisely in the requested style: ${targetTone}.`,
      customApiKey
    );

    let rewrittenText;
    let isSimulated = false;

    if (geminiResult) {
      rewrittenText = geminiResult.text;
    } else {
      isSimulated = true;
      if (tone === 'bullet_points') {
        rewrittenText = content.split('\n').filter(l => l.trim()).map(l => `• **Key Point**: ${l}`).join('\n');
      } else if (tone === 'concise') {
        rewrittenText = content.slice(0, 160).trim() + ' (Concise overview)';
      } else {
        rewrittenText = `[${tone.toUpperCase()} TONE]\n${content}\n\nNote: This document has been optimized for clarity, coherence, and impact.`;
      }
    }

    return res.json({
      rewritten: rewrittenText,
      simulated: isSimulated
    });
  } catch (error) {
    console.error('AI Rewrite error:', error);
    return res.status(500).json({ error: 'Failed to rewrite content.' });
  }
});

// 5. Contextual AI Chat with Note or Knowledge Base
router.post('/chat', async (req, res) => {
  try {
    const { message, activeNote, history = [], customApiKey } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    // Context from active note or user's top notes
    let context = '';
    if (activeNote) {
      context = `CURRENT ACTIVE NOTE:\nTitle: ${activeNote.title}\nCategory: ${activeNote.category}\nContent:\n${activeNote.content}\n\n`;
    }

    const prompt = `${context}USER QUESTION: ${message}\n\nPlease answer helpfully, referencing the note context when relevant.`;

    const systemInstruction = 'You are MindFlow AI Companion, a brilliant, thoughtful assistant helping the user brainstorm, organize ideas, analyze documents, and plan actions.';

    const geminiResult = await callGemini(prompt, systemInstruction, customApiKey);

    let replyText;
    let isSimulated = false;

    if (geminiResult) {
      replyText = geminiResult.text;
    } else {
      isSimulated = true;
      if (activeNote) {
        replyText = `Regarding **"${activeNote.title}"**: ${message.includes('?') ? 'To address your question directly, ' : ''}this note highlights key priorities around "${activeNote.category}". Consider breaking down your next steps into measurable milestones or using the AI Action Items tool to automatically generate a checklist!`;
      } else {
        replyText = `I'm here to assist you with MindFlow AI! You can ask me to summarize, expand ideas, extract action items, or plan out projects across your notes.`;
      }
    }

    return res.json({
      reply: replyText,
      simulated: isSimulated
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    return res.status(500).json({ error: 'Failed to process AI chat.' });
  }
});

module.exports = router;
