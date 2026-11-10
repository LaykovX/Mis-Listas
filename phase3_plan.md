# Phase 3: Lógica de precios

## Summary

| # | Task | Requirements |
|---|------|-------------|
| 1 | Subtotal por unidad de venta | REQ-03.2, REQ-03.3, REQ-03.4 |
| 2 | Estimación de precio por defecto (sitio, etiqueta madre, referencia) | REQ-07.2, REQ-07.3 |
| 3 | Total de la lista y estimación manual | REQ-07.1, REQ-07.3, REQ-07.4, REQ-07.5 |
| 4 | Variación de precios en % y en pesos, y resumen del historial | REQ-08.2, REQ-08.4, REQ-08.5 |
| 5 | Pruebas de propiedades (design.md 1 a 5), guardia de pureza y mutaciones | REQ-03, REQ-05.3, REQ-07, REQ-08 |

## Dependencies

- [ ] Fase 2 commiteada en `main` (commit `2a3d9d2`): `npm test` pasa 241/241 y `npx tsc --noEmit` limpio.
- [ ] `fast-check` ya instalado (Fase 1). No hay paquetes nuevos ni migraciones.
- [ ] Verificación en teléfono: ninguna. Esta fase no cambia nada visible; son funciones puras que usarán las fases 5 a 7.

---

## Decisiones de diseño (fijadas en este plan)

- **Código puro:** todo vive en `src/logic/` como funciones sin efectos secundarios. No importa `drizzle-orm`, `expo-*`, `react*` ni nada de `src/db/` salvo `@/db/constants` (solo constantes y la función `priceBasisOf`, sin base de datos). Define sus propios tipos de entrada (`PricePoint`, etc.) para no depender de las filas de la base; las filas de la Fase 2 (`PriceRecordWithSites`, `ListItem`, `CatalogItem`) los cumplen estructuralmente.
- **Redondeo de pesos:** cada subtotal se redondea al peso entero más cercano, con .5 hacia arriba (`Math.round`). El total es la suma de subtotales **ya redondeados**, así que siempre vale exactamente la suma de las líneas (propiedad 1 de design.md), sin diferencias de 1 peso. Ejemplo: 850 por kg × 3 porciones de 1/4 kg = 637,5, que se redondea a 638.
- **Entradas inválidas:** las funciones lanzan `RangeError` (nunca devuelven NaN ni un valor inventado) si reciben un precio no entero o menor que 1, una cantidad no finita o menor o igual a 0, o una unidad desconocida. Es la filosofía "fallar fuerte ante datos corruptos" de design.md. La validación amable para el usuario es de la capa de datos (Fase 2) y de las pantallas.
- **"Último" precio:** el de mayor `recordedDate`; si empatan, el de mayor `recordedAt`; si empatan, el de mayor `id`. Los registros de la propia lista actual también cuentan: un precio que acabas de pagar es el dato más fresco (interpretación de REQ-07.2 b, que dice "otra lista").
- **Etiqueta de sitio:** un registro coincide con el sitio si comparte **al menos una** etiqueta de sitio con la lista. Si una lista no tiene etiquetas de sitio, el nivel "sitio" se salta.
- **Base del precio:** el precio de un ítem es por kilo para `kg`, `half_kg` y `quarter_kg`, y por unidad para `unit` (REQ-03.3, REQ-03.4). Al estimar solo se usan registros históricos con la **misma base** que la unidad del ítem; no se mezclan precios por kilo con precios por unidad.
- **Referencia con base distinta:** el precio de referencia vale por la base de la `defaultUnit` del ítem de la base. Si no coincide con la base de la unidad elegida en la lista, igual se usa (REQ-07.3 exige que siempre haya precio), pero la estimación se marca con `basisMismatch: true` para que la interfaz pueda avisar "revisa este precio".
- **Estimación manual:** el total manual usa el precio manual de los ítems que lo tienen y el precio por defecto de los demás. Si ningún ítem tiene precio manual, no hay estimación manual (`manualTotal = null`, REQ-07.4).
- **`list_items.unit_price` no se usa aquí:** la estimación por defecto se recalcula cada vez desde el historial y la referencia, así una lista duplicada no arrastra precios viejos. Qué hacer con la columna guardada lo decide la Fase 5.
- **Variación:** `amount = actual - anterior` (pesos enteros) y `percent = amount / anterior × 100` (número sin redondear; la pantalla lo formatea). El precio anterior es siempre >= 1, así que no hay división por cero. La dirección es `up`, `down` o `same`.
- **Historial con dos bases:** un mismo ítem puede tener precios por kilo y por unidad. `summarizeHistory` recibe la base a resumir y solo compara registros de esa base.

---

## Tasks

### Task 1: Subtotal por unidad de venta

**What:** Calcular el subtotal en pesos enteros de un ítem según su cantidad, unidad y precio.

**Files:**
- Create: `src/logic/pricingGuards.ts` — funciones internas que lanzan `RangeError` con mensaje claro: `assertPrice`, `assertQuantity`, `assertUnit` (reutilizan `UNITS` de `@/db/constants`).
- Create: `src/logic/calcSubtotal.ts` — `calcSubtotal({ unitPrice, quantity, unit })` que devuelve un entero de pesos.
- Create: `src/logic/calcSubtotal.test.ts`.

**AC:**
- [ ] Con unidad `kg`, `half_kg` o `quarter_kg`, el precio se interpreta por kilo y el subtotal es `precio × cantidad × (1, 0,5 o 0,25)`, redondeado al peso (REQ-03.3). Ejemplos: 1.000 por kg × 2 `half_kg` = 1.000; 900 por kg × 1 `quarter_kg` = 225; 850 por kg × 3 `quarter_kg` = 638.
- [ ] Con unidad `unit`, el subtotal es `precio × cantidad`, redondeado (REQ-03.4). Ejemplo: 300 × 12 = 3.600.
- [ ] Admite cantidades decimales (1,5 kg × 2.000 = 3.000) y devuelve siempre un entero.
- [ ] El .5 se redondea hacia arriba (637,5 da 638).
- [ ] Lanza `RangeError` para precio 0, negativo o no entero; cantidad 0, negativa, NaN o infinita; y una unidad que no existe.
- [ ] Las cuatro unidades de `UNITS` están cubiertas, y un caso de prueba falla si se agrega una unidad nueva sin factor (REQ-03.2).
- [ ] No modifica sus argumentos.

---

### Task 2: Estimación de precio por defecto

**What:** Elegir el precio estimado de un ítem de lista con el orden: último precio del mismo sitio, último de la misma etiqueta madre, precio de referencia.

**Files:**
- Create: `src/logic/pricingTypes.ts` — tipos de entrada y salida: `PricePoint` (`id`, `price`, `priceBasis`, `recordedDate`, `recordedAt`, `parentTagId`, `siteTagIds`), `EstimateContext` (`parentTagId`, `siteTagIds`), `ReferencePrice` (`price`, `defaultUnit`), `EstimateSource` (`'site' | 'parent' | 'reference'`), `PriceEstimate` (`price`, `source`, `basisMismatch`, `recordedDate | null`).
- Create: `src/logic/latestPrice.ts` — `latestOf(points)`: el más reciente según el orden de desempate de este plan; no modifica el arreglo recibido; devuelve `null` si está vacío.
- Create: `src/logic/estimatePrice.ts` — `estimatePrice({ unit, context, history, reference })`.
- Create: `src/logic/latestPrice.test.ts`, `src/logic/estimatePrice.test.ts`.

**AC:**
- [ ] Si hay registros de la misma base cuya etiqueta de sitio coincide con alguna de la lista, usa el más reciente de ellos, con `source: 'site'` (REQ-07.2 a).
- [ ] Si no hay registro de sitio pero sí de la misma etiqueta madre, usa el más reciente de ellos, con `source: 'parent'` (REQ-07.2 b), aunque el registro sea de otro sitio.
- [ ] Si no hay ninguno de los dos, usa `reference.price` con `source: 'reference'` (REQ-07.2 c).
- [ ] Un registro de sitio más antiguo gana sobre un registro de la etiqueta madre más reciente (el orden manda sobre la fecha entre niveles).
- [ ] Un registro de otra etiqueta madre no se usa nunca.
- [ ] Registros con una base distinta a la de la unidad del ítem (por kilo contra por unidad) se ignoran; si solo hay de esos, se cae al siguiente nivel.
- [ ] Una lista sin etiquetas de sitio salta directo al nivel de etiqueta madre.
- [ ] Si la base de `reference.defaultUnit` no coincide con la de `unit`, devuelve el precio de referencia con `basisMismatch: true`; en cualquier otro caso `basisMismatch` es `false` (REQ-07.3).
- [ ] El resultado siempre trae un `price` entero >= 1, incluso con historial vacío (REQ-07.3).
- [ ] Desempates: misma fecha, gana el `recordedAt` mayor; mismo instante, gana el `id` mayor.
- [ ] No modifica ni reordena `history` (probado con el arreglo congelado con `Object.freeze`).
- [ ] Lanza `RangeError` si la referencia o algún precio del historial no es válido.

---

### Task 3: Total de la lista y estimación manual

**What:** Calcular, para una lista, las líneas con su precio y subtotal, el total por defecto y el total manual (si existe).

**Files:**
- Create: `src/logic/computeListEstimate.ts` — `computeListEstimate({ context, items })`, donde cada ítem trae `itemId`, `quantity`, `unit`, `manualPrice` (`number | null`), `history` y `reference`. Devuelve `{ lines, defaultTotal, manualTotal, hasManualEstimate }`; cada línea trae `itemId`, `estimate` (el `PriceEstimate` por defecto), `defaultSubtotal`, `manualPrice` y `manualSubtotal`.
- Create: `src/logic/computeListEstimate.test.ts`.

**AC:**
- [ ] `defaultTotal` es exactamente la suma de los `defaultSubtotal` de las líneas (REQ-07.1); una lista vacía da 0.
- [ ] Cada línea usa `estimatePrice` y `calcSubtotal`, sin duplicar sus reglas.
- [ ] Si ningún ítem tiene `manualPrice`, `hasManualEstimate` es `false` y `manualTotal` es `null` (REQ-07.4).
- [ ] Si algún ítem tiene `manualPrice`, `hasManualEstimate` es `true`; `manualSubtotal` usa el precio manual donde existe y el precio por defecto donde no; `manualTotal` es la suma de los `manualSubtotal` (REQ-07.4, REQ-07.5).
- [ ] Ambos totales están siempre disponibles cuando existe estimación manual, para que la pantalla alterne entre ellos sin recalcular (REQ-07.5).
- [ ] Todas las líneas tienen un precio estimado entero >= 1 (REQ-07.3).
- [ ] Un `manualPrice` inválido (0, negativo o no entero) lanza `RangeError`; `null` es válido.
- [ ] El orden de las líneas es el mismo que el de los ítems recibidos.
- [ ] No modifica los ítems ni sus historiales.

---

### Task 4: Variación de precios y resumen del historial

**What:** Calcular la variación entre dos precios (en pesos y en %) y resumir el historial de un ítem para la gráfica y el mensaje de "faltan datos".

**Files:**
- Create: `src/logic/priceVariation.ts` — `calcVariation(previous, current)` devuelve `{ amount, percent, direction }`; `roundPercent(percent, decimals = 1)`.
- Create: `src/logic/summarizeHistory.ts` — `summarizeHistory(points, basis)` devuelve `{ status: 'insufficient-data', pointCount, latest }` si hay menos de 2 registros de esa base, o `{ status: 'ok', points, steps, overall, latest }` en caso contrario (`points` ordenados del más antiguo al más reciente, `steps` con `n - 1` variaciones entre registros consecutivos, `overall` entre el primero y el último, `latest` con `price` y `recordedDate` del más reciente).
- Create: `src/logic/priceVariation.test.ts`, `src/logic/summarizeHistory.test.ts`.

**AC:**
- [ ] `calcVariation(800, 1000)` da `amount: 200`, `percent: 25`, `direction: 'up'`; `calcVariation(1000, 800)` da `amount: -200`, `percent: -20`, `direction: 'down'` (REQ-08.4).
- [ ] Con precios iguales: `amount: 0`, `percent: 0`, `direction: 'same'`.
- [ ] `percent` nunca es NaN ni infinito, y es mayor que -100 (porque el precio actual es >= 1).
- [ ] `roundPercent(33.3333)` da 33,3 y `roundPercent(-12.35, 1)` redondea de forma simétrica (mismo valor absoluto que para +12,35).
- [ ] Lanza `RangeError` si algún precio no es entero >= 1.
- [ ] `summarizeHistory` con 0 o 1 registro de la base pedida devuelve `insufficient-data` (REQ-08.5) y, si hay uno, igual entrega `latest` para mostrar el último precio y su fecha (REQ-08.2).
- [ ] Con 2 o más, `steps` tiene `n - 1` elementos, cada uno entre registros consecutivos, y `overall` va del primero al último.
- [ ] Ordena por fecha, luego `recordedAt`, luego `id`, aunque la entrada venga desordenada, sin modificar el arreglo recibido.
- [ ] Ignora los registros de la otra base: un historial mixto (por kilo y por unidad) se resume solo para la base pedida.
- [ ] La suma de los `amount` de `steps` es igual al `amount` de `overall` (consistencia).

---

### Task 5: Pruebas de propiedades, guardia de pureza y verificación con mutaciones

**What:** Probar con datos aleatorios las propiedades 1 a 5 de `design.md`, asegurar que `src/logic/` siga siendo código puro, y comprobar que las pruebas detectan errores introducidos a propósito.

**Files:**
- Create: `src/logic/index.ts` — reexporta la API pública del módulo.
- Create: `src/logic/pricing.property.test.ts` — propiedades con `fast-check` (más de 100 ejecuciones cada una).
- Create: `src/logic/logicBoundary.test.ts` — recorre los archivos de `src/logic/` que no son pruebas y verifica sus imports.
- Create: `src/logic/testing/pricingArbitraries.ts` — generadores aleatorios reutilizables (precios, cantidades, unidades, historiales).

**AC:**
- [ ] **Propiedad 1:** para cualquier lista, `defaultTotal` es igual a la suma de los `defaultSubtotal`, y `manualTotal` a la suma de los `manualSubtotal` (REQ-07.1).
- [ ] **Propiedad 2:** para cualquier precio, cantidad y unidad, el subtotal es `precio × cantidad × factor` con diferencia menor o igual a 0,5 pesos antes del redondeo; con `unit` el factor es 1 y con `kg`, `half_kg` y `quarter_kg` es 1, 0,5 y 0,25 (REQ-03.3, REQ-03.4).
- [ ] **Propiedad 3:** para cualquier ítem, historial (incluso vacío) y referencia válida, existe un precio estimado entero >= 1 (REQ-07.3).
- [ ] **Propiedad 4:** para cualquier historial, el precio elegido sigue el orden sitio, etiqueta madre, referencia, y es el más reciente de su nivel (REQ-07.2).
- [ ] **Propiedad 5:** para cualquier historial y cualquier par de precios de referencia, si existe un registro de sitio o de etiqueta madre aplicable el precio estimado no depende de la referencia; y estimar nunca modifica ni reordena el historial (REQ-05.3, parte de lógica).
- [ ] Propiedades adicionales: la estimación es determinista (mismos datos, mismo resultado); `calcVariation(a, b)` y `calcVariation(b, a)` tienen `amount` opuesto; `summarizeHistory` da lo mismo con el historial en cualquier orden.
- [ ] **Guardia de pureza:** ningún archivo de `src/logic/` (fuera de pruebas) importa `drizzle-orm`, `expo`, `react`, `react-native` ni nada de `src/db/` aparte de `@/db/constants`; la prueba falla con un mensaje claro si alguien lo hace.
- [ ] **Mutaciones:** se rompen a propósito al menos 8 comportamientos (por ejemplo: invertir el orden sitio y etiqueta madre, usar 0,25 en lugar de 0,5 para `half_kg`, olvidar el redondeo, que el total no sume una línea, cambiar el signo de la variación, dividir por el precio actual en lugar del anterior, no ignorar registros de otra base, mutar el historial recibido) y cada una hace fallar al menos una prueba; los archivos se restauran después de cada intento.
- [ ] Las pruebas de propiedades pasan 3 veces seguidas con semillas aleatorias distintas.
- [ ] `npm test` pasa completo (las 241 pruebas anteriores más las nuevas) y `npx tsc --noEmit` queda limpio.

---

## Tests

| Test | File | Verifies |
|------|------|---------|
| Subtotal por unidad | `src/logic/calcSubtotal.test.ts` | Factores 1, 0,5 y 0,25, precio por unidad, redondeo y entradas inválidas (REQ-03) |
| Precio más reciente | `src/logic/latestPrice.test.ts` | Orden por fecha, instante e id; arreglo vacío; sin mutar |
| Estimación por defecto | `src/logic/estimatePrice.test.ts` | Orden sitio, etiqueta madre y referencia; bases distintas; `basisMismatch`; empates (REQ-07.2, REQ-07.3) |
| Total y estimación manual | `src/logic/computeListEstimate.test.ts` | Suma de subtotales, total manual con y sin precios manuales (REQ-07.1, REQ-07.4, REQ-07.5) |
| Variación | `src/logic/priceVariation.test.ts` | Pesos y porcentaje, dirección, redondeo, entradas inválidas (REQ-08.4) |
| Resumen del historial | `src/logic/summarizeHistory.test.ts` | Faltan datos, pasos, orden, base mezclada, último precio (REQ-08.2, REQ-08.5) |
| Propiedades 1 a 5 | `src/logic/pricing.property.test.ts` | Propiedades de design.md con datos aleatorios |
| Guardia de pureza | `src/logic/logicBoundary.test.ts` | `src/logic/` no importa base de datos, Expo ni React |
| Mutaciones (manual, durante la ejecución) | — (Task 5) | Que las pruebas detectan errores introducidos a propósito |
