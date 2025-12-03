-- ========================================
-- BARBERÍA - SISTEMA DE RESERVAS COMPLETO
-- Schema unificado con soporte para:
-- - Usuarios registrados e invitados
-- - Sistema de fidelización con descuentos
-- - Gestión de barberos y servicios
-- ========================================

-- Limpiar base de datos (opcional, solo si quieres empezar de cero)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- ========================================
-- 1. ROLES
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

COMMENT ON TABLE roles IS 'Roles del sistema: cliente, barbero, admin';

-- ========================================
-- 2. USUARIOS
-- ========================================
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  rol_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  nombre VARCHAR(100) NOT NULL,
  telefono VARCHAR(15) UNIQUE,
  contraseña VARCHAR(255) NOT NULL,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_usuarios_telefono ON usuarios(telefono);
CREATE INDEX idx_usuarios_rol ON usuarios(rol_id);

COMMENT ON TABLE usuarios IS 'Usuarios registrados del sistema';
COMMENT ON COLUMN usuarios.contraseña IS 'Contraseña encriptada con bcrypt';

-- ========================================
-- 3. BARBEROS
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

CREATE INDEX idx_barberos_disponible ON barberos(disponible);
CREATE INDEX idx_barberos_usuario ON barberos(usuario_id);

COMMENT ON TABLE barberos IS 'Barberos del sistema vinculados a usuarios';
COMMENT ON COLUMN barberos.nombre_artistico IS 'Nombre profesional del barbero';

-- ========================================
-- 4. SERVICIOS
-- ========================================
CREATE TABLE IF NOT EXISTS servicios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
  duracion INTEGER CHECK (duracion > 0),
  activo BOOLEAN DEFAULT true
);

CREATE INDEX idx_servicios_activo ON servicios(activo);

COMMENT ON TABLE servicios IS 'Servicios ofrecidos por la barbería';
COMMENT ON COLUMN servicios.duracion IS 'Duración en minutos';
COMMENT ON COLUMN servicios.precio IS 'Precio en la moneda local';

-- ========================================
-- 5. PRODUCTOS
-- ========================================
CREATE TABLE IF NOT EXISTS productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
  categoria VARCHAR(100),
  activo BOOLEAN DEFAULT true
);

CREATE INDEX idx_productos_activo ON productos(activo);
CREATE INDEX idx_productos_categoria ON productos(categoria);

COMMENT ON TABLE productos IS 'Productos vendidos en la barbería';

-- ========================================
-- 6. CONFIGURACIÓN DE DESCUENTOS
-- ========================================
CREATE TABLE IF NOT EXISTS configuracion_descuentos (
  id SERIAL PRIMARY KEY,
  cada_n_citas INTEGER NOT NULL DEFAULT 5,
  porcentaje_descuento DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  activo BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_citas_positivo CHECK (cada_n_citas > 0),
  CONSTRAINT check_porcentaje_valido CHECK (porcentaje_descuento >= 0 AND porcentaje_descuento <= 100)
);

-- Insertar configuración por defecto: 30% cada 5 citas
INSERT INTO configuracion_descuentos (cada_n_citas, porcentaje_descuento, activo) 
VALUES (5, 30.00, true);

COMMENT ON TABLE configuracion_descuentos IS 'Configuración del sistema de descuentos por fidelidad';

-- ========================================
-- 7. RESERVAS (CON SOPORTE PARA INVITADOS Y DESCUENTOS)
-- ========================================
CREATE TABLE IF NOT EXISTS reservas (
  id SERIAL PRIMARY KEY,
  
  -- Usuario registrado (OPCIONAL - puede ser invitado)
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  
  -- Barbero y fecha/hora (OBLIGATORIOS)
  barbero_id INTEGER NOT NULL REFERENCES barberos(id) ON DELETE CASCADE,
  fecha_reserva DATE NOT NULL,
  hora_reserva TIME NOT NULL,
  
  -- Estado y notas
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmada', 'completada', 'cancelada')),
  notas TEXT,
  
  -- Soporte para invitados
  es_invitado BOOLEAN DEFAULT false,
  invitado_nombre VARCHAR(100),
  invitado_telefono VARCHAR(15),
  invitado_email VARCHAR(100),
  
  -- Sistema de fidelización (solo para usuarios registrados)
  citas_completadas_previas INTEGER DEFAULT 0,
  aplica_descuento BOOLEAN DEFAULT false,
  porcentaje_descuento DECIMAL(5,2) DEFAULT 0.00,
  subtotal DECIMAL(10,2) DEFAULT 0.00,
  descuento_monto DECIMAL(10,2) DEFAULT 0.00,
  total_final DECIMAL(10,2) DEFAULT 0.00,
  
  -- Metadatos de cancelación
  fecha_cancelacion TIMESTAMP,
  cancelado_por INTEGER REFERENCES usuarios(id),
  
  -- Timestamps
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraint: horario único por barbero
  UNIQUE(barbero_id, fecha_reserva, hora_reserva),
  
  -- Constraint: Si es invitado, debe tener datos; si no, debe tener usuario_id
  CONSTRAINT check_reserva_tipo CHECK (
    (es_invitado = false AND usuario_id IS NOT NULL) 
    OR 
    (es_invitado = true AND usuario_id IS NULL AND invitado_nombre IS NOT NULL AND invitado_telefono IS NOT NULL)
  )
);

-- Índices para optimizar búsquedas
CREATE INDEX idx_reservas_barbero_fecha ON reservas(barbero_id, fecha_reserva, hora_reserva);
CREATE INDEX idx_reservas_usuario ON reservas(usuario_id) WHERE usuario_id IS NOT NULL;
CREATE INDEX idx_reservas_invitado_telefono ON reservas(invitado_telefono) WHERE es_invitado = true;
CREATE INDEX idx_reservas_estado ON reservas(estado);
CREATE INDEX idx_reservas_fecha ON reservas(fecha_reserva);
CREATE INDEX idx_reservas_usuario_estado ON reservas(usuario_id, estado) WHERE es_invitado = false;
CREATE INDEX idx_reservas_descuento ON reservas(aplica_descuento) WHERE aplica_descuento = true;

COMMENT ON TABLE reservas IS 'Reservas de usuarios registrados e invitados con sistema de descuentos';
COMMENT ON COLUMN reservas.es_invitado IS 'true = reserva de invitado (sin cuenta), false = usuario registrado';
COMMENT ON COLUMN reservas.citas_completadas_previas IS 'Número de citas completadas antes de esta reserva';
COMMENT ON COLUMN reservas.aplica_descuento IS 'Indica si esta reserva tiene descuento por fidelidad';
COMMENT ON COLUMN reservas.porcentaje_descuento IS 'Porcentaje de descuento aplicado (ej: 30.00)';
COMMENT ON COLUMN reservas.subtotal IS 'Total antes del descuento';
COMMENT ON COLUMN reservas.descuento_monto IS 'Monto del descuento en moneda local';
COMMENT ON COLUMN reservas.total_final IS 'Total final después del descuento';

-- ========================================
-- 8. DETALLE DE RESERVAS
-- ========================================
CREATE TABLE IF NOT EXISTS detalle_reserva (
  id SERIAL PRIMARY KEY,
  reserva_id INTEGER NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('servicio', 'producto')),
  servicio_id INTEGER REFERENCES servicios(id),
  producto_id INTEGER REFERENCES productos(id),
  precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario >= 0),
  
  -- Constraint: debe tener servicio O producto, no ambos
  CONSTRAINT check_detalle_tipo CHECK (
    (tipo = 'servicio' AND servicio_id IS NOT NULL AND producto_id IS NULL)
    OR
    (tipo = 'producto' AND producto_id IS NOT NULL AND servicio_id IS NULL)
  )
);

CREATE INDEX idx_detalle_reserva ON detalle_reserva(reserva_id);

COMMENT ON TABLE detalle_reserva IS 'Servicios y productos incluidos en cada reserva';

-- ========================================
-- 9. HISTORIAL DE DESCUENTOS
-- ========================================
CREATE TABLE IF NOT EXISTS historial_descuentos (
  id SERIAL PRIMARY KEY,
  reserva_id INTEGER NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  citas_completadas_al_momento INTEGER NOT NULL,
  porcentaje_aplicado DECIMAL(5,2) NOT NULL,
  monto_descuento DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  total_final DECIMAL(10,2) NOT NULL,
  fecha_aplicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_historial_descuentos_usuario ON historial_descuentos(usuario_id);
CREATE INDEX idx_historial_descuentos_reserva ON historial_descuentos(reserva_id);

COMMENT ON TABLE historial_descuentos IS 'Registro histórico de todos los descuentos aplicados';

-- ========================================
-- 10. INDISPONIBILIDAD DE BARBEROS
-- ========================================
CREATE TABLE IF NOT EXISTS barberos_indisponibilidad (
  id SERIAL PRIMARY KEY,
  barbero_id INTEGER NOT NULL REFERENCES barberos(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora_inicio TIME,
  hora_fin TIME,
  motivo VARCHAR(100),
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Si no hay hora_inicio/fin, es todo el día
  CONSTRAINT check_horario CHECK (
    (hora_inicio IS NULL AND hora_fin IS NULL)
    OR
    (hora_inicio IS NOT NULL AND hora_fin IS NOT NULL AND hora_fin > hora_inicio)
  )
);

CREATE INDEX idx_barberos_indisponibilidad ON barberos_indisponibilidad(barbero_id, fecha, hora_inicio);

COMMENT ON TABLE barberos_indisponibilidad IS 'Horarios en los que los barberos no están disponibles';

-- ========================================
-- 11. FUNCIONES - DISPONIBILIDAD
-- ========================================

-- Verificar disponibilidad de barbero
CREATE OR REPLACE FUNCTION verificar_disponibilidad_barbero(
  p_barbero_id INTEGER,
  p_fecha DATE,
  p_hora TIME
) RETURNS BOOLEAN AS $$
DECLARE
  tiene_reserva BOOLEAN;
  tiene_indisponibilidad BOOLEAN;
BEGIN
  -- Verificar si tiene reserva en ese horario
  SELECT EXISTS(
    SELECT 1 FROM reservas
    WHERE barbero_id = p_barbero_id
    AND fecha_reserva = p_fecha
    AND hora_reserva = p_hora
    AND estado NOT IN ('cancelada')
  ) INTO tiene_reserva;
  
  -- Verificar indisponibilidad
  SELECT EXISTS(
    SELECT 1 FROM barberos_indisponibilidad
    WHERE barbero_id = p_barbero_id
    AND fecha = p_fecha
    AND (
      (hora_inicio IS NULL) -- Todo el día
      OR
      (p_hora >= hora_inicio AND p_hora < hora_fin)
    )
  ) INTO tiene_indisponibilidad;
  
  -- Disponible si NO tiene reserva Y NO tiene indisponibilidad
  RETURN NOT tiene_reserva AND NOT tiene_indisponibilidad;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION verificar_disponibilidad_barbero IS 'Verifica si un barbero está disponible en fecha/hora específica';

-- Obtener horarios disponibles de un barbero en una fecha
CREATE OR REPLACE FUNCTION obtener_horarios_disponibles(
  p_barbero_id INTEGER,
  p_fecha DATE
) RETURNS TABLE(hora TIME, disponible BOOLEAN) AS $$
DECLARE
  hora_actual TIME;
BEGIN
  -- Generar horarios de 9:00 a 18:30 (cada 30 minutos)
  FOR hora_actual IN 
    SELECT generate_series(
      '09:00'::TIME,
      '18:30'::TIME,
      '30 minutes'::INTERVAL
    )::TIME
  LOOP
    RETURN QUERY
    SELECT 
      hora_actual,
      verificar_disponibilidad_barbero(p_barbero_id, p_fecha, hora_actual);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION obtener_horarios_disponibles IS 'Retorna todos los horarios del día con su disponibilidad';

-- ========================================
-- 12. FUNCIONES - SISTEMA DE FIDELIZACIÓN
-- ========================================

-- Contar citas completadas de un usuario
CREATE OR REPLACE FUNCTION contar_citas_completadas(p_usuario_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  total_citas INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_citas
  FROM reservas
  WHERE usuario_id = p_usuario_id
  AND es_invitado = false
  AND estado = 'completada';
  
  RETURN COALESCE(total_citas, 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION contar_citas_completadas IS 'Cuenta las citas completadas de un usuario registrado';

-- Calcular si aplica descuento
CREATE OR REPLACE FUNCTION calcular_descuento(p_citas_completadas INTEGER)
RETURNS TABLE(
  aplica BOOLEAN,
  porcentaje DECIMAL(5,2),
  es_cita_numero INTEGER
) AS $$
DECLARE
  v_cada_n_citas INTEGER;
  v_porcentaje DECIMAL(5,2);
  v_siguiente_cita INTEGER;
BEGIN
  -- Obtener configuración activa
  SELECT cada_n_citas, porcentaje_descuento 
  INTO v_cada_n_citas, v_porcentaje
  FROM configuracion_descuentos 
  WHERE activo = true 
  LIMIT 1;
  
  -- Si no hay configuración, no aplica descuento
  IF v_cada_n_citas IS NULL THEN
    RETURN QUERY SELECT false, 0.00::DECIMAL(5,2), 0;
    RETURN;
  END IF;
  
  -- La siguiente cita
  v_siguiente_cita := p_citas_completadas + 1;
  
  -- Verificar si la siguiente cita es múltiplo de N
  IF v_siguiente_cita > 0 AND (v_siguiente_cita % v_cada_n_citas) = 0 THEN
    RETURN QUERY SELECT true, v_porcentaje, v_siguiente_cita;
  ELSE
    RETURN QUERY SELECT false, 0.00::DECIMAL(5,2), v_siguiente_cita;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_descuento IS 'Calcula si aplica descuento según número de citas completadas';

-- Calcular montos con descuento
CREATE OR REPLACE FUNCTION calcular_montos_reserva(
  p_subtotal DECIMAL(10,2),
  p_porcentaje_descuento DECIMAL(5,2)
)
RETURNS TABLE(
  descuento_monto DECIMAL(10,2),
  total_final DECIMAL(10,2)
) AS $$
DECLARE
  v_descuento DECIMAL(10,2);
  v_total DECIMAL(10,2);
BEGIN
  -- Calcular monto de descuento
  v_descuento := ROUND(p_subtotal * (p_porcentaje_descuento / 100), 2);
  
  -- Calcular total final
  v_total := p_subtotal - v_descuento;
  
  RETURN QUERY SELECT v_descuento, v_total;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_montos_reserva IS 'Calcula el descuento y total final de una reserva';

-- ========================================
-- 13. VISTAS
-- ========================================

-- Vista: Reservas completas con información de descuentos
CREATE OR REPLACE VIEW vista_reservas_completas AS
SELECT
  r.id,
  r.fecha_reserva,
  r.hora_reserva,
  r.estado,
  r.notas,
  r.es_invitado,
  
  -- Información del cliente (registrado o invitado)
  CASE 
    WHEN r.es_invitado = true THEN r.invitado_nombre
    ELSE u.nombre
  END as cliente_nombre,
  
  CASE 
    WHEN r.es_invitado = true THEN r.invitado_telefono
    ELSE u.telefono
  END as cliente_telefono,
  
  CASE 
    WHEN r.es_invitado = true THEN r.invitado_email
    ELSE NULL
  END as cliente_email,
  
  CASE 
    WHEN r.es_invitado = true THEN 'invitado'
    ELSE 'registrado'
  END as tipo_cliente,
  
  -- Información del barbero
  b.id as barbero_id,
  b.nombre_artistico as barbero_nombre,
  b.especialidad as barbero_especialidad,
  
  -- Usuario registrado (si aplica)
  r.usuario_id,
  
  -- Información de descuentos
  r.citas_completadas_previas,
  r.aplica_descuento,
  r.porcentaje_descuento,
  r.subtotal,
  r.descuento_monto,
  r.total_final,
  
  -- Calcular próximo descuento para usuarios registrados
  CASE 
    WHEN r.es_invitado = false AND r.usuario_id IS NOT NULL THEN
      (SELECT cada_n_citas FROM configuracion_descuentos WHERE activo = true LIMIT 1)
    ELSE NULL
  END as cada_n_citas_config,
  
  CASE 
    WHEN r.es_invitado = false AND r.usuario_id IS NOT NULL AND r.citas_completadas_previas IS NOT NULL THEN
      (SELECT cada_n_citas - (r.citas_completadas_previas % cada_n_citas) 
       FROM configuracion_descuentos 
       WHERE activo = true 
       LIMIT 1)
    ELSE NULL
  END as citas_para_proximo_descuento,
  
  -- Metadatos
  r.fecha_creacion,
  r.fecha_cancelacion,
  r.cancelado_por
FROM reservas r
LEFT JOIN usuarios u ON r.usuario_id = u.id
JOIN barberos b ON r.barbero_id = b.id;

COMMENT ON VIEW vista_reservas_completas IS 'Vista con información completa de reservas incluyendo descuentos';

-- Vista: Estadísticas de reservas
CREATE OR REPLACE VIEW vista_estadisticas_reservas AS
SELECT
  COUNT(*) as total_reservas,
  COUNT(*) FILTER (WHERE es_invitado = false) as reservas_registrados,
  COUNT(*) FILTER (WHERE es_invitado = true) as reservas_invitados,
  COUNT(*) FILTER (WHERE estado = 'pendiente') as pendientes,
  COUNT(*) FILTER (WHERE estado = 'confirmada') as confirmadas,
  COUNT(*) FILTER (WHERE estado = 'completada') as completadas,
  COUNT(*) FILTER (WHERE estado = 'cancelada') as canceladas,
  COUNT(*) FILTER (WHERE aplica_descuento = true) as con_descuento,
  ROUND(
    COUNT(*) FILTER (WHERE estado = 'completada')::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as porcentaje_completadas,
  COALESCE(SUM(descuento_monto), 0) as total_descuentos_otorgados
FROM reservas;

COMMENT ON VIEW vista_estadisticas_reservas IS 'Estadísticas generales de reservas incluyendo descuentos';

-- ========================================
-- 14. TRIGGERS
-- ========================================

-- Trigger: Actualizar estadísticas de barbero al cambiar estado de reserva
CREATE OR REPLACE FUNCTION actualizar_estadisticas_barbero()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'completada' AND OLD.estado != 'completada' THEN
    UPDATE barberos 
    SET citas_completadas = citas_completadas + 1
    WHERE id = NEW.barbero_id;
  END IF;
  
  IF NEW.estado = 'cancelada' AND OLD.estado != 'cancelada' THEN
    UPDATE barberos 
    SET citas_canceladas = citas_canceladas + 1
    WHERE id = NEW.barbero_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_estadisticas_barbero
AFTER UPDATE OF estado ON reservas
FOR EACH ROW
WHEN (OLD.estado IS DISTINCT FROM NEW.estado)
EXECUTE FUNCTION actualizar_estadisticas_barbero();

COMMENT ON FUNCTION actualizar_estadisticas_barbero IS 'Actualiza automáticamente las estadísticas del barbero';

-- ========================================
-- 15. DATOS DE EJEMPLO (OPCIONAL)
-- ========================================

-- Puedes descomentar esta sección para insertar datos de prueba

/*
-- Usuarios de ejemplo
INSERT INTO usuarios (rol_id, nombre, telefono, contraseña) VALUES
  (1, 'Juan Pérez', '987654321', '$2a$10$...'), -- Cliente (contraseña hasheada)
  (2, 'Carlos Cortez', '987654322', '$2a$10$...'), -- Barbero
  (3, 'Admin Sistema', '987654323', '$2a$10$...'); -- Admin

-- Barberos
INSERT INTO barberos (usuario_id, nombre_artistico, especialidad, disponible) VALUES
  (2, 'Carlitos El Barbero', 'Cortes modernos y barba', true);

-- Servicios
INSERT INTO servicios (nombre, descripcion, precio, duracion, activo) VALUES
  ('Corte de cabello', 'Corte clásico o moderno', 25.00, 30, true),
  ('Afeitado clásico', 'Afeitado con navaja y toalla caliente', 20.00, 20, true),
  ('Corte + Barba', 'Servicio completo', 40.00, 45, true);

-- Productos
INSERT INTO productos (nombre, descripcion, precio, categoria, activo) VALUES
  ('Pomada para cabello', 'Fijación fuerte', 15.00, 'Cuidado capilar', true),
  ('Aceite para barba', 'Hidratante natural', 12.00, 'Cuidado de barba', true);
*/

-- ========================================
-- 16. VERIFICACIÓN FINAL
-- ========================================

SELECT 
  '✅ Schema completo creado exitosamente' as mensaje,
  COUNT(*) as total_tablas
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- Mostrar todas las tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;