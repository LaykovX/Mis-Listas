# Naming Conventions

Claude: Read this before generating screens, components, database code, or tests.

## UI Foundations

- Accessibility: WCAG AA como base. Botones de al menos 48 px de alto, buen contraste, no depender solo del color.
- Reference site: none specified
- Component library: React Native Paper (Material Design)
- Color scheme: sigue el tema del teléfono (claro u oscuro), modo claro como diseño principal
- Large mode: interruptor "Texto y botones grandes" en ajustes (apagado por defecto). Todo tamaño de texto y botón sale del tema, nunca de valores fijos en la pantalla.

## Language Rules

- Code identifiers (variables, functions, files, DB columns): English.
- All user-facing text: Spanish, defined in one central strings file, never hardcoded in components.
- Domain terms in code:

| Spanish (UI) | English (code) |
|---|---|
| lista | `list` |
| ítem de la lista | `listItem` |
| ítem de la base | `catalogItem` |
| etiqueta madre | `parentTag` |
| etiqueta de sitio | `siteTag` |
| registro de precio | `priceRecord` |
| precio de referencia | `referencePrice` |
| estimación por defecto / manual | `defaultEstimate` / `manualEstimate` |
| cierre de compra | `purchaseWrapUp` |

NOT: `lista`, `etiquetaMadre`, `precioReferencia` in code.

## REQUIRED: Test IDs

React Native uses `testID` (not `data-testid`). Maestro and Testing Library select by it.

```tsx
// Pattern: {screen}-{element}-{id?}
<Button testID="list-create-button" />
<TextInput testID="item-search-input" />
<View testID={`list-row-${list.id}`} />
<View testID={`list-item-row-${item.id}`} />
<Button testID="purchase-confirm-price-button" />
<Switch testID="settings-large-mode-switch" />
```

NOT: `testID="btn1"`, `testID="button"`, `testID="myButton"`.

Add `accessibilityLabel` (in Spanish, from the strings file) to every touchable element and image.

## REQUIRED: Modal Props

```tsx
interface ModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (values: FormValues) => void;
}
```

NOT: `onCancel`, `onDismiss`, `onSave`, `onConfirm`, `isOpen`, `show`.

## REQUIRED: Error State

```tsx
const [error, setError] = useState<string | null>(null);
const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
```

NOT: `errorMessage`, `err`, `errors`, `validationErrors`.

## REQUIRED: Dates and Money

```ts
// Calendar dates (no time): *Date  -> stored as ISO string "YYYY-MM-DD"
createdDate, usedDate, purchaseDate

// Exact instants: *At  -> stored as ISO 8601 string
updatedAt, deletedAt

// Money: whole Chilean pesos, as integers, suffix by meaning
referencePrice, unitPrice, subtotal, total   // all integers (CLP)
```

NOT: `created`, `date_used`, `price` for a total, decimal pesos, floats for money.

## Naming Patterns

| Item | Pattern | Example |
|---|---|---|
| Components | PascalCase | `ListCard.tsx`, `PriceChart.tsx` |
| Screens | PascalCase + `Screen` | `ListsScreen.tsx` |
| Hooks | `use` prefix, camelCase | `useListTotal.ts` |
| Pure logic modules | camelCase | `estimatePrice.ts`, `calcSubtotal.ts` |
| Variables and functions | camelCase | `calcSubtotal` |
| Types and interfaces | PascalCase | `ListItem`, `PriceRecord` |
| Constants | UPPER_SNAKE_CASE | `DEFAULT_PARENT_TAGS` |
| Database tables | snake_case, plural | `lists`, `list_items`, `price_records` |
| Database columns | snake_case | `reference_price`, `created_date` |
| Test files | `*.test.ts(x)` next to the file | `calcSubtotal.test.ts` |
| Property-based tests | `*.property.test.ts` | `estimatePrice.property.test.ts` |
| Maestro flows | kebab-case `.yaml` in `e2e/` | `create-list.yaml` |
| Event handlers | `handle` + Event | `handleSubmit` |
| Boolean variables | `is`, `has`, `can` prefix | `isUsed`, `hasManualEstimate` |

NOT: `Utils.ts`, `helpers.ts`, `data.ts`, `temp.ts`, or generic names with no domain meaning.

## File Organization

```
src/app/             screens and navigation (Expo Router)
src/components/      reusable UI components
src/db/              schema, migrations, queries
src/logic/           pure functions (pricing, estimation, variation)
src/strings/         all Spanish UI text
src/theme/           colors, sizes, large mode
e2e/                 Maestro flows
```

Business logic goes in `src/logic/` as pure functions with no UI or database imports, so it can be tested directly.

## Toolset-Enforced (No Action Needed)

| Concern | Enforced by |
|---|---|
| Database types in TypeScript | Drizzle (schema generates types) |
| Migrations | Drizzle Kit |
| Navigation routes from folder names | Expo Router |
| Test file discovery | Jest (`*.test.ts(x)`) |
| Component accessibility roles | React Native Paper |
