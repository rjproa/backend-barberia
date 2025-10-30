-- ========================================
-- ROLES
-- ========================================
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE NOT NULL
);

-- Insertar roles por defecto
INSERT INTO roles (nombre) VALUES
  ('cliente'),
  ('barbero'),
  ('admin')
ON CONFLICT (nombre) DO NOTHING;


-- ========================================
-- USUARIOS
-- ========================================
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  rol_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  nombre VARCHAR(100) NOT NULL,
  telefono VARCHAR(15),
  contraseña VARCHAR(255) NOT NULL,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ========================================
-- BARBEROS
-- ========================================
CREATE TABLE IF NOT EXISTS barberos (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  nombre_artistico VARCHAR(100),
  especialidad VARCHAR(100),
  disponible BOOLEAN DEFAULT true,
  total_citas INTEGER DEFAULT 0,
  citas_completadas INTEGER DEFAULT 0,
  citas_canceladas INTEGER DEFAULT 0
);


-- ========================================
-- SERVICIOS
-- ========================================
CREATE TABLE IF NOT EXISTS servicios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL,
  duracion INTEGER,
  activo BOOLEAN DEFAULT true
);


-- ========================================
-- PRODUCTOS
-- ========================================
CREATE TABLE IF NOT EXISTS productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL,
  categoria VARCHAR(100),
  activo BOOLEAN DEFAULT true
);


-- ========================================
-- RESERVAS
-- ========================================
CREATE TABLE IF NOT EXISTS reservas (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  barbero_id INTEGER NOT NULL REFERENCES barberos(id) ON DELETE CASCADE,
  fecha_reserva DATE NOT NULL,
  hora_reserva TIME NOT NULL,
  estado VARCHAR(20) DEFAULT 'pendiente',
  notas TEXT,
  fecha_cancelacion TIMESTAMP,
  cancelado_por INTEGER REFERENCES usuarios(id),
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(barbero_id, fecha_reserva, hora_reserva)
);

CREATE INDEX IF NOT EXISTS idx_reservas_barbero_fecha
ON reservas(barbero_id, fecha_reserva, hora_reserva);


-- ========================================
-- DETALLE DE RESERVAS
-- ========================================
CREATE TABLE IF NOT EXISTS detalle_reserva (
  id SERIAL PRIMARY KEY,
  reserva_id INTEGER NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL,
  servicio_id INTEGER REFERENCES servicios(id),
  producto_id INTEGER REFERENCES productos(id),
  precio_unitario DECIMAL(10,2) NOT NULL,
  CHECK (tipo IN ('servicio', 'producto'))
);


-- ========================================
-- INDISPONIBILIDAD DE BARBEROS
-- ========================================
CREATE TABLE IF NOT EXISTS barberos_indisponibilidad (
  id SERIAL PRIMARY KEY,
  barbero_id INTEGER NOT NULL REFERENCES barberos(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora_inicio TIME,
  hora_fin TIME,
  motivo VARCHAR(100),
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_barberos_indisponibilidad
ON barberos_indisponibilidad(barbero_id, fecha, hora_inicio);

