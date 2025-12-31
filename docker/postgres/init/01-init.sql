-- Skrip inisialisasi database untuk StockTrackApp
-- Membuat database dan user dengan permission yang tepat

-- Membuat database jika belum ada
CREATE DATABASE stocktrack_db;

-- Membuat user jika belum ada
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'stocktrack_user') THEN

      CREATE ROLE stocktrack_user LOGIN PASSWORD 'stocktrack_password';
   END IF;
END
$do$;

-- Memberikan permission ke user
GRANT ALL PRIVILEGES ON DATABASE stocktrack_db TO stocktrack_user;

-- Koneksi ke database stocktrack_db
\c stocktrack_db;

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO stocktrack_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO stocktrack_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO stocktrack_user;

-- Set default permissions untuk tabel baru
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO stocktrack_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO stocktrack_user;

-- Membuat extension yang diperlukan
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";