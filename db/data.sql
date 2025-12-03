-- ========================================
-- SCRIPT DE DATOS DE PRUEBA
-- Barbería con soporte para invitados
-- ========================================

-- NOTA: Las contraseñas están hasheadas con bcrypt
-- Contraseña original para todos: "123456"
-- Hash bcrypt: $2a$10$xQkH9yV7QXN5nE9qZ8kKxeGRYhL5WqJFh0cVvP8mJKfXzL9WqJFh0

-- ========================================
-- 1. USUARIOS
-- ========================================

-- Admin
INSERT INTO usuarios (rol_id, nombre, telefono, contraseña) VALUES
(3, 'Carlos Administrador', '987654321', '$2a$10$xQkH9yV7QXN5nE9qZ8kKxeGRYhL5WqJFh0cVvP8mJKfXzL9WqJFh0');

-- Barberos
INSERT INTO usuarios (rol_id, nombre, telefono, contraseña) VALUES
(2, 'Miguel Ángel Córdova', '987123456', '$2a$10$xQkH9yV7QXN5nE9qZ8kKxeGRYhL5WqJFh0cVvP8mJKfXzL9WqJFh0'),
(2, 'Roberto Sánchez', '987234567', '$2a$10$xQkH9yV7QXN5nE9qZ8kKxeGRYhL5WqJFh0cVvP8mJKfXzL9WqJFh0'),
(2, 'Andrés Palacios', '987345678', '$2a$10$xQkH9yV7QXN5nE9qZ8kKxeGRYhL5WqJFh0cVvP8mJKfXzL9WqJFh0');

-- Clientes
INSERT INTO usuarios (rol_id, nombre, telefono, contraseña) VALUES
(1, 'Juan Pérez García', '999888777', '$2a$10$xQkH9yV7QXN5nE9qZ8kKxeGRYhL5WqJFh0cVvP8mJKfXzL9WqJFh0'),
(1, 'María González López', '999777666', '$2a$10$xQkH9yV7QXN5nE9qZ8kKxeGRYhL5WqJFh0cVvP8mJKfXzL9WqJFh0'),
(1, 'Pedro Ramírez Castro', '999666555', '$2a$10$xQkH9yV7QXN5nE9qZ8kKxeGRYhL5WqJFh0cVvP8mJKfXzL9WqJFh0');

-- ========================================
-- 2. BARBEROS
-- ========================================

INSERT INTO barberos (usuario_id, nombre_artistico, especialidad, disponible) VALUES
(2, 'El Maestro Mike', 'Cortes clásicos y fade', true),
(3, 'Roby Styles', 'Diseños y barbas', true),
(4, 'Andy Sharp', 'Cortes modernos y afeitado', true);

-- ========================================
-- 3. SERVICIOS
-- ========================================

INSERT INTO servicios (nombre, descripcion, precio, duracion, activo) VALUES
('Corte de Cabello Clásico', 'Corte tradicional con tijera y máquina, incluye lavado', 25.00, 30, true),
('Corte + Barba', 'Corte de cabello completo más arreglo de barba profesional', 40.00, 45, true),
('Diseño y Fade', 'Corte degradado con diseños personalizados', 35.00, 40, true),
('Afeitado Clásico', 'Afeitado tradicional con navaja, toalla caliente y masaje facial', 30.00, 25, true),
('Corte Infantil', 'Corte especial para niños con paciencia y diversión', 20.00, 25, true),
('Barba Completa', 'Arreglo, perfilado y hidratación de barba', 25.00, 30, true);

-- ========================================
-- 4. PRODUCTOS
-- ========================================

INSERT INTO productos (nombre, descripcion, precio, categoria, activo) VALUES
('Cera para Cabello Premium', 'Cera de fijación fuerte, acabado mate, 100ml', 25.00, 'Styling', true),
('Aceite para Barba', 'Aceite natural hidratante para barba y bigote, 50ml', 30.00, 'Cuidado de Barba', true),
('Shampoo Profesional', 'Shampoo profesional para todo tipo de cabello, 250ml', 20.00, 'Cuidado Capilar', true),
('Bálsamo After Shave', 'Bálsamo calmante post-afeitado con aloe vera, 100ml', 22.00, 'Afeitado', true),
('Pomada Clásica', 'Pomada de brillo medio, fijación moderada, 85ml', 28.00, 'Styling', true),
('Kit Barbería Completo', 'Set con shampoo, cera y aceite para barba', 65.00, 'Combos', true);

-- ========================================
-- 5. RESERVAS - USUARIOS REGISTRADOS
-- ========================================

-- Reserva 1: Usuario registrado (Juan) - Mañana 10:00 AM
INSERT INTO reservas (
  usuario_id, 
  barbero_id, 
  fecha_reserva, 
  hora_reserva, 
  estado, 
  notas,
  es_invitado
) VALUES
(5, 1, (CURRENT_DATE + INTERVAL '1 day')::DATE, '10:00:00', 'confirmada', 'Cliente solicita corte fade con diseño en lateral', false);

-- Reserva 2: Usuario registrado (María) - Mañana 11:00 AM
INSERT INTO reservas (
  usuario_id, 
  barbero_id, 
  fecha_reserva, 
  hora_reserva, 
  estado, 
  notas,
  es_invitado
) VALUES
(6, 2, (CURRENT_DATE + INTERVAL '1 day')::DATE, '11:00:00', 'pendiente', 'Primera vez en la barbería', false);

-- Reserva 3: Usuario registrado (Pedro) - Hoy 15:00 PM
INSERT INTO reservas (
  usuario_id, 
  barbero_id, 
  fecha_reserva, 
  hora_reserva, 
  estado, 
  notas,
  es_invitado
) VALUES
(7, 3, CURRENT_DATE, '15:00:00', 'completada', 'Cliente frecuente', false);

-- ========================================
-- 6. RESERVAS - INVITADOS (SIN CUENTA)
-- ========================================

-- Reserva 4: Invitado - Mañana 14:00 PM
INSERT INTO reservas (
  usuario_id,
  barbero_id, 
  fecha_reserva, 
  hora_reserva, 
  estado, 
  notas,
  es_invitado,
  invitado_nombre,
  invitado_telefono,
  invitado_email
) VALUES
(NULL, 1, (CURRENT_DATE + INTERVAL '1 day')::DATE, '14:00:00', 'pendiente', 'Primera vez, viene recomendado', true, 'Carlos Invitado Pérez', '955123456', 'carlos.invitado@email.com');

-- Reserva 5: Invitado - Pasado mañana 10:30 AM
INSERT INTO reservas (
  usuario_id,
  barbero_id, 
  fecha_reserva, 
  hora_reserva, 
  estado, 
  notas,
  es_invitado,
  invitado_nombre,
  invitado_telefono,
  invitado_email
) VALUES
(NULL, 2, (CURRENT_DATE + INTERVAL '2 days')::DATE, '10:30:00', 'confirmada', 'Quiere diseño en cabello', true, 'Luis Gómez Invitado', '944567890', 'luis.gomez@email.com');

-- Reserva 6: Invitado - Hoy 16:00 PM
INSERT INTO reservas (
  usuario_id,
  barbero_id, 
  fecha_reserva, 
  hora_reserva, 
  estado, 
  notas,
  es_invitado,
  invitado_nombre,
  invitado_telefono,
  invitado_email
) VALUES
(NULL, 3, CURRENT_DATE, '16:00:00', 'completada', 'Cliente de paso, turista', true, 'Jorge Extranjero', '933998877', NULL);

-- ========================================
-- 7. DETALLE DE RESERVAS
-- ========================================

-- Detalles de Reserva 1 (Juan - Usuario registrado)
INSERT INTO detalle_reserva (reserva_id, tipo, servicio_id, precio_unitario) VALUES
(1, 'servicio', 3, 35.00); -- Diseño y Fade

INSERT INTO detalle_reserva (reserva_id, tipo, producto_id, precio_unitario) VALUES
(1, 'producto', 1, 25.00); -- Cera Premium

-- Detalles de Reserva 2 (María - Usuario registrado)
INSERT INTO detalle_reserva (reserva_id, tipo, servicio_id, precio_unitario) VALUES
(2, 'servicio', 1, 25.00); -- Corte Clásico

-- Detalles de Reserva 3 (Pedro - Usuario registrado)
INSERT INTO detalle_reserva (reserva_id, tipo, servicio_id, precio_unitario) VALUES
(3, 'servicio', 2, 40.00); -- Corte + Barba

INSERT INTO detalle_reserva (reserva_id, tipo, producto_id, precio_unitario) VALUES
(3, 'producto', 2, 30.00); -- Aceite para Barba

-- Detalles de Reserva 4 (Carlos - Invitado)
INSERT INTO detalle_reserva (reserva_id, tipo, servicio_id, precio_unitario) VALUES
(4, 'servicio', 1, 25.00); -- Corte Clásico

-- Detalles de Reserva 5 (Luis - Invitado)
INSERT INTO detalle_reserva (reserva_id, tipo, servicio_id, precio_unitario) VALUES
(5, 'servicio', 3, 35.00); -- Diseño y Fade

INSERT INTO detalle_reserva (reserva_id, tipo, producto_id, precio_unitario) VALUES
(5, 'producto', 1, 25.00); -- Cera Premium

-- Detalles de Reserva 6 (Jorge - Invitado)
INSERT INTO detalle_reserva (reserva_id, tipo, servicio_id, precio_unitario) VALUES
(6, 'servicio', 4, 30.00); -- Afeitado Clásico

-- ========================================
-- 8. INDISPONIBILIDAD DE BARBEROS
-- ========================================

-- El barbero "Roby Styles" no está disponible el próximo domingo
INSERT INTO barberos_indisponibilidad (barbero_id, fecha, hora_inicio, hora_fin, motivo) VALUES
(2, (CURRENT_DATE + INTERVAL '6 days')::DATE, NULL, NULL, 'Día libre - Domingo');

-- El barbero "El Maestro Mike" tiene almuerzo de 1pm a 2pm mañana
INSERT INTO barberos_indisponibilidad (barbero_id, fecha, hora_inicio, hora_fin, motivo) VALUES
(1, (CURRENT_DATE + INTERVAL '1 day')::DATE, '13:00:00', '14:00:00', 'Hora de almuerzo');

-- El barbero "Andy Sharp" tiene capacitación por la mañana pasado mañana
INSERT INTO barberos_indisponibilidad (barbero_id, fecha, hora_inicio, hora_fin, motivo) VALUES
(3, (CURRENT_DATE + INTERVAL '2 days')::DATE, '09:00:00', '12:00:00', 'Capacitación profesional');

-- ========================================
-- 9. CONSULTAS DE VERIFICACIÓN
-- ========================================

-- Ver todos los usuarios con sus roles
SELECT
  u.id,
  r.nombre as rol,
  u.nombre,
  u.telefono
FROM usuarios u
INNER JOIN roles r ON u.rol_id = r.id
ORDER BY r.id, u.nombre;

-- Ver todos los barberos
SELECT
  b.id,
  b.nombre_artistico,
  b.especialidad,
  b.disponible,
  u.nombre as nombre_real,
  u.telefono
FROM barberos b
LEFT JOIN usuarios u ON b.usuario_id = u.id;

-- Ver todas las reservas (registrados e invitados)
SELECT * FROM vista_reservas_completas
ORDER BY fecha_reserva, hora_reserva;

-- Ver solo reservas de usuarios registrados
SELECT * FROM vista_reservas_completas
WHERE tipo_cliente = 'registrado'
ORDER BY fecha_reserva, hora_reserva;

-- Ver solo reservas de invitados
SELECT * FROM vista_reservas_completas
WHERE tipo_cliente = 'invitado'
ORDER BY fecha_reserva, hora_reserva;

-- Ver estadísticas de reservas
SELECT * FROM vista_estadisticas_reservas;

-- Ver detalle completo de reservas con servicios y productos
SELECT
  r.id as reserva_id,
  r.cliente_nombre,
  r.tipo_cliente,
  r.barbero_nombre,
  dr.tipo as detalle_tipo,
  COALESCE(s.nombre, p.nombre) as item,
  dr.precio_unitario
FROM vista_reservas_completas r
INNER JOIN detalle_reserva dr ON r.id = dr.reserva_id
LEFT JOIN servicios s ON dr.servicio_id = s.id
LEFT JOIN productos p ON dr.producto_id = p.id
ORDER BY r.id, dr.tipo;

-- Ver indisponibilidad de barberos
SELECT
  bi.fecha,
  bi.hora_inicio,
  bi.hora_fin,
  bi.motivo,
  b.nombre_artistico as barbero
FROM barberos_indisponibilidad bi
INNER JOIN barberos b ON bi.barbero_id = b.id
ORDER BY bi.fecha, bi.hora_inicio;

-- ========================================
-- 10. RESUMEN DE DATOS INSERTADOS
-- ========================================

SELECT '=== RESUMEN DE DATOS INSERTADOS ===' as mensaje;

SELECT 
  'Roles' as tabla, 
  COUNT(*) as total,
  'cliente, barbero, admin' as datos
FROM roles
UNION ALL
SELECT 
  'Usuarios', 
  COUNT(*),
  '1 admin + 3 barberos + 3 clientes'
FROM usuarios
UNION ALL
SELECT 
  'Barberos', 
  COUNT(*),
  'El Maestro Mike, Roby Styles, Andy Sharp'
FROM barberos
UNION ALL
SELECT 
  'Servicios', 
  COUNT(*),
  'Cortes, barbas, diseños, etc.'
FROM servicios
UNION ALL
SELECT 
  'Productos', 
  COUNT(*),
  'Cera, aceites, shampoo, etc.'
FROM productos
UNION ALL
SELECT 
  'Reservas Totales', 
  COUNT(*),
  '3 usuarios + 3 invitados'
FROM reservas
UNION ALL
SELECT 
  'Reservas Usuarios', 
  COUNT(*),
  'Juan, María, Pedro'
FROM reservas WHERE es_invitado = false
UNION ALL
SELECT 
  'Reservas Invitados', 
  COUNT(*),
  'Carlos, Luis, Jorge'
FROM reservas WHERE es_invitado = true
UNION ALL
SELECT 
  'Detalles de Reserva', 
  COUNT(*),
  'Servicios y productos'
FROM detalle_reserva
UNION ALL
SELECT 
  'Indisponibilidades', 
  COUNT(*),
  'Días libres, almuerzos, etc.'
FROM barberos_indisponibilidad;

-- ========================================
-- 11. CREDENCIALES DE ACCESO
-- ========================================

SELECT '=== CREDENCIALES DE PRUEBA ===' as mensaje;
SELECT
  'ADMIN: Teléfono: 987654321, Contraseña: 123456' as credencial
UNION ALL
SELECT 'BARBERO 1: Teléfono: 987123456, Contraseña: 123456'
UNION ALL
SELECT 'BARBERO 2: Teléfono: 987234567, Contraseña: 123456'
UNION ALL
SELECT 'BARBERO 3: Teléfono: 987345678, Contraseña: 123456'
UNION ALL
SELECT 'CLIENTE 1: Teléfono: 999888777, Contraseña: 123456'
UNION ALL
SELECT 'CLIENTE 2: Teléfono: 999777666, Contraseña: 123456'
UNION ALL
SELECT 'CLIENTE 3: Teléfono: 999666555, Contraseña: 123456';

SELECT '=== TELEFONOS DE INVITADOS (para buscar reservas) ===' as mensaje;
SELECT
  'INVITADO 1: 955123456 (Carlos)' as invitados
UNION ALL
SELECT 'INVITADO 2: 944567890 (Luis)'
UNION ALL
SELECT 'INVITADO 3: 933998877 (Jorge)';

-- ========================================
-- FIN
-- ========================================

SELECT 'Datos de prueba cargados exitosamente' as resultado;