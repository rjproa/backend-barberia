-- 1. Agregar campos de descuento a la tabla reservas
ALTER TABLE reservas 
ADD COLUMN IF NOT EXISTS citas_completadas_previas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS aplica_descuento BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS porcentaje_descuento DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS descuento_monto DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_final DECIMAL(10,2) DEFAULT 0.00;

-- 2. Crear tabla de configuración de descuentos
CREATE TABLE IF NOT EXISTS configuracion_descuentos (
  id SERIAL PRIMARY KEY,
  cada_n_citas INTEGER NOT NULL DEFAULT 5,
  porcentaje_descuento DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  activo BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_citas_positivo CHECK (cada_n_citas > 0),
  CONSTRAINT check_porcentaje_valido CHECK (porcentaje_descuento >= 0 AND porcentaje_descuento <= 100)
);

INSERT INTO configuracion_descuentos (cada_n_citas, porcentaje_descuento, activo) 
VALUES (5, 30.00, true)
ON CONFLICT DO NOTHING;

-- 3. Crear tabla de historial de descuentos aplicados
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

CREATE INDEX IF NOT EXISTS idx_historial_descuentos_usuario ON historial_descuentos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_historial_descuentos_reserva ON historial_descuentos(reserva_id);

-- 4. Crear función para contar citas completadas
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

-- 5. Crear función para calcular si aplica descuento
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
  SELECT cada_n_citas, porcentaje_descuento 
  INTO v_cada_n_citas, v_porcentaje
  FROM configuracion_descuentos 
  WHERE activo = true 
  LIMIT 1;
  
  IF v_cada_n_citas IS NULL THEN
    RETURN QUERY SELECT false, 0.00::DECIMAL(5,2), 0;
    RETURN;
  END IF;
  
  v_siguiente_cita := p_citas_completadas + 1;
  
  IF v_siguiente_cita > 0 AND (v_siguiente_cita % v_cada_n_citas) = 0 THEN
    RETURN QUERY SELECT true, v_porcentaje, v_siguiente_cita;
  ELSE
    RETURN QUERY SELECT false, 0.00::DECIMAL(5,2), v_siguiente_cita;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 6. Crear función para calcular montos con descuento
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
  v_descuento := ROUND(p_subtotal * (p_porcentaje_descuento / 100), 2);
  v_total := p_subtotal - v_descuento;
  RETURN QUERY SELECT v_descuento, v_total;
END;
$$ LANGUAGE plpgsql;

-- 7. Crear vista para reservas con información de descuentos
CREATE OR REPLACE VIEW vista_reservas_con_descuentos AS
SELECT
  r.id,
  r.fecha_reserva,
  r.hora_reserva,
  r.estado,
  r.es_invitado,
  
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
  
  b.id as barbero_id,
  b.nombre_artistico as barbero_nombre,
  
  r.usuario_id,
  
  r.citas_completadas_previas,
  r.aplica_descuento,
  r.porcentaje_descuento,
  r.subtotal,
  r.descuento_monto,
  r.total_final,
  
  CASE 
    WHEN r.es_invitado = false AND r.usuario_id IS NOT NULL THEN
      (SELECT cada_n_citas FROM configuracion_descuentos WHERE activo = true LIMIT 1)
    ELSE NULL
  END as cada_n_citas_config,
  
  CASE 
    WHEN r.es_invitado = false AND r.usuario_id IS NOT NULL THEN
      (SELECT cada_n_citas - (r.citas_completadas_previas % cada_n_citas) 
       FROM configuracion_descuentos 
       WHERE activo = true 
       LIMIT 1)
    ELSE NULL
  END as citas_para_proximo_descuento,
  
  r.notas,
  r.fecha_creacion
FROM reservas r
LEFT JOIN usuarios u ON r.usuario_id = u.id
JOIN barberos b ON r.barbero_id = b.id;

-- 8. Índices
CREATE INDEX IF NOT EXISTS idx_reservas_usuario_estado ON reservas(usuario_id, estado) WHERE es_invitado = false;
CREATE INDEX IF NOT EXISTS idx_reservas_descuento ON reservas(aplica_descuento) WHERE aplica_descuento = true;

SELECT '✅ Sistema de fidelización instalado correctamente' as resultado;
