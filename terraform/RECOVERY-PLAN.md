# Plan de Recuperación de Infraestructura

## Estado Actual
**Fecha de destrucción:** 24 de noviembre de 2024  
**Motivo:** Ahorro de costos AWS (~$20-30/mes) durante período de desarrollo  
**Infraestructura destruida:** TODOS los recursos de AWS (ECS, Beanstalk, CloudFront, S3, ECR)

## Costos Ahorrados
- **Período de apagado:** 24 nov - 12 dic (18 días)
- **Ahorro estimado:** ~$18-20 USD
- **Costo de entrega final:** Solo 3 días (12-15 dic) = ~$2-3 USD

## Fecha de Entrega
**15 de diciembre de 2024**

## Plan de Recuperación (12 de diciembre)

### 1. Verificar Estado del Código
```powershell
cd C:\Users\Nicolás\Desktop\SocialGraph\socialgraphactivityfeed
git status
git log --oneline -5
```

**Commit actual:** `91ca30d` en branch `terraform-iac`  
**Último cambio:** Revertir cambios en cloudfront

### 2. Recrear Infraestructura con Terraform
```powershell
cd terraform
terraform init
terraform apply
```

**Tiempo estimado:** 8-10 minutos  
**Recursos creados:**
- 1 ECR repository (`social-graph-app-consumer`)
- 1 ECS cluster + service + task definition (Fargate)
- 1 Elastic Beanstalk application + environment
- 2 CloudFront distributions (frontend + backend)
- 2 S3 buckets (frontend + EB versions)
- IAM roles, security groups, CloudWatch logs

**IMPORTANTE:** Los buckets S3 estarán VACÍOS después del apply.

### 3. Redesplegar Backend (Elastic Beanstalk)

#### Opción A: Trigger workflow de GitHub
```powershell
# Hacer un commit vacío para triggerar CI/CD
cd C:\Users\Nicolás\Desktop\SocialGraph\socialgraphactivityfeed
git checkout terraform-iac
git commit --allow-empty -m "redeploy: levantar backend para entrega"
git push origin terraform-iac
```

Esto ejecutará `.github/workflows/backend.yml` que:
1. Hace build del código backend
2. Crea archivo ZIP
3. Despliega a Elastic Beanstalk
4. Tiempo: ~5-7 minutos

#### Opción B: Deploy manual
```powershell
cd Backend/servidor
zip -r deploy.zip .
aws elasticbeanstalk create-application-version --application-name <APP_NAME_FROM_TERRAFORM_OUTPUT> --version-label v-recovery-$(date +%s) --source-bundle S3Bucket=<S3_BUCKET_FROM_TERRAFORM_OUTPUT>,S3Key=deploy.zip
aws elasticbeanstalk update-environment --environment-name <ENV_NAME_FROM_TERRAFORM_OUTPUT> --version-label v-recovery-$(date +%s)
```

### 4. Redesplegar Frontend (S3 + CloudFront)

#### Opción A: Trigger workflow de GitHub
```powershell
cd C:\Users\Nicolás\Desktop\SocialGraph\socialgraphactivityfeed
git checkout terraform-iac
git commit --allow-empty -m "redeploy: levantar frontend para entrega"
git push origin terraform-iac
```

Esto ejecutará `.github/workflows/frontend.yml` que:
1. Build de React con Vite
2. Upload a S3
3. Invalidación de CloudFront
4. Tiempo: ~3-5 minutos

#### Opción B: Deploy manual
```powershell
cd Frontend/front-cinetrack
npm ci
npm run build
aws s3 sync dist/ s3://<FRONTEND_BUCKET_FROM_TERRAFORM_OUTPUT>/ --delete
aws cloudfront create-invalidation --distribution-id <CLOUDFRONT_FRONTEND_ID_FROM_TERRAFORM_OUTPUT> --paths "/*"
```

### 5. Redesplegar Consumer (ECS Fargate)

#### Opción A: Trigger workflow de GitHub
```powershell
cd C:\Users\Nicolás\Desktop\SocialGraph\socialgraphactivityfeed
git checkout terraform-iac
git commit --allow-empty -m "redeploy: levantar consumer para entrega"
git push origin terraform-iac
```

Esto ejecutará `.github/workflows/consumer.yml` que:
1. Build de Docker image
2. Push a ECR
3. Update de ECS service (force new deployment)
4. Tiempo: ~4-6 minutos

#### Opción B: Deploy manual
```powershell
cd Backend/consumer
# Login a ECR
aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin <ECR_URL_FROM_TERRAFORM_OUTPUT>

# Build y push
docker build -t social-graph-app-consumer .
docker tag social-graph-app-consumer:latest <ECR_URL_FROM_TERRAFORM_OUTPUT>:latest
docker push <ECR_URL_FROM_TERRAFORM_OUTPUT>:latest

# Force new deployment
aws ecs update-service --cluster <CLUSTER_NAME_FROM_TERRAFORM_OUTPUT> --service <SERVICE_NAME_FROM_TERRAFORM_OUTPUT> --force-new-deployment --region us-east-2
```

### 6. Verificación Post-Deploy

#### 6.1 Backend Health Check
```powershell
# Obtener URL de terraform outputs
cd terraform
terraform output elastic_beanstalk_url

# Test endpoint
curl <BEANSTALK_URL>/health
# Esperado: {"status":"ok","timestamp":"..."}
```

#### 6.2 Frontend Disponibilidad
```powershell
# Obtener URL de CloudFront
cd terraform
terraform output cloudfront_frontend_url

# Abrir en browser o test con curl
curl -I <CLOUDFRONT_URL>
# Esperado: HTTP/2 200
```

#### 6.3 Consumer Logs
```powershell
aws logs tail /ecs/social-graph-app-consumer --since 5m --follow --region us-east-2
```

Buscar:
- `✅ Consumer conectado exitosamente`
- `✅ Canal creado para consumo de eventos`
- `[SUCCESS]` messages con event processing

#### 6.4 Crear Usuario de Prueba
1. Ir a `https://socialgraph.cine-track.com.ar`
2. Crear usuario nuevo
3. Verificar logs del consumer para evento `usuarios.usuario.creado`
4. Verificar que aparece en MongoDB

### 7. DNS y Certificados SSL

**NOTA IMPORTANTE:** Route53 y ACM NO fueron destruidos porque están en recursos externos a Terraform.

Los dominios siguen apuntando a CloudFront:
- `socialgraph.cine-track.com.ar` → CloudFront Frontend
- `socialgraphbe.cine-track.com.ar` → CloudFront Backend

**ACCIÓN REQUERIDA:** Después de `terraform apply`, actualizar registros CNAME en Route53 con los nuevos distribution IDs.

```powershell
# Obtener nuevos IDs
cd terraform
terraform output cloudfront_frontend_id
terraform output cloudfront_backend_id

# Actualizar en Route53 manualmente o con CLI:
aws route53 change-resource-record-sets --hosted-zone-id <ZONE_ID> --change-batch file://dns-update.json
```

### 8. Timeline Completo (12 dic)

| Hora | Actividad | Duración |
|------|-----------|----------|
| 09:00 | `terraform apply` | 10 min |
| 09:10 | Verificar outputs, actualizar DNS | 5 min |
| 09:15 | Trigger deploy backend (workflow) | 7 min |
| 09:22 | Trigger deploy frontend (workflow) | 5 min |
| 09:27 | Trigger deploy consumer (workflow) | 6 min |
| 09:33 | Esperar propagación CloudFront | 15 min |
| 09:48 | Verificación completa + pruebas | 10 min |
| **09:58** | **Sistema 100% operacional** | **~1 hora** |

## Configuración Crítica Preservada

### Variables de Entorno (Backend)
Todas están en `terraform/elasticbeanstalk.tf`:
- `MONGODB_URI`
- `JWT_PUBLIC_KEY`
- `RABBIT_URL`
- `PORT`
- `NODE_ENV`

### Secretos de GitHub Actions
No afectados por destroy:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`

### RabbitMQ (AWS MQ)
**NO DESTRUIDO** - sigue corriendo:
- Broker: `b-782deeea-3f05-4f99-a380-77fee35a87a5.mq.us-east-2.on.aws`

### MongoDB Atlas
**NO DESTRUIDO** - sigue corriendo:
- Cluster: `socialgraph-activityfee.reute35.mongodb.net`
- Database: Todos los datos preservados

## Costos Durante Recuperación (12-15 dic)

| Servicio | Costo/día | 3 días |
|----------|-----------|---------|
| Elastic Beanstalk | $0.33 | $1.00 |
| ECS Fargate | $0.28 | $0.85 |
| CloudFront | $0.10 | $0.30 |
| S3 | $0.02 | $0.05 |
| **TOTAL** | **$0.73** | **~$2.20** |

## Rollback Plan

Si algo falla durante la recuperación:

1. **Verificar terraform state:**
   ```powershell
   cd terraform
   terraform show
   ```

2. **Destruir y reintentar:**
   ```powershell
   terraform destroy -auto-approve
   terraform apply -auto-approve
   ```

3. **Check workflows en GitHub:**
   - Ir a Actions tab
   - Re-run failed jobs

4. **Logs de debugging:**
   ```powershell
   # Backend
   aws elasticbeanstalk describe-environment-health --environment-name <ENV_NAME> --attribute-names All
   
   # Consumer
   aws logs tail /ecs/social-graph-app-consumer --since 30m
   
   # Frontend (CloudFront)
   aws cloudfront get-distribution --id <DISTRIBUTION_ID>
   ```

## Checklist Final (15 dic - Antes de Entrega)

- [ ] Backend responde en `/health`
- [ ] Frontend carga correctamente
- [ ] Login funciona
- [ ] Avatar del usuario se muestra (fix de `/auth/me`)
- [ ] Likes muestran optimistic updates (sin delay)
- [ ] Comentarios muestran optimistic updates
- [ ] Consumer procesa eventos (check logs)
- [ ] Crear usuario nuevo → aparece evento en consumer
- [ ] Actualizar perfil → aparece evento en consumer
- [ ] Tests pasando (opcional: run workflows)


## Notas Adicionales

- El `terraform.tfstate` está preservado localmente en `terraform/`
- El archivo `terraform.tfstate.backup` tiene el estado previo a destroy
- Todos los workflows de CI/CD están intactos
- No se requieren cambios de código, solo redeploy
- Los certificados SSL en ACM siguen válidos (no se destruyeron)

---

**Autor:** GitHub Copilot  
**Fecha:** 24 de noviembre de 2024  
**Última revisión:** Pre-destroy
