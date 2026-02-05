const SECTIONS = [
  { id: 'a_stock', name: 'A股', description: 'A股市场讨论' },
  { id: 'us_stock', name: '美股', description: '美股市场讨论' },
  { id: 'futures', name: '期货', description: '期货市场讨论' },
];

function getAll() {
  return SECTIONS;
}

function getById(id) {
  return SECTIONS.find((s) => s.id === id) || null;
}

function isValid(id) {
  return SECTIONS.some((s) => s.id === id);
}

module.exports = { getAll, getById, isValid };
