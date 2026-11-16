const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// All notes routes require authentication
router.use(requireAuth);

// Helper to parse JSON fields safely
function formatNote(note) {
  if (!note) return null;
  return {
    ...note,
    is_pinned: Boolean(note.is_pinned),
    tags: typeof note.tags === 'string' ? JSON.parse(note.tags || '[]') : note.tags,
    action_items: typeof note.action_items === 'string' ? JSON.parse(note.action_items || '[]') : note.action_items
  };
}

// Get all notes with optional search & category filter
router.get('/', (req, res) => {
  try {
    const { search, category } = req.query;
    let query = 'SELECT * FROM notes WHERE user_id = ?';
    const params = [req.user.id];

    if (category && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (search && search.trim() !== '') {
      query += ' AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)';
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY is_pinned DESC, updated_at DESC';

    const rawNotes = db.prepare(query).all(...params);
    const notes = rawNotes.map(formatNote);

    return res.json({ notes });
  } catch (error) {
    console.error('Fetch notes error:', error);
    return res.status(500).json({ error: 'Failed to retrieve notes.' });
  }
});

// Get category counts
router.get('/categories', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM notes 
      WHERE user_id = ? 
      GROUP BY category 
      ORDER BY count DESC
    `).all(req.user.id);

    return res.json({ categories: rows });
  } catch (error) {
    console.error('Fetch categories error:', error);
    return res.status(500).json({ error: 'Failed to retrieve categories.' });
  }
});

// Get single note by id
router.get('/:id', (req, res) => {
  try {
    const note = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found.' });
    }
    return res.json({ note: formatNote(note) });
  } catch (error) {
    console.error('Get note error:', error);
    return res.status(500).json({ error: 'Failed to retrieve note.' });
  }
});

// Create note
router.post('/', (req, res) => {
  try {
    const {
      title,
      content,
      category = 'General',
      tags = [],
      is_pinned = false,
      color = 'indigo',
      summary = null,
      action_items = []
    } = req.body;

    if (!title && !content) {
      return res.status(400).json({ error: 'Note must have at least a title or content.' });
    }

    const noteTitle = (title || 'Untitled Note').trim();
    const noteContent = (content || '').trim();
    const tagsJson = JSON.stringify(Array.isArray(tags) ? tags : []);
    const actionItemsJson = JSON.stringify(Array.isArray(action_items) ? action_items : []);
    const pinnedVal = is_pinned ? 1 : 0;

    const result = db.prepare(`
      INSERT INTO notes (user_id, title, content, category, tags, is_pinned, color, summary, action_items, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      req.user.id,
      noteTitle,
      noteContent,
      category.trim() || 'General',
      tagsJson,
      pinnedVal,
      color || 'indigo',
      summary || null,
      actionItemsJson
    );

    const created = db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({
      message: 'Note created successfully',
      note: formatNote(created)
    });
  } catch (error) {
    console.error('Create note error:', error);
    return res.status(500).json({ error: 'Failed to create note.' });
  }
});

// Update note
router.put('/:id', (req, res) => {
  try {
    const note = db.prepare('SELECT id FROM notes WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found.' });
    }

    const {
      title,
      content,
      category,
      tags,
      is_pinned,
      color,
      summary,
      action_items
    } = req.body;

    const existing = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);

    const updatedTitle = title !== undefined ? title.trim() : existing.title;
    const updatedContent = content !== undefined ? content : existing.content;
    const updatedCategory = category !== undefined ? category.trim() : existing.category;
    const updatedTags = tags !== undefined ? JSON.stringify(tags) : existing.tags;
    const updatedPinned = is_pinned !== undefined ? (is_pinned ? 1 : 0) : existing.is_pinned;
    const updatedColor = color !== undefined ? color : existing.color;
    const updatedSummary = summary !== undefined ? summary : existing.summary;
    const updatedActionItems = action_items !== undefined ? JSON.stringify(action_items) : existing.action_items;

    db.prepare(`
      UPDATE notes
      SET title = ?, content = ?, category = ?, tags = ?, is_pinned = ?, color = ?, summary = ?, action_items = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(
      updatedTitle,
      updatedContent,
      updatedCategory,
      updatedTags,
      updatedPinned,
      updatedColor,
      updatedSummary,
      updatedActionItems,
      req.params.id,
      req.user.id
    );

    const updatedNote = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
    return res.json({
      message: 'Note updated successfully',
      note: formatNote(updatedNote)
    });
  } catch (error) {
    console.error('Update note error:', error);
    return res.status(500).json({ error: 'Failed to update note.' });
  }
});

// Toggle pin status
router.patch('/:id/pin', (req, res) => {
  try {
    const note = db.prepare('SELECT id, is_pinned FROM notes WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found.' });
    }

    const newPinned = note.is_pinned ? 0 : 1;
    db.prepare('UPDATE notes SET is_pinned = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newPinned, req.params.id);

    return res.json({
      message: newPinned ? 'Note pinned' : 'Note unpinned',
      is_pinned: Boolean(newPinned)
    });
  } catch (error) {
    console.error('Pin note error:', error);
    return res.status(500).json({ error: 'Failed to toggle pin state.' });
  }
});

// Toggle or update action items directly
router.patch('/:id/action-items', (req, res) => {
  try {
    const { action_items } = req.body;
    if (!Array.isArray(action_items)) {
      return res.status(400).json({ error: 'action_items must be an array.' });
    }

    db.prepare(`
      UPDATE notes 
      SET action_items = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND user_id = ?
    `).run(JSON.stringify(action_items), req.params.id, req.user.id);

    return res.json({ message: 'Action items updated', action_items });
  } catch (error) {
    console.error('Action items update error:', error);
    return res.status(500).json({ error: 'Failed to update action items.' });
  }
});

// Delete note
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Note not found or already deleted.' });
    }
    return res.json({ message: 'Note deleted successfully', id: Number(req.params.id) });
  } catch (error) {
    console.error('Delete note error:', error);
    return res.status(500).json({ error: 'Failed to delete note.' });
  }
});

module.exports = router;
