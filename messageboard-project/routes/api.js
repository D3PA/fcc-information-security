'use strict';
// In-memory storage (probemos sin DB primero)
let boards = new Map();

// Helper functions
const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 5);

const getBoard = (boardName) => {
  if (!boards.has(boardName)) {
    boards.set(boardName, { threads: new Map() });
  }
  return boards.get(boardName);
};

module.exports = function (app) {
  
  // POST /api/threads/{board} - Create new thread
  app.route('/api/threads/:board')
    .post((req, res) => {
      const board = req.params.board;
      const { text, delete_password } = req.body;
      
      if (!text || !delete_password) {
        return res.status(400).json({ error: 'Text and password required' });
      }
      
      const boardData = getBoard(board);
      const threadId = generateId();
      const now = new Date();
      
      const newThread = {
        _id: threadId,
        text,
        created_on: now,
        bumped_on: now,
        reported: false,
        delete_password,
        replies: []
      };
      
      boardData.threads.set(threadId, newThread);
      
      res.redirect(`/b/${board}/${threadId}`);
    })
    
    // GET /api/threads/{board} - Get recent threads
    .get((req, res) => {
      const board = req.params.board;
      const boardData = getBoard(board);
      
      const threads = Array.from(boardData.threads.values())
        .sort((a, b) => new Date(b.bumped_on) - new Date(a.bumped_on))
        .slice(0, 10)
        .map(thread => ({
          _id: thread._id,
          text: thread.text,
          created_on: thread.created_on,
          bumped_on: thread.bumped_on,
          replies: thread.replies
            .sort((a, b) => new Date(b.created_on) - new Date(a.created_on))
            .slice(0, 3)
            .map(reply => ({
              _id: reply._id,
              text: reply.text,
              created_on: reply.created_on
            }))
        }));
      
      res.json(threads);
    })
    
    // DELETE /api/threads/{board} - Delete thread
    .delete((req, res) => {
      const board = req.params.board;
      const { thread_id, delete_password } = req.body;
      const boardData = getBoard(board);
      
      const thread = boardData.threads.get(thread_id);
      if (!thread) {
        return res.send('thread not found');
      }
      
      if (thread.delete_password !== delete_password) {
        return res.send('incorrect password');
      }
      
      boardData.threads.delete(thread_id);
      res.send('success');
    })
    
    // PUT /api/threads/{board} - Report thread
    .put((req, res) => {
      const board = req.params.board;
      const { thread_id } = req.body;
      const boardData = getBoard(board);
      
      const thread = boardData.threads.get(thread_id);
      if (thread) {
        thread.reported = true;
        res.send('reported');
      } else {
        res.send('thread not found');
      }
    });
    
  // POST /api/replies/{board} - Create reply
  app.route('/api/replies/:board')
    .post((req, res) => {
      const board = req.params.board;
      const { thread_id, text, delete_password } = req.body;
      
      if (!text || !delete_password || !thread_id) {
        return res.status(400).json({ error: 'Thread ID, text and password required' });
      }
      
      const boardData = getBoard(board);
      const thread = boardData.threads.get(thread_id);
      
      if (!thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }
      
      const replyId = generateId();
      const now = new Date();
      
      const newReply = {
        _id: replyId,
        text,
        created_on: now,
        delete_password,
        reported: false
      };
      
      thread.replies.push(newReply);
      thread.bumped_on = now; // Update bump date
      
      res.redirect(`/b/${board}/${thread_id}`);
    })
    
    // GET /api/replies/{board} - Get thread with all replies
    .get((req, res) => {
      const board = req.params.board;
      const { thread_id } = req.query;
      const boardData = getBoard(board);
      
      const thread = boardData.threads.get(thread_id);
      if (!thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }
      
      const responseThread = {
        _id: thread._id,
        text: thread.text,
        created_on: thread.created_on,
        bumped_on: thread.bumped_on,
        replies: thread.replies.map(reply => ({
          _id: reply._id,
          text: reply.text,
          created_on: reply.created_on
        }))
      };
      
      res.json(responseThread);
    })
    
    // DELETE /api/replies/{board} - Delete reply
    .delete((req, res) => {
      const board = req.params.board;
      const { thread_id, reply_id, delete_password } = req.body;
      const boardData = getBoard(board);
      
      const thread = boardData.threads.get(thread_id);
      if (!thread) {
        return res.send('thread not found');
      }
      
      const reply = thread.replies.find(r => r._id === reply_id);
      if (!reply) {
        return res.send('reply not found');
      }
      
      if (reply.delete_password !== delete_password) {
        return res.send('incorrect password');
      }
      
      reply.text = '[deleted]';
      res.send('success');
    })
    
    // PUT /api/replies/{board} - Report reply
    .put((req, res) => {
      const board = req.params.board;
      const { thread_id, reply_id } = req.body;
      const boardData = getBoard(board);
      
      const thread = boardData.threads.get(thread_id);
      if (!thread) {
        return res.send('thread not found');
      }
      
      const reply = thread.replies.find(r => r._id === reply_id);
      if (reply) {
        reply.reported = true;
        res.send('reported');
      } else {
        res.send('reply not found');
      }
    });

};
