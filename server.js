const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const db = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  const boards = db.getBoards();
  res.render('index', { boards });
});

app.get('/board/:boardId', (req, res) => {
  const board = db.getBoard(req.params.boardId);
  if (!board) return res.status(404).send('板块未找到');
  res.render('board', { board });
});

app.get('/board/:boardId/new', (req, res) => {
  const board = db.getBoard(req.params.boardId);
  if (!board) return res.status(404).send('板块未找到');
  res.render('newThread', { board });
});

app.post('/board/:boardId/new', (req, res) => {
  const boardId = req.params.boardId;
  const { title, author, content } = req.body;
  try {
    const thread = db.createThread(boardId, { title, author, content });
    res.redirect(`/thread/${thread.id}`);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

app.get('/thread/:threadId', (req, res) => {
  const thread = db.getThread(req.params.threadId);
  if (!thread) return res.status(404).send('帖子未找到');
  res.render('thread', { thread });
});

app.post('/thread/:threadId/reply', (req, res) => {
  const threadId = req.params.threadId;
  const { author, content } = req.body;
  try {
    db.addReply(threadId, { author, content });
    res.redirect(`/thread/${threadId}`);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Tieba clone running at http://localhost:${PORT}`);
  });
}
