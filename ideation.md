# Ideation: Lista de Feria (app de listas de compras con historial de precios)

## Meta
- Status: Ready for Kickoff
- Last Updated: 2026-11-09
- Sessions: 2

## 1. Origin
- **Entry Type**: Solution (se retrocedió al problema subyacente)
- **Initial Statement**: "Aplicación móvil tanto para ios como para android, con la capacidad de crear lista de compras, ya sea para feria, supermercado, o cualquier otro servicio en la cual se necesite una lista de compras." Funciones pedidas: múltiples listas con nombre, fecha de creación y tag (supermercado|feria); fecha de uso; base de datos de ítems de ferias y supermercados; cantidad, precio manual y unidad o kg; comparación de precio y fecha entre listas con el mismo tag con gráfica de variación en % y precio; autocompletado al escribir el nombre de un ítem.
- **Refined Problem Statement**: Cada semana una familia compra frutas y verduras en la feria con listas hechas a mano o en notas del celular. Las listas se pierden y, aunque se reutilicen, nadie recuerda cuánto costaba cada ítem. Sin ese dato no pueden estimar cuánto efectivo llevar, y llevar de más es un riesgo por posibles robos. Tampoco pueden ver si el mercado sube o baja de precio entre semanas.

## 2. Jobs to be Done
- **Primary Job**: Preparar la compra semanal de la feria con una lista confiable y saber cuánto efectivo llevar, para no pasarse del presupuesto ni cargar dinero de más.
- **Related Jobs**:
  - Reutilizar la lista de la semana anterior sin reescribirla.
  - Saber si un producto está más caro o más barato que antes.
  - Compartir la lista con la familia o con quien acompaña la compra.
  - Llevar un registro de lo gastado a lo largo del tiempo.
- **Current Alternatives**:
  - Lista escrita a mano: se pierde, no guarda precios.
  - Notas del celular: no se pierde, pero no guarda el historial de precios por ítem y se copia y pega a mano.
  - Memoria: poco fiable para los precios.
  - Apps de listas genéricas con precios (Grocery, Listonic, Shopping List: Advanced, Grocery Prices History): no están pensadas para ferias, ni para el contexto chileno.
  - Comparadores chilenos (Carriapp, Sernac): comparan supermercados en tiempo real, no el historial propio ni ferias.
- **Switching Triggers**:
  - Perder otra vez la lista o no saber cuánto llevar.
  - Una compra que salió mucho más cara de lo esperado.
  - Que un familiar le muestre que la app le dio un total estimado acertado.

## 3. User Segments

### Segment 1: Familia que compra en la feria cada semana (usuario principal, el creador y sus padres)
- **Context**: Cada viernes van juntos a la feria a comprar frutas y verduras. Pagan en efectivo. Planifican la lista antes y la usan durante la compra.
- **Motivation**: Llevar la cantidad justa de efectivo (menos riesgo de robo), no perder la lista, reutilizarla y ver cómo cambian los precios.
- **Ability Barriers**:
  - Anotar precios en el puesto, con las manos ocupadas y de pie. Se resuelve anotándolos después de comprar cada producto.
  - Hábito arraigado de la lista en papel.
  - Padres con menos familiaridad con apps.
  - Cobertura de internet irregular en la feria (probable necesidad de funcionar sin conexión).
- **Potential Prompts**: La noche antes de la feria (armar la lista) y justo antes de salir (¿cuánto llevo?). Al final de cada compra, cuando el precio está fresco.

### Segment 2: Conocidos y compradores semanales con presupuesto ajustado
- **Context**: Personas que compran de forma recurrente en feria o supermercado y quieren controlar el gasto y ver la tendencia de precios. Este segmento es hipotético, aún no validado.
- **Motivation**: Entender cómo va el mercado y planificar el gasto semanal, y compartir listas con su hogar.
- **Ability Barriers**: Deben ingresar los precios a mano cada vez, y la app parte con pocos datos propios. Necesitan ver valor tras pocas semanas de uso.
- **Potential Prompts**: Subidas de precios en frutas y verduras, y recomendaciones de conocidos que ya la usan.

## 4. Market Landscape

### Direct Competitors
| Competitor | What They Do | Strengths | Weaknesses | Pricing |
|------------|--------------|-----------|------------|---------|
| Listonic | Lista de compras con funciones para ahorrar, asistente de IA y precios recordados | Muy conocida, gratis, funciones completas | Pensada para supermercado, sin tag de feria ni base de ítems chilena | Gratis. Premium desde USD 0,99/mes (quita anuncios, añade personalización) |
| Grocery | Lista con precio y calidad por ítem, sigue cambios de precio entre compras | Seguimiento de precios integrado | Mercado de EE. UU., sin contexto de feria | No encontrado |
| Grocery Prices History | Gráficos de variación de precios y exportación a CSV | Gráficos de variación | iPhone, sin foco en feria ni listas reutilizables | No encontrado |
| Shopping List: Advanced | Lista que guarda el historial de precios de cada ítem | Historial automático | Genérica, sin enfoque local | No encontrado |

### Indirect Competitors
| Solution | How it's used for this job | Gap it leaves |
|----------|---------------------------|---------------|
| Papel y notas del celular | Es lo que la familia usa hoy | Se pierde, sin historial de precios por ítem, sin total estimado |
| ¿A cuánto? (ODEPA) y boletines ODEPA | Consultar precios de frutas y verduras | Son precios mayoristas, no lo que el usuario pagó, y no hay lista |
| Carriapp y comparador Sernac | Comparar el carro entre supermercados | No cubren ferias ni guardan historial propio |

### Market Signals
- El efectivo sigue siendo el medio de pago principal en las ferias libres (Banco Central, citado por Emol, 2026-08-05).
- Una columna de Mediabanco señala que una proporción importante de los compradores de feria son adultos mayores (cifra no verificada en la fuente original).
- Estudio País Conectado (WOM y Cadem, 2026): 75% de los mayores de 60 años dice que las apps le ahorran tiempo. Encuesta Senior Tech (2025): 66% de los adultos mayores se siente presionado a digitalizarse.
- Los precios en ferias varían de forma notable en productos individuales: los sondeos de ODEPA reportados por DF muestran alzas de 25% a 27% en repollo y bajas de 25% en manzanas Fuji, aunque el promedio general se movió cerca de 3%.
- Las ferias suelen tener precios más bajos que los supermercados, y la diferencia entre canales llega a 139% a 189% en productos como la papa cardinal y el ajo chino.
- No se encontraron cifras de financiamiento o crecimiento para este nicho. Las apps de delivery de ferias (por ejemplo Pedidos Sanos, 2021) existen, pero resuelven otro problema.

### Opportunity Gaps
- **Historial propio para feria**: ninguna app encontrada combina lista, historial de precios pagados y contexto de feria. Importa porque el precio varía mucho de un producto a otro y de una semana a otra, y la familia hoy no lo recuerda.
- **"Cuánto efectivo llevo"**: ninguna estima el total en efectivo a partir de los precios de la última compra. Es el problema que originó la idea y se conecta con el riesgo de robo.
- **Contexto chileno**: base de ítems de feria, venta por kg o por unidad, pesos chilenos y lenguaje cotidiano.
- **Simplicidad para adultos mayores**: con una parte importante de compradores mayores y una alta presión a digitalizarse, una interfaz muy simple es un diferencial.

### Limitaciones de esta investigación
- Búsqueda hecha con 6 consultas, sin pruebas de las apps, y algunas fuentes son páginas de marketing de las propias empresas.
- No se pudo confirmar las funciones de Carriapp, el estado actual de ¿A cuánto?, ni cifras oficiales de uso de smartphone por edad (Subtel 2025 por revisar).
- El usuario no conoce otros competidores adicionales.

## 5. Assumptions Log

| ID | Assumption | Category | Importance | Confidence | Evidence | Validation Strategy |
|----|------------|----------|------------|------------|----------|---------------------|
| A1 | El usuario anotará el precio de cada producto justo después de comprarlo, en el puesto | User | High | Low | Sin evidencia externa. Es una conducta nueva y las manos están ocupadas en la feria | Probar con la propia familia durante 3 a 4 viernes y medir cuántos precios se registran |
| A2 | Con precios de la última compra, la app puede estimar bien cuánto efectivo llevar | Problem | High | Medium | El problema nace de la experiencia del usuario. Los precios varían entre semanas (alzas y bajas de 25% en productos individuales), así que la estimación será aproximada | Comparar el total estimado con el gasto real durante varias semanas |
| A3 | Los precios de un mismo producto cambian lo bastante entre semanas como para que la gráfica aporte valor | Market | High | Medium | Sondeos ODEPA/DF muestran variaciones puntuales de 25% o más, pero el promedio general ronda 3% | Revisar los datos propios tras 4 a 6 semanas |
| A4 | Los padres del usuario y otros adultos mayores usarán la app de forma regular | User | High | Low | Hay adopción creciente (75% dice que las apps les ahorran tiempo) pero también presión y brecha digital (66% se siente presionado) | Observar a los padres usando el prototipo y simplificar el flujo |
| A5 | Los usuarios querrán compartir listas, y export/import basta | Solution | Medium | Low | Es idea del usuario, no hay evidencia | Probar con la familia si el flujo de compartir por WhatsApp es suficiente |
| A6 | La app debe funcionar sin conexión a internet en la feria | Solution | High | Medium | Es probable, pero no se verificó la cobertura en las ferias del usuario | Preguntar en la propia feria si hay señal estable. Diseñar offline-first por defecto |
| A7 | Los compradores de feria pagan principalmente en efectivo, por lo que "cuánto llevo" es un problema relevante | Market | High | High | Banco Central: el efectivo es el medio principal en ferias libres | Monitorear |
| A8 | Una base de ítems de feria propia aporta valor frente a escribir el nombre libremente | Solution | Medium | Medium | El autocompletado reduce la fricción, pero hay que crear y mantener la base | Empezar con una lista corta de ítems comunes y dejar que el usuario agregue los suyos |
| A9 | Hay un público más amplio (conocidos, otros países) que pagaría o usaría la app | Market | Low | Low | Sin evidencia. Listonic es gratis y cobra poco por Premium, así que el pago directo es difícil | Tratarla como app personal y familiar primero, sin plan de monetización por ahora |

### Priority Matrix
- **Test First** (High Importance, Low Confidence): A1, A4
- **Monitor** (High Importance, High or Medium Confidence): A2, A3, A6, A7
- **Validate Later** (Lower priority): A5, A8, A9

## 6. Solution Hypotheses

### Hypothesis 1: Lista con sobre de efectivo (Recommended)
- **Description**: App offline-first de listas para feria y supermercado. Cada ítem recuerda el último precio pagado, que aparece prellenado, y la lista muestra un total estimado ("cuánto llevar"). Después de comprar cada producto, el precio se confirma con un toque o se corrige. Si no se alcanza a anotar en el puesto, un cierre de compra en casa permite confirmar todos los precios juntos. Incluye autocompletado desde una base inicial de ítems de feria (editable), tag, fecha de uso, unidad o kg y una gráfica simple por ítem. Compartir listas por export/import usando el menú nativo del celular, sin cuentas.
- **Key Differentiator**: Responde a "cuánto efectivo llevo" con los precios propios, enfocada en la feria y pensada para uso simple. Ninguna app encontrada hace esto.
- **Target Segment**: Segmento 1, la familia que compra cada semana en la feria.
- **Validates Assumptions**: A1, A2, A4, A6, A8
- **Key Risks**: Que anotar el precio siga siendo una carga (A1). Que la estimación no sea suficientemente precisa por la variación de precios (A2). Mantener una interfaz simple a medida que se agregan funciones.
- **Prior Art**: No se buscó (evolución de una categoría existente). Las apps de listas con precios (Listonic, Grocery) confirman que la demanda de recordar precios existe, pero ninguna se centra en la feria.

### Hypothesis 2: Cuaderno de precios
- **Description**: Enfoque analítico: el centro de la app es seguir y comparar precios. Comparación entre listas con el mismo tag, gráficas de variación en % y precio por ítem, y una vista de tendencias del mercado. La lista es solo la forma de ingresar datos.
- **Key Differentiator**: Análisis de precios más profundo que las apps de listas, aplicado a ferias.
- **Target Segment**: Segmento 2, compradores atentos al presupuesto y a la tendencia del mercado.
- **Validates Assumptions**: A3, A1
- **Key Risks**: Necesita varias semanas de datos antes de mostrar valor. Más compleja para adultos mayores (A4). Se aleja del problema original de llevar el efectivo justo.
- **Prior Art**: Grocery Prices History y Shopping List: Advanced ya ofrecen historial y gráficos, sin foco en feria.

### Hypothesis 3: Lista familiar sincronizada
- **Description**: Cuentas y sincronización en la nube para que toda la familia edite la misma lista en tiempo real y comparta el historial de precios.
- **Key Differentiator**: Colaboración en vivo, sin pasar archivos.
- **Target Segment**: Familias o grupos con varios compradores.
- **Validates Assumptions**: A5
- **Key Risks**: Requiere servidor, cuentas e inicio de sesión, lo que es una barrera para adultos mayores (A4). No funciona sin internet en la feria (A6). Mayor costo y complejidad de construir y mantener.
- **Prior Art**: Listonic, AnyList y otras ya lo ofrecen, así que no aportaría diferencial.

### Recommendation
**Pursue Hypothesis 1 (Lista con sobre de efectivo)** because:
- Ataca directamente el problema que originó la idea, saber cuánto efectivo llevar, y la brecha que ninguna app cubre.
- Prueba primero los supuestos de mayor riesgo (A1 y A4) con el usuario real, tu familia.
- Funciona sin conexión y sin cuentas, lo que encaja con el uso en la feria y con adultos mayores.
- Lo esencial de la Hipótesis 2 (historial y gráficas) entra como función secundaria, y la sincronización de la Hipótesis 3 puede venir más adelante si hace falta.

Key risks to monitor: carga de anotar precios, precisión de la estimación, simplicidad de la interfaz.
Critical assumptions to validate early: A1, A4

## 7. Open Questions for /kickoff

### Requirements Questions
**Decisiones del usuario (2026-11-09):**
- [x] Total estimado: es solo una estimación, no tiene que ser exacto. El precio que el usuario escribe después de comprar un ítem sobrescribe el precio estimado anterior, de modo que la estimación se ajusta a los precios de esa feria o supermercado en particular.
- [x] MVP: incluye tanto el último precio como la gráfica de variación (% y precio).
- [x] Compartir en el MVP: solo el contenido de la lista (export/import). No se necesita que dos personas editen la misma lista. Si se implementa más adelante, será con conexión a internet y cuentas de Google, con edición en tiempo real tipo Google Docs.
- [x] Base inicial de ítems: primero la lista de ítems y después los precios. Se arma investigando las frutas y verduras más compradas por temporada en Chile y los ítems de supermercado. Nombres genéricos, sin marca (por ejemplo "fideos", no "Lucchetti" ni "Carozzi").

- [x] Tags: el usuario crea sus propios tags con nombre (por ejemplo "feria las condes", "feria las compañías"), cada uno con un color elegido (por ejemplo verde). El precio y el historial se asocian al tag, o sea a un lugar específico. Habrá una sección de comparativas que compara todas las listas de un mismo tag (por ejemplo, todas las de color verde).
- [x] Compartir: código QR. Si la lista ya tiene precios y cantidades, se incluyen al compartirla.
- [x] Ítems sin precio: siempre debe haber un valor de referencia, nunca un vacío.

**Preguntas que quedan:**
- [ ] ¿De dónde sale el valor de referencia la primera vez que se compra un ítem (precio de otro tag, un valor inicial de la base de ítems, dato público de ODEPA, o el que el usuario fija)?
- [ ] ¿Se mantienen los tags genéricos "feria" y "supermercado" como punto de partida, o el usuario siempre crea los suyos?
- [ ] Un QR tiene capacidad limitada: ¿qué pasa con listas muy largas o con historial de precios (varios códigos, o solo la lista actual con su último precio)?
- [ ] ¿Qué significa "fecha en que se usó" una lista y cómo se marca como comprada?
- [ ] ¿Los tags son solo feria y supermercado o el usuario puede crear los suyos?
- [ ] ¿Cómo se manejan las cantidades y las unidades (kg, unidad, atado, malla)?

### Technical Questions
- [ ] ¿Qué framework para iOS y Android con un solo código (por ejemplo React Native/Expo o Flutter)? Se decide en /tech-stack.
- [ ] Almacenamiento local en el teléfono y respaldo: ¿qué pasa si el usuario pierde o cambia de teléfono?
- [ ] ¿Cómo se construye y se mantiene la base inicial de ítems de feria? ¿Se puede partir de datos públicos de ODEPA o se escribe a mano?
- [ ] Autocompletado: búsqueda tolerante a errores de tipeo y a sinónimos (por ejemplo "frutilla" y "fresa").

### Business Questions
- [ ] ¿Es una app personal y familiar o se publicará en las tiendas? Si se publica, ¿gratis, con anuncios o Premium?
- [ ] ¿Se publica en Chile primero y qué se necesita para otros países (moneda, idioma, ítems)?

### User Research Gaps
- [ ] A1: ¿cuántos precios se registran realmente en el puesto durante 3 a 4 viernes con la familia?
- [ ] A4: ¿tus padres logran armar y usar una lista sin ayuda? ¿Qué tamaño de letra y botones necesitan?
- [ ] A6: ¿hay señal estable en tu feria?
- [ ] A2: ¿qué tan cerca queda el total estimado del gasto real?

## 8. Research Log
| Date | Topic | Source | Key Findings |
|------|-------|--------|--------------|
| 2026-11-09 | Landscape scan: apps de listas con seguimiento de precios | Grocery (iMore), Listonic, Shopping List: Advanced, GroceryBudget, Grocery Prices History | Existen varias listas con historial o seguimiento de precios, mercado saturado en listas simples. Ninguna se orienta a ferias. |
| 2026-11-09 | Landscape scan: Chile | Carriapp, comparador Sernac, Observatorio de Precios (ChileAtiende) | Comparan precios entre cadenas en tiempo real. No encontré historial propio, ferias ni autocompletado. Búsqueda rápida, sin verificar a fondo. |
| 2026-11-09 | Competidores en Chile: apps de feria | ODEPA (¿A cuánto?), Pedidos Sanos, GoodMeal, Pauta, DF | No hay app que combine lista de feria con historial. ¿A cuánto? es mayorista. Pedidos Sanos es delivery. |
| 2026-11-09 | Precios de Listonic y funciones gratis o de pago | Listonic, App Store, App Pricing Lab | Funciones centrales gratis. Premium desde USD 0,99/mes (sin anuncios y personalización). Fuentes en parte de marketing. |
| 2026-11-09 | Datos de precios de ferias | ODEPA boletines y sondeo semanal (DF) | ODEPA publica precios mayoristas y un sondeo semanal de ferias y supermercados en la RM. |
| 2026-11-09 | Pago en efectivo en ferias | Emol/Banco Central, Mediabanco, Ex-Ante, SII | El efectivo sigue siendo el medio principal en ferias. Mucho comprador mayor (dato no verificado). |
| 2026-11-09 | Uso de smartphone por adultos mayores en Chile | CNN Chile (WOM/Cadem), Radio Agricultura (Senior Tech), UC | 75% dice que las apps le ahorran tiempo. 66% se siente presionado a digitalizarse. No hay cifra Subtel 2025 confirmada. |
| 2026-11-09 | Variación de precios en ferias | DF (sondeos ODEPA) | Variaciones puntuales de ±25% en productos, promedio general cerca de 3%. Fechas de las notas no claras. |
| 2026-11-09 | Prior attempts | (omitido) | No se buscó: las hipótesis evolucionan una categoría existente (listas con precios). |
