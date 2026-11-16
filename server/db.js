const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'mindflow.db');
const db = new Database(dbPath);

// Enable WAL mode for high concurrency & performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    tags TEXT DEFAULT '[]',
    is_pinned INTEGER DEFAULT 0,
    color TEXT DEFAULT 'indigo',
    summary TEXT,
    action_items TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ai_interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    note_id INTEGER,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    action_type TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
  CREATE INDEX IF NOT EXISTS idx_notes_pinned ON notes(user_id, is_pinned);
  CREATE INDEX IF NOT EXISTS idx_notes_category ON notes(user_id, category);
`);

// Seed default demo user and initial sample notes if database is new
function seedDemoData() {
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@mindflow.ai');
  if (!existingUser) {
    const passwordHash = bcrypt.hashSync('demo1234', 10);
    const result = db.prepare(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)'
    ).run('demo@mindflow.ai', passwordHash, 'Alex Demo');

    const demoUserId = result.lastInsertRowid;

    const sampleNotes = [
      {
        title: '🚀 Cloud Architecture & Full-Stack Deployment Roadmap',
        content: `Key principles for reliable cloud deployments:
1. Containerization with multi-stage Docker builds.
2. Stateless web services with environment-based configuration.
3. Automated CI/CD pipelines connecting GitHub to Cloud PaaS (Render, Railway, Vercel).
4. Secure authentication using salted bcrypt hashing and stateless JWT tokens.
5. Generative AI integration with fallback handling and streaming.

Upcoming milestones:
- Finalize production health checks and API documentation.
- Test responsive layouts on mobile, tablet, and desktop viewports.
- Connect Google Gemini API for real-time document summarization and action item extraction.`,
        category: 'Work',
        tags: JSON.stringify(['cloud', 'architecture', 'devops']),
        is_pinned: 1,
        color: 'indigo',
        summary: 'Architectural overview of modern full-stack web applications featuring containerization, JWT auth, and Gemini AI integration.',
        action_items: JSON.stringify([
          { id: '1', text: 'Finalize production health checks and API docs', completed: true },
          { id: '2', text: 'Test responsive layouts across all screen sizes', completed: true },
          { id: '3', text: 'Verify Gemini API endpoints and fallback handling', completed: false }
        ])
      },
      {
        title: '💡 Product Ideas: AI-Powered Knowledge Companion',
        content: `What makes an AI workspace truly delightful to use?
- Instant action items: Don't just summarize notes; turn notes into actionable todos.
- Contextual Chat: Let users ask "What were the deadlines mentioned in my notes last week?"
- Tone Transformer: Switch notes effortlessly between Executive Brief, Casual Memo, or Technical Spec.
- Dark & Light themes with clean typography and high contrast accessibility.`,
        category: 'Ideas',
        tags: JSON.stringify(['ai', 'product', 'ux']),
        is_pinned: 1,
        color: 'emerald',
        summary: 'Brainstorming key features that differentiate modern AI productivity tools.',
        action_items: JSON.stringify([
          { id: '1', text: 'Implement 1-click Tone Transformer', completed: true },
          { id: '2', text: 'Add contextual Q&A sidebar for active notes', completed: false }
        ])
      },
      {
        title: '📚 Deep Learning & Generative Models Reading List',
        content: `Curated papers and resources:
- Attention Is All You Need (Vaswani et al.)
- Scaling Laws for Neural Language Models
- FlashAttention-2: Faster Attention with Better Parallelism
- Google Gemini Architecture & Multimodal Capabilities
- Practical Agentic Workflows and Tool Calling Patterns`,
        category: 'Study',
        tags: JSON.stringify(['ai', 'reading', 'research']),
        is_pinned: 0,
        color: 'amber',
        summary: 'A curated foundational reading list on transformer models and generative AI systems.',
        action_items: JSON.stringify([
          { id: '1', text: 'Review FlashAttention-2 benchmarks', completed: false }
        ])
      }
    ];

    const insertNote = db.prepare(`
      INSERT INTO notes (user_id, title, content, category, tags, is_pinned, color, summary, action_items)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const note of sampleNotes) {
      insertNote.run(
        demoUserId,
        note.title,
        note.content,
        note.category,
        note.tags,
        note.is_pinned,
        note.color,
        note.summary,
        note.action_items
      );
    }
  }
}

seedDemoData();

module.exports = db;
