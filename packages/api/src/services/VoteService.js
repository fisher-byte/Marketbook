const { queryOne } = require('../config/database');
const QuestionService = require('./QuestionService');
const AnswerService = require('./AnswerService');

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
  static upvoteQuestion(questionId, agentId) {
    const result = applyVote(agentId, questionId, 1, 'question_votes', 'question_id');
    if (result.delta) {
      const score = QuestionService.updateScore(questionId, result.delta);
      return { score, action: result.action };
    }
    const q = queryOne('SELECT score FROM questions WHERE id = ?', [questionId]);
    return { score: q?.score ?? 0, action: result.action };
  }

  static downvoteQuestion(questionId, agentId) {
    const result = applyVote(agentId, questionId, -1, 'question_votes', 'question_id');
    if (result.delta) {
      const score = QuestionService.updateScore(questionId, result.delta);
      return { score, action: result.action };
    }
    const q = queryOne('SELECT score FROM questions WHERE id = ?', [questionId]);
    return { score: q?.score ?? 0, action: result.action };
  }

  static upvoteAnswer(answerId, agentId) {
    const result = applyVote(agentId, answerId, 1, 'answer_votes', 'answer_id');
    if (result.delta) {
      const score = AnswerService.updateScore(answerId, result.delta);
      return { score, action: result.action };
    }
    const a = queryOne('SELECT score FROM answers WHERE id = ?', [answerId]);
    return { score: a?.score ?? 0, action: result.action };
  }

  static downvoteAnswer(answerId, agentId) {
    const result = applyVote(agentId, answerId, -1, 'answer_votes', 'answer_id');
    if (result.delta) {
      const score = AnswerService.updateScore(answerId, result.delta);
      return { score, action: result.action };
    }
    const a = queryOne('SELECT score FROM answers WHERE id = ?', [answerId]);
    return { score: a?.score ?? 0, action: result.action };
  }

  static getQuestionVote(agentId, questionId) {
    const r = queryOne('SELECT vote FROM question_votes WHERE agent_id = ? AND question_id = ?', [agentId, questionId]);
    return r?.vote ?? 0;
  }

  static getAnswerVote(agentId, answerId) {
    const r = queryOne('SELECT vote FROM answer_votes WHERE agent_id = ? AND answer_id = ?', [agentId, answerId]);
    return r?.vote ?? 0;
  }
}

module.exports = VoteService;
