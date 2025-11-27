import { getPool } from './dbPool';

export const logEvent = async (username: string | null, eventType: string, payload: any = {}) => {
  try {
    const pool = getPool();
    const timestamp = new Date().toISOString();
    if (pool) {
      const client = await pool.connect();
      await client.query(
        'INSERT INTO event_logs (username, event_type, payload, created_at) VALUES ($1, $2, $3, $4)',
        [username, eventType, JSON.stringify(payload), timestamp]
      );
      client.release();
      return;
    }

    // Fallback: console.log in LocalStorage mode
    console.log('[LOG]', timestamp, username, eventType, payload);
  } catch (err) {
    console.error('Failed to log event', err);
  }
};

export default { logEvent };
