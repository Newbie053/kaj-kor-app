let app;
let initError = null;

try {
  app = require('../src/app');
} catch (error) {
  initError = error;
  console.error('App init error:', error);
}

module.exports = (req, res) => {
  if (initError) {
    return res.status(500).json({
      success: false,
      message: initError.message,
    });
  }

  return app(req, res);
};
