const { Feedback } = require('../models');

const create = async (req, res) => {
  try {
    const { message, source } = req.body;
    const trimmedMessage = String(message || '').trim();

    if (!trimmedMessage) {
      return res.status(400).json({ success: false, message: 'Feedback message is required' });
    }

    const feedback = await Feedback.create({
      userId: req.userId,
      message: trimmedMessage,
      source: source || 'mobile',
    });

    res.status(201).json({ success: true, result: feedback });
  } catch (error) {
    console.error('Feedback create error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  create,
};
