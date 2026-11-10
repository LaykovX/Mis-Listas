# Requisitos: Lista de Feria

## 1. Introducción

**Lista de Feria** es una app móvil para iOS y Android que permite armar listas de compras para ferias y supermercados, registrar los precios pagados y estimar cuánto efectivo llevar a la próxima compra.

El origen es una familia chilena que va cada viernes a la feria, paga en efectivo y hoy usa listas en papel o notas del celular. Las listas se pierden y nadie recuerda cuánto costaba cada producto, así que no saben cuánto dinero llevar, lo que además implica un riesgo por posibles robos.

La app será de uso personal y familiar al inicio, con la intención de publicarla en App Store y Google Play si resulta satisfactoria. Se prioriza Chile (pesos chilenos, español, productos de feria), dejando abierta la posibilidad de otros países.

**Criterios de éxito (a 6 meses):**
1. La familia la usa de forma regular en la compra semanal, en lugar del papel.
2. El total estimado se acerca al gasto real.
3. El historial de precios permite ver qué ítems subieron o bajaron en varias semanas.
4. Resulta satisfactoria de usar para familiares y cercanos.

## 2. Glosario

| Término | Definición |
|---|---|
| Lista | Conjunto de ítems a comprar, con nombre, fecha de creación, fecha de uso y etiquetas. |
| Ítem | Producto en una lista (por ejemplo, tomate). Nombre genérico, sin marca. |
| Base de ítems | Catálogo inicial de productos de feria y supermercado, con un precio de referencia, editable por el usuario. |
| Precio de referencia | Valor de partida de un ítem en la base de ítems. Garantiza que siempre exista un precio para estimar. |
| Etiqueta madre | Etiqueta incluida en la app: "Feria" o "Supermercado". Toda lista pertenece a una. |
| Etiqueta de sitio | Etiqueta creada por el usuario con nombre y color (por ejemplo, "feria las condes", verde). Una lista puede tener una o más. |
| Unidad de venta | Forma de comprar un ítem: cantidad (unidades), kilogramo, 1/2 kg o 1/4 kg. |
| Estimación por defecto | Total calculado automáticamente con la regla de precios (ver REQ-07). |
| Estimación manual | Total calculado con los precios que el usuario edita a mano en una lista. |
| Cierre de compra | Pantalla donde se confirman o corrigen todos los precios de una compra al terminar. |
| Comparativa | Sección que muestra la evolución de precios entre listas de una misma etiqueta madre. |

## 3. Fuera de alcance (MVP)

- Edición de una misma lista por varias personas en tiempo real, y cuentas de usuario (se planifica para después, con cuentas de Google).
- Respaldo automático en la nube (después del respaldo manual).
- Precios en tiempo real desde tiendas o ferias.
- Marcas de productos.
- Pagos o compras dentro de la app.

## 4. Requisitos

### REQ-01 Crear y gestionar listas
**Traces to:** A1, A4

Como comprador, quiero crear varias listas de compras y reutilizar las anteriores, para no escribir todo de nuevo cada semana.

1. THE System SHALL permitir crear una lista con un nombre y registrar automáticamente su fecha de creación.
2. THE System SHALL permitir tener múltiples listas.
3. THE System SHALL permitir editar el nombre de una lista y eliminarla.
4. THE System SHALL permitir duplicar una lista existente para reutilizarla.
5. THE System SHALL permitir marcar una lista como usada y guardar la fecha en que se usó.

### REQ-02 Etiquetas madre y de sitio
**Traces to:** A3, A9

Como comprador, quiero clasificar mis listas por tipo y por lugar, para comparar precios de forma ordenada.

1. THE System SHALL incluir las etiquetas madre "Feria" y "Supermercado" desde la primera apertura.
2. THE System SHALL exigir que cada lista tenga una etiqueta madre.
3. THE System SHALL permitir crear etiquetas de sitio con un nombre y un color elegido por el usuario.
4. THE System SHALL permitir asignar a una lista una o más etiquetas de sitio, además de la etiqueta madre.
5. THE System SHALL permitir renombrar, cambiar el color y eliminar etiquetas de sitio.
6. WHEN una etiqueta de sitio es eliminada, THE System SHALL conservar las listas y su historial de precios.

### REQ-03 Ítems en la lista
**Traces to:** A1, A2

Como comprador, quiero agregar ítems con cantidad, unidad y precio, para conocer el costo de mi compra.

1. THE System SHALL permitir agregar a una lista un ítem con nombre, cantidad, unidad de venta y precio.
2. THE System SHALL ofrecer como unidades de venta: cantidad (unidades), kilogramo, 1/2 kg y 1/4 kg.
3. WHEN la unidad es kilogramo, 1/2 kg o 1/4 kg, THE System SHALL interpretar el precio como precio por kilogramo y calcular el subtotal como precio × cantidad × 1, 0,5 o 0,25 según la unidad.
4. WHEN la unidad es cantidad, THE System SHALL interpretar el precio como precio por unidad y calcular el subtotal como precio × cantidad.
5. THE System SHALL permitir editar y eliminar ítems de una lista.
6. THE System SHALL mostrar precios en pesos chilenos sin decimales.

### REQ-04 Base de ítems y autocompletado
**Traces to:** A8

Como comprador, quiero encontrar ítems rápido al escribir, para armar la lista con pocos toques.

1. THE System SHALL incluir una base inicial de ítems de feria (frutas y verduras más compradas por temporada en Chile) y de supermercado, con nombres genéricos sin marca.
2. WHEN el usuario escribe parte del nombre de un ítem, THE System SHALL sugerir coincidencias de la base de ítems.
3. THE System SHALL tolerar mayúsculas, tildes y errores de tipeo menores al buscar.
4. THE System SHALL permitir agregar ítems propios a la base de ítems.
5. WHEN el usuario agrega un ítem propio sin precio de referencia, THE System SHALL pedirle un precio de referencia.

### REQ-05 Editar la base de ítems
**Traces to:** A8, A2

Como comprador, quiero ajustar el precio de referencia de un ítem, para que la estimación refleje los precios actuales.

1. THE System SHALL ofrecer una sección para buscar un ítem de la base y modificar su precio de referencia.
2. WHEN el usuario cambia el precio de referencia, THE System SHALL aplicar el nuevo valor a futuras estimaciones.
3. WHEN el usuario cambia el precio de referencia, THE System SHALL NOT modificar los precios ya registrados en compras anteriores.

### REQ-06 Registrar precios después de comprar
**Traces to:** A1, A4

Como comprador, quiero anotar el precio de cada producto justo después de comprarlo, para que el dato sea fresco y acertado.

1. THE System SHALL mostrar cada ítem con el precio prellenado y permitir confirmarlo con un toque.
2. THE System SHALL permitir corregir el precio de un ítem durante la compra.
3. THE System SHALL ofrecer un cierre de compra para confirmar o corregir todos los precios de una lista juntos.
4. WHEN el usuario registra un precio, THE System SHALL guardarlo con la fecha y las etiquetas de la lista, y usarlo como precio vigente para ese ítem en esas etiquetas.
5. THE System SHALL permitir registrar precios sin conexión a internet.

### REQ-07 Estimación del total
**Traces to:** A2, A7

Como comprador, quiero ver cuánto efectivo debo llevar, para no cargar dinero de más.

1. THE System SHALL mostrar el total estimado de una lista como la suma de los subtotales de sus ítems.
2. THE System SHALL determinar el precio de cada ítem en la estimación por defecto en este orden: (a) el último precio registrado en la misma etiqueta de sitio, (b) el último precio registrado en otra lista con la misma etiqueta madre, (c) el precio de referencia de la base de ítems.
3. THE System SHALL siempre contar con un precio para cada ítem.
4. WHEN el usuario edita manualmente los precios de una lista, THE System SHALL habilitar una estimación manual para esa lista.
5. WHERE existe una estimación manual, THE System SHALL permitir alternar entre la estimación por defecto y la manual.
6. THE System SHALL indicar claramente que el total es una estimación.

### REQ-08 Historial y gráfica de precios
**Traces to:** A3

Como comprador, quiero ver cómo cambió el precio de un ítem, para saber si subió o bajó.

1. THE System SHALL guardar el historial de precios de cada ítem con su fecha y etiquetas.
2. THE System SHALL mostrar el último precio de un ítem y la fecha en que se registró.
3. THE System SHALL mostrar una gráfica de la evolución del precio de un ítem a lo largo del tiempo.
4. THE System SHALL mostrar la variación entre compras en porcentaje y en pesos.
5. WHEN un ítem tiene menos de dos precios registrados, THE System SHALL indicar que faltan datos para mostrar la variación.

### REQ-09 Sección de comparativas
**Traces to:** A3

Como comprador, quiero comparar precios entre mis compras, para ver cómo va el mercado.

1. THE System SHALL ofrecer una sección de comparativas por etiqueta madre ("Feria" o "Supermercado").
2. THE System SHALL comparar los precios y fechas de un mismo ítem entre todas las listas de la misma etiqueta madre.
3. THE System SHALL mostrar la variación en porcentaje y en pesos con gráfica.
4. WHERE el usuario filtra por una etiqueta de sitio, THE System SHALL limitar la comparativa a ese sitio.

### REQ-10 Funcionamiento sin conexión
**Traces to:** A6

Como comprador en la feria, quiero usar la app sin internet, para que funcione donde no hay señal.

1. THE System SHALL guardar todos los datos en el teléfono.
2. THE System SHALL ofrecer todas las funciones del MVP sin conexión a internet.

### REQ-11 Compartir una lista por código QR
**Traces to:** A5

Como comprador, quiero compartir una lista con un familiar, para que la tenga en su teléfono.

1. THE System SHALL generar un código QR con el contenido de una lista.
2. WHEN la lista tiene precios y cantidades definidos, THE System SHALL incluirlos en el código QR.
3. THE System SHALL permitir importar una lista escaneando un código QR.
4. WHEN se importa una lista, THE System SHALL crearla como una lista nueva sin modificar las existentes.
5. THE System SHALL funcionar sin conexión a internet.

### REQ-12 Respaldo manual
**Traces to:** A2, A3

Como comprador, quiero respaldar mis datos, para no perder el historial si cambio de teléfono.

1. THE System SHALL permitir exportar todos los datos (listas, etiquetas, historial y base de ítems) a un archivo.
2. THE System SHALL permitir importar ese archivo en otro teléfono para restaurar los datos.
3. WHEN se restaura un respaldo, THE System SHALL pedir confirmación antes de reemplazar los datos existentes.

### REQ-13 Usabilidad para todos los usuarios
**Traces to:** A4

Como adulto mayor, quiero usar la app sin ayuda, para armar y usar mis listas de forma autónoma.

1. THE System SHALL ofrecer texto y botones de tamaño grande y legibles.
2. THE System SHALL permitir completar las acciones principales (crear lista, agregar ítem, confirmar precio) en pocos toques.
3. THE System SHALL estar en español.
4. THE System SHALL funcionar en iPhone y en Android.

## 5. Supuestos y preguntas pendientes

- **Capacidad del QR (supuesto):** un código QR guarda poca información. Se asume que comparte la lista actual con sus cantidades y precios, no el historial; si excede el límite, se divide en varios códigos. Falta validar con listas reales.
- **Base inicial de ítems:** falta investigar qué frutas y verduras más compradas por temporada incluir y sus precios de referencia (primero la lista de ítems, después los precios).
- **Estimación manual:** se asume que vale para esa lista y no modifica la base de ítems. Se confirma al implementar.
- **Fraccionamiento:** 1/2 y 1/4 se asumen como fracciones de kilo.
- **Futuro:** edición compartida en tiempo real con cuentas de Google y respaldo automático en la nube.
