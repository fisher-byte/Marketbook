function success(res, data) {
  res.json(data);
}

function created(res, data) {
  res.status(201).json(data);
}

function noContent(res) {
  res.status(204).send();
}

function paginated(res, items, { limit, offset }) {
  res.json({ posts: items, limit, offset });
}

module.exports = { success, created, noContent, paginated };
