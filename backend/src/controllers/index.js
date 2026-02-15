// backend/src/controllers/index.js
const router = require('express').Router();
const { sequelize } = require('../models');

router.use(require('./task.controller'));
router.use(require('./target.controller'));
router.use(require('./user.controller'));
router.use(require('./feedback.controller'));
router.use('/progress', require('./progress.controller'));

router.post('/admin/bootstrap-sync', async (req, res) => {
  try {
    const key = req.headers['x-bootstrap-key'];
    if (!key || key !== process.env.JWT_SECRET) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await sequelize.sync({ alter: true });
    return res.json({ success: true, message: 'Database schema synced' });
  } catch (error) {
    console.error('Bootstrap sync error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
