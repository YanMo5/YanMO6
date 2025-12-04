const fs = require('fs');
const path = require('path');
const shortid = require('shortid');
const { Octokit } = require('octokit');

const DB_PATH = path.join(__dirname, 'data', 'db.json');
let inMemoryDb = null;
let lastSavedTime = 0;
const SAVE_INTERVAL = 10000; // Save to GitHub every 10 seconds

// GitHub API client
const octokit = process.env.GITHUB_TOKEN ? new Octokit({ auth: process.env.GITHUB_TOKEN }) : null;
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'YanMo5';
const GITHUB_REPO = process.env.GITHUB_REPO || 'YanMO6';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

function load() {
  // First try to load from memory (fast, for multiple calls in same request)
  if (inMemoryDb) return inMemoryDb;
  
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    inMemoryDb = JSON.parse(raw);
    return inMemoryDb;
  } catch (e) {
    inMemoryDb = { boards: [] };
    return inMemoryDb;
  }
}

async function saveToGitHub(db) {
  if (!octokit) {
    console.warn('GITHUB_TOKEN not set, skipping GitHub save');
    return;
  }
  
  try {
    const content = JSON.stringify(db, null, 2);
    const file_path = 'data/db.json';
    
    // Get current file SHA (needed for update)
    let sha;
    try {
      const response = await octokit.rest.repos.getContent({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        path: file_path,
        ref: GITHUB_BRANCH
      });
      sha = response.data.sha;
    } catch (e) {
      // File doesn't exist yet, create it
      sha = undefined;
    }
    
    const encodedContent = Buffer.from(content).toString('base64');
    const timestamp = new Date().toISOString();
    
    if (sha) {
      // Update existing file
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        path: file_path,
        message: `Auto-save data at ${timestamp}`,
        content: encodedContent,
        sha: sha,
        branch: GITHUB_BRANCH
      });
    } else {
      // Create new file
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        path: file_path,
        message: `Initialize data at ${timestamp}`,
        content: encodedContent,
        branch: GITHUB_BRANCH
      });
    }
    
    console.log('Data saved to GitHub:', file_path);
    lastSavedTime = Date.now();
  } catch (err) {
    console.error('Failed to save to GitHub:', err.message);
  }
}

function save(db) {
  // Save to local file system immediately
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  inMemoryDb = db;
  
  // Save to GitHub asynchronously (don't wait)
  const now = Date.now();
  if (now - lastSavedTime > SAVE_INTERVAL) {
    saveToGitHub(db).catch(err => console.error('GitHub save error:', err));
  }
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
