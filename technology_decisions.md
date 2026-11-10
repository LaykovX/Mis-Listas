# Decisiones tecnológicas: Lista de Feria

## Propósito
Registrar cada decisión de tecnología del proyecto, con sus alternativas, la razón de la elección y lo que se sacrifica, para poder entender y revisar el porqué más adelante.

## Filosofía de decisión
- Entender el porqué antes que seguir "buenas prácticas" por costumbre.
- Elegir lo más simple que cumpla los requisitos del proyecto.
- Ser claros con los costos y las desventajas de cada opción.

## Restricciones confirmadas
- App móvil para **iOS y Android**, con un solo código.
- **Funciona 100% sin conexión** (REQ-10). Sin servidor ni cuentas en el MVP.
- Datos guardados en el teléfono, con respaldo manual por archivo y compartir por código QR.
- Uso personal y familiar al inicio, con posible publicación en App Store y Google Play.
- El usuario desarrolla con Claude Code (no es desarrollador), en un computador con **Windows**.
- Familiares con **iPhone y Android**, incluidos adultos mayores (interfaz simple, texto grande).
- Mantenedor: una sola persona.
- Idioma: español. Moneda: pesos chilenos.

## Registro de decisiones
### TD-001 — Framework de la app: React Native con Expo

- **Decision**: Framework de la app - React Native con Expo (TypeScript)
- **Date**: 2026-11-09
- **Options Considered**:
  - React Native con Expo: JavaScript/TypeScript, builds de iPhone en la nube (EAS) sin necesidad de Mac, prueba en el teléfono con Expo Go.
  - Flutter: lenguaje Dart, interfaz uniforme, pero compilar para iPhone desde Windows es más complicado.
  - PWA (app web instalable): lo más simple, pero con limitaciones en iPhone y difícil de publicar en las tiendas.
- **Rationale**: Resuelve la compilación para iPhone desde Windows, es el stack más conocido por Claude Code, cubre lo que la app necesita (almacenamiento local, cámara para QR, compartir archivos, gráficas) y permite publicar en tiendas sin reescribir.
- **Key Tradeoffs Accepted**: Dependencia del servicio EAS de Expo para compilar versiones de iPhone para las tiendas (plan gratuito limitado). Algunas funciones nativas pueden requerir configuración extra.
- **Dependencies**: Condiciona la base de datos local, las librerías de QR y gráficas, el entorno de desarrollo y las herramientas de pruebas.
- **Environment Notes**: Desarrollo en Windows. Pruebas diarias en Android e iPhone con Expo Go; builds de iPhone mediante EAS.

### TD-002 — Base de datos local: SQLite (expo-sqlite) con Drizzle ORM

- **Decision**: Base de datos local - SQLite mediante `expo-sqlite`, con Drizzle ORM para consultas y migraciones
- **Date**: 2026-11-09
- **Options Considered**:
  - SQLite (`expo-sqlite`) + Drizzle ORM: base relacional integrada en el teléfono, ideal para historial y comparativas, respaldo fácil por archivo.
  - Clave-valor (AsyncStorage o MMKV): muy simple, pero mala para consultas de historial y comparativas.
  - WatermelonDB: capa sobre SQLite pensada para muchos registros y sincronización, más compleja de lo necesario para el MVP.
- **Rationale**: Los datos (listas, ítems, etiquetas, historial de precios) están relacionados y las comparativas necesitan consultas. SQLite funciona sin conexión, facilita el respaldo manual (REQ-12) y el compartir por QR (REQ-11), y se puede sincronizar con un servidor si más adelante se agrega edición compartida. Drizzle aporta tipos y migraciones.
- **Key Tradeoffs Accepted**: Hay que diseñar bien las tablas desde el inicio y cuidar las migraciones para no perder el historial de la familia.
- **Dependencies**: Depende de TD-001 (Expo). Condiciona el formato de respaldo, el de QR y las pruebas de datos.
- **Environment Notes**: Sin diferencias entre Windows, iOS y Android; el motor SQLite viene incluido en ambos sistemas.

### TD-003 — Entorno de desarrollo local: Windows con Expo Go (emulador Android como respaldo)

- **Decision**: Entorno de desarrollo local - Windows nativo (sin Docker ni WSL), pruebas en teléfonos físicos con Expo Go; emulador de Android Studio como respaldo
- **Date**: 2026-11-09
- **Options Considered**:
  - Expo Go en teléfonos físicos (iPhone y Android): la forma más simple y rápida, y la única práctica para probar en iPhone desde Windows. Requiere misma red Wi-Fi o túnel, y no admite todas las librerías nativas.
  - Emulador de Android (Android Studio): útil sin teléfono Android a mano, pero pesado y con más configuración.
  - Builds de desarrollo en la nube (EAS): acceso a cualquier librería nativa, pero más lentos y consumen el plan gratuito.
- **Rationale**: El proyecto no tiene servidor ni base de datos que levantar, así que Docker o WSL no aportan. Expo Go cubre iPhone y Android con una instalación mínima. El usuario ya tiene Android Studio instalado, por lo que el emulador de Android queda disponible como respaldo. Las librerías previstas (SQLite, cámara para QR, compartir archivos) funcionan en Expo Go.
- **Key Tradeoffs Accepted**: No hay simulador de iPhone en Windows; las pruebas en iPhone dependen de un teléfono físico. Si una librería necesita código nativo, habrá que pasar a builds de desarrollo en la nube.
- **Dependencies**: Depende de TD-001 (Expo). Condiciona las herramientas de pruebas y el flujo de publicación.
- **Environment Notes**:
  - Repositorio git: ejecutar `git init` en el proyecto, hoy no es un repositorio.
  - `.gitattributes` para unificar saltos de línea (LF) entre sistemas.
  - Rutas con `/` y scripts en `npm`, sin archivos `.bat`, para portabilidad.
  - Mantener coherencia de mayúsculas y minúsculas en los nombres de archivos importados (iOS y Android son sensibles a esto, Windows no).

### TD-004 — Gráficas y códigos QR: react-native-gifted-charts, react-native-qrcode-svg y expo-camera

- **Decision**: Gráficas - `react-native-gifted-charts`. Generar QR - `react-native-qrcode-svg`. Escanear QR - `expo-camera`
- **Date**: 2026-11-09
- **Options Considered**:
  - Gráficas con `react-native-gifted-charts`: líneas y barras listas para usar, poco código, funciona en Expo Go.
  - Gráficas con `victory-native`: muy flexible, pero más compleja de configurar y con librerías de dibujo adicionales.
  - Gráficas a mano con `react-native-svg`: control total, pero hay que construir ejes y escalas.
  - QR: `react-native-qrcode-svg` para generar y `expo-camera` para escanear (viene con Expo).
- **Rationale**: Cubren la gráfica de precios y variación (REQ-08, REQ-09) y el compartir por QR (REQ-11) con poco esfuerzo, se ven bien para usuarios no técnicos y funcionan en Expo Go (TD-003).
- **Key Tradeoffs Accepted**: Si se necesita una gráfica muy particular habrá que cambiar de librería. Un QR guarda poca información: para listas largas el contenido se dividirá en varios códigos, diseño pendiente para la implementación del compartir.
- **Dependencies**: Depende de TD-001 y TD-003. El formato del QR depende de TD-002 (datos de la lista).
- **Environment Notes**: La cámara pide permiso al usuario en iOS y Android.

### TD-005 — Pruebas: Jest + jest-expo + React Native Testing Library, fast-check y Maestro

- **Decision**: Pruebas unitarias y de componentes - Jest + `jest-expo` + React Native Testing Library. Pruebas basadas en propiedades - `fast-check`. Pruebas de extremo a extremo - Maestro sobre el emulador de Android
- **Date**: 2026-11-09
- **Options Considered**:
  - Jest + `jest-expo` + React Native Testing Library: combinación estándar para Expo, corre sin teléfono y en Windows.
  - Vitest: más rápido, pero requiere más configuración en React Native y no es el estándar.
  - `fast-check`: genera datos al azar para comprobar las propiedades de design.md, dentro de Jest.
  - Maestro: pruebas de extremo a extremo con archivos simples, funciona con el emulador de Android.
  - Detox: más preciso, pero muy complejo y exige builds nativos.
  - Sin pruebas automáticas de extremo a extremo: menos trabajo inicial, pero repetición manual en cada cambio.
- **Rationale**: La lógica crítica (estimación, subtotales, variaciones, QR y respaldo) es JavaScript independiente de la plataforma, así que Jest la cubre igual para iPhone y Android y corre en Windows. Maestro permite probar flujos completos con poco esfuerzo usando el emulador que el usuario ya tiene (TD-003).
- **Key Tradeoffs Accepted**: Maestro no cubre iPhone porque en Windows no hay simulador, por lo que los detalles visuales y la cámara en iPhone se prueban manualmente. El skill `/comprehensive-test` está pensado para web (Playwright o Cypress) y debe adaptarse o sustituirse para este proyecto.
- **Dependencies**: Depende de TD-001, TD-002 y TD-003. Valida las propiedades de correctitud de design.md.
- **Environment Notes**: Las pruebas de Jest y fast-check corren en Windows sin diferencias. Las de Maestro corren sobre el emulador de Android Studio. Todas las pruebas de lógica usan el mismo código en iPhone y Android.

### TD-006 — Interfaz y accesibilidad: React Native Paper con modo de texto y botones grandes

- **Decision**: Componentes - React Native Paper (Material Design), con tema propio. Accesibilidad base WCAG AA. Un interruptor en ajustes ("Texto y botones grandes") que aumenta el tamaño del texto y de los botones. Esquema de colores - sigue el tema del teléfono (claro u oscuro), con el modo claro como diseño principal
- **Date**: 2026-11-09
- **Options Considered**:
  - React Native Paper: componentes listos con accesibilidad integrada, temas claro y oscuro, muy documentada. Aspecto Material, personalizable.
  - Componentes propios con estilos de React Native: control total, pero más trabajo y más riesgo de olvidar detalles de accesibilidad.
  - NativeWind (Tailwind para React Native): estilos rápidos con clases, pero igual hay que construir los componentes.
- **Rationale**: Los usuarios principales (padres de unos 50 a 60 años y el creador de 28) tienen buena vista, así que el tamaño normal es adecuado por defecto. Un interruptor de tamaño grande cubre a quienes lo necesiten ahora o más adelante (REQ-13) sin complicar la pantalla estándar. Paper ahorra trabajo y trae accesibilidad resuelta. La app respeta además el tamaño de letra definido en el sistema del teléfono.
- **Key Tradeoffs Accepted**: Aspecto base Material, personalizado con colores y formas propios. Mantener dos escalas de tamaño exige revisar las pantallas con el modo grande activado, para que nada se corte o se desborde.
- **Dependencies**: Depende de TD-001. El modo grande debe probarse en las pruebas manuales y de componentes (TD-005).
- **Environment Notes**: Reglas base - texto de contenido de unos 16 pt en modo normal y mayor en modo grande, botones de al menos 48 px de alto con espacio entre ellos, buen contraste (WCAG AA), no depender solo del color (las etiquetas de sitio llevan nombre además de color). Referencia visual: ninguna por ahora.
