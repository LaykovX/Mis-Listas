# Phase 1: Base del proyecto

## Summary

| # | Task | Requirements |
|---|------|-------------|
| 1 | Repositorio git y archivos de configuración | — |
| 2 | Proyecto Expo con TypeScript y navegación | REQ-13.3, REQ-13.4 |
| 3 | Tema con React Native Paper (claro y oscuro) | REQ-13.1, REQ-13.4 |
| 4 | Interruptor "Texto y botones grandes" | REQ-13.1, REQ-13.2 |
| 5 | Herramientas de pruebas (Jest, RNTL, fast-check) | — (valida propiedades de design.md más adelante) |
| 6 | Estructura de carpetas y archivo de textos en español | REQ-13.3 |
| 7 | Verificación en Android (emulador) y iPhone (Expo Go) | REQ-13.4 |

## Dependencies

- [ ] Node.js y npm instalados. Detectado: Node v26.13.0, npm 11.20.0. Verificar que la versión actual de Expo funciona con Node 26 (Task 2). Si falla, instalar Node LTS.
- [ ] git instalado. Detectado: 2.56.0.
- [ ] Android Studio con un emulador de Android creado (el usuario ya lo tiene instalado; confirmar que existe un dispositivo virtual).
- [ ] App Expo Go instalada en el iPhone y en el Android físicos (si se usan).
- [ ] Computador y teléfonos en la misma red Wi-Fi (o usar modo túnel).

---

## Tasks

### Task 1: Repositorio git y archivos de configuración

**What:** Inicializar git en la carpeta del proyecto con las reglas básicas para trabajar en Windows.

**Files:**
- Create: `.gitattributes` — `* text=auto eol=lf`
- Create: `.gitignore` — `node_modules/`, `.expo/`, `dist/`, `*.log`, `.env*`, archivos de build nativos
- Create: `.github/dependabot.yml` — ecosistemas `npm` y `github-actions`, `schedule: monthly`, un PR agrupado por ecosistema, `open-pull-requests-limit: 5`

**AC:**
- [ ] `git status` funciona en la carpeta del proyecto (es un repositorio).
- [ ] Los archivos de texto se guardan con saltos de línea LF.
- [ ] `node_modules/` y `.expo/` no aparecen como cambios sin seguimiento.
- [ ] Los documentos existentes (`ideation.md`, `requirements.md`, `design.md`, `technology_decisions.md`, `implementation_plan.md`, `naming_conventions.md`, `phase1_plan.md`) se conservan sin cambios.
- [ ] Nota: el workflow de auto-merge de Dependabot y la integración continua se crean cuando el repositorio se suba a GitHub. No se crean en esta fase.

---

### Task 2: Proyecto Expo con TypeScript y navegación

**What:** Crear la app Expo con TypeScript y Expo Router, con cuatro pestañas vacías.

**Files:**
- Create: `package.json`, `app.json`, `tsconfig.json` — generados por `create-expo-app` (plantilla TypeScript), creado en una carpeta temporal y movido a la raíz para no chocar con los documentos existentes.
- Create: `app/_layout.tsx` — layout raíz.
- Create: `app/(tabs)/_layout.tsx` — pestañas.
- Create: `app/(tabs)/index.tsx` — pestaña "Listas" (estado vacío).
- Create: `app/(tabs)/comparatives.tsx` — pestaña "Comparativas" (estado vacío).
- Create: `app/(tabs)/catalog.tsx` — pestaña "Ítems" (estado vacío).
- Create: `app/(tabs)/settings.tsx` — pestaña "Ajustes".
- Modify: `app.json` — nombre de la app "Lista de Feria", `slug`, orientación vertical, identificadores de paquete iOS y Android provisorios.

**AC:**
- [ ] `npx expo start` arranca sin errores con Node instalado.
- [ ] La app muestra cuatro pestañas navegables: Listas, Comparativas, Ítems y Ajustes.
- [ ] Todo el código está en TypeScript con `strict: true`.
- [ ] El texto visible de las pestañas está en español (REQ-13.3).
- [ ] No quedan archivos de ejemplo de la plantilla que no se usen (pantallas, imágenes y componentes de demostración).

---

### Task 3: Tema con React Native Paper (claro y oscuro)

**What:** Instalar React Native Paper y definir el tema claro y oscuro que sigue la configuración del teléfono.

**Files:**
- Create: `src/theme/colors.ts` — paletas clara y oscura con contraste WCAG AA.
- Create: `src/theme/index.ts` — construye el tema de Paper a partir de las paletas.
- Modify: `app/_layout.tsx` — envolver la app con `PaperProvider`, elegir tema según `useColorScheme()`.
- Modify: `package.json` — agregar `react-native-paper`, `react-native-safe-area-context`, `react-native-vector-icons` o `@expo/vector-icons` según indique la documentación vigente de Paper.

**AC:**
- [ ] La app usa componentes de Paper (por ejemplo, `Button`, `Text`) en las pantallas vacías.
- [ ] Al cambiar el teléfono entre modo claro y oscuro, la app cambia de tema sin reiniciarse.
- [ ] Los pares de colores de texto sobre fondo cumplen contraste mínimo 4,5:1 (WCAG AA), verificado con una función de prueba (Task 5).
- [ ] Las etiquetas y estados no dependen solo del color (REQ-13.1, convención del proyecto).

---

### Task 4: Interruptor "Texto y botones grandes"

**What:** Crear la configuración que alterna dos escalas de tamaño (normal y grande) y guardarla en el teléfono.

**Files:**
- Create: `src/theme/sizes.ts` — escalas `normal` y `large`: tamaños de texto (cuerpo ~16 pt normal, mayor en grande), alto mínimo de botones (≥ 48 px, mayor en grande) y espaciado entre botones.
- Create: `src/theme/SizeContext.tsx` — contexto y hook `useSizes()`.
- Create: `src/settings/preferences.ts` — leer y guardar la preferencia `largeMode` (por defecto `false`) con `@react-native-async-storage/async-storage`. Solo para preferencias de la interfaz, no para datos de la app.
- Modify: `src/theme/index.ts` — aplicar la escala activa a las fuentes del tema de Paper.
- Modify: `app/_layout.tsx` — proveer el contexto de tamaños.
- Modify: `app/(tabs)/settings.tsx` — `Switch` con `testID="settings-large-mode-switch"` y etiqueta "Texto y botones grandes".

**AC:**
- [ ] El interruptor está apagado la primera vez que se abre la app.
- [ ] Al activarlo, el texto y los botones de todas las pantallas aumentan de tamaño de inmediato (REQ-13.1).
- [ ] La preferencia se conserva al cerrar y volver a abrir la app.
- [ ] Ningún tamaño de texto o botón en las pantallas está escrito a mano: todos salen de `useSizes()` o del tema.
- [ ] En modo grande los botones siguen cumpliendo un alto mínimo de 48 px.
- [ ] La app respeta además el tamaño de letra definido en el sistema del teléfono.
- [ ] Las acciones principales de las pantallas actuales requieren pocos toques (REQ-13.2).

---

### Task 5: Herramientas de pruebas (Jest, RNTL, fast-check)

**What:** Configurar las pruebas unitarias, de componentes y basadas en propiedades, con una prueba de ejemplo de cada tipo.

**Files:**
- Modify: `package.json` — agregar `jest`, `jest-expo`, `@testing-library/react-native`, `fast-check`, `@types/jest`; scripts `test` y `test:watch`.
- Create: `jest.config.js` — preset `jest-expo`.
- Create: `src/theme/contrast.ts` — función `contrastRatio(foreground, background)`.
- Create: `src/theme/contrast.test.ts` — verifica que los pares de colores de `colors.ts` cumplen contraste ≥ 4,5:1.
- Create: `src/theme/sizes.property.test.ts` — con `fast-check`: para cualquier escala, el alto de botón ≥ 48 y la escala `large` ≥ `normal`.
- Create: `src/settings/SettingsScreen.test.tsx` — con Testing Library: el interruptor cambia la preferencia (usa el mock oficial de AsyncStorage).

**AC:**
- [ ] `npm test` ejecuta todas las pruebas y pasan en Windows.
- [ ] Hay una prueba unitaria, una de componente y una basada en propiedades funcionando.
- [ ] `npm run test:watch` vuelve a ejecutar pruebas al guardar cambios.

---

### Task 6: Estructura de carpetas y archivo de textos en español

**What:** Crear la estructura de carpetas definida en `naming_conventions.md` y centralizar el texto de la interfaz.

**Files:**
- Create: `src/components/.gitkeep`, `src/db/.gitkeep`, `src/logic/.gitkeep`, `e2e/.gitkeep`
- Create: `src/strings/es.ts` — todos los textos visibles (nombres de pestañas, estados vacíos, ajustes).
- Create: `src/strings/index.ts` — exporta el objeto de textos `t`.
- Modify: pantallas de `app/` y `src/settings/` — usar `t.xxx` en lugar de texto escrito dentro de los componentes.

**AC:**
- [ ] Las carpetas `app/`, `src/components/`, `src/db/`, `src/logic/`, `src/strings/`, `src/theme/` y `e2e/` existen como en `naming_conventions.md`.
- [ ] No hay texto visible en español escrito directamente en los componentes: todo sale de `src/strings/`.
- [ ] Los identificadores del código están en inglés, según `naming_conventions.md`.
- [ ] La app sigue funcionando (REQ-13.3).

---

### Task 7: Verificación en Android (emulador) y iPhone (Expo Go)

**What:** Confirmar que la app abre y se comporta igual en Android y en iPhone.

**Files:**
- Create: `README.md` — instrucciones breves: instalar dependencias, `npx expo start`, abrir en emulador o Expo Go, ejecutar pruebas.

**AC:**
- [ ] La app abre en el emulador de Android de Android Studio y muestra las cuatro pestañas.
- [ ] La app abre en un iPhone real con Expo Go y muestra las cuatro pestañas (REQ-13.4).
- [ ] El interruptor de tamaño grande funciona en ambas plataformas.
- [ ] El cambio de tema claro y oscuro funciona en ambas plataformas.
- [ ] `npx tsc --noEmit` no reporta errores de tipos.
- [ ] `npm test` pasa.

---

## Tests

| Test | File | Verifies |
|------|------|---------|
| Contraste de colores | `src/theme/contrast.test.ts` | Los pares texto/fondo de ambos temas cumplen WCAG AA (≥ 4,5:1) |
| Escalas de tamaño (propiedad) | `src/theme/sizes.property.test.ts` | Alto de botón ≥ 48 px y escala grande ≥ normal para cualquier valor |
| Interruptor de modo grande | `src/settings/SettingsScreen.test.tsx` | El interruptor cambia y guarda la preferencia `largeMode` |
| Verificación manual | — (Task 7) | La app abre en Android y iPhone con pestañas, temas y modo grande |
