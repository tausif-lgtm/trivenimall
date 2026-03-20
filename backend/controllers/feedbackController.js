const db = require('../config/db');

// POST submit feedback (public - no auth)
exports.submitFeedback = async (req, res) => {
  try {
    const {
      name, mobile, visit_category,
      rating_overall, rating_cleanliness, rating_ac, rating_lighting, rating_ambience, rating_toilet,
      brands_requested
    } = req.body;

    // Validate ratings 1-5
    const ratings = [rating_overall, rating_cleanliness, rating_ac, rating_lighting, rating_ambience, rating_toilet];
    for (const r of ratings) {
      if (r !== undefined && (r < 1 || r > 5)) {
        return res.status(400).json({ success: false, message: 'Ratings must be between 1 and 5.' });
      }
    }

    await db.query(
      `INSERT INTO feedback (name, mobile, visit_category, rating_overall, rating_cleanliness, rating_ac, rating_lighting, rating_ambience, rating_toilet, brands_requested)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name || null,
        mobile || null,
        visit_category || 'Shopping',
        rating_overall || 5,
        rating_cleanliness || 5,
        rating_ac || 5,
        rating_lighting || 5,
        rating_ambience || 5,
        rating_toilet || 5,
        brands_requested || null
      ]
    );
    res.status(201).json({ success: true, message: 'Thank you for your feedback!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET all feedback (admin)
exports.getFeedback = async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    let sql = 'SELECT * FROM feedback WHERE 1=1';
    const params = [];
    if (from_date) { sql += ' AND DATE(created_at) >= ?'; params.push(from_date); }
    if (to_date) { sql += ' AND DATE(created_at) <= ?'; params.push(to_date); }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET feedback analytics (averages + brand keywords)
exports.getFeedbackAnalytics = async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    const dateFilter = from_date && to_date ? 'WHERE DATE(created_at) BETWEEN ? AND ?' : '';
    const params = from_date && to_date ? [from_date, to_date] : [];

    const [avgs] = await db.query(
      `SELECT
         COUNT(*) AS total_responses,
         ROUND(AVG(rating_overall), 1) AS avg_overall,
         ROUND(AVG(rating_cleanliness), 1) AS avg_cleanliness,
         ROUND(AVG(rating_ac), 1) AS avg_ac,
         ROUND(AVG(rating_lighting), 1) AS avg_lighting,
         ROUND(AVG(rating_ambience), 1) AS avg_ambience,
         ROUND(AVG(rating_toilet), 1) AS avg_toilet
       FROM feedback ${dateFilter}`,
      params
    );
    const [byCategory] = await db.query(
      `SELECT visit_category, COUNT(*) AS count FROM feedback ${dateFilter} GROUP BY visit_category`, params
    );
    const [brandRows] = await db.query(
      `SELECT brands_requested FROM feedback ${dateFilter}${dateFilter ? ' AND' : ' WHERE'} brands_requested IS NOT NULL`, params
    );

    // Simple keyword frequency
    const brandMap = {};
    brandRows.forEach(row => {
      const words = row.brands_requested.toLowerCase().split(/[\s,;\/\n]+/);
      words.forEach(w => {
        w = w.trim();
        if (w.length > 2) brandMap[w] = (brandMap[w] || 0) + 1;
      });
    });
    const topBrands = Object.entries(brandMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([brand, count]) => ({ brand, count }));

    res.json({ success: true, data: { averages: avgs[0], by_category: byCategory, top_brands: topBrands } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
