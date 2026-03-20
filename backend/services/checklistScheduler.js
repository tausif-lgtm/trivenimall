/**
 * Checklist Auto-Scheduler
 * - Generates schedules for today on startup
 * - Marks missed (previous day) as 'missed'
 * - Re-runs every day at midnight
 */
const Checklist = require('../models/Checklist');

let lastRunDate = '';

async function runDailyGeneration() {
  const today = new Date().toISOString().slice(0, 10);
  if (lastRunDate === today) return; // Already ran today
  lastRunDate = today;

  try {
    const missed = await Checklist.markMissedSchedules();
    if (missed > 0) console.log(`[Scheduler] Marked ${missed} schedule(s) as missed.`);

    const created = await Checklist.generateSchedulesForDate(today);
    console.log(`[Scheduler] Generated ${created} schedule(s) for ${today}.`);
  } catch (e) {
    console.error('[Scheduler] Error during daily generation:', e.message);
  }
}

function scheduleNextMidnight() {
  const now = new Date();
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  next.setHours(0, 1, 0, 0); // 00:01 AM next day
  const msUntilMidnight = next.getTime() - now.getTime();

  setTimeout(() => {
    runDailyGeneration();
    // Then repeat every 24 hours
    setInterval(runDailyGeneration, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);

  console.log(`[Scheduler] Next daily run in ${Math.round(msUntilMidnight / 60000)} minutes.`);
}

function start() {
  // Run immediately on startup
  runDailyGeneration();
  // Schedule next run at midnight
  scheduleNextMidnight();
}

module.exports = { start };
