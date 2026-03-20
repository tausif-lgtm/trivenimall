const db = require('../config/db');
const { parseUploadedFile } = require('../utils/parseUpload');

// GET sales list
exports.getSales = async (req, res) => {
  try {
    const { store_id, from_date, to_date } = req.query;
    let sql = `
      SELECT s.*, st.store_name, st.category, u.name AS entered_by_name
      FROM sales s
      JOIN stores st ON s.store_id = st.id
      JOIN users u ON s.entered_by = u.id
      WHERE 1=1
    `;
    const params = [];
    if (store_id) { sql += ' AND s.store_id = ?'; params.push(store_id); }
    if (from_date) { sql += ' AND s.sale_date >= ?'; params.push(from_date); }
    if (to_date) { sql += ' AND s.sale_date <= ?'; params.push(to_date); }
    sql += ' ORDER BY s.sale_date DESC, st.store_name ASC';
    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET summary + analytics
exports.getSalesSummary = async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    const dateFilter = from_date && to_date ? 'WHERE sale_date BETWEEN ? AND ?' : '';
    const params = from_date && to_date ? [from_date, to_date] : [];

    const [[mallTotal]] = await db.query(
      `SELECT COALESCE(SUM(revenue), 0) AS total, COALESCE(SUM(cash_amount), 0) AS cash_total, COALESCE(SUM(online_amount), 0) AS online_total FROM sales ${dateFilter}`, params
    );
    const subFilter = from_date && to_date ? 'WHERE s2.sale_date BETWEEN ? AND ?' : '';
    const [byStore] = await db.query(
      `SELECT st.store_name, MAX(COALESCE(s.outlet_type, st.category)) AS outlet_type, st.category,
              COALESCE(SUM(s.revenue), 0) AS total,
              ROUND(COALESCE(SUM(s.revenue),0)*100.0/NULLIF((SELECT SUM(revenue) FROM sales s2 ${subFilter}),0),1) AS pct
       FROM stores st
       LEFT JOIN sales s ON st.id = s.store_id ${from_date && to_date ? 'AND s.sale_date BETWEEN ? AND ?' : ''}
       WHERE st.is_active = 1
       GROUP BY st.id, st.store_name, st.category ORDER BY total DESC`,
      from_date && to_date ? [...params, ...params] : []
    );
    const [daily] = await db.query(
      `SELECT sale_date, SUM(revenue) AS total, SUM(cash_amount) AS cash, SUM(online_amount) AS online FROM sales ${dateFilter} GROUP BY sale_date ORDER BY sale_date ASC`, params
    );
    const [byCategory] = await db.query(
      `SELECT st.category, COALESCE(SUM(s.revenue),0) AS total
       FROM sales s JOIN stores st ON s.store_id = st.id
       ${from_date && to_date ? 'WHERE s.sale_date BETWEEN ? AND ?' : ''}
       GROUP BY st.category ORDER BY total DESC`, params
    );

    // Period comparison
    const fmt = (d) => d.toISOString().split('T')[0];
    const getPeriodTotal = async (date) => {
      const [[r]] = await db.query(`SELECT COALESCE(SUM(revenue),0) AS total FROM sales WHERE sale_date = ?`, [fmt(date)]);
      return r.total;
    };
    let periodComparison = null;
    if (from_date) {
      const d = new Date(from_date);
      const y = new Date(d); y.setDate(y.getDate() - 1);
      const lw = new Date(d); lw.setDate(lw.getDate() - 7);
      const lm = new Date(d); lm.setDate(lm.getDate() - 30);
      const [yt, lwt, lmt] = await Promise.all([getPeriodTotal(y), getPeriodTotal(lw), getPeriodTotal(lm)]);
      const cur = Number(mallTotal.total);
      const pct = (c) => c > 0 ? Math.round((cur - c) / c * 100) : 0;
      periodComparison = {
        yesterday: { total: yt, date: fmt(y), pct: pct(yt) },
        last_week: { total: lwt, date: fmt(lw), pct: pct(lwt) },
        last_month: { total: lmt, date: fmt(lm), pct: pct(lmt) },
      };
    }
    res.json({ success: true, data: { mall_total: mallTotal.total, cash_total: mallTotal.cash_total, online_total: mallTotal.online_total, by_store: byStore, daily, by_category: byCategory, period_comparison: periodComparison } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST upsert single entry
exports.upsertSales = async (req, res) => {
  try {
    const { store_id, outlet_type, sale_date, revenue, cash_amount, online_amount, notes } = req.body;
    if (!store_id || !sale_date)
      return res.status(400).json({ success: false, message: 'store_id and sale_date required.' });
    const cashAmt = parseFloat(cash_amount) || 0;
    const onlineAmt = parseFloat(online_amount) || 0;
    const totalRevenue = (cash_amount !== undefined || online_amount !== undefined)
      ? cashAmt + onlineAmt
      : parseFloat(revenue) || 0;
    await db.query(
      `INSERT INTO sales (store_id, outlet_type, sale_date, revenue, cash_amount, online_amount, notes, entered_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE outlet_type=VALUES(outlet_type), revenue=VALUES(revenue), cash_amount=VALUES(cash_amount), online_amount=VALUES(online_amount), notes=VALUES(notes), entered_by=VALUES(entered_by)`,
      [store_id, outlet_type || null, sale_date, totalRevenue, cashAmt, onlineAmt, notes || null, req.user.id]
    );
    res.json({ success: true, message: 'Sales entry saved.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST bulk upload — CSV or Excel
// Columns: Type | Name of Outlet | Sale Date | Sale Amount
exports.bulkUpload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });

    const rows = parseUploadedFile(req.file.buffer, req.file.mimetype, req.file.originalname);
    if (!rows.length) return res.status(400).json({ success: false, message: 'Empty file.' });

    // Load stores for name→id mapping
    const [stores] = await db.query('SELECT id, store_name FROM stores');
    const storeMap = {};
    stores.forEach(s => { storeMap[s.store_name.toLowerCase().trim()] = s.id; });

    // Skip header row if first cell looks like text header
    const dataRows = rows.filter(r => {
      const first = String(r[0] || '').toLowerCase().trim();
      return first && first !== 'type' && first !== 'outlet_type' && first !== '#';
    });

    let inserted = 0, errors = [];

    for (const r of dataRows) {
      // Support formats:
      // 3-col: store_name, date, revenue
      // 4-col: type, store_name, date, revenue  OR  store_name, date, cash, online
      // 5-col: type, store_name, date, cash, online
      let outlet_type, store_ref, sale_date, cash_str, online_str, revenue_str;

      if (r.length >= 5) {
        [outlet_type, store_ref, sale_date, cash_str, online_str] = r;
      } else if (r.length === 4) {
        // Detect: if col4 looks like it could be cash (has paired col5) — treat as type,store,date,revenue
        [outlet_type, store_ref, sale_date, revenue_str] = r;
      } else {
        [store_ref, sale_date, revenue_str] = r;
      }

      // Handle Excel date objects
      if (sale_date instanceof Date) {
        const y = sale_date.getFullYear();
        const m = String(sale_date.getMonth() + 1).padStart(2, '0');
        const d = String(sale_date.getDate()).padStart(2, '0');
        sale_date = `${y}-${m}-${d}`;
      } else {
        sale_date = String(sale_date || '').trim();
        // Convert DD-MM-YYYY → YYYY-MM-DD
        const dmyMatch = sale_date.match(/^(\d{2})-(\d{2})-(\d{4})$/);
        if (dmyMatch) sale_date = `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
        // Convert DD/MM/YYYY → YYYY-MM-DD
        const dmySlash = sale_date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (dmySlash) sale_date = `${dmySlash[3]}-${dmySlash[2]}-${dmySlash[1]}`;
      }

      const parseAmt = (v) => parseFloat(String(v || '0').replace(/[₹,\s]/g, '')) || 0;
      const cashAmt = parseAmt(cash_str);
      const onlineAmt = parseAmt(online_str);
      const revenue = (cash_str !== undefined && online_str !== undefined)
        ? cashAmt + onlineAmt
        : parseAmt(revenue_str);

      store_ref = String(store_ref || '').trim();

      if (!store_ref || !sale_date || isNaN(revenue)) { errors.push(`Bad row: ${r.join(',')}`); continue; }

      let store_id = parseInt(store_ref);
      if (isNaN(store_id)) {
        store_id = storeMap[store_ref.toLowerCase()];
        if (!store_id) { errors.push(`Store not found: "${store_ref}"`); continue; }
      }

      try {
        await db.query(
          `INSERT INTO sales (store_id, outlet_type, sale_date, revenue, cash_amount, online_amount, notes, entered_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE outlet_type=VALUES(outlet_type), revenue=VALUES(revenue), cash_amount=VALUES(cash_amount), online_amount=VALUES(online_amount), entered_by=VALUES(entered_by)`,
          [store_id, outlet_type || null, sale_date, revenue, cashAmt, onlineAmt, 'Bulk upload', req.user.id]
        );
        inserted++;
      } catch (e) { errors.push(`Insert failed: ${r.join(',')}`); }
    }

    res.json({ success: true, message: `${inserted} of ${dataRows.length} rows inserted.`, errors: errors.slice(0, 10) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET sample file download
exports.downloadSample = async (req, res) => {
  try {
    const XLSX = require('xlsx');
    const data = [
      ['Type', 'Name of Outlet', 'Sale Date', 'Cash Amount', 'Online Amount'],
      ['Food & Beverage', 'Dominos Pizza', '2026-03-16', 25000, 20000],
      ['Fashion & Apparel', 'H&M', '2026-03-16', 70000, 50000],
      ['Fashion & Apparel', 'Zara', '2026-03-16', 60000, 35000],
      ['Entertainment', 'Cinemax', '2026-03-16', 150000, 50000],
      ['Electronics', 'Samsung Store', '2026-03-16', 40000, 35000],
      ['Food & Beverage', 'Food Court', '2026-03-16', 55000, 25000],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 22 }, { wch: 22 }, { wch: 14 }, { wch: 16 }, { wch: 16 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales Data');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="Sales_Sample.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE
exports.deleteSales = async (req, res) => {
  try {
    await db.query('DELETE FROM sales WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Entry deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
