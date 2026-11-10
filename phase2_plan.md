# Phase 2: Modelo de datos

## Summary

| # | Task | Requirements |
|---|------|-------------|
| 1 | Dependencias y configuración de Drizzle con Expo SQLite | REQ-10.1 |
| 2 | Esquema de tablas, migración inicial y base de pruebas en memoria | REQ-01, REQ-02, REQ-03, REQ-10.1 |
| 3 | Cliente de base de datos, arranque (migraciones y etiquetas madre) y proveedor | REQ-02.1, REQ-10.1, REQ-10.2 |
| 4 | Repositorios: crear, leer, editar y borrar cada entidad | REQ-01.1-01.5, REQ-02.2-02.6, REQ-03.1, REQ-03.5, REQ-04.4, REQ-05.2-05.3, REQ-06.4 |
| 5 | Pruebas de integridad de datos (propiedades 5, 6 y 7) | REQ-02.2, REQ-02.6, REQ-05.3 |

## Dependencies

- [ ] Fase 1 completa y commiteada (commit `6d009e4`): `npm test` pasa 42/42 y `npx tsc --noEmit` limpio.
- [ ] Conexión a internet para instalar paquetes nuevos.
- [ ] Un teléfono con Expo Go para la verificación manual de arranque (Task 3).

---

## Decisiones de modelo (fijadas en este plan)

- **Etiquetas madre:** filas de `tags` con `kind='parent'` y `slug` (`feria` o `supermercado`). No llevan nombre guardado: el texto "Feria" y "Supermercado" se muestra desde `src/strings` según el `slug`. No se pueden renombrar ni borrar.
- **Etiquetas de sitio:** filas de `tags` con `kind='site'`, `name` y `color` (`#RRGGBB`) obligatorios. `slug` es nulo.
- **Toda lista tiene exactamente una etiqueta madre** (`lists.parent_tag_id`, obligatoria) y cero o más de sitio (tabla `list_site_tags`).
- **Todo ítem de lista apunta a un ítem de la base** (`list_items.catalog_item_id`, obligatorio). Si el usuario escribe un ítem nuevo, primero se crea en la base (REQ-04.4).
- **Precios en pesos chilenos como enteros, siempre >= 1.** El precio es por kilo si la unidad es `kg`, `half_kg` o `quarter_kg`, y por unidad si es `unit` (REQ-03.3, REQ-03.4). `quantity` es la cantidad de porciones de esa unidad (por ejemplo, 2 con `half_kg` = 1 kg).
- **El historial de precios sobrevive:** `price_records` guarda una copia de la etiqueta madre y de las etiquetas de sitio al momento del registro (REQ-06.4). Borrar una etiqueta de sitio quita solo su asociación; borrar una lista deja `list_id` en nulo; los registros permanecen.
- **Fechas:** días como texto `YYYY-MM-DD` (`*_date`); instantes como texto ISO 8601 (`*_at`).
- **Claves foráneas activas:** `PRAGMA foreign_keys = ON` en cada conexión (SQLite las trae apagadas).

---

## Tasks

### Task 1: Dependencias y configuración de Drizzle con Expo SQLite

**What:** Instalar `expo-sqlite`, Drizzle y las herramientas de migración, y configurar Babel, Metro y Drizzle Kit para empaquetar archivos `.sql`.

**Files:**
- Modify: `package.json` — `expo-sqlite` (con `npx expo install`), `drizzle-orm` en `dependencies`; `drizzle-kit`, `babel-plugin-inline-import`, `sql.js` y `@types/sql.js` en `devDependencies` (instalar con `npm install --save-dev` y verificar la sección). Scripts `db:generate` (`drizzle-kit generate`) y `db:check` (`drizzle-kit check`).
- Create: `babel.config.js` — preset `babel-preset-expo` y plugin `inline-import` para la extensión `.sql`.
- Create: `metro.config.js` — configuración por defecto de Expo (`getDefaultConfig`); agregar `sql` a `resolver.sourceExts` solo si el empaquetado lo exige.
- Create: `drizzle.config.ts` — `dialect: 'sqlite'`, `driver: 'expo'`, `schema: './src/db/schema.ts'`, `out: './drizzle'`.
- Modify: `.gitignore` — confirmar que `drizzle/` NO está ignorada (las migraciones se commitean).

**AC:**
- [ ] `npm ls expo-sqlite drizzle-orm drizzle-kit sql.js` muestra las versiones instaladas sin errores de resolución (REQ-10.1).
- [ ] `drizzle-kit`, `babel-plugin-inline-import`, `sql.js` y `@types/sql.js` están en `devDependencies`; `expo-sqlite` y `drizzle-orm` en `dependencies`.
- [ ] `npx tsc --noEmit` y `npm test` siguen pasando (42/42) tras la configuración.
- [ ] `npx expo-doctor` pasa sin problemas.
- [ ] `npx expo export --platform android --platform ios` termina sin errores con la nueva configuración de Babel y Metro.

---

### Task 2: Esquema de tablas, migración inicial y base de pruebas en memoria

**What:** Definir las 7 tablas con Drizzle, generar la migración SQL inicial y crear un asistente que levanta una base SQLite en memoria (sql.js) con esas migraciones para las pruebas.

**Files:**
- Create: `src/db/constants.ts` — `PARENT_TAG_SLUGS = ['feria', 'supermercado']`, `TAG_KINDS = ['parent', 'site']`, `UNITS = ['unit', 'kg', 'half_kg', 'quarter_kg']`, `PRICE_BASES = ['unit', 'kg']`, y los tipos derivados.
- Create: `src/db/schema.ts` — tablas (snake_case, plural):
  - `tags`: `id`, `kind`, `slug` (único, nulo), `name` (nulo), `color` (nulo), `created_at`; `CHECK`: si `kind='parent'` entonces `slug` no nulo; si `kind='site'` entonces `name` y `color` no nulos.
  - `lists`: `id`, `name`, `created_date`, `used_date` (nulo), `parent_tag_id` (FK a `tags`, `RESTRICT`), `created_at`, `updated_at`.
  - `list_site_tags`: `list_id` (FK a `lists`, `CASCADE`), `tag_id` (FK a `tags`, `CASCADE`); clave primaria compuesta.
  - `catalog_items`: `id`, `name`, `normalized_name` (único), `default_unit`, `reference_price`, `is_user_added`, `created_at`, `updated_at`.
  - `list_items`: `id`, `list_id` (FK a `lists`, `CASCADE`), `catalog_item_id` (FK a `catalog_items`, `RESTRICT`), `quantity`, `unit`, `unit_price`, `manual_price` (nulo), `purchased_price` (nulo), `is_purchased` (por defecto 0), `sort_order`.
  - `price_records`: `id`, `catalog_item_id` (FK, `RESTRICT`), `list_id` (FK a `lists`, `SET NULL`, nulo), `parent_tag_id` (FK a `tags`, `RESTRICT`), `price`, `price_basis`, `recorded_date`, `recorded_at`.
  - `price_record_sites`: `price_record_id` (FK a `price_records`, `CASCADE`), `tag_id` (FK a `tags`, `CASCADE`); clave primaria compuesta.
  - Índices: `price_records (catalog_item_id, recorded_date)`, `price_records (parent_tag_id)`, `list_items (list_id)`, `catalog_items (normalized_name)`.
- Create: `drizzle/` — migración inicial generada con `npm run db:generate` (archivos `.sql`, `meta/` y `migrations.js`).
- Create: `src/db/testing/createTestDb.ts` — abre una base en memoria con `sql.js`, activa `PRAGMA foreign_keys = ON`, aplica los archivos `.sql` de `drizzle/` en orden y devuelve una base Drizzle.
- Create: `src/db/types.ts` — tipo `Db` (`BaseSQLiteDatabase<'sync', unknown, typeof schema>`, compatible con Expo SQLite y sql.js) y tipos de fila inferidos del esquema.
- Create: `src/db/schema.test.ts`.

**AC:**
- [ ] `npm run db:generate` produce una migración inicial sin errores, y `npm run db:check` no reporta inconsistencias.
- [ ] La base de pruebas se crea en memoria con las 7 tablas y los índices, aplicando las migraciones reales (REQ-10.1).
- [ ] Con claves foráneas activas, insertar una lista con una `parent_tag_id` inexistente falla.
- [ ] La restricción `CHECK` de `tags` rechaza una etiqueta de sitio sin nombre o sin color, y una etiqueta madre sin `slug`.
- [ ] `catalog_items.normalized_name` rechaza duplicados.
- [ ] Los nombres de tablas y columnas siguen `naming_conventions.md` (snake_case; fechas `*_date`/`*_at`).
- [ ] El tipo `Db` compila con la base de pruebas (sql.js) sin conversiones forzadas.

---

### Task 3: Cliente de base de datos, arranque y proveedor

**What:** Abrir la base real en el teléfono, aplicar las migraciones, crear las etiquetas madre una sola vez, y exponer la base al resto de la app solo cuando está lista.

**Files:**
- Create: `src/db/client.ts` — `openDatabase()`: abre `lista-de-feria.db` con `expo-sqlite`, ejecuta `PRAGMA foreign_keys = ON` y devuelve la base Drizzle.
- Create: `src/db/seed.ts` — `ensureDefaultTags(db)`: inserta las etiquetas madre `feria` y `supermercado` si no existen (idempotente).
- Create: `src/db/DatabaseProvider.tsx` — abre la base, ejecuta las migraciones (`useMigrations` de `drizzle-orm/expo-sqlite/migrator`), llama a `ensureDefaultTags`, y expone `useDb()`. Acepta una prop opcional para inyectar la base en pruebas.
- Create: `src/db/DatabaseProvider.test.tsx`.
- Create: `src/db/seed.test.ts`.
- Modify: `src/app/_layout.tsx` — envolver la app con `DatabaseProvider`; mantener la pantalla de carga hasta que preferencias y base estén listas.
- Modify: `src/strings/es.ts` — textos `tags.feria` ("Feria"), `tags.supermercado` ("Supermercado") y el mensaje de error de base de datos.
- Create: `src/components/DatabaseErrorScreen.tsx` — pantalla de error simple si la base no se puede abrir o migrar.

**AC:**
- [ ] `ensureDefaultTags` crea exactamente 2 etiquetas madre en una base vacía, y ejecutarla de nuevo no crea duplicados (REQ-02.1).
- [ ] `useDb()` fuera del proveedor lanza un error claro.
- [ ] Si la migración falla, se muestra `DatabaseErrorScreen` con un mensaje en español y los datos existentes no se modifican.
- [ ] Mientras la base no está lista, la app no muestra pantallas que la usen.
- [ ] Todo el código usa solo almacenamiento local, sin llamadas de red (REQ-10.1, REQ-10.2).
- [ ] Verificación manual en el teléfono: la app abre con las 4 pestañas y las preferencias de Fase 1 siguen funcionando (el usuario lo confirma con Expo Go).

---

### Task 4: Repositorios: crear, leer, editar y borrar cada entidad

**What:** Escribir funciones de acceso a datos para cada tabla, con validación de entradas y errores tipados, sin importar nada de interfaz.

**Files:**
- Create: `src/db/errors.ts` — `DbValidationError` con códigos (`INVALID_NAME`, `INVALID_COLOR`, `INVALID_PRICE`, `INVALID_QUANTITY`, `INVALID_UNIT`, `INVALID_DATE`, `PARENT_TAG_REQUIRED`, `NOT_A_PARENT_TAG`, `NOT_A_SITE_TAG`, `NOT_FOUND`, `PROTECTED_TAG`).
- Create: `src/db/repositories/tags.ts` — listar etiquetas madre; crear, listar, renombrar, cambiar color y borrar etiquetas de sitio (REQ-02.3, REQ-02.5); las etiquetas madre no se pueden modificar ni borrar.
- Create: `src/db/repositories/lists.ts` — crear (nombre, etiqueta madre, etiquetas de sitio, fecha de creación), leer, listar, renombrar, borrar, duplicar (copia ítems, no copia `used_date`) y marcar como usada con fecha (REQ-01.1-01.5, REQ-02.2, REQ-02.4).
- Create: `src/db/repositories/catalogItems.ts` — crear ítem propio (con `reference_price` obligatorio, REQ-04.4), leer, y actualizar `reference_price` sin tocar `price_records` (REQ-05.2, REQ-05.3). `normalized_name` se calcula con una función pura de normalización (minúsculas, sin tildes, sin espacios repetidos).
- Create: `src/db/normalize.ts` — `normalizeName(text)`.
- Create: `src/db/repositories/listItems.ts` — agregar, editar y quitar ítems de una lista, con cantidad > 0, unidad válida y precio entero >= 1 (REQ-03.1, REQ-03.5).
- Create: `src/db/repositories/priceRecords.ts` — registrar un precio (copia la etiqueta madre y las de sitio de la lista, guarda la fecha, REQ-06.4) y leer el historial de un ítem, ordenado por fecha.
- Create: `src/db/repositories/index.ts` — exporta todo.
- Create: pruebas por repositorio: `tags.test.ts`, `lists.test.ts`, `catalogItems.test.ts`, `listItems.test.ts`, `priceRecords.test.ts`, `normalize.test.ts` (junto a cada archivo).

**AC:**
- [ ] Cada función recibe la base como primer parámetro y no importa `expo-sqlite` ni componentes (probable con la base sql.js).
- [ ] Crear una lista sin etiqueta madre, o con una etiqueta de sitio como madre, falla con `PARENT_TAG_REQUIRED` o `NOT_A_PARENT_TAG` (REQ-02.2).
- [ ] Una lista acepta cero o más etiquetas de sitio, y rechaza una etiqueta madre como etiqueta de sitio (REQ-02.4).
- [ ] Crear etiquetas de sitio exige nombre no vacío y color `#RRGGBB`; renombrar y recolorear funcionan; las etiquetas madre se rechazan con `PROTECTED_TAG` (REQ-02.3, REQ-02.5).
- [ ] Duplicar una lista copia sus ítems y etiquetas, asigna fecha de creación nueva y deja `used_date` en nulo (REQ-01.4).
- [ ] Marcar una lista como usada guarda la fecha indicada (REQ-01.5).
- [ ] Precio no entero, menor que 1 o cantidad menor o igual a 0 se rechazan con `INVALID_PRICE` o `INVALID_QUANTITY`; una unidad fuera de `UNITS` se rechaza con `INVALID_UNIT`.
- [ ] Registrar un precio guarda la etiqueta madre de la lista, todas sus etiquetas de sitio y la fecha (REQ-06.4); el historial se devuelve ordenado de más antiguo a más reciente.
- [ ] Cambiar `reference_price` de un ítem no modifica ningún `price_records` existente (REQ-05.3).
- [ ] Los errores son `DbValidationError` con código; ningún repositorio traga excepciones.

---

### Task 5: Pruebas de integridad de datos

**What:** Escribir pruebas que verifican, con datos aleatorios, las propiedades de correctitud de `design.md` que dependen del modelo de datos.

**Files:**
- Create: `src/db/integrity.property.test.ts` — con `fast-check` y la base sql.js (cantidad acotada de ejecuciones, por ejemplo 25, cada una con base nueva).
- Create: `src/db/integrity.test.ts` — casos concretos con nombres descriptivos.

**AC:**
- [ ] **Propiedad 7 (design.md):** para cualquier conjunto de listas con etiquetas de sitio y registros de precio, borrar una etiqueta de sitio deja intacto el número de listas, de ítems de lista y de `price_records`; solo desaparecen sus filas en `list_site_tags` y `price_record_sites` (REQ-02.6).
- [ ] **Propiedad 6:** para cualquier lista creada, tiene exactamente una etiqueta madre y cero o más de sitio; ninguna operación del repositorio deja una lista sin madre (REQ-02.2).
- [ ] **Propiedad 5:** para cualquier cambio de `reference_price`, el contenido de `price_records` es idéntico antes y después (REQ-05.3).
- [ ] Borrar una lista deja `price_records.list_id` en nulo y conserva los registros; borrar una lista borra sus `list_items`.
- [ ] Borrar una etiqueta de sitio no puede dejar registros huérfanos (las claves foráneas están activas en la base de pruebas).
- [ ] Todas las pruebas de integridad pasan 3 veces seguidas (sin dependencia del orden ni de datos aleatorios fijos).

---

## Tests

| Test | File | Verifies |
|------|------|---------|
| Esquema y migración inicial | `src/db/schema.test.ts` | 7 tablas, índices, claves foráneas y `CHECK` de etiquetas |
| Etiquetas madre idempotentes | `src/db/seed.test.ts` | `ensureDefaultTags` crea 2 etiquetas y no duplica (REQ-02.1) |
| Proveedor de base de datos | `src/db/DatabaseProvider.test.tsx` | Muestra hijos solo cuando está lista; pantalla de error si falla la migración |
| Normalización de nombres | `src/db/normalize.test.ts` | Minúsculas, sin tildes, sin espacios repetidos |
| Etiquetas | `src/db/repositories/tags.test.ts` | Crear, renombrar, recolorear, borrar sitio; madre protegida (REQ-02) |
| Listas | `src/db/repositories/lists.test.ts` | Crear, duplicar, marcar usada, madre obligatoria (REQ-01, REQ-02) |
| Ítems de la base | `src/db/repositories/catalogItems.test.ts` | Ítem propio, precio de referencia, sin tocar el historial (REQ-04.4, REQ-05) |
| Ítems de lista | `src/db/repositories/listItems.test.ts` | Validación de cantidad, unidad y precio (REQ-03) |
| Registros de precio | `src/db/repositories/priceRecords.test.ts` | Copia de etiquetas, fecha y orden (REQ-06.4) |
| Integridad (propiedades) | `src/db/integrity.property.test.ts` | Propiedades 5, 6 y 7 con datos aleatorios |
| Integridad (casos) | `src/db/integrity.test.ts` | Borrado en cascada y conservación del historial |
| Verificación manual | — (Task 3) | La app abre en el teléfono con las migraciones aplicadas |

---

## Notas para fases siguientes (resultado de la ejecución)

Salieron de las dos revisiones adversariales de la Fase 2. Ninguna bloquea esta fase.

- **Fase 6 (comprar y registrar precios):** hoy `recordPrice` registra un precio contra una lista y un ítem de la base, pero no exige que el ítem esté en esa lista, y ninguna función marca `is_purchased` / `purchased_price` de un ítem de lista. Hace falta una operación atómica "marcar comprado y registrar el precio" (una transacción) que valide que el ítem pertenece a la lista.
- **Fase 3 y posteriores (migraciones):** `PRAGMA foreign_keys = ON` se activa antes de migrar. Una migración futura que reconstruya una tabla de SQLite necesitará un manejo especial de las claves foráneas, y SQLite ignora `foreign_keys = OFF` dentro de la transacción de la migración. Planificarlo antes de la primera migración que reconstruya tablas.
- **Pantalla de error de base de datos:** no tiene botón "Reintentar"; ante un fallo al abrir la base hay que reiniciar la app. El cliente ya permite reintentar (no guarda la conexión si falla), solo falta la acción en la interfaz.
- **Reglas solo en el código (no en CHECK de la base):** formato de color `#RRGGBB`, que `lists.parent_tag_id` apunte a una etiqueta madre y que `list_site_tags.tag_id` apunte a una de sitio. Hoy las garantizan los repositorios; cualquier escritura nueva debe pasar por ellos.
- **Límites de validación:** precio de 1 a 100.000.000 pesos; cantidad de 0,001 a 100.000; nombres de hasta 60 caracteres.
- **Reutilización:** `sql.js` + `createTestDb` + `createSeededDb` (en `src/db/testing/`) son la base para probar cualquier consulta nueva.
