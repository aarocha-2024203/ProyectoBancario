# ProyectoBancario
# Sistema Bancario — Documentación del Proyecto


## Descripción General

Sistema Bancario es una plataforma web bancaria completa desarrollada con una arquitectura de microservicios. Permite la gestión de usuarios, cuentas bancarias, tarjetas, préstamos, transacciones, depósitos, retiros y estados de cuenta, con dos roles diferenciados: Administrador y Cliente.

---

## Arquitectura del Sistema
``
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)                 │
│                     http://localhost:5173                   │
└──────────────────────┬──────────────────┬───────────────────┘
                       │                  │
          ┌────────────▼──────┐  ┌────────▼──────────┐
          │   Auth-Service    │  │  Proyecto Bancario│
          │  Node.js + Express│  │  Node.js + Express│
          │  Puerto: 3005     │  │  Puerto: 3006     │
          │  BD: PostgreSQL   │  │  BD: MongoDB      │
          └───────────────────┘  └───────────────────┘
```

El sistema está dividido en **3 capas**:

- Frontend: Interfaz de usuario en React con diseño premium oscuro
- Auth-Service: Microservicio de autenticación con PostgreSQL
- Proyecto Bancario: Microservicio bancario con MongoDB


## Configuración e Instalación

### Requisitos previos
- Node.js 20+
- pnpm
- PostgreSQL 15
- MongoDB 7

### Variables de entorno

**Auth-Service (`.env`)**
```env
# Server
NODE_ENV=development
PORT=3005

# Database PostgreSQL
DB_HOST=postgres
DB_PORT=5432
DB_NAME=ProyectoBancario3
DB_USERNAME=root
DB_PASSWORD=admin
DB_SQL_LOGGING=false

# JWT Configuration
JWT_SECRET=MyVerySecretKeyForJWTTokenAuthenticationWith256Bits!
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=AuthService
JWT_AUDIENCE=AuthService

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=proyectobancario3@gmail.com
SMTP_PASSWORD=ewokmugaebuuvyjk
EMAIL_FROM=proyectobancario3@gmail.com
EMAIL_FROM_NAME=AuthDotnet App

# Cloudinary
CLOUDINARY_CLOUD_NAME=dbzfz5hl0
CLOUDINARY_API_KEY=421499449373898
CLOUDINARY_API_SECRET=pN03UK7ZlITeWX5aGCbLJely054
CLOUDINARY_BASE_URL=https://res.cloudinary.com/dbzfz5hl0/image/upload/
CLOUDINARY_FOLDER=proyectobancario/profiles
CLOUDINARY_DEFAULT_AVATAR_FILENAME=default-avatar_ewzxwx.png

# File Upload
UPLOAD_PATH=./uploads

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Security
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3006
ADMIN_ALLOWED_ORIGINS=http://localhost:5173

# Verification Tokens (en horas)
VERIFICATION_EMAIL_EXPIRY_HOURS=24
PASSWORD_RESET_EXPIRY_HOURS=1
```

**ProyectoBancario (`.env`)**
```env
NODE_ENV=development
PORT=3006

# MongoDB
MONGO_URI=mongodb://mongo:27017/ProyectoBancario
AUTH_SERVICE_URL=http://auth-service:3005
# JWT
JWT_SECRET=MyVerySecretKeyForJWTTokenAuthenticationWith256Bits!
JWT_ISSUER=AuthService
JWT_AUDIENCE=AuthService

# Cloudinary
CLOUDINARY_CLOUD_NAME=dbzfz5hl0
CLOUDINARY_API_KEY=421499449373898
CLOUDINARY_API_SECRET=pN03UK7ZlITeWX5aGCbLJely054
CLOUDINARY_FOLDER=proyectobancario/profiles

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_ENABLE_SSL=false
SMTP_USERNAME=proyectobancario3@gmail.com
SMTP_PASSWORD=ewokmugaebuuvyjk
EMAIL_FROM=proyectobancario3@gmail.com
EMAIL_FROM_NAME=ProyectoBancario App

# ExchangeRate API
EXCHANGE_RATE_API_KEY=b721d4744b2f8cf590f1452e

# PostgreSQL (para leer usuarios del Auth-Service)
DB_HOST=postgres
DB_PORT=5432
DB_NAME=ProyectoBancario3
DB_USERNAME=root
DB_PASSWORD=admin
DB_SQL_LOGGING=false
```

**Frontend (`.env`)**
```env
VITE_API_URL=http://localhost:3005/api/v1
VITE_BANKING_URL=http://localhost:3006/api/v1
```

### Instalación y ejecución

```
# 1. Auth-Service y ProyectoBancario
cd ProyectoBancario3
docker compose up -d
docker compose up -d --build
docker compose ps
docker compose logs auth-service
docker compose logs proyecto-bancario

# 3. Frontend (nueva terminal)
cd react-app-proyectobanco
pnpm install
pnpm run dev
```

---

## Módulo de Autenticación (Auth-Service)

### Endpoints disponibles

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Registro de nuevo usuario | No |
| POST | `/api/v1/auth/verify-email` | Verificar correo con token | No |
| POST | `/api/v1/auth/login` | Iniciar sesión | No |
| POST | `/api/v1/auth/resend-verification` | Reenviar correo de verificación | No |
| POST | `/api/v1/auth/forgot-password` | Solicitar restablecimiento de contraseña | No |
| POST | `/api/v1/auth/reset-password` | Restablecer contraseña con token | No |
| GET | `/api/v1/auth/profile` | Obtener perfil del usuario autenticado | Sí |
| GET | `/api/v1/users/by-role/:roleName` | Listar usuarios por rol | Admin |
| PUT | `/api/v1/users/change-role/:userId` | Cambiar rol de usuario | Admin |

### Flujo de Registro

```
Usuario completa el formulario
        │
        ▼
POST /auth/register
(name, surname, username, email, password, phone)
        │
        ▼
Backend crea usuario con Status=false
Backend genera token de verificación (24h)
Backend envía correo con enlace de verificación
        │
        ▼
Usuario hace clic en el enlace del correo
http://localhost:5173/verify-email?token=XXXX
        │
        ▼
POST /auth/verify-email { token }
Backend activa la cuenta (Status=true)
Backend envía correo de bienvenida
        │
        ▼
Usuario puede iniciar sesión
```

### Flujo de Login

```
Usuario ingresa credenciales
        │
        ▼
POST /auth/login
{ emailOrUsername, password }
        │
        ▼
Backend verifica credenciales con Argon2
Backend comprueba que el email esté verificado
Backend comprueba que la cuenta esté activa
        │
        ▼
Respuesta: { token, userDetails: { id, username, role, profilePicture } }
        │
        ▼
Frontend guarda token en localStorage (Zustand persist)
Frontend redirige según rol:
  - ADMIN_ROLE → /dashboard/admin
  - USER_ROLE  → /dashboard
```

### Flujo de Recuperación de Contraseña

```
Usuario solicita recuperación
        │
        ▼
POST /auth/forgot-password { email }
Backend genera token de reset (1 hora)
Backend envía correo con enlace
        │
        ▼
Usuario hace clic en el enlace
http://localhost:5173/reset-password?token=XXXX
        │
        ▼
Usuario ingresa nueva contraseña
POST /auth/reset-password { token, newPassword }
Backend actualiza la contraseña con nuevo hash Argon2
Backend limpia el token de reset
```

## Módulo Bancario (ProyectoBancario)

### Endpoints principales

#### Cuentas
| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| POST | `/api/v1/accounts/create` | Crear cuenta bancaria | Todos |
| GET | `/api/v1/accounts/` | Listar todas las cuentas | Admin, Manager |
| GET | `/api/v1/accounts/user/:userId` | Cuentas de un usuario | Todos |
| GET | `/api/v1/accounts/:accountNumber` | Obtener cuenta específica | Todos |
| PUT | `/api/v1/accounts/:accountNumber` | Actualizar cuenta | Todos |
| DELETE | `/api/v1/accounts/:accountNumber` | Eliminar cuenta | Todos |
| PATCH | `/api/v1/accounts/:accountNumber/status` | Cambiar estado | Todos |

#### Cuentas Bloqueadas
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/v1/accountLocks/create` | Crear bloqueo |
| GET | `/api/v1/accountLocks/` | Listar bloqueos |
| PUT | `/api/v1/accountLocks/:id` | Actualizar bloqueo |
| DELETE | `/api/v1/accountLocks/:id` | Eliminar bloqueo |

#### Otras entidades
| Entidad | Ruta base |
|---|---|
| Monedas | `/api/v1/coins` |
| Tarjetas | `/api/v1/cards` |
| Transacciones | `/api/v1/transaction` |
| Préstamos | `/api/v1/loan` |
| Depósitos | `/api/v1/deposits` |
| Retiros | `/api/v1/withdrawal` |
| Servicios | `/api/v1/service` |
| Estados de cuenta | `/api/v1/accountStatements` |

### Flujo de Creación de Cuenta

```
Admin completa el formulario de nueva cuenta
Campos requeridos:
  - userId      (ID del usuario en Auth-Service)
  - currencyCode (GTQ, USD, EUR)
  - monthlyIncome
  - address
  - jobName
  - phone (8 dígitos)
  - dpi   (13 dígitos)
        │
        ▼
POST /api/v1/accounts/create
        │
        ▼
Banking-Service consulta Auth-Service
GET http://localhost:3005/api/v1/auth/profile-by-id
para obtener nombre y username del usuario
        │
        ▼
Se valida el ingreso mínimo requerido
Se genera número de cuenta único (formato ABC-000-0000)
Se guarda en MongoDB
        │
        ▼
Cuenta creada — el usuario puede verla en /dashboard → Mis Cuentas
```

### Flujo de Bloqueo de Cuenta

```
Admin va a "Cuentas Bloqueadas" → "Bloquear cuenta"
Ingresa: N° cuenta, ID usuario, motivo, descripción
Opcionalmente: fecha de desbloqueo automático
        │
        ▼
1. POST /api/v1/accountLocks/create  → crea registro de bloqueo
2. PATCH /api/v1/accounts/:accountNumber/status { status: 'bloqueada' }
        │
        ▼
La cuenta queda bloqueada — el usuario ve el aviso en su panel
        │
        ▼
Si se configuró fecha de desbloqueo:
El scheduler revisa cada 10 segundos
Cuando la fecha llega → desbloquea automáticamente
```

### Desbloqueo automático (Scheduler)

El Banking-Service ejecuta un proceso en segundo plano cada 10 segundos que:

1. Busca bloqueos con `status: 'bloqueado'` y `unlockDate <= ahora`
2. Cambia el estado del bloqueo a `desbloqueado`
3. Cambia el estado de la cuenta a `activa`
4. Registra el evento en consola

---

## Frontend (React)

### Estructura de carpetas

```
src/
├── app/
│   ├── App.jsx                    ← Componente raíz
│   └── router/
│       ├── AppRoutes.jsx          ← Definición de rutas
│       ├── ProtectedRoute.jsx     ← Requiere autenticación
│       └── RoleGuard.jsx          ← Requiere rol específico
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RegisterForm.jsx
│   │   │   └── ForgotPasswordForm.jsx
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx       ← Página principal de auth
│   │   │   ├── VerifyEmailPage.jsx
│   │   │   ├── ResetPasswordPage.jsx
│   │   │   └── UnauthorizedPage.jsx
│   │   └── store/
│   │       └── authStore.js       ← Estado global de autenticación
│   ├── admin/
│   │   └── pages/
│   │       └── AdminDashboard.jsx ← Panel administrativo completo
│   ├── dashboard/
│   │   └── pages/
│   │       └── UserDashboard.jsx  ← Panel del cliente
│   └── profile/
│       └── ProfilePage.jsx        ← Perfil de usuario
├── shared/
│   ├── api/
│   │   ├── api.js                 ← Axios para Auth-Service
│   │   ├── banking.js             ← Axios para Banking-Service
│   │   ├── auth.js                ← Endpoints de autenticación
│   │   └── users.js               ← Endpoints de usuarios
│   ├── components/
│   │   └── layout/
│   │       ├── DashboardLayout.jsx ← Layout con sidebar
│   │       └── Dashboard.css
│   ├── hooks/
│   │   └── useData.js             ← Hook reutilizable de fetch con caché
│   └── utils/
│       └── toast.js               ← Notificaciones
```

### Rutas de la aplicación

| Ruta | Componente | Acceso |
|---|---|---|
| `/` | Redirect → `/auth/login` | Público |
| `/auth/login` | AuthPage | Público |
| `/verify-email?token=` | VerifyEmailPage | Público |
| `/reset-password?token=` | ResetPasswordPage | Público |
| `/unauthorized` | UnauthorizedPage | Público |
| `/dashboard/admin` | AdminDashboard | Solo ADMIN_ROLE |
| `/dashboard` | UserDashboard | Autenticado |

---

## Flujos de Usuario

### Cliente (USER_ROLE)

```
1. Se registra en /auth/login → "Regístrate aquí"
2. Verifica su correo haciendo clic en el enlace recibido
3. Inicia sesión → redirige a /dashboard
4. Puede ver:
   ├── Mi Panel     → balance total, resumen de cuentas, últimas transacciones
   ├── Mis Cuentas  → tarjetas visuales por cuenta (activa/bloqueada/inactiva)
   ├── Mis Tarjetas → tarjetas de crédito/débito
   ├── Transferencias → historial y nueva transferencia
   ├── Préstamos    → estado de créditos
   ├── Depósitos    → realizar depósitos
   ├── Retiros      → realizar retiros
   ├── Estado de Cuenta → historial
   └── Mi Perfil    → información personal y seguridad
```

### Administrador (ADMIN_ROLE)

```
1. Inicia sesión con credenciales de admin
2. Redirige a /dashboard/admin
3. Tiene acceso a:
   ├── Panel General   → estadísticas en tiempo real
   ├── Usuarios        → lista de todos los usuarios registrados
   │   └── Puede cambiar roles (Admin ↔ Usuario)
   ├── Cuentas         → CRUD completo de cuentas bancarias
   │   ├── Crear cuenta asignada a un usuario
   │   ├── Editar datos de la cuenta
   │   ├── Activar / Desactivar cuenta
   │   └── Eliminar cuenta
   ├── Cuentas Bloqueadas → gestión de bloqueos
   │   ├── Bloquear cuenta (automáticamente cambia estado)
   │   ├── Configurar fecha de desbloqueo automático
   │   └── Eliminar bloqueo (desbloquea la cuenta)
   ├── Tarjetas        → ver y gestionar tarjetas
   ├── Transacciones   → historial completo
   ├── Préstamos       → gestión de créditos
   ├── Depósitos       → registrar depósitos
   ├── Retiros         → registrar retiros
   ├── Monedas         → gestión de divisas y tipos de cambio
   ├── Servicios       → catálogo de servicios
   ├── Estados de Cuenta → historial de estados
   └── Mi Perfil       → información y seguridad del admin
```

---

## Panel Administrativo

### Sección de Usuarios

- Lista todos los usuarios registrados con foto de perfil, nombre, correo, teléfono y rol
- Permite cambiar el rol entre `USER_ROLE` y `ADMIN_ROLE` con actualización optimista (refleja el cambio inmediatamente en la UI sin esperar al servidor)
- El admin principal (`proyectobancario3@gmail.com`) está protegido y no puede ser degradado
- Modal de detalle con toda la información del usuario

### Sección de Cuentas

- Muestra todas las cuentas en todos los estados (activa, inactiva, bloqueada)
- Stats en tiempo real: total, activas, inactivas, bloqueadas, balance total
- Crear cuenta: requiere ID de usuario del Auth-Service, el sistema automáticamente obtiene el nombre y username
- Editar: permite modificar nombre titular, dirección, ocupación e ingreso mensual
- Activar/Desactivar con un clic
- Eliminar con confirmación
- El usuario ve sus cuentas en el dashboard cliente en tiempo real

### Sección de Cuentas Bloqueadas

- Al crear un bloqueo: cambia el estado de la cuenta a `bloqueada` automáticamente
- Al eliminar un bloqueo: cambia el estado de la cuenta a `activa` automáticamente
- Fecha de desbloqueo automático: el scheduler desbloquea la cuenta a la hora exacta configurada
- El cliente ve un aviso rojo en su panel cuando tiene cuentas bloqueadas

---

## Seguridad

### Autenticación JWT
- El token se genera al hacer login con expiración de 24h
- Incluye: `sub` (userId), `role`, `email`, `name`, `surname`
- Se verifica en cada petición protegida mediante el middleware `validateJWT`
- Se almacena en `localStorage` mediante Zustand persist

### Rate Limiting (Auth-Service)
- API general: 20 peticiones por minuto
- Endpoints de auth: 5 peticiones por minuto
- Endpoints de email: 3 peticiones cada 15 minutos

### Protección de rutas
- `ProtectedRoute`: redirige a `/auth/login` si no hay sesión
- `RoleGuard`: redirige a `/unauthorized` si el rol no coincide
- Si un usuario con rol degradado intenta acceder a `/dashboard/admin`, es redirigido automáticamente a `/dashboard`

### Hash de contraseñas
- Algoritmo: Argon2id
- Parámetros: memoria 102400 KB, 2 iteraciones, 8 paralelismo
- Las contraseñas nunca se almacenan en texto plano

### CORS
- Auth-Service: permite origins configurados en `.env`
- Banking-Service: permite todos los origins en desarrollo con métodos `GET, POST, PUT, DELETE, PATCH, OPTIONS`

---

## Documentación Swagger

Ambos servicios tienen documentación interactiva disponible:

- **Auth-Service**: `http://localhost:3005/api/v1/docs`
- **ProyectoBancario**: `http://localhost:3006/api/v1/docs`

---

