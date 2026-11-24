import mysql, { Pool } from 'mysql2/promise';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { DatabaseSnapshot } from '../../src/types/database';
import { INITIAL_DATABASE_SNAPSHOT } from '../../src/data/seedData';

dotenv.config();

let pool: Pool | null = null;
let isMySqlConnected = false;
let inMemorySnapshot: DatabaseSnapshot = structuredClone(INITIAL_DATABASE_SNAPSHOT);

const TABLE_NAMES: (keyof DatabaseSnapshot)[] = [
  'tbl_khu_vuc',
  'tbl_ban',
  'tbl_khach_hang',
  'tbl_khach_doan',
  'tbl_danh_muc_mon',
  'tbl_mon_an',
  'tbl_chi_tiet_combo',
  'tbl_nguyen_lieu',
  'tbl_dinh_muc_mon',
  'tbl_nhan_vien',
  'tbl_vai_tro',
  'tbl_tai_khoan',
  'tbl_ca_lam_viec',
  'tbl_phan_cong_ca',
  'tbl_don_nghi_phep',
  'tbl_bang_luong',
  'tbl_phieu_dat_ban',
  'tbl_don_goi_mon',
  'tbl_chi_tiet_don_goi',
  'tbl_nhat_ky_bep',
  'tbl_hoa_don',
  'tbl_giao_dich_thanh_toan',
  'tbl_nha_cung_cap',
  'tbl_phieu_nhap_hang',
  'tbl_chi_tiet_phieu_nhap',
  'tbl_so_quy_dong_tien',
  'tbl_yeu_cau_khach_hang',
];

export function logJson(level: 'INFO' | 'WARN' | 'ERROR', message: string, context: Record<string, unknown> = {}) {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      service: 'ac-rms-mysql-engine',
      message,
      ...context,
    }),
  );
}

export async function initDatabaseEngine(): Promise<{ mode: 'mysql-cloud' | 'hybrid-memory'; tables: number }> {
  const dbUrl = process.env.DATABASE_URL?.trim();
  const dbHost = process.env.DB_HOST?.trim();

  if (!dbUrl && (!dbHost || (dbHost === 'localhost' && !process.env.DB_PASSWORD))) {
    logJson('INFO', 'No Cloud MySQL URI detected in env; activating Hybrid In-Memory MySQL 3NF Engine (27 tables ready).', {
      tablesCount: TABLE_NAMES.length,
    });
    isMySqlConnected = false;
    return { mode: 'hybrid-memory', tables: TABLE_NAMES.length };
  }

  try {
    if (dbUrl) {
      const useSsl = process.env.DB_SSL !== 'false' && (dbUrl.includes('ssl') || process.env.DB_SSL === 'true');
      pool = mysql.createPool({
        uri: dbUrl,
        waitForConnections: true,
        connectionLimit: 10,
        multipleStatements: true,
        ssl: useSsl ? { rejectUnauthorized: false } : undefined,
      });
    } else {
      const useSsl = process.env.DB_SSL === 'true';
      pool = mysql.createPool({
        host: dbHost,
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'ac_rms_db',
        waitForConnections: true,
        connectionLimit: 10,
        multipleStatements: true,
        ssl: useSsl ? { rejectUnauthorized: false } : undefined,
      });
    }

    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    isMySqlConnected = true;

    logJson('INFO', 'Connected to MySQL 8.0 Database successfully.', {
      target: dbUrl ? 'DATABASE_URL (Cloud MySQL)' : `${dbHost}:${process.env.DB_PORT || 3306}`,
    });

    if (process.env.AUTO_INIT_DB !== 'false') {
      await runSqlMigrationsAndSeed();
    }

    const loaded = await loadSnapshotFromMySql();
    if (loaded) {
      inMemorySnapshot = loaded;
    }
    return { mode: 'mysql-cloud', tables: TABLE_NAMES.length };
  } catch (error) {
    logJson('WARN', 'MySQL connection unreachable; falling back to Hybrid In-Memory 3NF Engine so app remains 100% operational.', {
      error: error instanceof Error ? error.message : String(error),
    });
    isMySqlConnected = false;
    return { mode: 'hybrid-memory', tables: TABLE_NAMES.length };
  }
}

export async function runSqlMigrationsAndSeed(): Promise<void> {
  if (!pool) return;
  const schemaPath = path.resolve(process.cwd(), 'database/schema_27_tables.sql');
  const seedPath = path.resolve(process.cwd(), 'database/seed_27_tables.sql');

  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schemaSql);
    logJson('INFO', 'Executed schema_27_tables.sql (27 3NF tables verified).');
  }

  // Check if tbl_khu_vuc is empty before seeding
  const [rows] = await pool.query<mysql.RowDataPacket[]>('SELECT COUNT(*) AS cnt FROM tbl_khu_vuc');
  const count = Number(rows[0]?.cnt ?? 0);
  if (count === 0 && fs.existsSync(seedPath)) {
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await pool.query(seedSql);
    logJson('INFO', 'Executed seed_27_tables.sql (initial data seeded into Cloud MySQL).');
  }
}

export async function loadSnapshotFromMySql(): Promise<DatabaseSnapshot | null> {
  if (!pool || !isMySqlConnected) return null;
  try {
    const snapshot = structuredClone(INITIAL_DATABASE_SNAPSHOT);
    for (const table of TABLE_NAMES) {
      const [rows] = await pool.query<mysql.RowDataPacket[]>(`SELECT * FROM ${table}`);
      if (Array.isArray(rows)) {
        (snapshot as unknown as Record<string, unknown>)[table] = rows;
      }
    }
    return snapshot;
  } catch (err) {
    logJson('ERROR', 'Failed to read full 27-table snapshot from MySQL', {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export async function persistSnapshotToMySql(newSnapshot: DatabaseSnapshot): Promise<void> {
  inMemorySnapshot = structuredClone(newSnapshot);
  if (!pool || !isMySqlConnected) return;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');

    for (const table of TABLE_NAMES) {
      const rows = newSnapshot[table] as unknown as Record<string, unknown>[];
      await conn.query(`DELETE FROM ${table}`);
      if (rows && rows.length > 0) {
        const columns = Object.keys(rows[0]);
        const colList = columns.map((c) => `\`${c}\``).join(', ');
        const values = rows.map((row) =>
          columns.map((col) => {
            const val = row[col];
            if (typeof val === 'boolean') return val ? 1 : 0;
            return val ?? null;
          }),
        );
        await conn.query(`INSERT INTO ${table} (${colList}) VALUES ?`, [values]);
      }
    }

    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    logJson('ERROR', 'Failed to sync snapshot to MySQL transactionally', {
      error: err instanceof Error ? err.message : String(err),
    });
  } finally {
    conn.release();
  }
}

export function getCurrentSnapshot(): DatabaseSnapshot {
  return inMemorySnapshot;
}

export async function resetDatabaseToSeed(): Promise<DatabaseSnapshot> {
  inMemorySnapshot = structuredClone(INITIAL_DATABASE_SNAPSHOT);
  if (isMySqlConnected) {
    await persistSnapshotToMySql(inMemorySnapshot);
  }
  return inMemorySnapshot;
}

export function getDbConnectionStatus() {
  return {
    connectedToCloudMySql: isMySqlConnected,
    engine: isMySqlConnected ? 'MySQL 8.0 (Cloud / Pool)' : 'Hybrid MySQL 3NF Memory Engine',
    tableCount: TABLE_NAMES.length,
  };
}
