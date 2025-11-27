const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  this.timeout(10000);
  let reportThreadId;
  let replyThreadId;
  let deleteThreadId;

  // Test 1: Creating a new thread
  test('Creating a new thread: POST request to /api/threads/{board}', function(done) {
    chai.request(server)
      .post('/api/threads/test')
      .send({
        text: 'Test thread 1',
        delete_password: 'pass1'
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        done();
      });
  });

  // Test 2: Viewing the 10 most recent threads with 3 replies each
  test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', function(done) {
    chai.request(server)
      .get('/api/threads/test')
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        done();
      });
  });

  // Test 3: Deleting a thread with the incorrect password
  test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board}', function(done) {
    // First create a thread to delete
    chai.request(server)
      .post('/api/threads/test')
      .send({
        text: 'Thread for wrong password test',
        delete_password: 'correctpass'
      })
      .end(function(err, res) {
        const threadId = res.redirects[0]?.split('/').pop();
        chai.request(server)
          .delete('/api/threads/test')
          .send({
            thread_id: threadId,
            delete_password: 'wrongpass'
          })
          .end(function(err, res) {
            assert.equal(res.text, 'incorrect password');
            done();
          });
      });
  });

  // Test 4: Deleting a thread with the correct password
  test('Deleting a thread with the correct password: DELETE request to /api/threads/{board}', function(done) {
    chai.request(server)
      .post('/api/threads/test')
      .send({
        text: 'Thread for correct password test',
        delete_password: 'deletepass'
      })
      .end(function(err, res) {
        const threadId = res.redirects[0]?.split('/').pop();
        chai.request(server)
          .delete('/api/threads/test')
          .send({
            thread_id: threadId,
            delete_password: 'deletepass'
          })
          .end(function(err, res) {
            assert.equal(res.text, 'success');
            done();
          });
      });
  });

  // Test 5: Reporting a thread
  test('Reporting a thread: PUT request to /api/threads/{board}', function(done) {
    chai.request(server)
      .post('/api/threads/test')
      .send({
        text: 'Thread for reporting',
        delete_password: 'reportpass'
      })
      .end(function(err, res) {
        reportThreadId = res.redirects[0]?.split('/').pop();
        chai.request(server)
          .put('/api/threads/test')
          .send({
            thread_id: reportThreadId
          })
          .end(function(err, res) {
            assert.equal(res.text, 'reported');
            done();
          });
      });
  });

  // Test 6: Creating a new reply
  test('Creating a new reply: POST request to /api/replies/{board}', function(done) {
    chai.request(server)
      .post('/api/threads/test')
      .send({
        text: 'Thread for reply test',
        delete_password: 'threadpass'
      })
      .end(function(err, res) {
        replyThreadId = res.redirects[0]?.split('/').pop();
        chai.request(server)
          .post('/api/replies/test')
          .send({
            thread_id: replyThreadId,
            text: 'Test reply',
            delete_password: 'replypass'
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            done();
          });
      });
  });

  // Test 7: Viewing a single thread with all replies
  test('Viewing a single thread with all replies: GET request to /api/replies/{board}', function(done) {
    chai.request(server)
      .get('/api/replies/test')
      .query({ thread_id: replyThreadId })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.property(res.body, 'replies');
        done();
      });
  });

  // Test 8: Deleting a reply with the incorrect password
  test('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board}', function(done) {
    // First create a thread and reply
    chai.request(server)
      .post('/api/threads/test')
      .send({
        text: 'Thread for reply deletion test',
        delete_password: 'threadpass2'
      })
      .end(function(err, res) {
        const threadId = res.redirects[0]?.split('/').pop();
        chai.request(server)
          .post('/api/replies/test')
          .send({
            thread_id: threadId,
            text: 'Reply to delete with wrong pass',
            delete_password: 'correctreplypass'
          })
          .end(function(err, res) {
            chai.request(server)
              .get('/api/replies/test')
              .query({ thread_id: threadId })
              .end(function(err, res) {
                const replyId = res.body.replies[0]._id;
                chai.request(server)
                  .delete('/api/replies/test')
                  .send({
                    thread_id: threadId,
                    reply_id: replyId,
                    delete_password: 'wrongreplypass'
                  })
                  .end(function(err, res) {
                    assert.equal(res.text, 'incorrect password');
                    done();
                  });
              });
          });
      });
  });

  // Test 9: Deleting a reply with the correct password
  test('Deleting a reply with the correct password: DELETE request to /api/replies/{board}', function(done) {
    chai.request(server)
      .post('/api/threads/test')
      .send({
        text: 'Thread for correct reply deletion',
        delete_password: 'threadpass3'
      })
      .end(function(err, res) {
        const threadId = res.redirects[0]?.split('/').pop();
        chai.request(server)
          .post('/api/replies/test')
          .send({
            thread_id: threadId,
            text: 'Reply to delete with correct pass',
            delete_password: 'deletecorrectpass'
          })
          .end(function(err, res) {
            chai.request(server)
              .get('/api/replies/test')
              .query({ thread_id: threadId })
              .end(function(err, res) {
                const replyId = res.body.replies[0]._id;
                chai.request(server)
                  .delete('/api/replies/test')
                  .send({
                    thread_id: threadId,
                    reply_id: replyId,
                    delete_password: 'deletecorrectpass'
                  })
                  .end(function(err, res) {
                    assert.equal(res.text, 'success');
                    done();
                  });
              });
          });
      });
  });

  // Test 10: Reporting a reply
  test('Reporting a reply: PUT request to /api/replies/{board}', function(done) {
    chai.request(server)
      .post('/api/threads/test')
      .send({
        text: 'Thread for reply reporting',
        delete_password: 'threadpass4'
      })
      .end(function(err, res) {
        const threadId = res.redirects[0]?.split('/').pop();
        chai.request(server)
          .post('/api/replies/test')
          .send({
            thread_id: threadId,
            text: 'Reply to report',
            delete_password: 'reportreplypass'
          })
          .end(function(err, res) {
            chai.request(server)
              .get('/api/replies/test')
              .query({ thread_id: threadId })
              .end(function(err, res) {
                const replyId = res.body.replies[0]._id;
                chai.request(server)
                  .put('/api/replies/test')
                  .send({
                    thread_id: threadId,
                    reply_id: replyId
                  })
                  .end(function(err, res) {
                    assert.equal(res.text, 'reported');
                    done();
                  });
              });
          });
      });
  });

});