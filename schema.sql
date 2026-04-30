-- ═══════════════════════════════════════════════════════════
-- SCHEMA SPRINT 0 — Suelosur S.A.S.
-- PostgreSQL local
-- Ejecutar: psql -U postgres -d suelosur -f schema.sql
-- ═══════════════════════════════════════════════════════════

-- 1. Usuarios con roles y autenticación local
CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario        VARCHAR(50)  NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  nombre         VARCHAR(100) NOT NULL,
  rol            VARCHAR(30)  NOT NULL CHECK (rol IN ('admin_ventas','admin_contable','chofer','dueno')),
  activo         BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────
-- 2. Clientes
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clientes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre          VARCHAR(150) NOT NULL,
  domicilio_ppal  VARCHAR(200),
  zona            VARCHAR(50),
  tel_whatsapp    VARCHAR(30),
  tipo_cliente    VARCHAR(50),
  activo          BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────
-- 3. Productos (áridos)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS productos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre            VARCHAR(100) NOT NULL,
  unidad_medida     VARCHAR(20) NOT NULL DEFAULT 'Tonelada',
  precio_referencia DECIMAL(12,2) DEFAULT 0,
  activo            BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────
-- DATOS DE EJEMPLO — borrar en producción
-- ───────────────────────────────────────────────────────────

INSERT INTO productos (nombre, unidad_medida, precio_referencia) VALUES
  ('Arena Fina',      'Tonelada', 8500),
  ('Arena Gruesa',    'Tonelada', 7800),
  ('Piedra Partida',  'Tonelada', 9200),
  ('Piedra Bola',     'Tonelada', 8800),
  ('Canto Rodado',    'Tonelada', 10500),
  ('Tosca',           'Tonelada', 5500)
ON CONFLICT DO NOTHING;

INSERT INTO clientes (nombre, domicilio_ppal, zona, tel_whatsapp, tipo_cliente) VALUES
  ('Construcciones Norte SRL', 'Av. Vélez Sársfield 3200', 'Norte',  '3514001234', 'Empresa'),
  ('García, Roberto',          'Colón 1420',               'Centro', '3513009876', 'Particular'),
  ('Obra Bv. Chacabuco',       'Bv. Chacabuco 890',        'Sur',    '3512005678', 'Obra')
ON CONFLICT DO NOTHING;

-- ───────────────────────────────────────────────────────────
-- CÓMO CREAR EL PRIMER USUARIO (dueño):
--
-- En Node.js (o en un script aparte):
--   const bcrypt = require('bcryptjs')
--   const hash = await bcrypt.hash('tu-contraseña', 12)
--
-- Luego ejecutar en psql:
--   INSERT INTO users (usuario, password_hash, nombre, rol)
--   VALUES ('valentino', '<hash>', 'Valentino', 'dueno');
-- ───────────────────────────────────────────────────────────
