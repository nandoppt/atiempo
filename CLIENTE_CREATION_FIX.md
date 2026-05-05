# Problema con Creación de Clientes

## Descripción del Problema

Al crear un nuevo usuario cliente, el sistema falla al insertar el registro correspondiente en la tabla `clientes` de la base de datos. Los parámetros que no se relacionan correctamente con la DB son:

1. **Campos faltantes**: El campo `telefono` no se estaba pasando (ahora corregido)
2. **Timing de creación**: Se intentaba crear el registro de cliente inmediatamente después del signup de auth, lo que puede fallar por restricciones de RLS o timing
3. **Políticas RLS**: Las políticas de seguridad a nivel de fila pueden impedir inserciones desde usuarios no autenticados

## Solución Implementada

### 1. Separación del Proceso de Creación
- **Antes**: Se creaba el registro de cliente inmediatamente en `signUp()`
- **Ahora**: Se crea el registro de cliente en el primer login exitoso via `ensureClienteRecord()`

### 2. Función `ensureClienteRecord`
Esta función se ejecuta cada vez que un usuario cliente inicia sesión y:
- Verifica si ya existe un registro de cliente
- Si no existe, intenta crearlo
- Maneja errores de duplicados y restricciones RLS
- Usa `maybeSingle()` en lugar de `single()` para evitar errores cuando no hay registros

### 3. Mejor Manejo de Errores
- Logging detallado para debugging
- Mensajes de error más específicos en la UI
- Fallback para casos donde la creación falla

## Código de Función RPC (Opcional)

Si las políticas RLS impiden la inserción directa, crear esta función en Supabase:

```sql
CREATE OR REPLACE FUNCTION create_cliente_record(
  p_id UUID,
  p_email TEXT,
  p_nombre TEXT,
  p_telefono TEXT,
  p_fecha_registro TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO clientes (id, email, nombre, telefono, fecha_registro)
  VALUES (p_id, p_email, p_nombre, p_telefono, p_fecha_registro)
  ON CONFLICT (id) DO NOTHING;
END;
$$;
```

## Verificación

Para verificar que funciona:
1. Crear un nuevo usuario cliente
2. Confirmar el email (si es requerido)
3. Iniciar sesión
4. Verificar en la consola del navegador los logs de `[ensureClienteRecord]`
5. Verificar que el registro aparece en la tabla `clientes`

## Logs Esperados

```
[signUp] Starting signup process: { email: "user@example.com", role: "cliente", nombre: "Juan" }
[signUp] Auth signup result: { data: "success", error: null }
[ensureClienteRecord] Creating cliente record: { id: "...", email: "user@example.com", ... }
[ensureClienteRecord] Cliente record created successfully
```</content>
<parameter name="filePath">c:\Users\fsaltos\Documents\Proyectos\atiempo\CLIENTE_CREATION_FIX.md