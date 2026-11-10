# Plan de implementación: Lista de Feria

## 1. Visión general

Se construirá una app móvil (iOS y Android) con React Native y Expo, que guarda todo en el teléfono con SQLite, sin servidor ni cuentas. El plan avanza de abajo hacia arriba: primero la base del proyecto y los datos, luego la lógica de precios (que se prueba de forma aislada), después las pantallas, y al final compartir, respaldo, pruebas completas y preparación para tiendas.

Documentos de referencia: `requirements.md`, `design.md`, `technology_decisions.md`.

## 2. Fase 0: Decisiones tecnológicas (completa)

Ver `technology_decisions.md` (TD-001 a TD-006): Expo, SQLite + Drizzle, Windows con Expo Go, gráficas y QR, pruebas con Jest, fast-check y Maestro, y React Native Paper con modo grande.

## 3. Fases de construcción

### Fase 1: Base del proyecto
- **Goal**: Dejar un proyecto que corre en Expo Go con la estructura, el tema visual y las herramientas de pruebas listos.
- **Tasks**:
  1. Ejecutar `git init` y crear `.gitattributes` (saltos de línea LF) y `.gitignore`.
  2. Crear el proyecto Expo con TypeScript y navegación entre pantallas.
  3. Instalar React Native Paper y crear el tema claro y oscuro.
  4. Crear el interruptor "Texto y botones grandes" en ajustes, con las dos escalas de tamaño guardadas (REQ-13).
  5. Configurar Jest, `jest-expo`, React Native Testing Library y `fast-check`, con una prueba de ejemplo.
  6. Crear la estructura de carpetas y el archivo central de textos en español.
  7. Verificar que la app abre en un Android (emulador) y en un iPhone con Expo Go.
- **Deliverable**: App vacía con navegación, tema, interruptor de tamaño grande y pruebas funcionando.
- **Requisitos:** REQ-13

### Fase 2: Modelo de datos
- **Goal**: Definir cómo se guardan los datos y poder leerlos y escribirlos de forma segura.
- **Tasks**:
  1. Instalar `expo-sqlite` y Drizzle ORM, con migraciones.
  2. Crear las tablas: etiquetas (madre y de sitio, con color), listas, relación lista-etiquetas, base de ítems (con precio de referencia), ítems de lista y registro de precios (con fecha y etiquetas).
  3. Crear las dos etiquetas madre "Feria" y "Supermercado" en la primera apertura.
  4. Escribir funciones para crear, leer, editar y borrar cada entidad.
  5. Probar que eliminar una etiqueta de sitio conserva listas e historial (propiedad 7).
- **Deliverable**: Base de datos local con acceso probado por pruebas automáticas.
- **Requisitos:** REQ-01, REQ-02, REQ-10

### Fase 3: Lógica de precios
- **Goal**: Tener el cálculo de subtotales, estimación y variación como funciones puras y bien probadas.
- **Tasks**:
  1. Cálculo de subtotal por unidad (cantidad, kg, 1/2 kg y 1/4 kg) (REQ-03).
  2. Estimación por defecto en el orden: sitio, etiqueta madre, referencia (REQ-07).
  3. Total de la lista y estimación manual por lista (REQ-07).
  4. Cálculo de variación en % y en pesos entre precios (REQ-08).
  5. Pruebas unitarias y basadas en propiedades con `fast-check` (propiedades 1 a 5).
- **Deliverable**: Módulo de lógica de precios con pruebas que pasan.
- **Requisitos:** REQ-03, REQ-07, REQ-08

### Fase 4: Base de ítems y autocompletado
- **Goal**: Que el usuario encuentre ítems al escribir y pueda ajustar sus precios de referencia.
- **Tasks**:
  1. Investigar y armar la lista inicial de ítems de feria por temporada en Chile y de supermercado, con nombres genéricos sin marca (primero los ítems, después los precios).
  2. Definir precios de referencia aproximados y cargar la base en la primera apertura.
  3. Autocompletado con tolerancia a mayúsculas, tildes y errores de tipeo.
  4. Pantalla para buscar un ítem y modificar su precio de referencia sin tocar el historial.
  5. Agregar ítems propios, pidiendo precio de referencia.
- **Deliverable**: Base de ítems cargada, con búsqueda y edición de referencia.
- **Requisitos:** REQ-04, REQ-05

### Fase 5: Listas, etiquetas e ítems
- **Goal**: Que el usuario pueda armar listas completas con total estimado.
- **Tasks**:
  1. Pantalla de listas: crear, renombrar, eliminar y duplicar (REQ-01).
  2. Elegir etiqueta madre y etiquetas de sitio, con nombre y color (REQ-02).
  3. Agregar ítems a una lista con cantidad, unidad y precio estimado (REQ-03).
  4. Mostrar el total estimado y alternar entre estimación por defecto y manual (REQ-07).
  5. Verificar las pantallas con el modo de texto grande activado.
- **Deliverable**: Se puede armar y editar una lista completa con total estimado.
- **Requisitos:** REQ-01, REQ-02, REQ-03, REQ-07, REQ-13

### Fase 6: Compra y registro de precios
- **Goal**: Que anotar el precio después de comprar sea rápido y confiable.
- **Tasks**:
  1. Vista de compra: cada ítem con precio prellenado y confirmación con un toque (REQ-06).
  2. Corrección de precio durante la compra.
  3. Cierre de compra para confirmar todos los precios juntos.
  4. Guardar cada precio con fecha y etiquetas, y marcar la lista como usada con su fecha (REQ-01, REQ-06).
- **Deliverable**: Flujo completo de compra que alimenta el historial de precios.
- **Requisitos:** REQ-01, REQ-06

### Fase 7: Historial, gráficas y comparativas
- **Goal**: Mostrar cómo cambian los precios.
- **Tasks**:
  1. Historial de precios por ítem con último precio y fecha (REQ-08).
  2. Gráfica de evolución con `react-native-gifted-charts`, con variación en % y en pesos.
  3. Mensaje de "faltan datos" cuando hay menos de dos precios.
  4. Sección de comparativas por etiqueta madre, con filtro opcional por etiqueta de sitio (REQ-09).
- **Deliverable**: Gráficas e historial utilizables.
- **Requisitos:** REQ-08, REQ-09

### Fase 8: Compartir por QR y respaldo
- **Goal**: Poder pasar una lista a otro teléfono y respaldar los datos.
- **Tasks**:
  1. Generar el QR de una lista con sus ítems, cantidades y precios (REQ-11).
  2. Dividir en varios códigos si la lista no cabe en uno.
  3. Escanear un QR con `expo-camera` e importar la lista como nueva.
  4. Exportar e importar el respaldo completo en un archivo, con confirmación antes de reemplazar datos (REQ-12).
  5. Pruebas de ida y vuelta (propiedades 8 y 9).
- **Deliverable**: Compartir por QR y respaldo manual funcionando.
- **Requisitos:** REQ-11, REQ-12

### Fase 9: Pulido, pruebas completas y preparación
- **Goal**: Dejar la app lista para uso real y, si se decide, para las tiendas.
- **Tasks**:
  1. Pruebas de extremo a extremo con Maestro en el emulador de Android (flujos principales).
  2. Revisar accesibilidad: contraste, tamaños y modo grande en todas las pantallas (REQ-13).
  3. Revisar mensajes de error según `design.md`.
  4. Generar un build de prueba con EAS para iPhone y Android.
  5. Prueba real con la familia durante 3 a 4 viernes: medir precios registrados (A1), facilidad para tus padres (A4) y cercanía del total al gasto real (A2).
  6. Opcional, según el resultado: preparar la publicación (cuentas de desarrollador, política de privacidad, íconos y capturas).
- **Deliverable**: App probada y lista para uso familiar, con datos reales sobre los supuestos de riesgo.
- **Requisitos:** REQ-10, REQ-13 y validación de A1, A2, A4

## 4. Dependencias entre fases

```
Fase 1 -> Fase 2 -> Fase 3 -> Fase 5 -> Fase 6 -> Fase 7 -> Fase 8 -> Fase 9
                 \-> Fase 4 -/
```

- La Fase 3 depende de las tablas de la Fase 2.
- La Fase 4 (base de ítems) puede avanzar en paralelo con la 3, pero la Fase 5 necesita ambas.
- Las fases 6, 7 y 8 se apoyan en el modelo de datos y las pantallas de la Fase 5.

## 5. Riesgos y mitigación

| Riesgo | Mitigación |
|---|---|
| Anotar precios en el puesto es una carga (A1) | Precio prellenado con confirmación de un toque y cierre de compra en casa (Fase 6). Medir en las pruebas con la familia. |
| Interfaz difícil para algunos usuarios (A4) | Interruptor de texto y botones grandes, pocas pantallas, probar con tus padres desde la Fase 5. |
| Estimación poco precisa (A2) | Comunicar que es una estimación, permitir la estimación manual y medir contra el gasto real. |
| Perder el historial por una migración mal hecha | Migraciones con Drizzle, pruebas de datos y respaldo manual antes de cambios de estructura. |
| Un QR no alcanza para listas largas | Dividir en varios códigos (Fase 8) y probar con listas largas reales. |
| Una librería no funciona en Expo Go | Pasar a builds de desarrollo en EAS para esa librería. |
| Sin simulador de iPhone en Windows | Probar en un iPhone físico con Expo Go y builds EAS; Maestro solo en Android. |
| Precios de referencia desactualizados | Pantalla para editarlos (REQ-05) y recordatorio de revisarlos al iniciar la temporada. |

## 6. Criterios de éxito

- [ ] Los 13 requisitos de `requirements.md` están implementados y verificados.
- [ ] Las 10 propiedades de `design.md` tienen pruebas automáticas que pasan.
- [ ] La app funciona sin conexión en iPhone y en Android.
- [ ] La familia la usa en la compra semanal durante varias semanas.
- [ ] El total estimado se acerca al gasto real (meta de ±15%, a confirmar con datos).
- [ ] Hay historial suficiente para ver variaciones de precios en gráficas.
- [ ] Resulta satisfactoria de usar para familiares y cercanos.

## 7. Maintenance

### Actualización de dependencias

**Dependabot** (si el repositorio se sube a GitHub; crear `.github/dependabot.yml` en la Fase 1):
- Frecuencia: `monthly`.
- Agrupar las dependencias en un solo PR por ecosistema (npm y github-actions).
- `open-pull-requests-limit: 5`.

**Auto-merge** (`.github/workflows/dependabot-auto-merge.yml`):
- Fusionar automáticamente las actualizaciones de parche y menores cuando las pruebas pasen (squash).
- Las actualizaciones mayores requieren revisión manual.
- Usar `dependabot/fetch-metadata` para detectar el tipo de actualización.

**Versiones**:
- Usar versiones compatibles (`^3.2.0` en npm).
- Mantener exactas solo las herramientas cuyo comportamiento rompe el build.
- Las versiones de Expo, React Native y sus librerías se actualizan juntas con `npx expo install --fix`, siguiendo el SDK de Expo.

### Ciclo trimestral

Un día cada tres meses:
1. Fusionar el PR agrupado de Dependabot pendiente.
2. Revisar si hay un SDK de Expo nuevo y las fechas de fin de soporte de Node y del SDK en uso.
3. Revisar anuncios de Expo/EAS, Apple y Google (por ejemplo cambios de requisitos para publicar).
4. Ejecutar todas las pruebas y generar un build de prueba.

**Excepción**: avisos de seguridad críticos o altos se atienden en una semana.

### Qué no necesita actualizaciones frecuentes
- La versión de Node: una vez al año o cuando se acerque su fin de soporte.
- Herramientas de desarrollo (linters, formateadores): solo si bloquean algo.
- Cuentas de tiendas: solo si se publica; renovar la cuota anual de Apple.

---

## Notas de ejecución de la Fase 2 para las fases siguientes

Salieron de las dos revisiones adversariales de la Fase 2. Ninguna bloquea esta fase.

- **Fase 6 (comprar y registrar precios):** hoy `recordPrice` registra un precio contra una lista y un ítem de la base, pero no exige que el ítem esté en esa lista, y ninguna función marca `is_purchased` / `purchased_price` de un ítem de lista. Hace falta una operación atómica "marcar comprado y registrar el precio" (una transacción) que valide que el ítem pertenece a la lista.
- **Fase 3 y posteriores (migraciones):** `PRAGMA foreign_keys = ON` se activa antes de migrar. Una migración futura que reconstruya una tabla de SQLite necesitará un manejo especial de las claves foráneas, y SQLite ignora `foreign_keys = OFF` dentro de la transacción de la migración. Planificarlo antes de la primera migración que reconstruya tablas.
- **Pantalla de error de base de datos:** no tiene botón "Reintentar"; ante un fallo al abrir la base hay que reiniciar la app. El cliente ya permite reintentar (no guarda la conexión si falla), solo falta la acción en la interfaz.
- **Reglas solo en el código (no en CHECK de la base):** formato de color `#RRGGBB`, que `lists.parent_tag_id` apunte a una etiqueta madre y que `list_site_tags.tag_id` apunte a una de sitio. Hoy las garantizan los repositorios; cualquier escritura nueva debe pasar por ellos.
- **Límites de validación:** precio de 1 a 100.000.000 pesos; cantidad de 0,001 a 100.000; nombres de hasta 60 caracteres.
- **Reutilización:** `sql.js` + `createTestDb` + `createSeededDb` (en `src/db/testing/`) son la base para probar cualquier consulta nueva.

---

## Notas de ejecución de la Fase 3 para las fases siguientes

La lógica de precios vive en `src/logic/` (importar desde `@/logic`). Son funciones puras: no leen la base ni la pantalla.

- **Fase 5 (listas): conectar la base con la lógica.** Las filas de la Fase 2 no encajan tal cual; hace falta una pequeña función de traspaso (fuera de `src/logic/`, que debe seguir siendo pura):
  - `PriceRecordWithSites` (de `getPriceHistory`) ya sirve como `PricePoint`, sin conversión.
  - `CatalogItem` → `ReferencePrice`: `{ price: referencePrice, defaultUnit }`.
  - `ListItem` → `EstimateLineInput`: `itemId` es el `id`, `history` sale de `getPriceHistory(db, catalogItemId)` (sin filtros) y `reference` del ítem de la base.
  - `EstimateContext`: `{ parentTagId, siteTagIds }` de la lista.
- **Fase 5: errores por ítem.** Las funciones lanzan `RangeError` ante datos corruptos (por ejemplo, un registro de historial mal formado). Un solo ítem dañado haría fallar toda la estimación de la lista: la pantalla debe capturar el error por ítem y mostrar un aviso, sin dejar la lista en blanco.
- **Fase 5: `list_items.unit_price`.** La estimación por defecto se recalcula siempre desde el historial y la referencia, y no lee `unit_price`. Hay que decidir qué hace esa columna: refrescarla al agregar un ítem, o dejar de usarla.
- **Fase 5 y 6: mostrar la estimación.** `estimate.basisMismatch` indica que se usó una referencia expresada en otra base (por kilo contra por unidad): conviene avisar "revisa este precio". `estimate.source` (`site`, `parent`, `reference`) y `recordedDate` permiten explicar de dónde sale cada precio. REQ-07.6 (indicar que el total es una estimación) lo resuelve la pantalla.
- **Fase 7: gráficas y comparativas.** `summarizeHistory(puntos, base)` entrega los puntos ordenados, la variación entre compras y el último precio; `roundPercent` formatea el porcentaje para mostrarlo. Un ítem puede tener historial por kilo y por unidad: se resumen por separado y la pantalla debe elegir la base (por defecto, la de la unidad habitual del ítem).
- **Reglas de cálculo que la interfaz no debe contradecir:**
  - Los subtotales se redondean al peso, con el .5 hacia arriba, y el total es la suma de subtotales ya redondeados.
  - La cantidad se toma con hasta 6 decimales y un ítem de precio y cantidad mínimos puede valer 0 pesos.
  - Todos los niveles de la estimación exigen la misma etiqueta madre; el nivel "sitio" además exige compartir una etiqueta de sitio.
  - Los precios del historial de otra base (kilo o unidad) no se mezclan.
- **Formato de fechas:** las funciones exigen fechas `AAAA-MM-DD` válidas (como las que guarda la Fase 2) e instantes ISO 8601; rechazan años 0000 a 0099, igual que la capa de datos.
