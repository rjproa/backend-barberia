#!/bin/bash

# ========================================
# Script de Pruebas Automatizado
# Backend Barbería
# ========================================

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contador de pruebas
TESTS_PASSED=0
TESTS_FAILED=0

# URL base
BASE_URL="http://localhost:3000"

# Variables globales
TOKEN=""
USER_ID=""
ADMIN_TOKEN=""
RESERVA_ID=""

# ========================================
# Funciones Auxiliares
# ========================================

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_test() {
    echo -e "${YELLOW}Test: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ PASS: $1${NC}"
    ((TESTS_PASSED++))
}

print_error() {
    echo -e "${RED}❌ FAIL: $1${NC}"
    ((TESTS_FAILED++))
}

wait_user() {
    echo -e "\n${YELLOW}Presiona Enter para continuar...${NC}"
    read
}

# ========================================
# 1. CONFIGURACIÓN INICIAL
# ========================================

print_header "1. CONFIGURACIÓN INICIAL"

print_test "1.1 Verificar que el servidor esté corriendo"
if curl -s "$BASE_URL/api/health" > /dev/null; then
    print_success "Servidor corriendo en $BASE_URL"
else
    print_error "Servidor NO está corriendo. Ejecuta: npm start"
    exit 1
fi

# ========================================
# 2. PRUEBAS DE AUTENTICACIÓN
# ========================================

print_header "2. AUTENTICACIÓN"

# Test 2.1: Registro
print_test "2.1 Registro de nuevo usuario"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "rol_id": 1,
    "nombre": "Cliente Test Automatizado",
    "telefono": "900000099",
    "contraseña": "123456"
  }')

if echo "$RESPONSE" | grep -q "Usuario registrado exitosamente"; then
    print_success "Usuario registrado correctamente"
    TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*' | sed 's/"token":"//')
    USER_ID=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
    echo "  Token: ${TOKEN:0:20}..."
    echo "  User ID: $USER_ID"
else
    print_error "Error al registrar usuario"
    echo "$RESPONSE"
fi

# Test 2.2: Login
print_test "2.2 Login con credenciales existentes"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "telefono": "999888777",
    "contraseña": "123456"
  }')

if echo "$RESPONSE" | grep -q "Login exitoso"; then
    print_success "Login exitoso"
else
    print_error "Error al hacer login"
fi

# Test 2.3: Obtener perfil
print_test "2.3 Obtener perfil con token"
RESPONSE=$(curl -s "$BASE_URL/api/auth/profile" \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -q "Cliente Test Automatizado"; then
    print_success "Perfil obtenido correctamente"
else
    print_error "Error al obtener perfil"
fi

# Test 2.4: Login con contraseña incorrecta
print_test "2.4 Login con contraseña incorrecta (debe fallar)"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "telefono": "999888777",
    "contraseña": "incorrecta"
  }')

if echo "$RESPONSE" | grep -q "Credenciales inválidas"; then
    print_success "Error manejado correctamente"
else
    print_error "Debería rechazar credenciales incorrectas"
fi

# ========================================
# 3. PRUEBAS DE BARBEROS
# ========================================

print_header "3. BARBEROS"

# Test 3.1: Listar barberos
print_test "3.1 Listar todos los barberos"
RESPONSE=$(curl -s "$BASE_URL/api/barbers")

if echo "$RESPONSE" | grep -q "El Maestro Mike"; then
    print_success "Barberos listados correctamente"
else
    print_error "Error al listar barberos"
fi

# Test 3.2: Barberos disponibles
print_test "3.2 Listar barberos disponibles"
RESPONSE=$(curl -s "$BASE_URL/api/barbers/available")

if echo "$RESPONSE" | grep -q "disponible"; then
    print_success "Barberos disponibles obtenidos"
else
    print_error "Error al obtener barberos disponibles"
fi

# ========================================
# 4. PRUEBAS DE SERVICIOS
# ========================================

print_header "4. SERVICIOS Y PRODUCTOS"

# Test 4.1: Servicios activos
print_test "4.1 Listar servicios activos"
RESPONSE=$(curl -s "$BASE_URL/api/services/active")

if echo "$RESPONSE" | grep -q "Corte de Cabello"; then
    print_success "Servicios listados correctamente"
else
    print_error "Error al listar servicios"
fi

# Test 4.2: Productos activos
print_test "4.2 Listar productos activos"
RESPONSE=$(curl -s "$BASE_URL/api/products/active")

if echo "$RESPONSE" | grep -q "Cera"; then
    print_success "Productos listados correctamente"
else
    print_error "Error al listar productos"
fi

# ========================================
# 5. RESERVAS - USUARIO REGISTRADO
# ========================================

print_header "5. RESERVAS - USUARIO REGISTRADO"

# Test 5.1: Ver horarios disponibles
print_test "5.1 Consultar horarios disponibles"
RESPONSE=$(curl -s "$BASE_URL/api/reservations/available-slots?barbero_id=1&fecha=2025-08-27")

if echo "$RESPONSE" | grep -q "slots_disponibles"; then
    print_success "Horarios disponibles obtenidos"
else
    print_error "Error al obtener horarios"
fi

# Test 5.2: Crear primera reserva
print_test "5.2 Crear primera reserva (sin descuento)"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/reservations" \
  -H "Content-Type: application/json" \
  -d "{
    \"usuario_id\": $USER_ID,
    \"barbero_id\": 1,
    \"fecha_reserva\": \"2025-08-27\",
    \"hora_reserva\": \"10:00:00\",
    \"notas\": \"Test automatizado\",
    \"es_invitado\": false,
    \"servicios\": [{\"id\": 1, \"precio\": 25.00}]
  }")

if echo "$RESPONSE" | grep -q "Reserva creada exitosamente"; then
    print_success "Reserva creada correctamente"
    RESERVA_ID=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
    echo "  Reserva ID: $RESERVA_ID"
    
    # Verificar que NO tiene descuento
    if echo "$RESPONSE" | grep -q '"aplica_descuento":false'; then
        print_success "Confirmado: Primera cita sin descuento"
    else
        print_error "Primera cita no debería tener descuento"
    fi
else
    print_error "Error al crear reserva"
    echo "$RESPONSE"
fi

# Test 5.3: Ver mis reservas
print_test "5.3 Ver mis reservas"
RESPONSE=$(curl -s "$BASE_URL/api/reservations/user/$USER_ID")

if echo "$RESPONSE" | grep -q "Test automatizado"; then
    print_success "Reservas del usuario obtenidas"
else
    print_error "Error al obtener reservas del usuario"
fi

# Test 5.4: Completar reserva
print_test "5.4 Completar reserva"
RESPONSE=$(curl -s -X PATCH "$BASE_URL/api/reservations/$RESERVA_ID/status" \
  -H "Content-Type: application/json" \
  -d '{"estado": "completada"}')

if echo "$RESPONSE" | grep -q "completada exitosamente"; then
    print_success "Reserva completada correctamente"
else
    print_error "Error al completar reserva"
fi

# ========================================
# 6. RESERVAS - INVITADO
# ========================================

print_header "6. RESERVAS - INVITADO"

# Test 6.1: Crear reserva como invitado
print_test "6.1 Crear reserva como invitado"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/reservations" \
  -H "Content-Type: application/json" \
  -d '{
    "barbero_id": 2,
    "fecha_reserva": "2025-08-28",
    "hora_reserva": "14:00:00",
    "notas": "Test invitado automatizado",
    "es_invitado": true,
    "invitado_nombre": "Test Invitado Auto",
    "invitado_telefono": "922998877",
    "invitado_email": "test@auto.com",
    "servicios": [{"id": 3, "precio": 35.00}]
  }')

if echo "$RESPONSE" | grep -q "Reserva de invitado creada exitosamente"; then
    print_success "Reserva de invitado creada"
else
    print_error "Error al crear reserva de invitado"
fi

# Test 6.2: Buscar reservas de invitado
print_test "6.2 Buscar reservas por teléfono de invitado"
RESPONSE=$(curl -s "$BASE_URL/api/reservations/guest/922998877")

if echo "$RESPONSE" | grep -q "Test Invitado Auto"; then
    print_success "Reservas de invitado encontradas"
else
    print_error "Error al buscar reservas de invitado"
fi

# Test 6.3: Invitado sin nombre (debe fallar)
print_test "6.3 Invitado sin nombre (debe fallar)"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/reservations" \
  -H "Content-Type: application/json" \
  -d '{
    "barbero_id": 1,
    "fecha_reserva": "2025-08-29",
    "hora_reserva": "15:00:00",
    "es_invitado": true,
    "invitado_telefono": "922334455",
    "servicios": [{"id": 1, "precio": 25.00}]
  }')

if echo "$RESPONSE" | grep -q "Nombre y teléfono son requeridos"; then
    print_success "Validación funcionando correctamente"
else
    print_error "Debería requerir nombre para invitados"
fi

# ========================================
# 7. SISTEMA DE FIDELIZACIÓN
# ========================================

print_header "7. SISTEMA DE FIDELIZACIÓN"

# Test 7.1: Ver estadísticas iniciales
print_test "7.1 Ver estadísticas de fidelidad"
RESPONSE=$(curl -s "$BASE_URL/api/reservations/user/$USER_ID/loyalty")

if echo "$RESPONSE" | grep -q "citas_completadas"; then
    print_success "Estadísticas de fidelidad obtenidas"
    CITAS=$(echo "$RESPONSE" | grep -o '"citas_completadas":[0-9]*' | sed 's/"citas_completadas"://')
    echo "  Citas completadas: $CITAS"
else
    print_error "Error al obtener estadísticas"
fi

# Test 7.2: Crear 3 citas más y completarlas
print_test "7.2 Crear y completar 3 citas más (total 4)"
for i in {2..4}; do
    FECHA="2025-08-$((26+i))"
    HORA="11:00:00"
    
    # Crear
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/reservations" \
      -H "Content-Type: application/json" \
      -d "{
        \"usuario_id\": $USER_ID,
        \"barbero_id\": 1,
        \"fecha_reserva\": \"$FECHA\",
        \"hora_reserva\": \"$HORA\",
        \"es_invitado\": false,
        \"servicios\": [{\"id\": 1, \"precio\": 25.00}]
      }")
    
    RES_ID=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
    
    # Completar
    curl -s -X PATCH "$BASE_URL/api/reservations/$RES_ID/status" \
      -H "Content-Type: application/json" \
      -d '{"estado": "completada"}' > /dev/null
    
    echo "  Cita $i creada y completada"
done
print_success "3 citas adicionales creadas y completadas"

# Test 7.3: Verificar que próxima cita tiene descuento
print_test "7.3 Verificar que próxima cita (5ta) tendrá descuento"
RESPONSE=$(curl -s "$BASE_URL/api/reservations/user/$USER_ID/loyalty")

if echo "$RESPONSE" | grep -q '"aplica":true'; then
    print_success "¡Próxima cita tendrá 30% de descuento!"
else
    print_error "Debería aplicar descuento en la 5ta cita"
fi

# Test 7.4: Crear cita #5 CON DESCUENTO
print_test "7.4 Crear cita #5 (CON DESCUENTO 30%)"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/reservations" \
  -H "Content-Type: application/json" \
  -d "{
    \"usuario_id\": $USER_ID,
    \"barbero_id\": 1,
    \"fecha_reserva\": \"2025-08-31\",
    \"hora_reserva\": \"12:00:00\",
    \"es_invitado\": false,
    \"servicios\": [{\"id\": 2, \"precio\": 100.00}]
  }")

if echo "$RESPONSE" | grep -q "30% de descuento"; then
    print_success "¡Descuento aplicado correctamente!"
    
    # Verificar montos
    SUBTOTAL=$(echo "$RESPONSE" | grep -o '"subtotal":"[0-9.]*"' | sed 's/"subtotal":"//;s/"//')
    DESCUENTO=$(echo "$RESPONSE" | grep -o '"descuento_monto":"[0-9.]*"' | sed 's/"descuento_monto":"//;s/"//')
    TOTAL=$(echo "$RESPONSE" | grep -o '"total_final":"[0-9.]*"' | sed 's/"total_final":"//;s/"//')
    
    echo "  Subtotal: S/ $SUBTOTAL"
    echo "  Descuento: S/ $DESCUENTO"
    echo "  Total: S/ $TOTAL"
    
    if [ "$DESCUENTO" = "30.00" ]; then
        print_success "Monto de descuento correcto (30% de 100 = 30)"
    else
        print_error "Descuento debería ser 30.00, es: $DESCUENTO"
    fi
else
    print_error "No se aplicó el descuento en la 5ta cita"
    echo "$RESPONSE"
fi

# ========================================
# 8. PRUEBAS DE ADMIN
# ========================================

print_header "8. FUNCIONES DE ADMIN"

# Test 8.1: Login como admin
print_test "8.1 Login como administrador"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "telefono": "987654321",
    "contraseña": "123456"
  }')

if echo "$RESPONSE" | grep -q "admin"; then
    print_success "Login de admin exitoso"
    ADMIN_TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*' | sed 's/"token":"//')
else
    print_error "Error al hacer login como admin"
fi

# Test 8.2: Ver todas las reservas
print_test "8.2 Ver todas las reservas (admin)"
RESPONSE=$(curl -s "$BASE_URL/api/reservations" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

TOTAL=$(echo "$RESPONSE" | grep -o '"count":[0-9]*' | sed 's/"count"://')
if [ ! -z "$TOTAL" ]; then
    print_success "Admin puede ver todas las reservas (Total: $TOTAL)"
else
    print_error "Error al obtener reservas"
fi

# Test 8.3: Estadísticas generales
print_test "8.3 Ver estadísticas generales"
RESPONSE=$(curl -s "$BASE_URL/api/reservations/stats")

if echo "$RESPONSE" | grep -q "total_descuentos_otorgados"; then
    print_success "Estadísticas generales obtenidas"
    DESCUENTOS=$(echo "$RESPONSE" | grep -o '"total_descuentos_otorgados":"[0-9.]*"' | sed 's/"total_descuentos_otorgados":"//;s/"//')
    echo "  Total descuentos otorgados: S/ $DESCUENTOS"
else
    print_error "Error al obtener estadísticas"
fi

# ========================================
# 9. CASOS DE ERROR
# ========================================

print_header "9. CASOS DE ERROR"

# Test 9.1: Horario duplicado
print_test "9.1 Intentar reservar horario ocupado (debe fallar)"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/reservations" \
  -H "Content-Type: application/json" \
  -d "{
    \"usuario_id\": $USER_ID,
    \"barbero_id\": 1,
    \"fecha_reserva\": \"2025-08-27\",
    \"hora_reserva\": \"10:00:00\",
    \"es_invitado\": false,
    \"servicios\": [{\"id\": 1, \"precio\": 25.00}]
  }")

if echo "$RESPONSE" | grep -q "ya tiene una reserva en ese horario"; then
    print_success "Validación de horario duplicado funciona"
else
    print_error "Debería rechazar horarios duplicados"
fi

# ========================================
# RESUMEN FINAL
# ========================================

print_header "RESUMEN DE PRUEBAS"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))

echo -e "${BLUE}Tests ejecutados: $TOTAL_TESTS${NC}"
echo -e "${GREEN}Tests exitosos: $TESTS_PASSED${NC}"
echo -e "${RED}Tests fallidos: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ¡TODAS LAS PRUEBAS PASARON! 🎉${NC}"
    echo -e "${GREEN}Tu backend está funcionando perfectamente.${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  Algunas pruebas fallaron${NC}"
    echo -e "${YELLOW}Revisa los errores arriba y corrige los problemas.${NC}"
    exit 1
fi