#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Genera el Plan de 7 Fases para DietPro — Ecosistema CyC
v2 — Notificaciones, Temas, Colaboradores
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import Flowable

W, H = A4

# Colores
PRIMARY   = colors.HexColor('#2ECC71')
DARK      = colors.HexColor('#1a1a2e')
ACCENT    = colors.HexColor('#27AE60')
LIGHT_BG  = colors.HexColor('#F0FFF4')
LIGHT_BG2 = colors.HexColor('#E8F5E9')
GRAY      = colors.HexColor('#6c757d')
WHITE     = colors.white
GOLD      = colors.HexColor('#F39C12')

styles = getSampleStyleSheet()

def S(name, **kw):
    return ParagraphStyle(name, **kw)

h1_style = S('H1', fontName='Helvetica-Bold', fontSize=16,
             textColor=PRIMARY, spaceBefore=14, spaceAfter=6, leading=20)
h2_style = S('H2', fontName='Helvetica-Bold', fontSize=13,
             textColor=DARK, spaceBefore=10, spaceAfter=4, leading=16)
h3_style = S('H3', fontName='Helvetica-Bold', fontSize=11,
             textColor=ACCENT, spaceBefore=8, spaceAfter=3, leading=14)
body_style = S('Body', fontName='Helvetica', fontSize=10,
               textColor=colors.HexColor('#2c2c2c'), spaceAfter=4, leading=14)
bullet_style = S('Bullet', fontName='Helvetica', fontSize=10,
                 textColor=colors.HexColor('#2c2c2c'), spaceAfter=3,
                 leftIndent=14, leading=13, firstLineIndent=-8)
phase_num_style = S('PhaseNum', fontName='Helvetica-Bold', fontSize=22,
                    textColor=WHITE, alignment=TA_CENTER, leading=26)
phase_title_style = S('PhaseTitle', fontName='Helvetica-Bold', fontSize=13,
                      textColor=WHITE, leading=16)

def bullet(text, icon='v'):
    return Paragraph(f'<font color="#2ECC71">{icon}</font>  {text}', bullet_style)

def check(text):
    return bullet(text, 'v')

def hr(color=PRIMARY, thickness=0.8):
    return HRFlowable(width='100%', thickness=thickness, color=color, spaceAfter=6, spaceBefore=4)

# ── Planes actualizados con colaboradores ────────────────────────────────────
PLANES_COLABORADORES = [
    ['Combinacion', 'Admins', 'Colaboradores', 'Total usuarios', 'Descripcion'],
    ['2x2',  '2', '2',  '4',  'Negocio pequeno, equipo reducido'],
    ['2x4',  '2', '4',  '6',  'Local mediano con repositores'],
    ['2x8',  '2', '8',  '10', 'Local grande con equipo completo'],
    ['2x16', '2', '16', '18', 'Multi-turno o franquicia con muchos empleados'],
]

PLANES_PRODUCTOS = [
    ['Plan', 'Ofertas', 'Productos local', 'Colaboradores max', 'Ideal para'],
    ['Basico',  '50',  '20',  'Hasta 2x4',  'Dietetica pequena'],
    ['Pro',     '100', '50',  'Hasta 2x8',  'Local en crecimiento'],
    ['Max',     '300', '150', 'Hasta 2x16', 'Local grande'],
    ['Libre',   'Sin limite', 'Sin limite', 'Sin limite', 'Franquicia o multi-sucursal'],
]

STACK = [
    ['Herramienta', 'Uso en DietPro'],
    ['GitHub', 'Repo: dragoprot26-Esp/dietpro — CI/CD via Vercel'],
    ['Supabase', 'DB PostgreSQL + Auth + RLS + Storage (imagenes)'],
    ['Vercel', 'Deploy automatico + variables de entorno'],
    ['EmailJS', 'Mails bienvenida, alertas de stock y vencimiento'],
    ['Mercado Pago', 'Checkout Pro para pagos digitales'],
    ['QuaggaJS', 'Escaneo de codigos de barras con camara del celular'],
    ['jsQR / ZXing', 'Lectura de codigos QR con camara'],
    ['QRCode.js', 'Generacion de QR del local para imprimir'],
    ['Web Notifications API', 'Notificaciones push en PC y celular (campanita)'],
    ['Service Worker (PWA)', 'Notificaciones en segundo plano, app instalable'],
]

FASES = [
    {
        'num': '01',
        'color': colors.HexColor('#27AE60'),
        'titulo': 'Planificacion e Ideacion',
        'objetivo': 'Definir el modelo de negocio, roles, colaboradores, planes y flujo general.',
        'items': [
            ('Modelo SaaS', [
                'App de gestion para dieteticas con licencia mensual/anual',
                'Prefijo de licencia: DIET (ej: DIET-0001-2026-XXXX)',
                'Gestionada desde Cyc-Admin — mismo ecosistema CyC',
                'Sistema de referidos heredado del ecosistema',
            ]),
            ('Roles de usuario', [
                'Admin 1 y Admin 2: permisos completos (configuracion, productos, ventas, colaboradores)',
                'Colaborador: permisos limitados definidos por el admin (ventas, stock, sin configuracion)',
                'Vista publica: acceso libre via QR, sin login',
                'La cantidad de colaboradores habilitados viene de Cyc-Admin al emitir la licencia',
            ]),
            ('Sistema de colaboradores (definido en Cyc-Admin)', [
                '2x2: 2 admins + 2 colaboradores = 4 usuarios totales',
                '2x4: 2 admins + 4 colaboradores = 6 usuarios totales',
                '2x8: 2 admins + 8 colaboradores = 10 usuarios totales',
                '2x16: 2 admins + 16 colaboradores = 18 usuarios totales',
                'Cyc-Admin define el tope al emitir la licencia DIET',
                'El admin puede agregar/quitar colaboradores hasta el limite permitido',
                'Cada colaborador tiene usuario y contrasena propios',
            ]),
            ('Planes de suscripcion', [
                'Basico: hasta 50 ofertas + 20 productos del local (colaboradores: hasta 2x4)',
                'Pro: hasta 100 ofertas + 50 productos del local (colaboradores: hasta 2x8)',
                'Max: hasta 300 ofertas + 150 productos del local (colaboradores: hasta 2x16)',
                'Libre: sin limites de productos, ofertas ni colaboradores',
            ]),
            ('Flujo principal', [
                'Admin o colaborador escanea codigo de barras/QR con celular',
                'Completa vencimiento, stock inicial, categoria y precio',
                'Al vender: stock se descuenta automaticamente en Supabase',
                'Si el stock baja del minimo: notificacion en campanita + mail al admin',
            ]),
        ],
        'sugerencia': 'Los permisos de los colaboradores pueden ser granulares en v2: solo ventas, solo stock, ventas + ofertas, etc. Para el MVP alcanza con un rol "colaborador" con acceso a ventas y stock pero sin configuracion ni usuarios.',
    },
    {
        'num': '02',
        'color': colors.HexColor('#2980B9'),
        'titulo': 'Diseno y Arquitectura',
        'objetivo': 'Disenar la base de datos, arquitectura, temas visuales y experiencia de usuario.',
        'items': [
            ('Tablas en Supabase', [
                'products: id, tenant_id, name, brand, barcode, category, price, stock, min_stock, entry_date, expiry_date, image_url, active',
                'stock_movements: id, product_id, tenant_id, type (in/out), quantity, reason, user_id, created_at',
                'sales: id, tenant_id, items (JSON), total, payment_method, seller_id, created_at',
                'offers: id, product_id, tenant_id, offer_price, label, active, expires_at',
                'salon_config: tenant_id, name, whatsapp, email, address, logo, public_slug, theme',
                'barcode_cache: barcode, name, brand (compartida entre todos los tenants)',
                'collaborators: id, tenant_id, name, email, password_hash, active, permissions (JSON)',
                'notifications: id, tenant_id, type, message, read, created_at',
            ]),
            ('Sistema de notificaciones (campanita)', [
                'Tabla notifications en Supabase con tipo, mensaje y estado (leida/no leida)',
                'Web Notifications API: notificacion nativa del navegador en PC y Android',
                'Service Worker: recibe y muestra notificaciones aunque la app este en segundo plano',
                'Realtime Supabase: la campanita se actualiza en tiempo real sin recargar',
                'Tipos de notificacion: stock bajo, producto por vencer, venta anulada, colaborador nuevo',
                'El admin activa el permiso de notificaciones al instalar la PWA (un click)',
            ]),
            ('Sistema de temas (themes)', [
                'Tema Oscuro Verde (default DietPro): fondo #1a1a2e, acento #2ECC71',
                'Tema Claro Natural: fondo blanco, acento verde oscuro #27AE60',
                'Tema Oscuro Neutro: fondo oscuro gris, acento blanco — mas formal',
                'Tema Personalizado: el admin puede elegir color de acento (color picker)',
                'El tema se guarda en salon_config.theme y se aplica via variables CSS',
                'Cada usuario puede tener su tema propio guardado en localStorage',
            ]),
            ('Arquitectura', [
                'SPA (Single Page App) — mismo patron que SalonPro',
                'PWA completa: instalable en celular y PC (manifest.json + Service Worker)',
                'QuaggaJS para codigos de barras EAN-13, EAN-8, Code128',
                'jsQR para lectura de QR con camara',
                'Realtime Supabase para notificaciones en vivo',
                'Pagina publica en /local/SLUG — siempre online',
            ]),
        ],
        'sugerencia': 'El Service Worker ya esta implementado en SalonPro. En DietPro se puede reutilizar la misma arquitectura y agregar el canal de Push Notifications apuntando a la tabla notifications de Supabase Realtime.',
    },
    {
        'num': '03',
        'color': colors.HexColor('#8E44AD'),
        'titulo': 'Desarrollo Seguro',
        'objetivo': 'Construir todos los modulos siguiendo OWASP y el plan de seguridad del ecosistema.',
        'items': [
            ('Modulo: Autenticacion y Usuarios', [
                'Login con usuario/password via Supabase Auth',
                'Verificacion de licencia DIET activa al iniciar sesion',
                'Deteccion de rol: Admin vs Colaborador — menu y permisos distintos',
                'Admin puede crear, editar y desactivar colaboradores hasta el tope de la licencia',
                'El tope de colaboradores viene del campo max_collaborators de la licencia en Cyc-Admin',
                'Contrasena temporal al crear colaborador — forzar cambio en primer login',
                'Logout limpia session y variables globales',
            ]),
            ('Modulo: Notificaciones (campanita)', [
                'Icono de campanita en el header — muestra badge con cantidad no leidas',
                'Panel desplegable con lista de notificaciones recientes',
                'Supabase Realtime: la campanita se actualiza sin recargar la pagina',
                'Web Notifications API: popup nativo del SO al llegar una notif nueva',
                'Service Worker: funciona aunque el celular este con la pantalla apagada',
                'Notificaciones generadas automaticamente: stock bajo, vencimiento en 7 dias',
                'El admin puede marcar todas como leidas o eliminarlas',
                'Compatible PC (Chrome/Edge/Firefox) y celular Android (Chrome PWA)',
            ]),
            ('Modulo: Temas visuales', [
                'Selector de tema en Configuracion con preview en tiempo real',
                'Variables CSS globales: --color-primary, --color-bg, --color-surface, --color-text',
                'Tema se guarda en salon_config y se carga al iniciar la app',
                'Color picker para tema personalizado (libreria Pickr.js)',
                'Vista previa antes de confirmar el cambio de tema',
            ]),
            ('Modulo: Productos y Escaner', [
                'Alta con escaneo de codigo de barras o QR desde la camara del celular',
                'Busqueda en barcode_cache: si existe, precarga nombre y marca',
                'Campos: nombre, marca, categoria, precio, stock, stock minimo, vencimiento',
                'Al guardar: si stock < min_stock, genera notificacion automaticamente',
                'Historial de precios: cada cambio queda registrado con fecha y usuario',
            ]),
            ('Modulo: Stock', [
                'Vista de inventario con stock actual, stock minimo y estado (OK / bajo / critico)',
                'Ajuste manual: entrada, salida, merma, devolucion — con motivo obligatorio',
                'Alerta visual en lista: verde (ok), naranja (bajo), rojo (critico)',
                'Alerta de vencimiento: banner en el dashboard si hay productos que vencen en 7 dias',
                'Historial de movimientos con tipo, cantidad, motivo y usuario que lo hizo',
            ]),
            ('Modulo: Ventas / Caja', [
                'Colaboradores pueden registrar ventas (si tienen ese permiso)',
                'Escaner de producto para agregar al carrito',
                'Al escanear: nombre, precio, stock disponible con opcion cancelar/confirmar',
                'Metodos de pago: efectivo, transferencia o Mercado Pago Checkout Pro',
                'Al confirmar: descuenta stock y registra el ID del vendedor (admin o colaborador)',
                'Si stock queda bajo del minimo al vender: genera notificacion automatica',
                'Historial del dia — admin puede ver quien vendio cada item',
            ]),
            ('Modulo: Ofertas', [
                'Toggle rapido para activar/desactivar cada oferta',
                'Limite segun plan (Basico: 50, Pro: 100, Max: 300, Libre: ilimitado)',
                'Vencimiento de oferta: se desactiva automaticamente al llegar la fecha',
                'Ofertas activas aparecen en la pagina publica en tiempo real',
            ]),
            ('Modulo: Dashboard', [
                'Resumen del dia: ventas, productos vendidos, ingresos',
                'Top 10 productos mas vendidos (grafico de barras)',
                'Ventas por categoria (grafico de torta)',
                'Ventas por vendedor: quién vendio mas (util para evaluar colaboradores)',
                'Panel de alertas: stock bajo + productos por vencer',
                'Indicador de notificaciones pendientes (vinculado a campanita)',
            ]),
            ('Modulo: Configuracion', [
                'Datos del local: nombre, WhatsApp, mail, direccion, logo',
                'Selector de tema con preview en tiempo real',
                'Gestion de colaboradores: agregar, editar, desactivar (hasta el limite del plan)',
                'Configurar dias de alerta de vencimiento (default: 7 dias)',
                'Boton: imprimir QR del local (poster A4)',
                'Categorias de productos: agregar/editar/eliminar',
                'Exportar inventario como CSV',
                'Activar/desactivar notificaciones push del navegador',
            ]),
        ],
        'sugerencia': 'Para las notificaciones push en iOS (iPhone) se necesita que la PWA este instalada en la pantalla de inicio (iOS 16.4+). Conviene mostrar un banner de instalacion la primera vez que el admin abre la app desde Safari en iPhone.',
    },
    {
        'num': '04',
        'color': colors.HexColor('#E67E22'),
        'titulo': 'Pagina Publica y QR del Local',
        'objetivo': 'Crear la pagina que los clientes ven al escanear el QR. Siempre online, sin login.',
        'items': [
            ('Acceso publico', [
                'URL permanente: dietpro.vercel.app/local/SLUG-DEL-NEGOCIO',
                'QR generado automaticamente — imprimible desde Configuracion',
                'Datos en tiempo real desde Supabase',
                'Sin informacion de stock visible para el publico',
                'Aplica el tema del local (mismo color de acento configurado por el admin)',
            ]),
            ('Contenido de la pagina publica', [
                'Header con logo, nombre, direccion, WhatsApp y mail del local',
                'Seccion "Ofertas del dia": cards con precio tachado y precio de oferta',
                'Seccion "Nuestros productos": lista con nombre, marca, categoria y precio',
                'Filtro por categoria (acordeon colapsable — igual que SalonPro)',
                'Boton directo de WhatsApp para consultas',
                'Meta tags para compartir en WhatsApp (og:title, og:image)',
            ]),
            ('QR imprimible', [
                'Poster A4 con QR grande + nombre del local + slogan',
                'Generado con QRCode.js en el navegador, sin servidor',
                'Opcion de descarga como PNG o impresion directa',
            ]),
        ],
        'sugerencia': 'Modo "Lista de precios" que el admin activa/desactiva. Cuando esta activo, muestra TODOS los precios en la pagina publica — reemplaza la lista en papel del local.',
    },
    {
        'num': '05',
        'color': colors.HexColor('#E74C3C'),
        'titulo': 'Manuales, Mails y Comunicacion',
        'objetivo': 'Generar el manual PDF y configurar los mails transaccionales del ecosistema.',
        'items': [
            ('Manual PDF — secciones', [
                '1. Primeros pasos (login, configuracion del local, elegir tema)',
                '2. Cargar productos con escaner o manualmente',
                '3. Gestionar stock (ajustes, alertas, historial)',
                '4. Registrar ventas y medios de pago',
                '5. Crear y gestionar ofertas',
                '6. Notificaciones: como activar la campanita y las alertas push',
                '7. Gestion de colaboradores: agregar, editar, desactivar',
                '8. Dashboard e interpretacion de datos',
                '9. Pagina publica y QR del local',
                '10. Configuracion avanzada y exportacion',
                '11. Preguntas frecuentes',
            ]),
            ('Mails transaccionales (EmailJS)', [
                'Bienvenida con credenciales al activar licencia DIET',
                'Aviso de vencimiento de licencia',
                'Confirmacion de lead (referidos)',
                'Alerta de stock bajo (con link directo al producto)',
                'Alerta de vencimiento proximo (7 dias antes)',
                'Bienvenida al colaborador nuevo (con su usuario y contrasena temporal)',
            ]),
            ('Integracion con Cyc-Admin', [
                'Agregar DIET al objeto APPS con prefijo, color verde y max_collaborators',
                'Agregar en ref/index.html para el sistema de referidos',
                'Campo nuevo en licencias: tipo_colaboradores (2x2, 2x4, 2x8, 2x16)',
                'DietPro lee ese campo al login para saber cuantos colaboradores puede tener',
            ]),
        ],
        'sugerencia': 'El mail de bienvenida al colaborador puede incluir un tutorial rapido (GIF animado o screenshots) de como registrar una venta. Reduce el tiempo de onboarding del personal.',
    },
    {
        'num': '06',
        'color': colors.HexColor('#16A085'),
        'titulo': 'Pruebas y Calidad',
        'objetivo': 'Validar todos los flujos criticos con foco en escaneo, stock, notificaciones y colaboradores.',
        'items': [
            ('Tests funcionales', [
                'Escaneo EAN-13, EAN-8, Code128 y QR en distintos celulares y condiciones de luz',
                'Carga de producto con y sin barcode_cache preexistente',
                'Venta completa: escaneo → carrito → pago → descuento de stock',
                'Notificacion: bajar stock manualmente bajo el minimo → verificar campanita + push',
                'Notificacion: cargar producto con vencimiento en 5 dias → verificar alerta',
                'Colaborador: crear, asignar permisos, login, registrar venta, ver en historial',
                'Tope de colaboradores: verificar que no se puede agregar mas del limite del plan',
                'Cambio de tema: verificar que se aplica en tiempo real y persiste al recargar',
            ]),
            ('Tests de notificaciones push', [
                'PC Chrome: solicitar permiso → recibir notificacion nativa del SO',
                'Android Chrome (PWA instalada): recibir notificacion con pantalla apagada',
                'iOS Safari (PWA instalada, iOS 16.4+): verificar que llega la notificacion',
                'Sin permiso de notificaciones: app funciona igual, campanita sigue disponible',
            ]),
            ('Tests de seguridad', [
                'RLS: colaborador no puede ver datos de otro tenant',
                'Permisos: colaborador sin acceso a Configuracion no puede acceder por URL directa',
                'Auth: intentar acceder sin licencia activa',
                'Tope de usuarios: verificar que la API rechaza crear colaboradores de mas',
            ]),
            ('Tests de Mercado Pago', [
                'Checkout Pro sandbox: pago exitoso → stock descontado → notificacion si queda bajo',
                'Pago rechazado → venta NO registrada → stock sin cambios',
            ]),
        ],
        'sugerencia': 'Probar las notificaciones push en un dispositivo real desde el primer dia de desarrollo — tienen particularidades de permisos en cada SO que conviene resolver temprano.',
    },
    {
        'num': '07',
        'color': colors.HexColor('#2C3E50'),
        'titulo': 'Deploy, Lanzamiento y Crecimiento',
        'objetivo': 'Desplegar en produccion, monitorear y planificar las funcionalidades de la siguiente version.',
        'items': [
            ('Deploy inicial', [
                'Repo: github.com/dragoprot26-Esp/dietpro',
                'Vercel conectado al repo — deploy automatico en cada push a main',
                'Variables de entorno: SB_URL, SB_KEY, MP_KEY, VAPID_KEY (notificaciones push)',
                'Agregar dominio en EmailJS para envio de mails',
                'Crear CLAUDE.md especifico en Proyectos/dietpro/',
                'Actualizar CLAUDE.md global con la nueva app DIET',
                'Agregar DIET en Cyc-Admin con campo tipo_colaboradores',
            ]),
            ('Roadmap v2', [
                'Permisos granulares por colaborador (solo ventas, solo stock, etc.)',
                'Proveedores: vincular productos, orden de reposicion automatica',
                'Lector de precios: cliente escanea y ve precio sin entrar al admin',
                'Exportar reportes: ventas del mes en PDF o Excel',
                'Multi-sucursal: ver varias sucursales desde el mismo panel',
                'Facturacion electronica AFIP (largo plazo)',
                'Notificaciones via WhatsApp (Twilio o Meta API) como alternativa al push',
            ]),
        ],
        'sugerencia': 'Implementar un onboarding guiado en el primer login: configurar local → cargar primer producto → activar una oferta → agregar primer colaborador → ver dashboard → imprimir QR. Cada paso tiene un tooltip explicativo.',
    },
]

SUGERENCIAS_EXTRA = [
    ('Lector de precios para clientes',
     'QR secundario dentro del local. El cliente lo escanea y puede consultar el precio de cualquier producto escaneando su codigo. Sin acceso al admin.'),
    ('Barcode_cache compartida entre tenants',
     'Tabla compartida. Cuando cualquier admin carga un producto nuevo, el codigo queda disponible para todos los usuarios de DietPro. La base crece sola.'),
    ('Permisos granulares de colaboradores (v2)',
     'En v2, cada colaborador puede tener permisos individuales: solo ventas, ventas + stock, ventas + ofertas, etc. Para el MVP un rol unico es suficiente.'),
    ('Notificaciones via WhatsApp',
     'Alternativa al push para celulares sin PWA instalada: enviar alerta de stock bajo por WhatsApp al admin via Twilio o la API de Meta.'),
    ('Modo lista de precios publica',
     'El admin activa/desactiva mostrar TODOS los precios en la pagina publica. Reemplaza el pizarron o la lista en papel del local.'),
    ('Historial de precios por producto',
     'Cada cambio de precio queda registrado con fecha y usuario. Util para rastrear aumentos de proveedores y analizar margenes.'),
]

PROXIMOS_PASOS = [
    '1. Crear repo dietpro en GitHub bajo dragoprot26-Esp',
    '2. Crear carpeta Proyectos/dietpro/ con CLAUDE.md especifico',
    '3. Agregar DIET + campo tipo_colaboradores en Cyc-Admin (index.html)',
    '4. Crear tablas en Supabase (SQL con RLS incluido)',
    '5. Armar estructura base SPA con sistema de temas (CSS variables)',
    '6. Implementar login con deteccion de rol Admin / Colaborador',
    '7. Construir modulo de Productos con escaneo de camara',
    '8. Construir Stock, Ventas, Ofertas y Dashboard',
    '9. Implementar campanita + notificaciones push (Service Worker)',
    '10. Construir pagina publica y QR imprimible',
    '11. Gestion de colaboradores en Configuracion',
    '12. Generar manual PDF y configurar mails en EmailJS',
]

def build():
    import os
    out = '/sessions/gallant-exciting-thompson/mnt/Proyectos/dietpro/docs/Plan_DietPro_7Fases.pdf'
    os.makedirs(os.path.dirname(out), exist_ok=True)

    doc = SimpleDocTemplate(out, pagesize=A4,
                            leftMargin=18*mm, rightMargin=18*mm,
                            topMargin=16*mm, bottomMargin=16*mm)
    story = []

    # ── Portada ──
    cover = Table(
        [[Paragraph('DietPro', S('ct', fontName='Helvetica-Bold', fontSize=36,
                                  textColor=PRIMARY, alignment=TA_CENTER, leading=40))],
         [Paragraph('Gestion Inteligente para Dieteticas', S('cs', fontName='Helvetica', fontSize=13,
                    textColor=colors.HexColor('#A8E6CF'), alignment=TA_CENTER))],
         [Spacer(1, 6)],
         [Paragraph('PLAN DE CREACION Y SEGURIDAD - 7 FASES  |  v2',
                    S('cb', fontName='Helvetica-Bold', fontSize=11, textColor=GOLD, alignment=TA_CENTER))],
         [Paragraph('Notificaciones Push  |  Temas Visuales  |  Sistema de Colaboradores',
                    S('cn', fontName='Helvetica', fontSize=10,
                      textColor=colors.HexColor('#27AE60'), alignment=TA_CENTER))],
         [Spacer(1, 4)],
         [Paragraph('Ecosistema CyC  |  Version 2.0  |  Mayo 2026',
                    S('ci', fontName='Helvetica', fontSize=9, textColor=GRAY, alignment=TA_CENTER))],
        ],
        colWidths=[171*mm],
        style=TableStyle([
            ('BACKGROUND',   (0,0), (-1,-1), DARK),
            ('TOPPADDING',   (0,0), (-1,-1), 16),
            ('BOTTOMPADDING',(0,0), (-1,-1), 16),
        ])
    )
    story.append(cover)
    story.append(Spacer(1, 12))

    # Novedades v2
    story.append(Paragraph('Novedades en esta version del plan', h1_style))
    story.append(hr())
    novedades = [
        ('Campanita de notificaciones', 'Icono en el header con badge de no leidas. Alertas de stock bajo y vencimiento proximo en tiempo real via Supabase Realtime. Notificaciones push nativas del SO en PC y celular via Web Notifications API + Service Worker. Compatible con Chrome, Edge, Firefox y Android. En iOS requiere PWA instalada (iOS 16.4+).'),
        ('Sistema de temas visuales', 'Cuatro temas incluidos: Oscuro Verde (default), Claro Natural, Oscuro Neutro y Personalizado con color picker. El tema se aplica via variables CSS y se guarda en el perfil del local.'),
        ('Colaboradores con licencia escalonada', 'Los admins pueden agregar colaboradores hasta el tope definido en Cyc-Admin al emitir la licencia: 2x2, 2x4, 2x8 o 2x16. Cada colaborador tiene usuario y contrasena propios. La cantidad de colaboradores permitidos escala con el plan de suscripcion.'),
    ]
    for titulo, desc in novedades:
        nov = Table(
            [[Paragraph(f'<b>{titulo}</b>', S('nt', fontName='Helvetica-Bold', fontSize=10,
                         textColor=colors.HexColor('#1a5c36'))),
              Paragraph(desc, S('nd', fontName='Helvetica', fontSize=9,
                                textColor=colors.HexColor('#2c2c2c'), leading=13))]],
            colWidths=[44*mm, 127*mm],
            style=TableStyle([
                ('BACKGROUND',   (0,0), (-1,-1), LIGHT_BG),
                ('VALIGN',       (0,0), (-1,-1), 'TOP'),
                ('TOPPADDING',   (0,0), (-1,-1), 8),
                ('BOTTOMPADDING',(0,0), (-1,-1), 8),
                ('LEFTPADDING',  (0,0), (-1,-1), 8),
                ('RIGHTPADDING', (0,0), (-1,-1), 8),
                ('LINEAFTER',    (0,0), (0,-1), 1.5, PRIMARY),
            ])
        )
        story.append(nov)
        story.append(Spacer(1, 4))

    story.append(Spacer(1, 8))

    # Planes colaboradores
    story.append(Paragraph('Combinaciones de usuarios (definidas en Cyc-Admin)', h2_style))
    ct = Table(PLANES_COLABORADORES, colWidths=[22*mm, 20*mm, 30*mm, 28*mm, 71*mm],
               style=TableStyle([
                   ('BACKGROUND',    (0,0), (-1,0),  DARK),
                   ('TEXTCOLOR',     (0,0), (-1,0),  WHITE),
                   ('FONTNAME',      (0,0), (-1,0),  'Helvetica-Bold'),
                   ('FONTSIZE',      (0,0), (-1,-1), 9),
                   ('ROWBACKGROUNDS',(0,1), (-1,-1),
                    [colors.HexColor('#d4edda'), colors.HexColor('#c3e6cb'),
                     colors.HexColor('#b1dfbb'), colors.HexColor('#a3d9a5')]),
                   ('GRID',          (0,0), (-1,-1), 0.5, colors.HexColor('#a8d5b0')),
                   ('TOPPADDING',    (0,0), (-1,-1), 5),
                   ('BOTTOMPADDING', (0,0), (-1,-1), 5),
                   ('LEFTPADDING',   (0,0), (-1,-1), 6),
                   ('ALIGN',         (1,0), (3,-1), 'CENTER'),
               ]))
    story.append(ct)
    story.append(Spacer(1, 10))

    # Planes productos
    story.append(Paragraph('Planes de suscripcion con colaboradores incluidos', h2_style))
    pt = Table(PLANES_PRODUCTOS, colWidths=[22*mm, 22*mm, 30*mm, 30*mm, 67*mm],
               style=TableStyle([
                   ('BACKGROUND',    (0,0), (-1,0),  DARK),
                   ('TEXTCOLOR',     (0,0), (-1,0),  WHITE),
                   ('FONTNAME',      (0,0), (-1,0),  'Helvetica-Bold'),
                   ('FONTSIZE',      (0,0), (-1,-1), 9),
                   ('ROWBACKGROUNDS',(0,1), (-1,-1),
                    [colors.HexColor('#d4edda'), colors.HexColor('#c3e6cb'),
                     colors.HexColor('#b1dfbb'), colors.HexColor('#a3d9a5')]),
                   ('GRID',          (0,0), (-1,-1), 0.5, colors.HexColor('#a8d5b0')),
                   ('TOPPADDING',    (0,0), (-1,-1), 5),
                   ('BOTTOMPADDING', (0,0), (-1,-1), 5),
                   ('LEFTPADDING',   (0,0), (-1,-1), 6),
               ]))
    story.append(pt)
    story.append(Spacer(1, 10))

    # Stack
    story.append(Paragraph('Stack tecnologico', h2_style))
    st = Table(STACK, colWidths=[50*mm, 121*mm],
               style=TableStyle([
                   ('BACKGROUND',    (0,0), (-1,0),  DARK),
                   ('TEXTCOLOR',     (0,0), (-1,0),  WHITE),
                   ('FONTNAME',      (0,0), (-1,0),  'Helvetica-Bold'),
                   ('FONTSIZE',      (0,0), (-1,-1), 9),
                   ('ROWBACKGROUNDS',(0,1), (-1,-1), [WHITE, LIGHT_BG2]),
                   ('GRID',          (0,0), (-1,-1), 0.5, colors.HexColor('#c8e6c9')),
                   ('TOPPADDING',    (0,0), (-1,-1), 5),
                   ('BOTTOMPADDING', (0,0), (-1,-1), 5),
                   ('LEFTPADDING',   (0,0), (-1,-1), 8),
               ]))
    story.append(st)
    story.append(Spacer(1, 14))

    # ── Fases ──
    story.append(Paragraph('Plan de 7 Fases de Desarrollo', h1_style))
    story.append(hr())
    story.append(Spacer(1, 6))

    for fase in FASES:
        col = fase['color']
        header_table = Table(
            [[Paragraph(fase['num'], phase_num_style),
              [Paragraph(fase['titulo'], phase_title_style),
               Spacer(1, 4),
               Paragraph(f"<i>{fase['objetivo']}</i>",
                         ParagraphStyle('fo', fontName='Helvetica-Oblique', fontSize=9,
                                        textColor=colors.HexColor('#A8E6CF'), leading=12))]]],
            colWidths=[22*mm, 149*mm],
            style=TableStyle([
                ('BACKGROUND',   (0,0), (-1,-1), col),
                ('VALIGN',       (0,0), (-1,-1), 'MIDDLE'),
                ('TOPPADDING',   (0,0), (-1,-1), 10),
                ('BOTTOMPADDING',(0,0), (-1,-1), 10),
                ('LEFTPADDING',  (0,0), (-1,-1), 10),
                ('RIGHTPADDING', (0,0), (-1,-1), 10),
            ])
        )

        items_content = []
        for (subtitulo, bullets) in fase['items']:
            items_content.append(Paragraph(subtitulo, h3_style))
            for b in bullets:
                items_content.append(bullet(b))
            items_content.append(Spacer(1, 4))

        sug_table = Table(
            [[Paragraph(f'<b>Sugerencia:</b>  {fase["sugerencia"]}',
                        ParagraphStyle('sug', fontName='Helvetica', fontSize=9,
                                       textColor=colors.HexColor('#1a5c36'), leading=13))]],
            colWidths=[171*mm],
            style=TableStyle([
                ('BACKGROUND',   (0,0), (-1,-1), colors.HexColor('#d4edda')),
                ('TOPPADDING',   (0,0), (-1,-1), 8),
                ('BOTTOMPADDING',(0,0), (-1,-1), 8),
                ('LEFTPADDING',  (0,0), (-1,-1), 10),
                ('RIGHTPADDING', (0,0), (-1,-1), 10),
            ])
        )

        story.append(KeepTogether([
            header_table,
            Spacer(1, 6),
            *items_content,
            sug_table,
            Spacer(1, 14),
        ]))

    # Sugerencias adicionales
    story.append(Paragraph('Sugerencias adicionales para v2+', h1_style))
    story.append(hr())
    story.append(Spacer(1, 4))
    for i, (titulo, desc) in enumerate(SUGERENCIAS_EXTRA):
        row_color = LIGHT_BG if i % 2 == 0 else LIGHT_BG2
        sug = Table(
            [[Paragraph(f'{i+1}.', ParagraphStyle('n', fontName='Helvetica-Bold',
                         fontSize=14, textColor=PRIMARY, alignment=TA_CENTER)),
              [Paragraph(titulo, h3_style), Paragraph(desc, body_style)]]],
            colWidths=[14*mm, 157*mm],
            style=TableStyle([
                ('BACKGROUND',   (0,0), (-1,-1), row_color),
                ('VALIGN',       (0,0), (-1,-1), 'TOP'),
                ('TOPPADDING',   (0,0), (-1,-1), 8),
                ('BOTTOMPADDING',(0,0), (-1,-1), 8),
                ('LEFTPADDING',  (0,0), (-1,-1), 8),
            ])
        )
        story.append(sug)
        story.append(Spacer(1, 6))

    # Proximos pasos
    story.append(Spacer(1, 8))
    story.append(Paragraph('Proximos pasos para arrancar', h1_style))
    story.append(hr())
    for p in PROXIMOS_PASOS:
        story.append(check(p))
    story.append(Spacer(1, 16))

    footer = Table(
        [[Paragraph('DietPro  |  Ecosistema CyC  |  dragoprot26@gmail.com  |  Mayo 2026',
                    S('foot', fontName='Helvetica', fontSize=9,
                      textColor=WHITE, alignment=TA_CENTER))]],
        colWidths=[171*mm],
        style=TableStyle([
            ('BACKGROUND',   (0,0), (-1,-1), DARK),
            ('TOPPADDING',   (0,0), (-1,-1), 10),
            ('BOTTOMPADDING',(0,0), (-1,-1), 10),
        ])
    )
    story.append(footer)

    doc.build(story)
    print(f'PDF generado: {out}')

build()
yc-Admin (index.html)',
    '4. Crear tablas en Supabase (SQL con RLS incluido)',
    '5. Armar estructura base SPA con sistema de temas (CSS variables)',
    '6. Implementar login con deteccion de rol Admin / Colaborador',
    '7. Construir modulo de Productos con escaneo de camara',
    '8. Construir Stock, Ventas, Ofertas y Dashboard',
    '9. Implementar campanita + notificaciones push (Service Worker)',
    '10. Construir pagina publica y QR imprimible',
    '11. Gestion de colaboradores en Configuracion',
    '12. Generar manual PDF y configurar mails en EmailJS',
]

def build():
    import os
    out = '/sessions/gallant-exciting-thompson/mnt/Proyectos/dietpro/docs/Plan_DietPro_7Fases.pdf'
    os.makedirs(os.path.dirname(out), exist_ok=True)

    doc = SimpleDocTemplate(out, pagesize=A4,
                            leftMargin=18*mm, rightMargin=18*mm,
                            topMargin=16*mm, bottomMargin=16*mm)
    story = []

    # Portada
    cover = Table(
        [[Paragraph('DietPro', S('ct', fontName='Helvetica-Bold', fontSize=36,
                                  textColor=PRIMARY, alignment=TA_CENTER, leading=40))],
         [Paragraph('Gestion Inteligente para Dieteticas', S('cs', fontName='Helvetica', fontSize=13,
                    textColor=colors.HexColor('#A8E6CF'), alignment=TA_CENTER))],
         [Spacer(1, 6)],
         [Paragraph('PLAN DE CREACION Y SEGURIDAD - 7 FASES  |  v2',
                    S('cb', fontName='Helvetica-Bold', fontSize=11, textColor=GOLD, alignment=TA_CENTER))],
         [Paragraph('Notificaciones Push  |  Temas Visuales  |  Sistema de Colaboradores',
                    S('cn', fontName='Helvetica', fontSize=10,
                      textColor=colors.HexColor('#27AE60'), alignment=TA_CENTER))],
         [Spacer(1, 4)],
         [Paragraph('Ecosistema CyC  |  Version 2.0  |  Mayo 2026',
                    S('ci', fontName='Helvetica', fontSize=9, textColor=GRAY, alignment=TA_CENTER))],
        ],
        colWidths=[171*mm],
        style=TableStyle([
            ('BACKGROUND',   (0,0), (-1,-1), DARK),
            ('TOPPADDING',   (0,0), (-1,-1), 16),
            ('BOTTOMPADDING',(0,0), (-1,-1), 16),
        ])
    )
    story.append(cover)
    story.append(Spacer(1, 12))

    # Novedades v2
    story.append(Paragraph('Novedades en esta version del plan', h1_style))
    story.append(hr())
    novedades = [
        ('Campanita de notificaciones', 'Icono en el header con badge de no leidas. Alertas de stock bajo y vencimiento proximo en tiempo real via Supabase Realtime. Notificaciones push nativas del SO en PC y celular via Web Notifications API + Service Worker.'),
        ('Sistema de temas visuales', 'Cuatro temas incluidos: Oscuro Verde (default), Claro Natural, Oscuro Neutro y Personalizado con color picker. El tema se aplica via variables CSS y se guarda en el perfil del local.'),
        ('Colaboradores con licencia escalonada', 'Los admins pueden agregar colaboradores hasta el tope definido en Cyc-Admin: 2x2, 2x4, 2x8 o 2x16. Cada colaborador tiene usuario y contrasena propios.'),
    ]
    for titulo, desc in novedades:
        nov = Table(
            [[Paragraph(titulo, S('nt', fontName='Helvetica-Bold', fontSize=10,
                         textColor=colors.HexColor('#1a5c36'))),
              Paragraph(desc, S('nd', fontName='Helvetica', fontSize=9,
                                textColor=colors.HexColor('#2c2c2c'), leading=13))]],
            colWidths=[44*mm, 127*mm],
            style=TableStyle([
                ('BACKGROUND',   (0,0), (-1,-1), LIGHT_BG),
                ('VALIGN',       (0,0), (-1,-1), 'TOP'),
                ('TOPPADDING',   (0,0), (-1,-1), 8),
                ('BOTTOMPADDING',(0,0), (-1,-1), 8),
                ('LEFTPADDING',  (0,0), (-1,-1), 8),
                ('RIGHTPADDING', (0,0), (-1,-1), 8),
                ('LINEAFTER',    (0,0), (0,-1), 1.5, PRIMARY),
            ])
        )
        story.append(nov)
        story.append(Spacer(1, 4))
    story.append(Spacer(1, 8))

    # Planes colaboradores
    story.append(Paragraph('Combinaciones de usuarios (definidas en Cyc-Admin)', h2_style))
    ct = Table(PLANES_COLABORADORES, colWidths=[22*mm, 20*mm, 30*mm, 28*mm, 71*mm],
               style=TableStyle([
                   ('BACKGROUND',    (0,0), (-1,0),  DARK),
                   ('TEXTCOLOR',     (0,0), (-1,0),  WHITE),
                   ('FONTNAME',      (0,0), (-1,0),  'Helvetica-Bold'),
                   ('FONTSIZE',      (0,0), (-1,-1), 9),
                   ('ROWBACKGROUNDS',(0,1), (-1,-1),
                    [colors.HexColor('#d4edda'), colors.HexColor('#c3e6cb'),
                     colors.HexColor('#b1dfbb'), colors.HexColor('#a3d9a5')]),
                   ('GRID',          (0,0), (-1,-1), 0.5, colors.HexColor('#a8d5b0')),
                   ('TOPPADDING',    (0,0), (-1,-1), 5),
                   ('BOTTOMPADDING', (0,0), (-1,-1), 5),
                   ('LEFTPADDING',   (0,0), (-1,-1), 6),
                   ('ALIGN',         (1,0), (3,-1), 'CENTER'),
               ]))
    story.append(ct)
    story.append(Spacer(1, 10))

    # Planes productos
    story.append(Paragraph('Planes de suscripcion con colaboradores incluidos', h2_style))
    pt = Table(PLANES_PRODUCTOS, colWidths=[22*mm, 22*mm, 30*mm, 30*mm, 67*mm],
               style=TableStyle([
                   ('BACKGROUND',    (0,0), (-1,0),  DARK),
                   ('TEXTCOLOR',     (0,0), (-1,0),  WHITE),
                   ('FONTNAME',      (0,0), (-1,0),  'Helvetica-Bold'),
                   ('FONTSIZE',      (0,0), (-1,-1), 9),
                   ('ROWBACKGROUNDS',(0,1), (-1,-1),
                    [colors.HexColor('#d4edda'), colors.HexColor('#c3e6cb'),
                     colors.HexColor('#b1dfbb'), colors.HexColor('#a3d9a5')]),
                   ('GRID',          (0,0), (-1,-1), 0.5, colors.HexColor('#a8d5b0')),
                   ('TOPPADDING',    (0,0), (-1,-1), 5),
                   ('BOTTOMPADDING', (0,0), (-1,-1), 5),
                   ('LEFTPADDING',   (0,0), (-1,-1), 6),
               ]))
    story.append(pt)
    story.append(Spacer(1, 10))

    # Stack
    story.append(Paragraph('Stack tecnologico', h2_style))
    st = Table(STACK, colWidths=[50*mm, 121*mm],
               style=TableStyle([
                   ('BACKGROUND',    (0,0), (-1,0),  DARK),
                   ('TEXTCOLOR',     (0,0), (-1,0),  WHITE),
                   ('FONTNAME',      (0,0), (-1,0),  'Helvetica-Bold'),
                   ('FONTSIZE',      (0,0), (-1,-1), 9),
                   ('ROWBACKGROUNDS',(0,1), (-1,-1), [WHITE, LIGHT_BG2]),
                   ('GRID',          (0,0), (-1,-1), 0.5, colors.HexColor('#c8e6c9')),
                   ('TOPPADDING',    (0,0), (-1,-1), 5),
                   ('BOTTOMPADDING', (0,0), (-1,-1), 5),
                   ('LEFTPADDING',   (0,0), (-1,-1), 8),
               ]))
    story.append(st)
    story.append(Spacer(1, 14))

    # Fases
    story.append(Paragraph('Plan de 7 Fases de Desarrollo', h1_style))
    story.append(hr())
    story.append(Spacer(1, 6))

    for fase in FASES:
        col = fase['color']
        header_table = Table(
            [[Paragraph(fase['num'], phase_num_style),
              [Paragraph(fase['titulo'], phase_title_style),
               Spacer(1, 4),
               Paragraph('<i>' + fase['objetivo'] + '</i>',
                         ParagraphStyle('fo', fontName='Helvetica-Oblique', fontSize=9,
                                        textColor=colors.HexColor('#A8E6CF'), leading=12))]]],
            colWidths=[22*mm, 149*mm],
            style=TableStyle([
                ('BACKGROUND',   (0,0), (-1,-1), col),
                ('VALIGN',       (0,0), (-1,-1), 'MIDDLE'),
                ('TOPPADDING',   (0,0), (-1,-1), 10),
                ('BOTTOMPADDING',(0,0), (-1,-1), 10),
                ('LEFTPADDING',  (0,0), (-1,-1), 10),
                ('RIGHTPADDING', (0,0), (-1,-1), 10),
            ])
        )

        items_content = []
        for (subtitulo, bullets) in fase['items']:
            items_content.append(Paragraph(subtitulo, h3_style))
            for b in bullets:
                items_content.append(bullet(b))
            items_content.append(Spacer(1, 4))

        sug_table = Table(
            [[Paragraph('<b>Sugerencia:</b>  ' + fase['sugerencia'],
                        ParagraphStyle('sug', fontName='Helvetica', fontSize=9,
                                       textColor=colors.HexColor('#1a5c36'), leading=13))]],
            colWidths=[171*mm],
            style=TableStyle([
                ('BACKGROUND',   (0,0), (-1,-1), colors.HexColor('#d4edda')),
                ('TOPPADDING',   (0,0), (-1,-1), 8),
                ('BOTTOMPADDING',(0,0), (-1,-1), 8),
                ('LEFTPADDING',  (0,0), (-1,-1), 10),
                ('RIGHTPADDING', (0,0), (-1,-1), 10),
            ])
        )

        story.append(KeepTogether([
            header_table,
            Spacer(1, 6),
        ] + items_content + [
            sug_table,
            Spacer(1, 14),
        ]))

    # Sugerencias adicionales
    story.append(Paragraph('Sugerencias adicionales para v2+', h1_style))
    story.append(hr())
    story.append(Spacer(1, 4))
    for i, (titulo, desc) in enumerate(SUGERENCIAS_EXTRA):
        row_color = LIGHT_BG if i % 2 == 0 else LIGHT_BG2
        sug = Table(
            [[Paragraph(str(i+1) + '.', ParagraphStyle('n', fontName='Helvetica-Bold',
                         fontSize=14, textColor=PRIMARY, alignment=TA_CENTER)),
              [Paragraph(titulo, h3_style), Paragraph(desc, body_style)]]],
            colWidths=[14*mm, 157*mm],
            style=TableStyle([
                ('BACKGROUND',   (0,0), (-1,-1), row_color),
                ('VALIGN',       (0,0), (-1,-1), 'TOP'),
                ('TOPPADDING',   (0,0), (-1,-1), 8),
                ('BOTTOMPADDING',(0,0), (-1,-1), 8),
                ('LEFTPADDING',  (0,0), (-1,-1), 8),
            ])
        )
        story.append(sug)
        story.append(Spacer(1, 6))

    # Proximos pasos
    story.append(Spacer(1, 8))
    story.append(Paragraph('Proximos pasos para arrancar', h1_style))
    story.append(hr())
    for p in PROXIMOS_PASOS:
        story.append(check(p))
    story.append(Spacer(1, 16))

    footer = Table(
        [[Paragraph('DietPro  |  Ecosistema CyC  |  dragoprot26@gmail.com  |  Mayo 2026',
                    S('foot', fontName='Helvetica', fontSize=9,
                      textColor=WHITE, alignment=TA_CENTER))]],
        colWidths=[171*mm],
        style=TableStyle([
            ('BACKGROUND',   (0,0), (-1,-1), DARK),
            ('TOPPADDING',   (0,0), (-1,-1), 10),
            ('BOTTOMPADDING',(0,0), (-1,-1), 10),
        ])
    )
    story.append(footer)

    doc.build(story)
    print('PDF generado: ' + out)

build()
, DARK),
            ('TOPPADDING',   (0,0), (-1,-1), 10),
            ('BOTTOMPADDING',(0,0), (-1,-1), 10),
        ])
    )
    story.append(footer)

    doc.build(story)
    print('PDF generado: ' + out)

build()
