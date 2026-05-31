# 🥦 CLAUDE.md — DietPro
> App de gestión para dietéticas — Ecosistema CyC

---

## 📌 Info del proyecto
- **App:** DietPro
- **Prefijo licencia:** DIET (ej: DIET-0001-2026-XXXX)
- **Repo GitHub:** dragoprot26-Esp/dietpro
- **URL Vercel:** https://dietpro.vercel.app (pendiente de crear)
- **Descripción:** Gestión de productos, stock, ventas y ofertas para dietéticas.
  Incluye escaneo de código de barras/QR con el celular y página pública para clientes.

---

## 🏗️ Módulos

| Módulo | Estado |
|---|---|
| Auth (login + licencia DIET) | pendiente |
| Productos + Escaner (QuaggaJS) | pendiente |
| Stock (movimientos + alertas) | pendiente |
| Ventas / Caja (+ Mercado Pago) | pendiente |
| Ofertas | pendiente |
| Dashboard (analytics) | pendiente |
| Configuración + QR del local | pendiente |
| Página pública (/local/SLUG) | pendiente |

---

## 💳 Planes de suscripción

| Plan | Ofertas | Productos local |
|---|---|---|
| Básico | 50 | 20 |
| Pro | 100 | 50 |
| Max | 300 | 150 |
| Libre | Sin límite | Sin límite |

---

## 🗄️ Tablas Supabase

- **products:** id, tenant_id, name, brand, barcode, category, price, stock, min_stock, entry_date, expiry_date, image_url, active
- **stock_movements:** id, product_id, tenant_id, type (in/out), quantity, reason, created_at
- **sales:** id, tenant_id, items (JSON), total, payment_method, created_at
- **offers:** id, product_id, tenant_id, offer_price, label, active, expires_at
- **salon_config:** tenant_id, name, whatsapp, email, address, logo, public_slug
- **barcode_cache:** barcode, name, brand (compartida entre todos los tenants)

---

## 🛠️ Stack

- **Frontend:** SPA HTML/JS — mismo patrón que SalonPro
- **DB:** Supabase (mismo proyecto que el ecosistema)
- **Deploy:** Vercel conectado al repo
- **Escaneo:** QuaggaJS (barcodes) + jsQR (QR codes)
- **Pagos:** Mercado Pago Checkout Pro
- **Mails:** EmailJS (service_yyq7g8j)
- **QR local:** QRCode.js generado en el navegador

---

## 🔒 Reglas de seguridad (heredadas del ecosistema)

1. RLS activo en todas las tablas — filtro por tenant_id obligatorio
2. Sin credenciales hardcodeadas — variables de entorno en Vercel
3. Session limpia al login (reset de variables globales)
4. autocomplete="off" en campos de login
5. Estándares OWASP: prevenir XSS, CSRF, SQL Injection

---

## 📋 Estado del desarrollo

- [x] Plan de 7 fases generado (docs/Plan_DietPro_7Fases.pdf)
- [ ] Repo GitHub creado
- [ ] Tablas Supabase creadas
- [ ] Estructura base SPA
- [ ] Módulo Auth
- [ ] Módulo Productos + Escaner
- [ ] Módulo Stock
- [ ] Módulo Ventas
- [ ] Módulo Ofertas
- [ ] Dashboard
- [ ] Página pública
- [ ] Manual PDF

---

## 📎 Documentos

- `docs/Plan_DietPro_7Fases.pdf` — Plan completo de desarrollo
