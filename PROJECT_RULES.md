# PROJECT_RULES.md — Bodega Pro 8.0
# Reglas Técnicas Permanentes · A2K Digital Studio

> Este archivo documenta TODOS los bugs corregidos y decisiones técnicas definitivas.
> Claude debe leerlo en cada sesión ANTES de tocar el código.

---

## REGLA #1 — BOTONES CANCELAR: z-index + pointer-events

**Problema:** Los botones "Cancelar" (`class="btn btn-ghost"`) en el `.modal-footer`
no tenían `z-index` ni `pointer-events:auto`, quedando bloqueados bajo capas del overlay.

**Solución aplicada (CSS, línea ~274):**
```css
.modal-footer .btn, .modal-footer button {
  position: relative;
  z-index: 20000 !important;
  pointer-events: auto !important;
}
```

**NUNCA** eliminar esta regla. Aplica a todos los modales: estáticos y dinámicos.

---

## REGLA #2 — closeModal: SIEMPRE usar setProperty

**Problema:** Había dos definiciones de `closeModal`. La primera (línea ~3203) usaba
`el.style.display = 'none'` (débil, puede ser sobrescrita por CSS `!important`).

**Solución definitiva:** AMBAS instancias deben usar:
```javascript
function closeModal(id) {
  var el = document.getElementById(id);
  if (el) { el.style.setProperty('display', 'none', 'important'); el.classList.remove('open'); }
}
```

**NUNCA** usar `el.style.display = 'none'` en esta función. Solo `setProperty`.

---

## REGLA #3 — LISTENER GLOBAL: captura .btn-close Y botones de modal-footer

**Problema:** El listener en fase de captura solo detectaba `.btn-close` (la X),
ignorando los botones "Cancelar" que usan `class="btn btn-ghost"`.

**Solución aplicada (JS, línea ~2102):**
```javascript
window.addEventListener('click', function(e) {
  var btn = e.target.closest('.btn-close, .modal-footer .btn, .modal-footer button');
  if (!btn) return;
  var oc = btn.getAttribute('onclick') || '';
  if (oc.indexOf('closeModal') !== -1) {
    // Tiene onclick propio — forzar cierre del overlay como respaldo
    var overlay2 = btn.closest('.modal-overlay');
    if (overlay2) {
      setTimeout(function(){ overlay2.style.setProperty('display','none','important'); overlay2.classList.remove('open'); }, 0);
    }
    return;
  }
  var overlay = btn.closest('.modal-overlay');
  if (overlay) { overlay.style.setProperty('display','none','important'); overlay.classList.remove('open'); return; }
  var parent = btn.parentNode;
  while (parent && parent !== document.body) {
    if (parent.style && window.getComputedStyle(parent).position === 'fixed') {
      parent.style.setProperty('display','none','important'); break;
    }
    parent = parent.parentNode;
  }
}, true); // TRUE = fase de captura, no puede ser bloqueado por stopPropagation
```

---

## REGLA #4 — Z-INDEX STACK (NO MODIFICAR SIN CAUSA)

| Elemento | z-index | Motivo |
|---|---|---|
| `#modalAdminPw` | 99999 | Modal de contraseña admin, siempre encima |
| `.btn-close` | 20000 !important | Botón X de cierre |
| `.modal-footer .btn` | 20000 !important | Botones Cancelar/Cerrar |
| `.modal-overlay` | 10001 | Overlay de fondo de modales |
| `#modalServerInfo` | 10000 | Modal Servidor Local (HTML estático final) |
| `.sidebar`, `.topbar` | 9000 | Navegación principal |

---

## REGLA #5 — IRON LOCK (PROHIBIDO MODIFICAR)

- El sistema de licencias ejecuta INMEDIATAMENTE al cargar la página.
- Bloquea `#app` (`display:none`) hasta validar la licencia.
- Códigos MASTER internos: `BPRO-DEMO-2024`, `BPRO-ABIG-2024`, `BPRO-ZYNC-2024`.
- **NUNCA alterar** la lógica de verificación, vencimiento ni bloqueo.

---

## REGLA #6 — LICENCIA DEMO = 5 DÍAS FIJOS

- `<select id="demo-dias">` debe estar **siempre** con `disabled` y `pointer-events:none`.
- En JS: `vd.setDate(vd.getDate()+5)` — el número 5 es **inmutable**.
- El texto visible siempre muestra `<strong id="demo-dias-label">5 días</strong>`.
- **NUNCA** agregar un selector de 1-7 días ni cambiar la duración.

---

## REGLA #7 — PESO MÍNIMO: 720 KB

- El archivo `index.html` debe mantenerse en ~720 KB (~6633 líneas).
- **NUNCA** eliminar CSS, funciones de inventario, módulos o comentarios para "reducir peso".
- Si se agregan features, el peso puede crecer — nunca reducirse por debajo del original.

---

## REGLA #8 — MODALES DINÁMICOS (creados por JS)

Estos modales no existen en el HTML inicial. Se crean en tiempo de ejecución:

| ID | Creado en función |
|---|---|
| `#modalLogout` | `logout()` |
| `#modalAjusteStock` | `adjustStock()` |
| `#modalProveedor` | funciones de proveedores |
| `#modalDeudaProv` | funciones de proveedores |
| `#modalPagoProv` | funciones de proveedores |
| `#modalGavetaInfo` | `mostrarInfoGaveta()` |

Todos deben tener `class="modal-overlay"` para que el listener global los capture.

---

## REGLA #9 — MODAL SERVIDOR LOCAL (`#modalServerInfo`)

- Está al **final del body**, línea 6633 (fuera del `#app`).
- Sus listeners se asignan dinámicamente: `document.getElementById('closeServerModal').onclick = _cerrarServer`.
- El listener global en captura también lo cubre como respaldo.
- **NUNCA moverlo** dentro del `#app` — debe permanecer en su posición actual.

---

## HISTORIAL DE CORRECCIONES

| Fecha | Bug | Solución |
|---|---|---|
| 2026-03-20 | Modales no cerraban (X ni Cancelar) | z-index 20000, setProperty, listener captura v1 |
| 2026-03-20 | X funciona, Cancelar muerto | CSS modal-footer z-index, closeModal unificado, listener captura v2 |

---

## CONTACTO DEL PROYECTO

- **Desarrollador:** A2K Digital Studio
- **WhatsApp:** +58 416 411 7331
- **Email:** a2kdigitalstudio2025@gmail.com
- **Repo GitHub:** `tiendadigitalaipro/bodega-pro-descarga.html`
- **Branch:** `main`
