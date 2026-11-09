import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Pool } = pg;

// Local runs pick up .env; variables already set (host secrets, CI, a
// one-off `DATABASE_URL=… npm run db:migrate`) take precedence over it.
try {
	process.loadEnvFile(path.join(process.cwd(), ".env"));
} catch (error) {
	if (error.code !== "ENOENT") throw error;
}

// Migrations and seeding run multi-statement sessions, so they use the
// session connection when DATABASE_URL is a transaction pooler.
const databaseUrl = process.env.DATABASE_SESSION_URL?.trim() || process.env.DATABASE_URL;

if (!databaseUrl) {
	console.error("DATABASE_URL is required to run migrations.");
	process.exit(1);
}

const migrationsDir = path.join(process.cwd(), "database", "migrations");
const ssl =
	process.env.DATABASE_SSL === "true"
		? { rejectUnauthorized: false }
		: process.env.DATABASE_SSL === "false" ||
				databaseUrl.includes("localhost") ||
				databaseUrl.includes("127.0.0.1")
			? undefined
			: { rejectUnauthorized: false };

const pool = new Pool({ connectionString: databaseUrl, ssl });

try {
	const files = (await fs.readdir(migrationsDir))
		.filter((file) => file.endsWith(".sql"))
		.sort();

	await pool.query(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version text PRIMARY KEY,
			applied_at timestamptz NOT NULL DEFAULT now()
		)
	`);

	for (const file of files) {
		const existing = await pool.query(
			"SELECT version FROM schema_migrations WHERE version = $1",
			[file],
		);

		if (existing.rowCount) {
			console.log(`Skipping ${file}`);
			continue;
		}

		const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
		const client = await pool.connect();
		try {
			await client.query("BEGIN");
			await client.query(sql);
			await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [
				file,
			]);
			await client.query("COMMIT");
			console.log(`Applied ${file}`);
		} catch (error) {
			await client.query("ROLLBACK");
			throw error;
		} finally {
			client.release();
		}
	}
} finally {
	await pool.end();
}
