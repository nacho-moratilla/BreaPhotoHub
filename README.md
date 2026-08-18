# 📸 BreaPhotoHub

> Aplicación web tipo **photo booth** para eventos con escaneo de código **QR / NFC**, captura en directo con la cámara del móvil, galería en tiempo real y descarga de fotos individuales o en **ZIP**.

---

## ✨ Características Principales

- 📱 **Acceso por QR o NFC**: Cada evento cuenta con su propio enlace y código QR generado automáticamente.
- 📷 **Cámara Web / Móvil en Vivo**:
  - Captura instantánea con visor estilo cámara analógica/moderna.
  - Efecto de obturador y conmutador entre cámara frontal y trasera.
  - Compresión inteligente en el navegador para que las subidas sean ultrarrápidas incluso con mala cobertura.
- 🖼️ **Subida desde Galería**: Opción para seleccionar varias fotos a la vez del carrete.
- ⚡ **Tiempo Real**: Conectado a Supabase Realtime (WebSockets); cualquier foto subida aparece instantáneamente en la pantalla de todos los invitados sin recargar.
- 📦 **Descarga Individual y ZIP Completo**: Descarga fotos en alta calidad una a una o empaqueta todo el álbum en un único archivo ZIP en un clic.
- 🛡️ **Panel de Administración (`/admin`)**:
  - Protegido por contraseña.
  - Creación de eventos/álbumes con fechas y portadas.
  - Generación, previsualización e impresión de tarjetas de mesa con el QR.
  - Instrucciones para grabar etiquetas NFC.
  - Moderación y borrado de fotos.
- 🎨 **Diseño Moderno y Minimalista**: Estética limpia, elegante y adaptada 100% a móviles.

---

## 🚀 Inicio Rápido (Local)

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar Base de Datos (Supabase)
1. Crea un proyecto gratuito en [Supabase](https://supabase.com).
2. Ve al **SQL Editor** de tu proyecto en Supabase y ejecuta el contenido del archivo [`supabase/schema.sql`](supabase/schema.sql).
3. En Supabase ve a **Project Settings > API** y copia tu **Project URL** y tu **anon public key**.
4. Pega tus credenciales en el archivo `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
NEXT_PUBLIC_ADMIN_PASSWORD=admin123
```

### 3. Iniciar servidor de desarrollo
```bash
npm run dev
```
Abre en tu navegador [http://localhost:3000](http://localhost:3000).

---

## 🌐 Despliegue en Vercel (1 Clic)

1. Sube este proyecto a un repositorio en **GitHub**.
2. Entra en [Vercel](https://vercel.com) e importa el repositorio.
3. En la sección **Environment Variables**, añade:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_ADMIN_PASSWORD` (ej: `tu_contraseña_secreta`)
4. Haz clic en **Deploy**. ¡Tu aplicación estará en vivo con HTTPS gratuito!

---

## 🏷️ ¿Cómo configurar etiquetas NFC para las mesas?

1. Consigue pegatinas o tarjetas **NFC (NTAG213, NTAG215 o NTAG216)**.
2. Descarga la aplicación gratuita **NFC Tools** (disponible en iOS y Android).
3. Entra en tu panel de BreaPhotoHub (`/admin/albums/[tu-slug]`) y copia el enlace público del álbum.
4. En la app NFC Tools:
   - Ve a **Escribir > Añadir un registro > URL / URI**.
   - Pega el enlace de tu álbum.
   - Pulsa en **Escribir** y acerca el móvil a la pegatina o soporte NFC.
5. ¡Listo! Cualquier persona que acerque su teléfono desbloqueado a la mesa accederá directamente al álbum para hacer fotos.

---

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── layout.tsx              # Layout raíz y viewport móvil
│   ├── page.tsx                # Landing page principal
│   ├── globals.css             # Estilos minimalistas y animaciones de cámara
│   ├── album/
│   │   └── [slug]/page.tsx     # Página pública del evento (QR/NFC)
│   └── admin/
│       ├── page.tsx            # Panel admin con login y listado de álbumes
│       └── albums/
│           ├── new/page.tsx    # Formulario para crear nuevo álbum
│           └── [slug]/page.tsx # Gestión del álbum, QR descargable y moderación
├── components/
│   ├── CameraModal.tsx         # Cámara en vivo con conmutador y visor
│   ├── PhotoUploader.tsx       # Botones de acción (Cámara / Galería)
│   ├── PhotoGallery.tsx        # Grid de fotos en tiempo real y descarga ZIP
│   ├── PhotoLightbox.tsx       # Visor a pantalla completa con navegación
│   ├── QRCodeCard.tsx          # Tarjeta descargable e imprimible con QR
│   ├── Navbar.tsx              # Barra de navegación minimalista
│   └── Toast.tsx               # Notificaciones elegantes
├── lib/
│   ├── supabase.ts             # Cliente de Supabase
│   ├── types.ts                # Tipos TypeScript (Album, Photo, etc.)
│   └── utils.ts                # Compresión de imágenes, ZIP, fechas y slugs
└── supabase/
    └── schema.sql              # Esquema SQL completo con RLS y Storage
```
