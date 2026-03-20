# 🧠 CLAUDE.md — Agente Especialista: Bodega Pro 8.0 (A2K Digital Studio)

> **Archivo de contexto del proyecto. Léelo antes de cualquier tarea.**
> Evita gastar tokens leyendo los 720 KB completos del index.html en cada sesión.

---

## 🎯 ROL DEL AGENTE

Eres el **Agente Técnico Senior** de Bodega Pro 8.0, una app POS (Point of Sale) para bodegas venezolanas, desarrollada por A2K Digital Studio. El archivo principal es `index.html` (monolítico, ~720 KB, ~6633 líneas). **No existen archivos externos de JS ni CSS separados** — todo está inline en un solo HTML.

---

## ⚙️ ARQUITECTURA DEL PROYECTO

```
bodega-pro-descarga.html-main/
├── index.html                   ← App principal (720 KB, 6633 líneas) — ARCHIVO ÚNICO
├── bodega-pro-descarga.html     ← Página de descarga/landing
├── formulario-demo-bodega.html  ← Formulario para solicitar demo
├── Bodega Pro v8.0 — A2K Digital Studio.html ← Versión legacy/backup
├── README.md
└── CLAUDE.md                    ← Este archivo
```

### Estructura interna de `index.html`

| Bloque | Líneas aprox. | Descripción |
|---|---|---|
| `<head>` + CSS global | 1 – 730 | Variables CSS, estilos completos, responsive |
| HTML Pantalla Login | 634 – 682 | `#loginScreen` con Iron Lock |
| HTML App Principal | 683 – 1346 | `#app` con sidebar, topbar, páginas |
| Páginas (pages) | 762 – 1344 | dashboard, pos, inventario, historial, caja, clientes, reportes, proveedores, configuración |
| Modales estáticos | 1347 – 1682 | `#modalProducto`, `#modalCliente`, `#modalCobro` |
| `#modalAdminPw` | 1683 – 1698 | Modal de contraseña admin (z-index: 99999) |
| IRON LOCK JS | 1699 – 2440 | Sistema de licencias, ejecuta INMEDIATO antes de todo |
| JS App principal | 2441 – 6600+ | Lógica POS, inventario, caja, clientes, reportes, proveedores |
| `#modalServerInfo` | 6633 (última línea) | Modal "Servidor Local A2K" (HTML estático al final del body) |

---

## 🔒 REGLAS DE ORO — NO TOCAR SIN AUTORIZACIÓN EXPLÍCITA

### 1. 🛡️ IRON LOCK (Líneas ~1699–2440)
- Es el sistema de seguridad/licencias. **NUNCA modificar su lógica central.**
- Ejecuta INMEDIATAMENTE al cargar, antes de mostrar la app.
- Bloquea todo sin licencia válida.
- `#loginScreen` se muestra por defecto (`display:flex`); `#app` se oculta (`display:none`).
- Códigos MASTER internos: `BPRO-DEMO-2024`, `BPRO-ABIG-2024`, `BPRO-ZYNC-2024`.

### 2. 📅 LICENCIA DEMO = 5 DÍAS FIJOS
- La demo dura **exactamente 5 días**. Sin selector de días (el `<select id="demo-dias">` está `disabled` y con `pointer-events:none`).
- El texto siempre muestra `<strong id="demo-dias-label">5 días</strong>`.
- En código: `vd.setDate(vd.getDate()+5)` — no cambiar este número.

### 3. 📦 PESO MÍNIMO: 720 KB
- **No eliminar CSS ni funciones** para reducir el tamaño. La estructura de 720 KB debe mantenerse.
- Cada módulo (inventario, caja, clientes, proveedores, reportes) tiene su CSS y JS completo inline.

### 4. 🎨 DISEÑO A2K Studio
- Variables CSS: `--neon` (verde neón), `--accent` (azul), `--warn` (amarillo), `--danger` (rojo).
- Fuentes: `--display` (Syne), `--body` (Inter), `--mono` (JetBrains Mono).
- No simplificar ni reemplazar el diseño visual por versiones más simples.

---

## 🪟 SISTEMA DE MODALES — ESTADO ACTUAL (CORREGIDO)

### Z-Index Stack
```
z-index: 99999  → #modalAdminPw (modal de contraseña admin)
z-index: 20000  → .btn-close, botones Cancelar (SIEMPRE por encima de todo)
z-index: 10001  → .modal-overlay (overlay de fondo)
z-index: 10000  → #modalServerInfo
z-index: 9000   → .sidebar, .topbar
```

### Función closeModal (línea ~3203 y ~5084)
```javascript
function closeModal(id) {
  var el = document.getElementById(id);
  if (!el) return;
  el.style.setProperty('display', 'none', 'important');
  el.classList.remove('open');
}
```

### Listener Global de Cierre (línea ~2102) — FASE DE CAPTURA
```javascript
window.addEventListener('click', function(e) {
  var btn = e.target.closest('.btn-close');
  if (!btn) return;
  // 1. Cerrar overlay padre (.modal-overlay)
  var overlay = btn.closest('.modal-overlay');
  if (overlay) { overlay.style.setProperty('display','none','important'); overlay.classList.remove('open'); return; }
  // 2. Cerrar parentNode si no tiene .modal-overlay
  var p = btn.parentNode;
  while(p && p !== document.body) {
    if (p.style && (p.style.position==='fixed'||p.classList.contains('modal-overlay')||p.classList.contains('modal'))) {
      p.style.setProperty('display','none','important'); return;
    }
    p = p.parentNode;
  }
}, true); // ← true = fase de CAPTURA (ignora stopPropagation)
```

### CSS Anti-bloqueo (.btn-close — línea ~273)
```css
.btn-close {
  z-index: 20000 !important;
  pointer-events: auto !important;
  position: relative;
}
```

### Modales dinámicos (se crean con JS, no existen en HTML inicial)
- `#modalLogout` — Cierre de sesión
- `#modalAjusteStock` — Ajuste de stock de inventario
- `#modalProveedor` — Nuevo/editar proveedor
- `#modalDeudaProv` — Deuda con proveedor
- `#modalPagoProv` — Pago a proveedor
- `#modalGavetaInfo` — Info gaveta de dinero

### Modal Servidor Local (`#modalServerInfo`) — línea 6633
- **Está al final del body**, fuera del `#app`.
- Tiene dos botones de cierre: `#closeServerModal` (X) y `#closeServerModal2` (Cerrar).
- Sus listeners se asignan dinámicamente con `.onclick = _cerrarServer`.
- El listener global en captura también lo cubre.

---

## 📱 PÁGINAS DE LA APP

| ID | Módulo |
|---|---|
| `#page-dashboard` | Dashboard / Resumen del día |
| `#page-pos` | Punto de Venta (POS) |
| `#page-inventario` | Inventario de productos |
| `#page-historial` | Historial de ventas |
| `#page-devoluciones` | Devoluciones y anulaciones |
| `#page-caja` | Gestión de caja (apertura/cierre/arqueo) |
| `#page-clientes` | Clientes y fiados |
| `#page-reportes` | Reportes y análisis |
| `#page-proveedores` | Proveedores y deudas |
| `#page-configuracion` | Configuración general |

---

## 🔑 FUNCIONES CLAVE (referencia rápida)

| Función | Línea aprox. | Descripción |
|---|---|---|
| `closeModal(id)` | 3203, 5084 | Cierra modal por ID |
| `openModal(id)` | 5080 | Abre modal por ID |
| `showPage(page, el)` | 2439 | Navega entre páginas |
| `procesarVenta()` | 2858, 5125 | Procesa la venta en POS |
| `renderInventario()` | 3227 | Renderiza lista de inventario |
| `abrirCaja()` | 5437 | Apertura de caja |
| `cerrarCaja()` | 5517 | Cierre de caja |
| `generarLicencia()` | 5346 | Genera código PRO (admin) |
| `generarLicenciaDemo()` | 5366 | Genera código DEMO (admin) |
| `activarConCodigoPro()` | 4923 | Activa licencia PRO en el device |

---

## 💳 MÉTODOS DE PAGO SOPORTADOS

USD: Efectivo $, Zelle, Binance Pay, Zinli, Bybit Pay, Apolo Pay
Bs: Efectivo Bs, Pago Móvil, Punto Crédito, Punto Débito, Transferencia Bs, Bio Pago
Especiales: Fiado, Pago Mixto

---

## 📤 REPOSITORIO GITHUB

- **Repo:** `tiendadigitalaipro/bodega-pro-descarga.html`
- **URL:** `https://github.com/tiendadigitalaipro/bodega-pro-descarga.html`
- **Branch:** `main`
- **Ruta local:** `C:\Users\ASUS\Downloads\bodega-pro-descarga.html-main (1)\bodega-pro-descarga.html-main\`

Para subir cambios directamente:
```bash
cd "C:\Users\ASUS\Downloads\bodega-pro-descarga.html-main (1)\bodega-pro-descarga.html-main"
git add index.html
git commit -m "descripción del cambio"
git push origin main
```

---

## ⚠️ INSTRUCCIONES PARA CLAUDE EN FUTURAS SESIONES

1. **Lee este archivo primero** antes de pedir leer `index.html` completo.
2. **Para editar código:** usa `Read` solo en el rango de líneas relevante (ver tabla de estructura).
3. **Para buscar:** usa `Grep` con el patrón exacto en el archivo.
4. **NUNCA generar el archivo completo** en una respuesta — son 720 KB y se truncaría.
5. **Siempre verificar** que `closeModal` use `setProperty('display','none','important')`.
6. **Después de editar:** hacer `git push` directo sin pedir confirmación de pegado.

---

*Generado automáticamente por Claude — Bodega Pro 8.0 · A2K Digital Studio · 2026*
