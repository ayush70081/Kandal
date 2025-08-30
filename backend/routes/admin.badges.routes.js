// Badges management removed per new requirements (badges auto-derived from points)
const express = require('express');
const router = express.Router();
router.get('/', (req, res) => {
  res.status(410).json({ success: false, message: 'Badge management has been removed; badges are auto-derived from points.' });
});
module.exports = router;


