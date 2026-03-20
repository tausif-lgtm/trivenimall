const db = require('../config/db');
const { parseUploadedFile } = require('../utils/parseUpload');

// GET footfall list
exports.getFootfall = async (req, res) => {
  try {
    const { source, gate_name, from_date, to_date } = req.query;
    let sql = `
      SELECT f.*, u.name AS entered_by_name, COALESCE(s.store_name, '') AS store_name
      FROM footfall f
      JOIN users u ON f.entered_by = u.id
      LEFT JOIN stores s ON f.store_id = s.id
      WHERE 1=1
    `;
    const params = [];
    if (source) { sql += ' AND f.source = ?'; params.push(source); }
    if (gate_name) { sql += ' AND f.gate_name = ?'; params.push(gate_name); }
    if (from_date) { sql += ' AND f.footfall_date >= ?'; params.push(from_date); }
    if (to_date) { sql += ' AND f.footfall_date <= ?'; params.push(to_date); }
    sql += ' ORDER BY f.footfall_date DESC, f.time_slot ASC';
    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET analytics
exports.getFootfallAnalytics = async (req, res) => {
  try {
    const { from_date, to_date, gate_name } = req.query;
    if (!from_date || !to_date)
      return res.status(400).json({ success: false, message: 'from_date and to_date required.' });

    let baseWhere = 'WHERE footfall_date BETWEEN ? AND ?';
    let baseParams = [from_date, to_date];
    if (gate_name) { baseWhere += ' AND gate_name = ?'; baseParams.push(gate_name); }

    const [[totals]] = await db.query(`SELECT COALESCE(SUM(count),0) AS total FROM footfall ${baseWhere}`, baseParams);
    const [hourly] = await db.query(`SELECT time_slot, SUM(count) AS total FROM footfall ${baseWhere} AND time_slot IS NOT NULL GROUP BY time_slot ORDER BY time_slot ASC`, baseParams);
    const [byGate] = await db.query(`SELECT COALESCE(gate_name, source) AS gate, SUM(count) AS total FROM footfall ${baseWhere} GROUP BY COALESCE(gate_name, source) ORDER BY total DESC`, baseParams);
    const [[gateCount]] = await db.query(`SELECT COUNT(DISTINCT COALESCE(gate_name, source)) AS count FROM footfall ${baseWhere}`, baseParams);
    const [[slotCount]] = await db.query(`SELECT COUNT(DISTINCT time_slot) AS count FROM footfall ${baseWhere} AND time_slot IS NOT NULL`, baseParams);
    const [peakRow] = await db.query(`SELECT time_slot, SUM(count) AS total FROM footfall ${baseWhere} AND time_slot IS NOT NULL GROUP BY time_slot ORDER BY total DESC LIMIT 1`, baseParams);

    const fmt = (d) => d.toISOString().split('T')[0];
    const dateObj = new Date(from_date);
    const y = new Date(dateObj); y.setDate(y.getDate() - 1);
    const lw = new Date(dateObj); lw.setDate(lw.getDate() - 7);
    const lm = new Date(dateObj); lm.setDate(lm.getDate() - 30);
    const getPT = async (date) => { const [[r]] = await db.query(`SELECT COALESCE(SUM(count),0) AS total FROM footfall WHERE footfall_date = ?`, [fmt(date)]); return r.total; };
    const [yt, lwt, lmt] = await Promise.all([getPT(y), getPT(lw), getPT(lm)]);

    const [tableData] = await db.query(
      `SELECT id, footfall_date, COALESCE(gate_name, source) AS gate_name, time_slot, count,
              ROUND(count * 100.0 / NULLIF((SELECT SUM(count) FROM footfall ${baseWhere}), 0), 1) AS pct_of_total
       FROM footfall ${baseWhere} ORDER BY footfall_date DESC, time_slot ASC`,
      [...baseParams, ...baseParams]
    );

    const cur = Number(totals.total);
    const pct = (c) => c > 0 ? Math.round((cur - c) / c * 100) : 0;

    res.json({
      success: true,
      data: {
        total: cur,
        peak_hour: peakRow[0] ? { slot: peakRow[0].time_slot, count: peakRow[0].total } : null,
        active_gates: gateCount.count,
        time_slots: slotCount.count,
        hourly,
        by_gate: byGate,
        period_comparison: {
          yesterday: { total: yt, date: fmt(y), pct: pct(yt) },
          last_week_same_day: { total: lwt, date: fmt(lw), pct: pct(lwt) },
          last_month_same_day: { total: lmt, date: fmt(lm), pct: pct(lmt) },
        },
        table_data: tableData,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET gate list
exports.getGates = async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT DISTINCT COALESCE(gate_name, source) AS gate FROM footfall ORDER BY gate ASC`);
    res.json({ success: true, data: rows.map(r => r.gate) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST add single entry
exports.addFootfall = async (req, res) => {
  try {
    const { footfall_date, count, source, gate_name, time_slot, store_id, notes } = req.body;
    if (!footfall_date || count === undefined || !source)
      return res.status(400).json({ success: false, message: 'footfall_date, count, source required.' });
    await db.query(
      'INSERT INTO footfall (footfall_date, count, source, gate_name, time_slot, store_id, notes, entered_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [footfall_date, count, source, gate_name || null, time_slot || null, store_id || null, notes || null, req.user.id]
    );
    res.status(201).json({ success: true, message: 'Footfall entry added.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST bulk upload — CSV or Excel
// Columns: Gate Name | Date | Time Range | Footfall
exports.bulkUpload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });

    const rows = parseUploadedFile(req.file.buffer, req.file.mimetype, req.file.originalname);
    if (!rows.length) return res.status(400).json({ success: false, message: 'Empty file.' });

    // Skip header row
    const dataRows = rows.filter(r => {
      const first = String(r[0] || '').toLowerCase().trim();
      return first && first !== 'gate name' && first !== 'gate_name' && first !== 'date' && first !== '#';
    });

    let inserted = 0, errors = [];

    for (const r of dataRows) {
      // Columns: Gate Name, Date, Time Range, Footfall
      let [gate_name, footfall_date, time_slot, count_val] = r;

      // Handle Excel date objects or JS date strings
      if (footfall_date instanceof Date) {
        // Use IST timezone explicitly to avoid UTC shift (Excel midnight IST = prev day UTC)
        footfall_date = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Kolkata' }).format(footfall_date);
      } else {
        footfall_date = String(footfall_date || '').trim();
        // Convert DD-MM-YYYY → YYYY-MM-DD
        const dmyMatch = footfall_date.match(/^(\d{2})-(\d{2})-(\d{4})$/);
        if (dmyMatch) footfall_date = `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
        // Convert DD/MM/YYYY → YYYY-MM-DD
        const dmySlash = footfall_date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (dmySlash) footfall_date = `${dmySlash[3]}-${dmySlash[2]}-${dmySlash[1]}`;
        // Fallback: parse any recognisable date string (e.g. "Thu Mar 12 2026 23:59:50 GMT+0530")
        if (!/^\d{4}-\d{2}-\d{2}$/.test(footfall_date)) {
          const parsed = new Date(footfall_date);
          if (!isNaN(parsed.getTime())) {
            footfall_date = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Kolkata' }).format(parsed);
          }
        }
      }

      gate_name = String(gate_name || '').trim();
      time_slot = String(time_slot || '').trim();
      const countStr = String(count_val || '').replace(/[,\s]/g, '');
      const count = countStr === '' ? 0 : parseInt(countStr);

      if (!gate_name || !footfall_date || !/^\d{4}-\d{2}-\d{2}$/.test(footfall_date) || isNaN(count)) { errors.push(`Bad row: ${r.join(',')}`); continue; }

      try {
        await db.query(
          'INSERT INTO footfall (footfall_date, count, source, gate_name, time_slot, notes, entered_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [footfall_date, count, 'mall', gate_name, time_slot || null, 'Bulk upload', req.user.id]
        );
        inserted++;
      } catch (e) { errors.push(`Insert failed: ${r.join(',')}`); }
    }

    res.json({ success: true, message: `${inserted} of ${dataRows.length} rows inserted.`, errors: errors.slice(0, 10) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET sample file download (Excel)
exports.downloadSample = async (req, res) => {
  try {
    const XLSX = require('xlsx');
    const data = [
      ['Gate Name', 'Date', 'Time Range', 'Footfall'],
      ['Main Entrance', '2026-03-16', '10:00-10:59', 420],
      ['Main Entrance', '2026-03-16', '11:00-11:59', 380],
      ['Main Entrance', '2026-03-16', '13:00-13:59', 435],
      ['Main Entrance', '2026-03-16', '18:00-18:59', 1000],
      ['LGF Entrance', '2026-03-16', '11:00-11:59', 80],
      ['LGF Entrance', '2026-03-16', '17:00-17:59', 35],
      ['LGF Entrance', '2026-03-16', '18:00-18:59', 120],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Footfall Data');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="Footfall_Sample.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET summary (legacy)
exports.getFootfallSummary = async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    const df = from_date && to_date ? 'WHERE footfall_date BETWEEN ? AND ?' : '';
    const p = from_date && to_date ? [from_date, to_date] : [];
    const [total] = await db.query(`SELECT COALESCE(SUM(count), 0) AS total FROM footfall ${df}`, p);
    const [bySource] = await db.query(`SELECT source, COALESCE(SUM(count), 0) AS total FROM footfall ${df} GROUP BY source`, p);
    const [daily] = await db.query(`SELECT footfall_date, SUM(count) AS total FROM footfall ${df} GROUP BY footfall_date ORDER BY footfall_date ASC`, p);
    res.json({ success: true, data: { total: total[0].total, by_source: bySource, daily } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE
exports.deleteFootfall = async (req, res) => {
  try {
    await db.query('DELETE FROM footfall WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Entry deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
