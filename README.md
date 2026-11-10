# Lista de Feria

App móvil (iOS y Android) para armar listas de compras de feria y supermercado, registrar precios y estimar cuánto efectivo llevar. Funciona sin conexión.

Documentos del proyecto: `ideation.md`, `requirements.md`, `design.md`, `technology_decisions.md`, `implementation_plan.md`, `naming_conventions.md`.

## Requisitos

- Node.js y npm
- Para probar en teléfono: la app **Expo Go** (iPhone y/o Android), con el teléfono y el computador en la misma red Wi-Fi
- Opcional: Android Studio con el SDK, un emulador y sus herramientas instalados

## Instalación

```bash
npm install
```

## Ejecutar la app

```bash
npx expo start
```

- **Teléfono (iPhone o Android):** abre Expo Go y escanea el código QR que aparece en la terminal. Si no conecta, usa `npx expo start --tunnel`.
- **Emulador de Android:** con el emulador abierto, presiona `a` en la terminal.

## Comandos útiles

| Comando | Qué hace |
|---|---|
| `npm test` | Ejecuta todas las pruebas |
| `npm run test:watch` | Repite las pruebas al guardar cambios |
| `npm run typecheck` | Revisa los tipos de TypeScript |
| `npx expo-doctor` | Revisa que las dependencias sean compatibles |
| `npx expo install <paquete>` | Instala un paquete con la versión compatible con Expo |

## Estructura

```
src/app/          pantallas y navegación (Expo Router)
src/components/   componentes reutilizables
src/db/           base de datos (Fase 2)
src/logic/        lógica pura de precios (Fase 3)
src/settings/     preferencias de la interfaz
src/strings/      todo el texto de la interfaz, en español
src/theme/        colores, tamaños y modo "Texto y botones grandes"
e2e/              pruebas de extremo a extremo con Maestro
```
