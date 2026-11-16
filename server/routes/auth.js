const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireAuth, generateToken } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const emailTrimmed = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(emailTrimmed);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const result = db.prepare(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)'
    ).run(emailTrimmed, passwordHash, name.trim());

    const newUser = {
      id: result.lastInsertRowid,
      email: emailTrimmed,
      name: name.trim()
    };

    // Create a welcome note for the new user
    db.prepare(`
      INSERT INTO notes (user_id, title, content, category, tags, is_pinned, color, summary, action_items)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newUser.id,
      '🎉 Welcome to MindFlow AI!',
      'Welcome to your personal AI-powered workspace.\n\nHere is how to get the most out of it:\n- Click "New Note" to record ideas, meeting notes, or study materials.\n- Use the "AI Tools" button to summarize, generate action items, or brainstorm new angles.\n- Chat with your note anytime using the AI Assistant panel.\n- Pin important notes to keep them at the top.',
      'General',
      JSON.stringify(['welcome', 'getting-started']),
      1,
      'indigo',
      'Welcome guide explaining how to use notes, Gemini AI generation, and tags.',
      JSON.stringify([
        { id: '1', text: 'Create your first custom note', completed: false },
        { id: '2', text: 'Try the 1-click AI Summarizer', completed: false }
      ])
    );

    const token = generateToken(newUser);
    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: newUser
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// Login user
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const emailTrimmed = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(emailTrimmed);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name
    };

    const token = generateToken(safeUser);
    return res.json({
      message: 'Logged in successfully',
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// 1-Click Demo Guest Login
router.post('/demo', (req, res) => {
  try {
    let demoUser = db.prepare('SELECT id, email, name FROM users WHERE email = ?').get('demo@mindflow.ai');
    if (!demoUser) {
      const passwordHash = bcrypt.hashSync('demo1234', 10);
      const result = db.prepare(
        'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)'
      ).run('demo@mindflow.ai', passwordHash, 'Alex Demo');
      demoUser = { id: result.lastInsertRowid, email: 'demo@mindflow.ai', name: 'Alex Demo' };
    }

    const token = generateToken(demoUser);
    return res.json({
      message: 'Logged in as Demo User',
      token,
      user: demoUser
    });
  } catch (error) {
    console.error('Demo login error:', error);
    return res.status(500).json({ error: 'Internal server error during demo login.' });
  }
});

// Get current user profile + stats
router.get('/me', requireAuth, (req, res) => {
  try {
    const user = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_notes,
        SUM(CASE WHEN is_pinned = 1 THEN 1 ELSE 0 END) as pinned_notes,
        COUNT(DISTINCT category) as categories_count
      FROM notes 
      WHERE user_id = ?
    `).get(req.user.id);

    return res.json({
      user,
      stats: {
        totalNotes: stats.total_notes || 0,
        pinnedNotes: stats.pinned_notes || 0,
        categoriesCount: stats.categories_count || 0
      }
    });
  } catch (error) {
    console.error('Me endpoint error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
