# 🦷 DentalCare Pro - Sistema de Gestión para Consultorio Dental

Sistema web completo para consultorio dental con Node.js + Express + MongoDB en el backend y React + Tailwind en el frontend.

## ✨ Características

### Panel del Dentista
- 📋 Gestión de pacientes (CRUD completo)
- 🏥 Registro de consultas con diagnósticos y tratamientos
- 📷 Subida de fotos clínicas a Cloudinary
- 📅 Gestión de citas
- 📊 Dashboard con estadísticas
- 📱 QR y código de acceso para pacientes

### Portal del Paciente (3 métodos de acceso)
- 📧 Por email
- 🔑 Por código único (6 caracteres)
- 📱 Por QR / Link directo

## 🛠️ Tecnologías

| Backend | Frontend |
|---------|----------|
| Node.js + Express | React 18 |
| MongoDB + Mongoose | Tailwind CSS |
| JWT | React Router |
| Cloudinary | Axios |
| QRCode | Lucide Icons |

## 🚀 Instalación

### Prerrequisitos
- Node.js 18+
- MongoDB local o Atlas
- Cuenta en Cloudinary

### 1. Clonar repositorio
```bash
git clone <repo>
cd dental-clinic
```

### 2. Configurar Backend
```bash
cd backend
cp .env.example .env
# Editar .env con tus credenciales
npm install
```

### 3. Configurar Frontend
```bash
cd frontend
cp .env.example .env
npm install
```

### 4. Variables de entorno del Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/dental-clinic
JWT_SECRET=tu_secret_muy_seguro
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
FRONTEND_URL=http://localhost:5173
```

### 5. Crear datos de prueba
```bash
cd backend
npm run seed
```

Credenciales de prueba:
- **Admin**: admin@dentalcare.com / admin123
- **Doctor**: doctor@dentalcare.com / doctor123

### 6. Ejecutar
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## 📁 Estructura

```
dental-clinic/
├── backend/
│   ├── src/
│   │   ├── config/          # DB y Cloudinary
│   │   ├── controllers/     # Lógica de negocio
│   │   ├── middleware/      # Auth y validación
│   │   ├── models/          # Schemas Mongoose
│   │   ├── routes/          # Endpoints API
│   │   └── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Layout, Modal, etc.
│   │   ├── contexts/        # AuthContext
│   │   ├── pages/           # Vistas
│   │   ├── services/        # API calls
│   │   └── utils/           # Helpers
│   └── package.json
└── README.md
```

## 📡 API Endpoints

### Autenticación
- `POST /api/auth/login` - Login staff
- `POST /api/auth/patient/email` - Login paciente por email
- `POST /api/auth/patient/code` - Login paciente por código
- `POST /api/auth/patient/token` - Login paciente por QR/token
- `GET /api/auth/me` - Perfil actual

### Pacientes
- `GET /api/patients` - Listar
- `POST /api/patients` - Crear
- `GET /api/patients/:id` - Detalle
- `PUT /api/patients/:id` - Actualizar
- `DELETE /api/patients/:id` - Eliminar
- `GET /api/patients/:id/history` - Historial completo
- `GET /api/patients/:id/qr` - Obtener QR

### Consultas
- `GET /api/consultations` - Listar
- `POST /api/consultations` - Crear
- `GET /api/consultations/:id` - Detalle
- `PUT /api/consultations/:id` - Actualizar
- `DELETE /api/consultations/:id` - Eliminar
- `POST /api/consultations/:id/photos` - Subir fotos

### Citas
- `GET /api/appointments` - Listar
- `POST /api/appointments` - Crear
- `PUT /api/appointments/:id` - Actualizar
- `DELETE /api/appointments/:id` - Eliminar
- `PUT /api/appointments/:id/complete` - Completar
- `PUT /api/appointments/:id/cancel` - Cancelar

## 🚂 Despliegue en Railway

### Backend
1. Crear proyecto en Railway
2. Agregar MongoDB (o usar Atlas)
3. Conectar repo y seleccionar `/backend`
4. Configurar variables de entorno
5. Deploy

### Frontend
1. Build: `npm run build`
2. Desplegar `dist/` en Vercel, Netlify o Railway

## 📝 Licencia

MIT
