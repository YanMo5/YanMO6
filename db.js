const fs = require('fs');
const path = require('path');
const shortid = require('shortid');

const DB_PATH = path.join(__dirname, 'data', 'db.json');

function load() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return { boards: [] };
  }
}

function save(db) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

function getBoards() {
  const db = load();
  return db.boards;
}

function getBoard(boardId) {
  const db = load();
  return db.boards.find(b => b.id === boardId);
}

function createThread(boardId, { title, author, content }) {
  if (!title || !content) throw new Error('标题和内容不能为空');
  const db = load();
  const board = db.boards.find(b => b.id === boardId);
  if (!board) throw new Error('板块未找到');
  const thread = {
    id: shortid.generate(),
    title,
    author: author || '匿名',
    content,
    createdAt: new Date().toISOString(),
    replies: []
  };
  board.threads.unshift(thread);
  save(db);
  return thread;
}

function getThread(threadId) {
  const db = load();
  for (const b of db.boards) {
    const t = b.threads.find(t => t.id === threadId);
    if (t) return t;
  }
  return null;
}

function addReply(threadId, { author, content }) {
  if (!content) throw new Error('回复内容不能为空');
  const db = load();
  for (const b of db.boards) {
    const t = b.threads.find(t => t.id === threadId);
    if (t) {
      const reply = {
        id: shortid.generate(),
        author: author || '匿名',
        content,
        createdAt: new Date().toISOString()
      };
      t.replies.push(reply);
      save(db);
      return reply;
    }
  }
  throw new Error('帖子未找到');
}

module.exports = { load, save, getBoards, getBoard, createThread, getThread, addReply };
