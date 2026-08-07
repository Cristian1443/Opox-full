# Monitor BOE — guía de prueba para quien no viene del mundo jurídico

Esta guía es para probar el módulo sin saber nada de derecho. Todo lo que hay que saber está
aquí: qué hace el módulo, qué normas usar (con su código ya copiado), qué pasos dar y qué
tiene que salir en cada uno.

La guía técnica para integradores es otra: `API_Monitor_BOE.md` (endpoints, códigos de error)
y la colección `postman/MotorIA_Monitor_BOE.postman_collection.json`.

---

## 1. Vocabulario mínimo

| Palabra | Qué significa aquí |
|---|---|
| **BOE** | Boletín Oficial del Estado. Donde España publica sus leyes. |
| **Norma** | Una ley, un real decreto, un reglamento. Un documento legal. |
| **Texto consolidado** | La versión de la norma con todas sus reformas ya incorporadas: cómo está la ley **hoy**. Es lo que descarga el módulo. |
| **Identificador BOE** | El código único de cada norma: `BOE-A-AAAA-NNNNN`. `BOE-A-2015-10565` es la Ley 39/2015. |
| **Artículo / precepto** | Cada trozo numerado de una ley. "Artículo 21" es un precepto. |
| **Reforma** | Cuando una ley nueva cambia el texto de una ley antigua. El BOE republica el consolidado con la redacción nueva. |

## 2. Qué hace el módulo, en una frase

Vigila las leyes que un temario usa. Cuando el BOE cambia una de esas leyes, el módulo lo
detecta, **retira las preguntas del banco que se apoyaban en el texto viejo** (para que ningún
alumno estudie derecho derogado) y puede reescribirlas sobre la redacción nueva.

## 3. Antes de empezar

1. **Un curso con temario cargado.** El monitor trabaja sobre las preguntas de un curso. Si el
   curso está vacío no hay nada que marcar. Se crea en `/` (Generador de tests): subir un PDF
   y generar preguntas.
2. **Clave de OpenAI (`sk-…`).** La demo pública no lleva clave propia. Se pega en el campo de
   abajo a la izquierda en `/boe` y se pulsa **Guardar**.
   - Sin clave: dar de alta normas, listarlas y darlas de baja **sí** funciona.
   - Con clave: **Comprobar ahora** y regenerar preguntas. Comparan textos con embeddings, y
     eso se paga.
3. **URL.** `…/boe` para este módulo (`/` es el generador, `/bank` el banco de exámenes).

## 4. Normas para probar

Códigos reales, verificados contra la API del BOE el 4 de agosto de 2026. Copiar y pegar tal
cual en el campo **Seguir una norma**.

| Identificador | Norma | Por qué sirve |
|---|---|---|
| `BOE-A-2015-10565` | Ley 39/2015, del Procedimiento Administrativo Común | La estrella de cualquier oposición |
| `BOE-A-2015-10566` | Ley 40/2015, de Régimen Jurídico del Sector Público | Su pareja; se reforma a menudo |
| `BOE-A-2015-11719` | RD Legislativo 5/2015, Estatuto Básico del Empleado Público (EBEP) | Función pública |
| `BOE-A-1978-31229` | Constitución Española | Texto largo, buen caso de carga |
| `BOE-A-1985-5392` | Ley 7/1985, Bases del Régimen Local | Administración local |
| `BOE-A-2017-12902` | Ley 9/2017, Contratos del Sector Público | Muy voluminosa y muy reformada |
| `BOE-A-2018-16673` | LO 3/2018, Protección de Datos | Temario transversal |
| `BOE-A-1995-25444` | LO 10/1995, Código Penal | Para oposiciones de seguridad |

Para provocar errores a propósito:

| Valor | Qué debe salir |
|---|---|
| `BOE-A-9999-99999` | Error: el BOE no publica esa norma (404) |
| `39/2015` o `ley 39` | Error de formato: debe ser `BOE-A-AAAA-NNNNN` (422) |
| Un identificador ya seguido | Error: ya estaba en seguimiento (409) |

## 5. Guion de prueba

### 5.1 Alta de norma
1. Elegir el curso en el desplegable **Curso**.
2. Pegar `BOE-A-2015-10565` en **Seguir una norma** y pulsar **＋**.
3. **Esperado:** aparece en *Normas en seguimiento* con su título oficial completo
   ("Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común…"). El título no se
   escribe a mano: lo trae el BOE. Tarda unos segundos porque descarga la ley entera.

### 5.2 Errores controlados
4. Repetir el mismo identificador → aviso de que ya se sigue. No se duplica en la lista.
5. Probar `39/2015` → aviso de formato.
6. Probar `BOE-A-9999-99999` → aviso de norma no encontrada en el BOE.

### 5.3 Alta de varias y baja
7. Añadir dos o tres más de la tabla. Todas deben salir con su título correcto.
8. Pulsar la **✕** de una → pide confirmación y desaparece de la lista.

### 5.4 Comprobación de cambios
9. Con la clave guardada, pulsar **Comprobar ahora**.
10. **Esperado:** un resumen del tipo `revisadas: 3, cambios: 0, preguntas afectadas: 0`.
11. Pulsar **Ver cambios** → lista vacía.

> **Importante: `cambios: 0` es el resultado correcto, no un fallo.** El módulo compara la ley
> de hoy con la copia que guardó al darla de alta. Si el BOE no ha tocado esa ley en el
> intervalo, no hay nada que detectar. Ver el punto 6.

### 5.5 Cuando sí hay un cambio
Si aparece un cambio, la ficha muestra:
- El texto **antes** y **después**, y el artículo afectado.
- Las **preguntas afectadas**: dejan de servirse al alumno hasta revisarlas.
- El **temario retirado**: fragmentos del PDF que copiaban la redacción derogada.
- Botón para **regenerar**: reescribe esas preguntas sobre el texto vigente y solo las vuelve
  a publicar si pasan la validación completa. Las que no pasan quedan marcadas para revisión
  humana — eso también es comportamiento correcto, no un error.

## 6. Por qué es difícil ver una detección durante el QA

Medido contra la API del BOE el 4 de agosto de 2026: hay unas **12.500 normas consolidadas** y
del 1 al 4 de agosto se actualizaron **43**. Son unas 11 al día, aproximadamente **1 de cada
1.100**. La probabilidad de que una norma concreta cambie justo durante una semana de pruebas
es muy baja, y el BOE no ofrece manera de pedir "dame esta ley como estaba en 2018" para
forzarlo desde fuera.

Traducción práctica: **el alta, el listado, la baja, los errores y la comprobación se prueban
hoy mismo; la detección de una reforma real no se puede provocar a voluntad.**

Para poder probarla en cualquier momento hacen falta datos preparados. Dos vías, a decidir:

- **Curso de demostración con un cambio ya detectado.** Se deja sembrado un caso real (una
  reforma auténtica ya ocurrida) y el tester entra, ve la ficha del cambio, las preguntas
  retiradas y pulsa regenerar. Es lo más rápido de montar.
- **Botón de simulación para QA.** Devuelve la copia guardada de una norma a una versión
  anterior real; la siguiente comprobación detecta la reforma auténtica que vino después.
  Repetible tantas veces como se quiera y con texto legal de verdad, no inventado.

Esta parte no está construida todavía: es la que hay que acordar para que el testeo pueda
cerrarse.

## 7. Qué no es un fallo

| Lo que se ve | Por qué es correcto |
|---|---|
| `cambios: 0` tras comprobar | Ninguna de esas leyes se ha tocado desde el alta |
| El alta tarda varios segundos | Descarga la ley completa del BOE; el Código Penal o la Ley 9/2017 son enormes |
| Una regenerada sale como "marcada" y no se publica | No superó la validación; el sistema prefiere no publicar antes que publicar algo dudoso |
| El texto retirado desaparece del temario | Es el objetivo: el material derogado deja de generar preguntas nuevas |
| Sin clave de OpenAI no se puede comprobar | La comparación consume modelo; el alta y el listado no |
