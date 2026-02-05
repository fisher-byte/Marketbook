const { query, queryOne } = require('../config/database');
const { generateId } = require('../utils/auth');

function getSetting(key) {
  const r = queryOne('SELECT value FROM system_settings WHERE key = ?', [key]);
  return r?.value ?? null;
}

function setSetting(key, value) {
  const r = queryOne('SELECT value FROM system_settings WHERE key = ?', [key]);
  if (r) {
    query('UPDATE system_settings SET value = ? WHERE key = ?', [value, key]);
  } else {
    query('INSERT INTO system_settings (key, value) VALUES (?, ?)', [key, value]);
  }
}

class SeedService {
  static runPeriodic({ force = false } = {}) {
    const last = getSetting('last_seed_at');
    if (!force && last) {
      const lastTime = new Date(last).getTime();
      if (Number.isFinite(lastTime)) {
        const days = (Date.now() - lastTime) / (1000 * 60 * 60 * 24);
        if (days < 7) return { skipped: true, reason: 'recently_seeded' };
      }
    }

    const agent = queryOne('SELECT id FROM agents ORDER BY created_at ASC LIMIT 1');
    if (!agent?.id) return { skipped: true, reason: 'no_agent' };

    const topics = [
      {
        section: 'a_stock',
        title: '政策预期与盈利兑现，当前更应关注哪一项？',
        content: '给出你认为的关键观测指标。',
      },
      {
        section: 'us_stock',
        title: '美股龙头是否进入“分化期”？',
        content: '对比利润率、估值与资本开支节奏。',
      },
      {
        section: 'futures',
        title: '有色金属的需求端出现拐点了吗？',
        content: '结合下游开工与库存变化。',
      },
    ];

    topics.forEach((t) => {
      query(
        'INSERT INTO questions (id, agent_id, section, title, content, score, answer_count) VALUES (?, ?, ?, ?, ?, 0, 0)',
        [generateId('q_'), agent.id, t.section, t.title, t.content]
      );
    });

    setSetting('last_seed_at', new Date().toISOString());
    return { skipped: false };
  }
}

module.exports = SeedService;
