# Diseño: Lista de Feria

## 1. Visión general

Los compradores de feria no recuerdan lo que pagaron y pierden sus listas, por lo que no saben cuánto efectivo llevar. **Lista de Feria** resuelve esto con una app que funciona sin conexión: guarda listas, recuerda el último precio pagado por ítem y lugar, estima el total a llevar y muestra cómo cambian los precios.

Es la Hipótesis 1 de `ideation.md` ("Lista con sobre de efectivo"). Los requisitos están en `requirements.md`.

## 2. Principios de diseño

1. **Simple primero.** Pensada para adultos mayores: pocas pantallas, texto grande, acciones principales en pocos toques.
2. **Sin conexión por defecto.** Todo vive en el teléfono; internet nunca es necesario.
3. **Siempre hay un precio.** Ningún ítem queda sin valor: se usa el último precio del sitio, luego el de la etiqueta madre, luego la referencia de la base.
4. **El precio real manda.** Lo que el usuario anota después de comprar reemplaza a la estimación para ese sitio.
5. **No perder datos del usuario.** Los cambios a la base de ítems o a las etiquetas no alteran el historial ya registrado.

## 3. Enfoque tecnológico

Pendiente: `/tech-stack` definirá el framework (iOS y Android con un solo código), el almacenamiento local, la generación y lectura de códigos QR y la compilación para iPhone desde Windows.

## 4. Propiedades de correctitud

Cada propiedad indica qué requisitos valida.

1. Para cualquier lista, el total estimado es igual a la suma de los subtotales de sus ítems. (REQ-07)
2. Para cualquier ítem con unidad kg, 1/2 kg o 1/4 kg, el subtotal es precio por kg × cantidad × (1, 0,5 o 0,25). Con unidad "cantidad" es precio × cantidad. (REQ-03)
3. Para cualquier ítem de una lista, existe un precio estimado; nunca es vacío. (REQ-07)
4. Para cualquier ítem en la estimación por defecto, el precio sigue el orden: último precio del mismo sitio, luego de la misma etiqueta madre, luego la referencia. (REQ-07)
5. Para cualquier cambio del precio de referencia, los precios del historial no cambian. (REQ-05)
6. Para cualquier lista, tiene exactamente una etiqueta madre y cero o más de sitio. (REQ-02)
7. Para cualquier eliminación de una etiqueta de sitio, las listas y el historial asociados se conservan. (REQ-02)
8. Para cualquier lista exportada por QR e importada, el contenido (ítems, cantidades y precios) es idéntico al original. (REQ-11)
9. Para cualquier respaldo exportado y restaurado, los datos resultantes son equivalentes a los originales. (REQ-12)
10. Para cualquier operación del MVP, se completa sin acceso a internet. (REQ-10)

## 5. Flujos de lógica de negocio

### Flujo: Armar una lista
- **Trigger:** el usuario crea una lista o duplica una anterior.
- **Precondiciones:** existen las etiquetas madre.

1. El usuario nombra la lista y elige la etiqueta madre y, si quiere, una o más de sitio.
2. El usuario agrega ítems escribiendo el nombre y eligiendo una sugerencia del autocompletado.
3. Para cada ítem elige cantidad y unidad.
4. La app asigna el precio estimado por defecto.
5. La app muestra el total estimado.

**Postcondiciones:** la lista tiene ítems con precio estimado y un total.

### Flujo: Estimar el precio de un ítem
- **Trigger:** se agrega un ítem a una lista o se recalcula.

1. Buscar el último precio registrado en la misma etiqueta de sitio.
2. Si no hay, buscar el último precio en otra lista con la misma etiqueta madre.
3. Si no hay, usar el precio de referencia de la base de ítems.

**Postcondiciones:** el ítem tiene un precio.

### Flujo: Comprar y registrar precios
- **Trigger:** el usuario compra un producto de la lista.

1. El usuario ve el ítem con el precio prellenado.
2. Confirma con un toque o corrige el precio.
3. La app guarda el precio con fecha y etiquetas.
4. Al terminar, puede usar el cierre de compra para confirmar o corregir los precios pendientes.
5. El usuario marca la lista como usada y se guarda la fecha de uso.

**Postcondiciones:** los precios quedan en el historial y se usarán en estimaciones futuras de ese sitio.

### Flujo: Estimación manual
- **Trigger:** el usuario edita a mano los precios de una lista.

1. La app habilita la estimación manual de esa lista.
2. El usuario alterna entre estimación por defecto y manual.

**Postcondiciones:** la lista muestra el total elegido; la base de ítems no cambia.

### Flujo: Comparar precios
- **Trigger:** el usuario abre la sección de comparativas.

1. Elige la etiqueta madre (Feria o Supermercado).
2. Opcionalmente filtra por etiqueta de sitio.
3. Busca un ítem.
4. La app muestra el historial, la gráfica y la variación en % y en pesos.
5. Si hay menos de dos precios, indica que faltan datos.

### Flujo: Compartir una lista por QR
- **Trigger:** el usuario elige compartir una lista.

1. La app genera un QR con ítems, cantidades y precios.
2. Otro usuario escanea el QR.
3. La app importa la lista como nueva, sin tocar las existentes.

**Postcondiciones:** ambas personas tienen la lista de forma independiente.

### Flujo: Respaldar y restaurar
- **Trigger:** el usuario exporta o importa un respaldo.

1. Exportar: la app crea un archivo con todos los datos y el usuario lo guarda o lo envía.
2. Restaurar: el usuario selecciona el archivo, la app pide confirmación y reemplaza los datos.

## 6. Estrategia de manejo de errores

Filosofía: **no perder el trabajo del usuario y explicar los problemas en lenguaje simple.**

| Error | Respuesta del sistema |
|---|---|
| Precio inválido (vacío, negativo o no numérico) | Mantener el valor anterior y pedir un número válido. |
| Ítem sin precio de referencia al crearlo | Pedir un precio de referencia antes de guardarlo. |
| QR ilegible o de otro origen | Mostrar un mensaje claro y no importar nada. |
| Lista demasiado grande para un QR | Dividir en varios códigos o avisar al usuario. |
| Archivo de respaldo inválido o dañado | No modificar los datos actuales y mostrar un mensaje. |
| Falla al guardar localmente | Avisar y reintentar sin cerrar la pantalla. |
| Falta de datos para la gráfica | Mostrar "faltan datos" en lugar de un gráfico vacío. |

## 7. Estrategia de pruebas

- **Pruebas unitarias:** cálculo de subtotales (kg, fracciones, cantidad), orden de la estimación por defecto, variación porcentual, reglas de etiquetas.
- **Pruebas basadas en propiedades:** las propiedades de la sección 4, con listas e historiales generados al azar (el total siempre es la suma de subtotales; siempre hay un precio; cambiar la referencia no cambia el historial; exportar e importar conserva el contenido).
- **Pruebas de integración:** guardado local, importar y exportar respaldo, QR de ida y vuelta.
- **Pruebas manuales con usuarios reales:** la familia usa la app 3 a 4 viernes (A1, A4), se mide cuántos precios se registran y qué tan cerca queda el total del gasto real (A2).
- **Dispositivos:** al menos un iPhone y un Android, incluidos los de los familiares.
