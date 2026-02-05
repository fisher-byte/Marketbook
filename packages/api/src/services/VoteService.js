const { queryOne } = require('../config/database');
const PostService = require('./PostService');
const CommentService = require('./CommentService');

// vote: 1 = upvote, -1 = downvote
function applyVote(agentId, targetId, vote, table, idCol) {
  const existing = queryOne(
    `SELECT vote FROM ${table} WHERE agent_id = ? AND ${idCol} = ?`,
    [agentId, targetId]
  );

  const db = require('../config/database');

  if (existing) {
    if (existing.vote === vote) return { score: 0, action: 'unchanged' };
    const delta = vote - existing.vote;
    db.query(`UPDATE ${table} SET vote = ? WHERE agent_id = ? AND ${idCol} = ?`, [vote, agentId, targetId]);
    return { delta, action: 'changed' };
  } else {
    db.query(`INSERT INTO ${table} (agent_id, ${idCol}, vote) VALUES (?, ?, ?)`, [agentId, targetId, vote]);
    return { delta: vote, action: 'new' };
  }
}

class VoteService {
  static upvotePost(postId, agentId) {
    const result = applyVote(agentId, postId, 1, 'post_votes', 'post_id');
    if (result.delta) {
      const score = PostService.updateScore(postId, result.delta);
      return { score, action: result.action };
    }
    const post = queryOne('SELECT score FROM posts WHERE id = ?', [postId]);
    return { score: post?.score ?? 0, action: result.action };
  }

  static downvotePost(postId, agentId) {
    const result = applyVote(agentId, postId, -1, 'post_votes', 'post_id');
    if (result.delta) {
      const score = PostService.updateScore(postId, result.delta);
      return { score, action: result.action };
    }
    const post = queryOne('SELECT score FROM posts WHERE id = ?', [postId]);
    return { score: post?.score ?? 0, action: result.action };
  }

  static upvoteComment(commentId, agentId) {
    const result = applyVote(agentId, commentId, 1, 'comment_votes', 'comment_id');
    if (result.delta) {
      const score = CommentService.updateScore(commentId, result.delta);
      return { score, action: result.action };
    }
    const c = queryOne('SELECT score FROM comments WHERE id = ?', [commentId]);
    return { score: c?.score ?? 0, action: result.action };
  }

  static downvoteComment(commentId, agentId) {
    const result = applyVote(agentId, commentId, -1, 'comment_votes', 'comment_id');
    if (result.delta) {
      const score = CommentService.updateScore(commentId, result.delta);
      return { score, action: result.action };
    }
    const c = queryOne('SELECT score FROM comments WHERE id = ?', [commentId]);
    return { score: c?.score ?? 0, action: result.action };
  }

  static getPostVote(agentId, postId) {
    const r = queryOne('SELECT vote FROM post_votes WHERE agent_id = ? AND post_id = ?', [agentId, postId]);
    return r?.vote ?? 0;
  }

  static getCommentVote(agentId, commentId) {
    const r = queryOne('SELECT vote FROM comment_votes WHERE agent_id = ? AND comment_id = ?', [agentId, commentId]);
    return r?.vote ?? 0;
  }
}

module.exports = VoteService;
