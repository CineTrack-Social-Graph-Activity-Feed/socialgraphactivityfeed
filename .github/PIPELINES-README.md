# 🚀 CI/CD Pipelines - Social Graph Activity Feed

## 📋 Resumen Ejecutivo

Este proyecto tiene **5 pipelines automatizados** que gestionan el ciclo de vida completo de la aplicación:

| Pipeline | Propósito | Tecnologías | Coverage |
|----------|-----------|-------------|----------|
| **CI/CD Backend** | Infraestructura + Build + Deploy Backend | Terraform, Node.js, Elastic Beanstalk | 83.25% |
| **CI/CD Frontend** | Build + Deploy Frontend | React, Vite, S3, CloudFront | 89.81% |
| **ECS Fargate Consumer** | Deploy Consumer RabbitMQ | Docker, ECR, ECS Fargate | N/A |
| **Tests Unitarios** | Validar utilidades de testing | Python, pytest | 95-100% |
| **Terraform Infra** | Provisionar infraestructura standalone | Terraform, AWS | N/A |

---

## 🔧 Pipeline 1: CI/CD Backend (`main.yml`)

**Trigger**: Push o PR a `main`/`terraform-iac` en carpetas `Backend/**` o `terraform/**`

### Jobs:

#### 1️⃣ **infra** - Provisionar Infraestructura AWS
```
✅ Configura credenciales AWS
✅ Inicializa Terraform (backend S3 + DynamoDB lock)
✅ Terraform Plan (solo en PRs para validación)
✅ Terraform Apply (solo en main/terraform-iac)
✅ Exporta outputs: eb_bucket, eb_app, eb_env, cloudfront_backend_id
```

**Recursos provisionados**:
- S3 bucket para deployments
- Elastic Beanstalk (app + environment)
- CloudFront distribution (backend)
- MongoDB connection config

**Concurrency**: Bloquea múltiples `terraform apply` simultáneos por rama

---

#### 2️⃣ **backend** - Build y Test
```
✅ Setup Node.js 22
✅ Install dependencies (npm ci)
✅ Lint backend (npm run lint)
✅ Test backend con coverage (npm test)
   → 198 tests, 83.25% coverage
   → Controllers, Models, Middlewares
✅ Upload coverage reports
✅ Upload código backend (artifact para deploy)
```

**Servicios**: MongoDB en contenedor (para tests)

---

#### 3️⃣ **deploy** - Deploy a Elastic Beanstalk
```
✅ Download backend code (artifact)
✅ Crear estructura de deployment
✅ Instalar dependencias de producción (npm install --omit=dev)
✅ Crear .zip con aplicación
✅ Upload a S3 bucket
✅ Crear versión en Elastic Beanstalk
✅ Actualizar environment con nueva versión
✅ Verificar deployment (health check)
✅ Invalidar caché CloudFront
```

**Condiciones**: Solo ejecuta en push a `main`/`terraform-iac` (no en PRs)

**Dependencias**: `infra` y `backend` deben completarse exitosamente

---

## 🎨 Pipeline 2: CI/CD Frontend (`frontend-deploy.yml`)

**Trigger**: 
- Push a `main`/`terraform-iac` en carpeta `Frontend/**`
- Cuando termina workflow "CI/CD Backend"
- Manual (workflow_dispatch)

### Jobs:

#### 1️⃣ **get-infra-outputs** - Leer Estado Terraform
```
✅ Terraform init (solo lectura, no apply)
✅ Extraer outputs: s3_bucket, cloudfront_frontend_id, cloudfront_backend_url
✅ Validar que la infraestructura exista antes de continuar
```

**Nota**: NO modifica infraestructura, solo lee el estado

---

#### 2️⃣ **ci** - Build y Test Frontend
```
✅ Setup Node.js 22
✅ Install dependencies (npm ci)
✅ Test frontend con coverage (npm run test:coverage)
   → 207 tests, 89.81% coverage
   → Componentes React, Contexts, Pages
✅ Build producción (npm run build)
   → VITE_API_URL: https://socialgraphbe.cine-track.com.ar
✅ Upload build (artifact)
✅ Upload coverage reports
```

**Variables de entorno**: `VITE_API_URL` configurado con dominio personalizado del backend

---

#### 3️⃣ **deploy** - Deploy a S3 + CloudFront
```
✅ Download build (artifact)
✅ Configurar credenciales AWS
✅ Crear estructura de rutas SPA (copiar index.html a /api-test, /mi-actividad, etc.)
✅ Subir archivos con content-type correcto:
   → HTML: text/html, no-cache
   → JS: application/javascript, max-age=31536000
   → CSS: text/css, max-age=31536000
   → SVG: image/svg+xml, max-age=31536000
✅ Sincronizar con S3 (aws s3 sync --delete)
✅ Fix content-type de index.html
✅ Invalidar caché CloudFront
```

**Optimizaciones**:
- Cache-Control headers optimizados por tipo de archivo
- Soporte para React Router (SPA routing)
- Content-Type headers correctos
- Invalidación de caché automática

---

## 🐰 Pipeline 3: ECS Fargate Consumer (`consumer.yml`)

**Trigger**: 
- Push a `main`/`terraform-iac` en carpeta `Backend/consumer/**`
- Manual (workflow_dispatch)

### Jobs:

#### 1️⃣ **deploy** - Build y Deploy Consumer
```
✅ Checkout código
✅ Configurar credenciales AWS
✅ Login a Amazon ECR
✅ Build imagen Docker
   → docker build -t <ECR_REGISTRY>/social-graph-app-consumer:<SHA>
✅ Tag imagen como latest
✅ Push a ECR (SHA y latest tags)
✅ Descargar task definition actual de ECS
✅ Actualizar task definition con nueva imagen
✅ Deploy a ECS Fargate
   → Cluster: social-graph-app-consumer-cluster
   → Service: social-graph-app-consumer-service
   → Wait for service stability
✅ Verificar deployment
   → Status del servicio
   → Running/Desired count
   → Eventos recientes
✅ Mostrar link a CloudWatch Logs
```

**Propósito**: Consumer de mensajes RabbitMQ que procesa eventos asíncronos del sistema

**Infraestructura**: 
- Amazon ECR para imágenes Docker
- ECS Fargate para ejecución serverless de contenedores
- CloudWatch Logs para logs del consumer

---

## 🧪 Pipeline 4: Tests Unitarios (`cinetrack-tests.yml`)

**Trigger**: Push o PR a `main`/`terraform-iac` en carpeta `tests/**`

### Jobs:

#### 1️⃣ **unit-tests** - Ejecutar Tests de Utilidades
```
✅ Setup Python 3.11
✅ Install pytest dependencies
✅ Run unit tests (pytest tests/unit)
   → test_selenium_helpers.py (100%)
   → test_utils.py (99%)
✅ Coverage report (--cov=tests/unit --cov=tests/utils)
   → 95-100% coverage de utilidades
✅ Upload a Codecov
✅ Upload test reports
```

**Propósito**: Validar que las herramientas de testing (helpers, utilities) funcionen correctamente

**Nota**: NO ejecuta tests E2E/Integration (requieren servidores corriendo)

---

## 🏗️ Pipeline 5: Terraform Infra (`infra.yml`)

**Trigger**: Push o PR a `main` en carpeta `terraform/**`

### Jobs:

#### 1️⃣ **plan-apply** - Gestión de Infraestructura Standalone
```
✅ Configurar credenciales AWS
✅ Setup Terraform 1.9.5
✅ Terraform Init
✅ Terraform Plan (en PRs)
✅ Terraform Apply (solo en main)
```

**Diferencia con main.yml**: Este es un pipeline standalone solo para cambios de infraestructura

**Uso**: Para modificaciones de Terraform sin tocar código de aplicación

---

## 🔐 Secretos Requeridos

### AWS
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION` (us-east-2)

### Terraform
- `TF_BACKEND_BUCKET` - S3 para Terraform state
- `TF_LOCK_TABLE` - DynamoDB para locking
- `TF_VAR_mongodb_uri` - URI de MongoDB
- `TF_VAR_rabbit_url` - URL de RabbitMQ

### Frontend (opcional, usa outputs de Terraform si no están definidos)
- `S3_BUCKET` - Bucket S3 para frontend
- `CLOUDFRONT_DISTRIBUTION_ID` - ID de distribución CloudFront

### Backend
- `MONGODB_URI` - URI de MongoDB para tests

---

## 📊 Métricas de Calidad

### Coverage Actual
| Componente | Statements | Functions | Tests |
|------------|-----------|-----------|-------|
| **Backend** | 84.26% | 81.01% | 298 |
| **Frontend** | 88.23% | 79.38% | 212 |
| **Test Utils** | 95-100% | 95-100% | N/A |

---

## 🛡️ Prácticas DevOps Implementadas

### ✅ Seguridad
- Credenciales en GitHub Secrets (nunca en código)
- IAM roles con permisos mínimos
- Terraform state remoto encriptado (S3 + DynamoDB)

### ✅ Calidad
- Lint obligatorio en todos los PRs
- Tests con coverage mínimo
- Build validation antes de deploy

### ✅ Automatización
- Deploy automático en merge a main
- Rollback manual disponible (Elastic Beanstalk versioning)
- Cache invalidation automática (CloudFront)

### ✅ Observabilidad
- Coverage reports en artifacts
- Health checks post-deployment
- Test summaries en GitHub Actions UI
- CloudWatch Logs para consumer ECS

### ✅ Eficiencia
- Concurrency control (evita conflictos Terraform)
- Dependency caching (npm, pip)
- Conditional deployments (solo si cambia código relevante)
- Contenedores Docker optimizados

### ✅ Arquitectura Event-Driven
- Consumer dedicado para procesamiento asíncrono (ECS Fargate)
- Desacoplamiento con RabbitMQ
- Escalabilidad horizontal automática
- Procesamiento de eventos en background

---


## 🚨 Manejo de Errores

### Si falla Terraform
- Revisar logs en GitHub Actions
- Verificar state lock en DynamoDB
- Comando manual: `terraform unlock <LOCK_ID>`

### Si falla Backend Tests
- Coverage mínimo: 80%
- Revisar coverage report en artifacts
- Tests deben pasar antes de merge

### Si falla Frontend Build
- Verificar VITE_API_URL correcta
- Revisar dependencias (npm ci)
- Build local: `npm run build`

### Si falla Deployment
- Elastic Beanstalk: Revisar eventos en AWS Console
- CloudFront: Esperar propagación (5-10 min)
- Rollback: Cambiar versión en EB Console

### Si falla Consumer Deployment (ECS)
- Revisar logs en CloudWatch: `/ecs/social-graph-app-consumer`
- Verificar que la imagen se subió correctamente a ECR
- Revisar eventos del servicio ECS: `aws ecs describe-services --cluster social-graph-app-consumer-cluster --services social-graph-app-consumer-service`
- Verificar task definition y variables de entorno
- Rollback: Deploy una imagen anterior desde ECR

---

## 📚 Comandos Útiles

### Local Development
```bash
# Backend
cd Backend/servidor
npm install
npm test
npm run lint

# Frontend  
cd Frontend/front-cinetrack
npm install
npm run test:coverage
npm run build

# Consumer
cd Backend/consumer
docker build -t consumer .
docker run --rm consumer

# Tests Unitarios
cd tests
pip install -r requirements.txt
pytest tests/unit -v
```

### Terraform Manual
```bash
cd terraform
terraform init
terraform plan
terraform apply
terraform destroy  # ⚠️ Cuidado
```

### AWS CLI
```bash
# Ver estado de Elastic Beanstalk
aws elasticbeanstalk describe-environments --application-name social-graph-app

# Invalidar CloudFront manualmente
aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"

# Ver objetos en S3
aws s3 ls s3://<bucket-name>

# Ver imágenes en ECR
aws ecr list-images --repository-name social-graph-app-consumer

# Ver logs del consumer en CloudWatch
aws logs tail /ecs/social-graph-app-consumer --follow

# Ver tareas ECS en ejecución
aws ecs list-tasks --cluster social-graph-app-consumer-cluster

# Describir servicio ECS
aws ecs describe-services --cluster social-graph-app-consumer-cluster --services social-graph-app-consumer-service
```

---
