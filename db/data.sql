-- ========================================
-- SCRIPT DE INSERCIÓN DE DATOS DE PRUEBA
-- Barbería - Sistema de Reservas
-- ========================================

-- ========================================
-- 1. ROLES (Ya insertados por defecto)
-- ========================================
-- cliente, barbero, admin

-- ========================================
-- 2. USUARIOS (1 Admin, 3 Barberos, 1 Cliente)
-- ========================================

-- Admin
INSERT INTO usuarios (rol_id, nombre, telefono, contraseña) VALUES
(3, 'Carlos Administrador', '987654321', '$2a$10$xQkH9yV7QXN5nE9qZ8kKxeGRYhL5WqJFh0cVvP8mJKfXzL9WqJFh0');
-- Contraseña: admin123

-- Barberos
INSERT INTO usuarios (rol_id, nombre, telefono, contraseña) VALUES
(2, 'Miguel Ángel Córdova', '987123456', '$2a$10$xQkH9yV7QXN5nE9qZ8kKxeGRYhL5WqJFh0cVvP8mJKfXzL9WqJFh0'),
(2, 'Roberto Sánchez', '987234567', '$2a$10$xQkH9yV7QXN5nE9qZ8kKxeGRYhL5WqJFh0cVvP8mJKfXzL9WqJFh0'),
(2, 'Andrés Palacios', '987345678', '$2a$10$xQkH9yV7QXN5nE9qZ8kKxeGRYhL5WqJFh0cVvP8mJKfXzL9WqJFh0');
-- Contraseña para todos: barbero123

-- Cliente
INSERT INTO usuarios (rol_id, nombre, telefono, contraseña) VALUES
(1, 'Juan Pérez García', '999888777', '$2a$10$xQkH9yV7QXN5nE9qZ8kKxeGRYhL5WqJFh0cVvP8mJKfXzL9WqJFh0');
-- Contraseña: cliente123

-- ========================================
-- 3. BARBEROS (Vincular usuarios con perfil barbero)
-- ========================================

INSERT INTO barberos (usuario_id, nombre_artistico, especialidad, disponible) VALUES
(2, 'El Maestro Mike', 'Cortes clásicos y fade', true),
(3, 'Roby Styles', 'Diseños y barbas', true),
(4, 'Andy Sharp', 'Cortes modernos y afeitado', true);

-- ========================================
-- 4. SERVICIOS (4 servicios principales)
-- ========================================

INSERT INTO servicios (nombre, descripcion, precio, duracion, activo) VALUES
('Corte de Cabello Clásico', 'Corte tradicional con tijera y máquina, incluye lavado', 25.00, 30, true),
('Corte + Barba', 'Corte de cabello completo más arreglo de barba profesional', 40.00, 45, true),
('Diseño y Fade', 'Corte degradado con diseños personalizados', 35.00, 40, true),
('Afeitado Clásico', 'Afeitado tradicional con navaja, toalla caliente y masaje facial', 30.00, 25, true);

-- ========================================
-- 5. PRODUCTOS (4 productos disponibles)
-- ========================================

INSERT INTO productos (nombre, descripcion, precio, categoria, activo) VALUES
('Cera para Cabello Premium', 'Cera de fijación fuerte, acabado mate, 100ml', 25.00, 'Styling', true),
('Aceite para Barba', 'Aceite natural hidratante para barba y bigote, 50ml', 30.00, 'Cuidado de Barba', true),
('Shampoo Profesional', 'Shampoo profesional para todo tipo de cabello, 250ml', 20.00, 'Cuidado Capilar', true),
('Bálsamo After Shave', 'Bálsamo calmante post-afeitado con aloe vera, 100ml', 22.00, 'Afeitado', true);

-- ========================================
-- 6. RESERVA (1 reserva de ejemplo)
-- ========================================

-- Reserva para mañana a las 10:00 AM
INSERT INTO reservas (usuario_id, barbero_id, fecha_reserva, hora_reserva, estado, notas) VALUES
(5, 1, CURRENT_DATE + INTERVAL '1 day', '10:00:00', 'confirmada', 'Cliente solicita corte fade con diseño en lateral');

-- ========================================
-- 7. DETALLE DE RESERVA (Servicios y productos de la reserva)
-- ========================================

-- Obtener el ID de la reserva recién creada
DO $$
DECLARE
    reserva_id_actual INTEGER;
BEGIN
    SELECT id INTO reserva_id_actual FROM reservas ORDER BY id DESC LIMIT 1;
    
    -- Agregar servicio: Diseño y Fade
    INSERT INTO detalle_reserva (reserva_id, tipo, servicio_id, precio_unitario) VALUES
    (reserva_id_actual, 'servicio', 3, 35.00);
    
    -- Agregar producto: Cera para Cabello
    INSERT INTO detalle_reserva (reserva_id, tipo, producto_id, precio_unitario) VALUES
    (reserva_id_actual, 'producto', 1, 25.00);
END $$;

-- ========================================
-- 8. INDISPONIBILIDAD DE BARBERO (Ejemplo)
-- ========================================

-- El barbero "Roby Styles" no está disponible el próximo domingo
INSERT INTO barberos_indisponibilidad (barbero_id, fecha, hora_inicio, hora_fin, motivo) VALUES
(2, CURRENT_DATE + INTERVAL '6 days', NULL, NULL, 'Día libre');

-- El barbero "El Maestro Mike" tiene almuerzo de 1pm a 2pm
INSERT INTO barberos_indisponibilidad (barbero_id, fecha, hora_inicio, hora_fin, motivo) VALUES
(1, CURRENT_DATE + INTERVAL '1 day', '13:00:00', '14:00:00', 'Almuerzo');

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

-- Ver todos los servicios activos
SELECT * FROM servicios WHERE activo = true ORDER BY precio;

-- Ver todos los productos activos por categoría
SELECT categoria, nombre, precio FROM productos 
WHERE activo = true 
ORDER BY categoria, nombre;

-- Ver reservas con detalles completos
SELECT 
    r.id as reserva_id,
    r.fecha_reserva,
    r.hora_reserva,
    r.estado,
    u.nombre as cliente,
    u.telefono as cliente_telefono,
    b.nombre_artistico as barbero,
    r.notas
FROM reservas r
INNER JOIN usuarios u ON r.usuario_id = u.id
INNER JOIN barberos b ON r.barbero_id = b.id
ORDER BY r.fecha_reserva, r.hora_reserva;

-- Ver detalle completo de la reserva con servicios y productos
SELECT 
    r.id as reserva_id,
    dr.tipo,
    COALESCE(s.nombre, p.nombre) as item,
    dr.precio_unitario
FROM reservas r
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
-- RESUMEN DE DATOS INSERTADOS
-- ========================================

SELECT '=== RESUMEN DE DATOS INSERTADOS ===' as mensaje;

SELECT 'Roles' as tabla, COUNT(*) as total FROM roles
UNION ALL
SELECT 'Usuarios', COUNT(*) FROM usuarios
UNION ALL
SELECT 'Barberos', COUNT(*) FROM barberos
UNION ALL
SELECT 'Servicios', COUNT(*) FROM servicios
UNION ALL
SELECT 'Productos', COUNT(*) FROM productos
UNION ALL
SELECT 'Reservas', COUNT(*) FROM reservas
UNION ALL
SELECT 'Detalles de Reserva', COUNT(*) FROM detalle_reserva
UNION ALL
SELECT 'Indisponibilidades', COUNT(*) FROM barberos_indisponibilidad;

-- ========================================
-- CREDENCIALES DE ACCESO
-- ========================================

SELECT '=== CREDENCIALES DE PRUEBA ===' as mensaje;
SELECT 
    'ADMIN: Teléfono: 987654321, Contraseña: admin123' as credencial
UNION ALL
SELECT 'BARBERO 1: Teléfono: 987123456, Contraseña: barbero123'
UNION ALL
SELECT 'BARBERO 2: Teléfono: 987234567, Contraseña: barbero123'
UNION ALL
SELECT 'BARBERO 3: Teléfono: 987345678, Contraseña: barbero123'
UNION ALL
SELECT 'CLIENTE: Teléfono: 999888777, Contraseña: cliente123';