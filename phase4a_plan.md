# Phase 4a: Datos iniciales de la base de ítems

Subfase 1 de 2 de la Fase 4. La 4b (autocompletado, pantalla Ítems, agregar ítems propios y editar el precio de referencia) se planifica después.

## Summary

| # | Task | Requirements |
|---|------|-------------|
| 1 | Forma de los datos iniciales y reglas de calidad (pruebas primero) | REQ-04.1 |
| 2 | Lista de ítems de feria, por temporada (investigación) | REQ-04.1 |
| 3 | Lista de ítems de supermercado (investigación) | REQ-04.1 |
| 4 | Precios de referencia aproximados, con fuente y fecha (investigación) | REQ-04.1, REQ-07.2 (c) |
| 5 | Carga de la base en la primera apertura | REQ-04.1, REQ-05.3, REQ-10.1 |

## Dependencies

- [ ] Fase 3 en `main` (commit `b168aea`): `npm test` pasa 445/445 y `npx tsc --noEmit` limpio.
- [ ] Acceso a internet durante la ejecución, para las tareas 2, 3 y 4 (investigación web).
- [ ] No hay paquetes nuevos ni migraciones: los datos se cargan al abrir la app, por lo que no hace falta reiniciar Metro con `--clear`.
- [ ] Verificación manual en el teléfono (Ajustes, sección "Base de datos"): la cifra "Ítems en la base" pasa de 0 al total cargado, y no cambia al recargar la app.

---

## Decisiones de diseño (fijadas en este plan)

- **Los datos son código, no una migración SQL.** Viven en archivos TypeScript tipados (`src/db/seedData/`) y se insertan al abrir la app con una función idempotente, igual que las etiquetas madre. Así se pueden probar, revisar en el repositorio y ampliar en versiones futuras sin tocar el esquema.
- **Nunca se pisa lo del usuario.** La carga inserta solo los ítems que faltan, comparando por nombre normalizado (sin tildes ni mayúsculas). Si el usuario cambió un precio de referencia (4b) o creó un ítem propio con el mismo nombre, se conserva tal cual. No hay tabla de versión de datos: insertar lo que falta en cada arranque cuesta decenas de milisegundos.
- **Qué se guarda y qué no.** La base solo guarda `name`, `defaultUnit` y `referencePrice` (más `isUserAdded = false`). Los demás campos del archivo de datos (`category`, `seasons`, `aliases`, `priceSource`, `priceMonth`, `note`) viven solo en el código: documentan la investigación, alimentan las pruebas de cobertura y los `aliases` los usará la búsqueda de la 4b.
- **Nombres genéricos, sin marca** ("Fideos", no "Lucchetti" ni "Carozzi"), en español de Chile y con la primera letra en mayúscula. Una prueba rechaza una lista de marcas conocidas.
- **Qué significa el precio.** Para unidades por kilo (`kg`, `half_kg`, `quarter_kg`) es el precio por kilo; para `unit` es el precio de una unidad típica (un huevo, un atado, un paquete del tamaño más común). La unidad por defecto sigue cómo se compra normalmente (por ejemplo, las aceitunas en `quarter_kg`).
- **Los precios son aproximados, no oficiales.** Cada ítem lleva su fuente (`odepa-feria`, `odepa-supermercado`, `prensa` o `estimado`) y el mes de la referencia. Los `estimado` son una apuesta razonable que el usuario corrige en la 4b. El primer borrador de las listas (tareas 2 y 3) usa `estimado` y la tarea 4 lo reemplaza con datos cuando hay fuente ("primero la lista de ítems, después los precios").
- **Fuentes de investigación:** ODEPA "Mejores Alimentos de Temporada" (se actualiza los viernes, ferias y supermercados de 9 regiones) y los resúmenes semanales de precios de ferias libres de la Región Metropolitana, para frutas y verduras; notas de prensa con cifras de ferias (sondeos de ODEPA publicados en medios) como respaldo; y precios públicos de supermercados chilenos para los productos de góndola. No existe un calendario de temporada completo mes a mes: se arma combinando los reportes de las cuatro estaciones.
- **Rangos de cordura de precios** (en pesos, validados por una prueba): por kilo entre 200 y 30.000; por unidad entre 100 y 50.000. Una cifra fuera de rango debe revisarse, no se acepta en silencio.
- **Mínimos de cobertura** (validados por una prueba): al menos 150 ítems en total; feria al menos 90 (frutas al menos 30, verduras y hortalizas al menos 40, otros de feria al menos 10); supermercado al menos 60; y cada estación con al menos 25 ítems de feria marcados como de temporada.

---

## Tasks

### Task 1: Forma de los datos iniciales y reglas de calidad

**What:** Definir el tipo de un ítem inicial y escribir primero las pruebas de calidad que cualquier lista de datos debe cumplir.

**Files:**
- Create: `src/db/seedData/catalogSeedTypes.ts` — `SeedItem`: `name`, `defaultUnit` (`Unit`), `referencePrice` (entero), `category` (`'fruta' | 'verdura' | 'otro-feria' | 'supermercado'`), `seasons` (lista de `'verano' | 'otono' | 'invierno' | 'primavera'`; vacía o `'todo-el-ano'` para lo que hay siempre), `aliases` (lista opcional de sinónimos), `priceSource` (`'odepa-feria' | 'odepa-supermercado' | 'prensa' | 'estimado'`), `priceMonth` (`AAAA-MM`, opcional si es `estimado`) y `note` (texto opcional, por ejemplo "paquete de 400 g").
- Create: `src/db/seedData/catalogSeed.test.ts` — reglas de calidad sobre `ALL_SEED_ITEMS` (se importa de `./index`, que se crea en la Task 2).
- Create: `src/db/seedData/index.ts` — exporta `ALL_SEED_ITEMS` (concatena las listas de feria y supermercado); vacío en esta tarea.

**AC:**
- [ ] Las pruebas fallan al ejecutarlas con la lista vacía, por no cumplir la cobertura mínima (se verifica en rojo antes de la Task 2).
- [ ] Ningún nombre repite a otro tras normalizarlo con `normalizeName`; ningún alias coincide con el nombre normalizado de otro ítem ni con el de otro alias.
- [ ] Todo nombre cumple `validateName` (1 a 60 caracteres), empieza con mayúscula, no tiene espacios en los bordes ni dobles, y no contiene ninguna marca de una lista de marcas conocidas (por ejemplo Lucchetti, Carozzi, Soprole, Colún, Nestlé, Coca-Cola, Costa, McKay, Tucapel, Belmont, Cachantun, Watts, Iansa) ni un tamaño dentro del nombre.
- [ ] Todo `referencePrice` pasa `validatePrice` y está dentro de los rangos de cordura de este plan, según la base de su unidad (kilo o unidad).
- [ ] Todo `defaultUnit` pertenece a `UNITS`.
- [ ] Todo ítem con `priceSource` distinto de `estimado` lleva `priceMonth` con formato `AAAA-MM`.
- [ ] Se cumplen los mínimos de cobertura de este plan: total, por categoría y por estación.
- [ ] Los ítems de supermercado tienen `seasons` vacía, y los de feria con `seasons` vacía se tratan como "todo el año" y no cuentan para las estaciones.

---

### Task 2: Lista de ítems de feria, por temporada

**What:** Investigar y escribir los ítems que se compran en la feria en Chile, cubriendo las cuatro estaciones, con unidad por defecto, estación y sinónimos.

**Files:**
- Create: `src/db/seedData/feriaItems.ts` — `FERIA_ITEMS: SeedItem[]`, ordenados por categoría y luego por nombre.
- Modify: `src/db/seedData/index.ts` — incluir `FERIA_ITEMS` en `ALL_SEED_ITEMS`.

**AC:**
- [ ] La lista se arma a partir de las fuentes de este plan y cubre frutas, verduras y hortalizas (incluidas las de hoja y las hierbas, como cilantro y perejil) y otros productos típicos de feria (por ejemplo huevos, legumbres, frutos secos y aceitunas).
- [ ] Cumple los mínimos de feria del plan: al menos 90 ítems (frutas al menos 30, verduras al menos 40, otros al menos 10) y cada estación con al menos 25 ítems marcados.
- [ ] La unidad por defecto es la forma normal de comprar: `kg` en la mayoría; `unit` en lo que se vende por pieza o atado (lechuga, repollo, cilantro, piña, sandía); `quarter_kg` en lo que se compra en cuartos (por ejemplo aceitunas y frutos secos).
- [ ] Hay sinónimos de uso chileno donde corresponde (por ejemplo frutilla/fresa, palta/aguacate, choclo/maíz, betarraga/remolacha, durazno/melocotón, poroto verde/judía verde) y no chocan con ningún nombre (lo valida la Task 1).
- [ ] Todo ítem tiene un `referencePrice` provisional con `priceSource: 'estimado'`; los precios reales llegan en la Task 4.
- [ ] Un comentario al inicio del archivo cita las fuentes consultadas y la fecha de la investigación.
- [ ] Las pruebas de calidad de la Task 1 pasan para los ítems de feria (los mínimos de supermercado aún no se cumplen hasta la Task 3).

---

### Task 3: Lista de ítems de supermercado

**What:** Investigar y escribir los productos de supermercado de uso cotidiano, con nombres genéricos sin marca.

**Files:**
- Create: `src/db/seedData/supermercadoItems.ts` — `SUPERMERCADO_ITEMS: SeedItem[]`, ordenados por nombre.
- Modify: `src/db/seedData/index.ts` — incluir `SUPERMERCADO_ITEMS` en `ALL_SEED_ITEMS`.

**AC:**
- [ ] Al menos 60 ítems, cubriendo abarrotes (arroz, fideos, azúcar, harina, aceite, sal, legumbres secas, conservas), lácteos y huevos, panadería, carnes y aves, embutidos, bebidas, desayuno, aseo del hogar e higiene personal.
- [ ] Los nombres son genéricos ("Fideos", "Aceite", "Leche"), sin marca ni tamaño en el nombre; el tamaño típico va en `note` (por ejemplo "paquete de 400 g").
- [ ] La unidad por defecto es `unit` para productos envasados y `kg` para lo que se pesa (carnes, pollo, pan por kilo, quesos al corte).
- [ ] Todos llevan `seasons` vacía y un `referencePrice` provisional con `priceSource: 'estimado'`.
- [ ] Un comentario al inicio del archivo cita las fuentes consultadas y la fecha.
- [ ] Con esta tarea terminada, todas las pruebas de calidad de la Task 1 pasan (cobertura total, por categoría y por estación).

---

### Task 4: Precios de referencia aproximados, con fuente y fecha

**What:** Reemplazar los precios provisionales por precios investigados cuando exista una fuente, y registrar de dónde sale cada uno.

**Files:**
- Modify: `src/db/seedData/feriaItems.ts` — actualizar `referencePrice`, `priceSource` y `priceMonth`.
- Modify: `src/db/seedData/supermercadoItems.ts` — ídem.
- Modify: `src/db/seedData/catalogSeed.test.ts` — agregar las reglas de cobertura de fuentes de esta tarea.

**AC:**
- [ ] Al menos el 70% de los ítems de feria tiene precio con `priceSource` distinto de `estimado` (ODEPA o prensa), con `priceMonth` del último mes con datos disponibles al ejecutar.
- [ ] Al menos el 30% de los ítems de supermercado tiene precio con fuente (`odepa-supermercado`, `prensa` u otra pública citada en el comentario del archivo); el resto queda como `estimado`.
- [ ] Todos los precios siguen dentro de los rangos de cordura y de coherencia: dentro de feria, los productos que ODEPA reporta más baratos en feria que en supermercado no quedan con el precio al revés.
- [ ] Los precios `estimado` son una minoría explícita y la prueba lista cuántos hay, para que la 4b o el usuario los revisen.
- [ ] Cada comentario de fuente indica el mes de la referencia y que los precios son aproximados y editables por el usuario.
- [ ] Las pruebas de calidad siguen pasando, incluida la nueva cobertura de fuentes.

---

### Task 5: Carga de la base en la primera apertura

**What:** Insertar los ítems iniciales en `catalog_items` al abrir la app, sin duplicar y sin pisar lo que el usuario haya cambiado o creado.

**Files:**
- Create: `src/db/seedCatalog.ts` — `ensureCatalogSeed(db, items = ALL_SEED_ITEMS, clock)`: dentro de una transacción, inserta en bloques (como máximo 100 filas por sentencia, para no pasar el límite de parámetros de SQLite) los ítems con `isUserAdded = false`, usando `onConflictDoNothing` sobre `normalized_name`; devuelve cuántos insertó.
- Create: `src/db/seedCatalog.test.ts`.
- Modify: `src/db/DatabaseProvider.tsx` — llamar a `ensureCatalogSeed(db)` justo después de `ensureDefaultTags(db)`; si falla, mostrar la pantalla de error existente.
- Modify: `src/db/DatabaseProvider.test.tsx` — comprobar que se carga el catálogo y que un fallo del catálogo muestra la pantalla de error.

**AC:**
- [ ] En una base vacía inserta exactamente `ALL_SEED_ITEMS.length` ítems, todos con `isUserAdded = false`, el nombre y la unidad de la lista, y `normalizedName = normalizeName(name)` (REQ-04.1).
- [ ] Ejecutarla de nuevo inserta 0 y no cambia ninguna fila (idempotente).
- [ ] Si el usuario cambió el `referencePrice` de un ítem inicial, una nueva ejecución lo conserva (REQ-05.3, protección del trabajo del usuario).
- [ ] Si el usuario ya creó un ítem propio con el mismo nombre normalizado, se conserva con `isUserAdded = true` y el ítem inicial no se inserta.
- [ ] Si un ítem de la lista falla al insertarse, no queda ninguna fila a medias (transacción: se prueba con un disparador de SQLite que aborta una inserción).
- [ ] Ningún ítem inicial viola las restricciones de la tabla (precio >= 1, unidad válida, nombre normalizado único): una prueba inserta la lista completa en una base real de pruebas.
- [ ] La carga completa tarda menos de 1 segundo en la base de pruebas.
- [ ] No hay llamadas de red ni lectura de archivos externos: todo viene del código (REQ-10.1).
- [ ] En Ajustes, sección "Base de datos", "Ítems en la base" muestra el total cargado y no cambia al recargar la app (verificación manual del usuario).

---

## Tests

| Test | File | Verifies |
|------|------|---------|
| Calidad de los datos iniciales | `src/db/seedData/catalogSeed.test.ts` | Nombres únicos y sin marca, precios en rango, unidades válidas, sinónimos sin choques, cobertura por categoría y por estación, cobertura de fuentes |
| Carga del catálogo | `src/db/seedCatalog.test.ts` | Inserta todo una vez, idempotente, conserva precios editados e ítems propios, transacción atómica, rápida |
| Proveedor de base de datos | `src/db/DatabaseProvider.test.tsx` | Carga el catálogo al arrancar y muestra el error si falla |
| Conteo visible (manual) | — (Ajustes) | "Ítems en la base" muestra el total y es estable al recargar |

---

## Desviaciones de la ejecución (documentadas; aceptadas por el usuario el 10 de noviembre de 2026)

El plan no se cumplió exactamente en estos puntos. Se registran aquí para que no queden implícitos.

1. **Cobertura de precios con fuente en feria: 34 de 95 (35,8%), no el 70% pedido.** ODEPA solo publica unos 35 productos de feria en la tabla que se puede leer; la serie semanal completa está en un panel dinámico (Power BI) inaccesible. El usuario pidió buscar más fuentes en prensa: se hicieron 5 búsquedas y no apareció ningún precio minorista de feria con producto, unidad y fecha reciente comparables (eran de otros países, mayoristas o sin unidad). La prueba exige ahora al menos 35%.
2. **"Los estimados son una minoría" no se cumple: 110 de 165 precios (67%) son estimados.** Supermercado cumple su mínimo (21 de 70 = 30,0%).
3. **Frutilla y Sandía se excluyeron de los precios con fuente** aunque ODEPA publica una cifra, porque son incoherentes (frutilla: 1.332/kg en feria y 8.150 en supermercado; sandía: 3.125 por unidad con 1.767 por kilo implica una sandía de menos de 2 kg). Quedan como estimados.
4. **Los precios de ODEPA se aplican con un archivo aparte** (`src/db/seedData/odepaPrices.ts`), que guarda las filas tal como las publica la página y el cálculo de cada precio, en lugar de editar precio por precio las listas. Es más fácil de auditar.
5. **95 ítems de feria (no 91) y 70 de supermercado:** se agregaron jengibre, cochayuyo, mote y porotos blancos tras la revisión. No se agregaron ítems de supermercado (faltan, por ejemplo, quesillo, pavo y pescado) porque, sin precio con fuente, bajarían la cobertura de supermercado del 30% mínimo.
6. **Se verificó la transcripción de ODEPA contra la página original, fila por fila:** las 66 filas coinciden (revisión independiente del 10 de noviembre de 2026).
