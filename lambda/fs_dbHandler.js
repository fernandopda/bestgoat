const createConnection = require("./db");
require("dotenv").config();

let connectionPool;  // Global pool for reuse

// Main handler for DB operations
exports.handler = async (event) => {
  // event = { action: 'insertIfNotExists', data: { videoId, title, ... } }

  const { action, data } = event;

  if (action !== 'insertIfNotExists' || !data) {
    return { statusCode: 400, body: { message: 'Invalid action or data' } };
  }

  try {
    // Create or reuse the pool
    if (!connectionPool) {
      connectionPool = await createConnection();  // Assume this returns a mysql2 promise pool
    }

    // Check if video already exists
    const [existing] = await connectionPool.query('SELECT id FROM suggestions WHERE video_id = ?', [data.videoId]);

    if (existing.length > 0) {
      return { statusCode: 200, body: { inserted: false, message: 'Duplicate video' } };
    }

    // Insert new suggestion
    await connectionPool.query(
      'INSERT INTO suggestions (video_id, title, description, url, thumbnail_url, views, likes, comment_count, score, ai_reason, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [data.videoId, data.title, data.description, data.url, data.thumbnail_url, data.views, data.likes, data.comment_count, data.score, data.ai_reason, 'pending']
    );

    return { statusCode: 200, body: { inserted: true, message: 'Suggestion added' } };
  } catch (err) {
    console.error('DB error:', err);
    return { statusCode: 500, body: { message: 'DB error', error: err.message } };
  }  // No finally or end() - keep pool open for reuse
};