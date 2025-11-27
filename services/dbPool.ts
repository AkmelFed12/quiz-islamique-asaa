import { Pool } from '@neondatabase/serverless';

let pool: Pool | null = null;
let connectionAttempts = 0;
const MAX_RETRIES = 3;

export const getPool = (): Pool | null => {
  return pool;
};

export const initializePool = async (): Promise<boolean> => {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.warn('⚠️  DATABASE_URL is not set. Database operations will use LocalStorage.');
    return false;
  }

  try {
    pool = new Pool({ 
      connectionString: dbUrl,
      max: 10, // Maximum connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Test the connection
    const testClient = await pool.connect();
    const result = await testClient.query('SELECT NOW()');
    testClient.release();
    
    console.log('✅ Database connected successfully at', result.rows[0].now);
    return true;
  } catch (err) {
    connectionAttempts++;
    console.error(`❌ Database connection failed (attempt ${connectionAttempts}/${MAX_RETRIES}):`, err);
    
    if (connectionAttempts >= MAX_RETRIES) {
      console.error('⚠️  Max retries reached. Falling back to LocalStorage.');
      pool = null;
      return false;
    }
    
    // Retry after 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    return initializePool();
  }
};

export const closePool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('✅ Database connection closed');
  }
};
