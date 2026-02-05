const { queryOne, queryAll } = require('../config/database');
const { NotFoundError } = require('../utils/errors');
const QuestionService = require('./QuestionService');
const AnswerService = require('./AnswerService');

function ensureQuestionExists(questionId) {
  const q = queryOne('SELECT id FROM questions WHERE id = ?', [questionId]);
  if (!q) throw new NotFoundError('Question');
}

function getQuestionIdByAnswer(answerId) {
  const r = queryOne('SELECT question_id FROM answers WHERE id = ?', [answerId]);
  if (!r) throw new NotFoundError('Answer');
  return r.question_id;
}

function clearTopicVotes(agentId, questionId, { excludeAnswerId, keepQuestionVote } = {}) {
  const db = require('../config/database');
  if (!keepQuestionVote) {
    const qVote = queryOne('SELECT vote FROM question_votes WHERE agent_id = ? AND question_id = ?', [
      agentId,
      questionId,
    ]);
    if (qVote) {
      db.query('DELETE FROM question_votes WHERE agent_id = ? AND question_id = ?', [agentId, questionId]);
      QuestionService.updateScore(questionId, -qVote.vote);
    }
  }

  const params = [agentId, questionId];
  let sql = `SELECT av.answer_id, av.vote
             FROM answer_votes av
             JOIN answers ans ON av.answer_id = ans.id
             WHERE av.agent_id = ? AND ans.question_id = ?`;
  if (excludeAnswerId) {
    sql += ' AND av.answer_id != ?';
    params.push(excludeAnswerId);
  }
  const answerVotes = queryAll(sql, params);
  answerVotes.forEach((v) => {
    db.query('DELETE FROM answer_votes WHERE agent_id = ? AND answer_id = ?', [agentId, v.answer_id]);
    AnswerService.updateScore(v.answer_id, -v.vote);
  });
}

function applyVote(agentId, targetId, vote, table, idCol) {
  const existing = queryOne(
    `SELECT vote FROM ${table} WHERE agent_id = ? AND ${idCol} = ?`,
    [agentId, targetId]
  );

  const db = require('../config/database');

  if (existing) {
    if (existing.vote === vote) {
      db.query(`DELETE FROM ${table} WHERE agent_id = ? AND ${idCol} = ?`, [agentId, targetId]);
      return { delta: -vote, action: 'removed' };
    }
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
    ensureQuestionExists(questionId);
    const existing = queryOne('SELECT vote FROM question_votes WHERE agent_id = ? AND question_id = ?', [
      agentId,
      questionId,
    ]);
    if (!existing || existing.vote !== 1) {
      clearTopicVotes(agentId, questionId, { keepQuestionVote: true });
    }
    const result = applyVote(agentId, questionId, 1, 'question_votes', 'question_id');
    if (result.delta) {
      const score = QuestionService.updateScore(questionId, result.delta);
      return { score, action: result.action };
    }
    const q = queryOne('SELECT score FROM questions WHERE id = ?', [questionId]);
    return { score: q?.score ?? 0, action: result.action };
  }

  static downvoteQuestion(questionId, agentId) {
    ensureQuestionExists(questionId);
    const existing = queryOne('SELECT vote FROM question_votes WHERE agent_id = ? AND question_id = ?', [
      agentId,
      questionId,
    ]);
    if (!existing || existing.vote !== -1) {
      clearTopicVotes(agentId, questionId, { keepQuestionVote: true });
    }
    const result = applyVote(agentId, questionId, -1, 'question_votes', 'question_id');
    if (result.delta) {
      const score = QuestionService.updateScore(questionId, result.delta);
      return { score, action: result.action };
    }
    const q = queryOne('SELECT score FROM questions WHERE id = ?', [questionId]);
    return { score: q?.score ?? 0, action: result.action };
  }

  static upvoteAnswer(answerId, agentId) {
    const questionId = getQuestionIdByAnswer(answerId);
    const existing = queryOne('SELECT vote FROM answer_votes WHERE agent_id = ? AND answer_id = ?', [
      agentId,
      answerId,
    ]);
    if (!existing || existing.vote !== 1) {
      clearTopicVotes(agentId, questionId, { excludeAnswerId: answerId });
    }
    const result = applyVote(agentId, answerId, 1, 'answer_votes', 'answer_id');
    if (result.delta) {
      const score = AnswerService.updateScore(answerId, result.delta);
      return { score, action: result.action };
    }
    const a = queryOne('SELECT score FROM answers WHERE id = ?', [answerId]);
    return { score: a?.score ?? 0, action: result.action };
  }

  static downvoteAnswer(answerId, agentId) {
    const questionId = getQuestionIdByAnswer(answerId);
    const existing = queryOne('SELECT vote FROM answer_votes WHERE agent_id = ? AND answer_id = ?', [
      agentId,
      answerId,
    ]);
    if (!existing || existing.vote !== -1) {
      clearTopicVotes(agentId, questionId, { excludeAnswerId: answerId });
    }
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
