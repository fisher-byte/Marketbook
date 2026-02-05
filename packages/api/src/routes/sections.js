const { Router } = require('express');
const { success } = require('../utils/response');
const SectionService = require('../services/SectionService');

const router = Router();

router.get('/', (req, res) => {
  success(res, { sections: SectionService.getAll() });
});

module.exports = router;
