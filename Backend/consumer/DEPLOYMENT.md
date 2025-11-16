# Consumer Deployment Guide

## Arquitectura

El consumer se despliega como un contenedor Docker en **AWS ECS Fargate**, corriendo 24/7 para consumir mensajes de RabbitMQ.

```
┌─────────────────────────────────────────┐
│  AWS ECS FARGATE                        │
│  ┌───────────────────────────────────┐  │
│  │  Consumer Container               │  │
│  │  - Escucha RabbitMQ              │  │
│  │  - Procesa eventos de Core       │  │
│  │  - Actualiza MongoDB             │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Pasos para desplegar

### 1. Aplicar infraestructura con Terraform

```bash
cd terraform

# Inicializar Terraform (si no lo has hecho)
terraform init

# Planificar cambios
terraform plan

# Aplicar infraestructura (crea ECR, ECS Cluster, Task Definition, Service)
terraform apply
```

Esto creará:
- ✅ **ECR Repository**: Para almacenar imágenes Docker del consumer
- ✅ **ECS Cluster**: Cluster dedicado para el consumer
- ✅ **ECS Task Definition**: Configuración del contenedor
- ✅ **ECS Service**: Servicio que mantiene el consumer corriendo
- ✅ **CloudWatch Logs**: Para logs del consumer
- ✅ **IAM Roles**: Permisos necesarios
- ✅ **Security Group**: Reglas de red

### 2. Desplegar el consumer

El deployment se hace automáticamente vía GitHub Actions cuando:
- Haces push a `main` con cambios en `Backend/consumer/**`
- Ejecutas manualmente el workflow `Deploy Consumer to ECS`

**O manualmente:**

```bash
# Login a ECR
aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-2.amazonaws.com

# Build y push imagen
cd Backend/consumer
docker build -t social-graph-app-consumer:latest .
docker tag social-graph-app-consumer:latest <ACCOUNT_ID>.dkr.ecr.us-east-2.amazonaws.com/social-graph-app-consumer:latest
docker push <ACCOUNT_ID>.dkr.ecr.us-east-2.amazonaws.com/social-graph-app-consumer:latest

# Forzar nuevo deployment en ECS
aws ecs update-service --cluster social-graph-app-consumer-cluster --service social-graph-app-consumer-service --force-new-deployment --region us-east-2
```

### 3. Verificar que el consumer está corriendo

```bash
# Ver el estado del servicio
aws ecs describe-services \
  --cluster social-graph-app-consumer-cluster \
  --services social-graph-app-consumer-service \
  --region us-east-2

# Ver tasks corriendo
aws ecs list-tasks \
  --cluster social-graph-app-consumer-cluster \
  --service-name social-graph-app-consumer-service \
  --region us-east-2

# Ver logs en tiempo real
aws logs tail /ecs/social-graph-app-consumer --follow --region us-east-2
```

### 4. Health Check

El consumer expone un endpoint de health en el puerto 3001:

```bash
# Obtener la IP pública de la task
TASK_ARN=$(aws ecs list-tasks --cluster social-graph-app-consumer-cluster --service-name social-graph-app-consumer-service --query 'taskArns[0]' --output text --region us-east-2)

aws ecs describe-tasks --cluster social-graph-app-consumer-cluster --tasks $TASK_ARN --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text --region us-east-2

# Luego obtener la IP pública del ENI y hacer:
curl http://<PUBLIC_IP>:3001/health
```

## Configuración

### Variables de entorno

Las variables se configuran en `terraform/ecs.tf`:

- `NODE_ENV`: production
- `PORT`: 3001
- `MONGODB_URI`: Desde variable de Terraform
- `RABBIT_URL`: Desde variable de Terraform

### Recursos

Por defecto:
- **CPU**: 256 units (0.25 vCPU)
- **Memory**: 512 MB
- **Desired Count**: 1 tarea

Puedes cambiar estos valores en `terraform/variables.tf`:

```hcl
consumer_cpu           = "512"   # 0.5 vCPU
consumer_memory        = "1024"  # 1 GB
consumer_desired_count = 2       # 2 instancias para redundancia
```

## Troubleshooting

### Ver logs del consumer

```bash
aws logs tail /ecs/social-graph-app-consumer --follow --region us-east-2
```

### Consumer no inicia

1. Verificar que ECR tiene la imagen:
```bash
aws ecr list-images --repository-name social-graph-app-consumer --region us-east-2
```

2. Verificar variables de entorno en la task definition:
```bash
aws ecs describe-task-definition --task-definition social-graph-app-consumer --region us-east-2
```

3. Verificar que RabbitMQ es accesible desde el consumer

### Reiniciar el consumer

```bash
aws ecs update-service \
  --cluster social-graph-app-consumer-cluster \
  --service social-graph-app-consumer-service \
  --force-new-deployment \
  --region us-east-2
```

## Costos

**Estimado mensual** (1 task, 0.25 vCPU, 512 MB):
- ECS Fargate: ~$5-10/mes
- CloudWatch Logs: ~$1-2/mes
- ECR Storage: <$1/mes

**Total**: ~$6-13/mes

## Próximos pasos

Una vez desplegado:
1. ✅ El consumer correrá 24/7 en la nube
2. ✅ Ya no necesitas `npm run dev` localmente
3. ✅ Los eventos de RabbitMQ se procesarán automáticamente
4. ✅ Logs disponibles en CloudWatch

Para escalar horizontalmente (más consumers):
```bash
aws ecs update-service \
  --cluster social-graph-app-consumer-cluster \
  --service social-graph-app-consumer-service \
  --desired-count 3 \
  --region us-east-2
```
