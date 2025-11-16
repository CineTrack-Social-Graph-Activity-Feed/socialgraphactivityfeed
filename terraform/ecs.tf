# ECS Cluster para el consumer
resource "aws_ecs_cluster" "consumer" {
  name = "${var.app_name}-consumer-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name        = "${var.app_name}-consumer-cluster"
    Environment = "production"
    Service     = "consumer"
  }
}

# CloudWatch Log Group para el consumer
resource "aws_cloudwatch_log_group" "consumer" {
  name              = "/ecs/${var.app_name}-consumer"
  retention_in_days = 7

  tags = {
    Name        = "${var.app_name}-consumer-logs"
    Environment = "production"
    Service     = "consumer"
  }
}

# IAM Role para ECS Task Execution
resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.app_name}-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.app_name}-ecs-execution-role"
    Environment = "production"
  }
}

# Attach policy para ECS Task Execution
resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# IAM Role para la tarea del consumer
resource "aws_iam_role" "consumer_task" {
  name = "${var.app_name}-consumer-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.app_name}-consumer-task-role"
    Environment = "production"
    Service     = "consumer"
  }
}

# Policy para que el consumer pueda escribir logs
resource "aws_iam_role_policy" "consumer_logs" {
  name = "${var.app_name}-consumer-logs-policy"
  role = aws_iam_role.consumer_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.consumer.arn}:*"
      }
    ]
  })
}

# ECS Task Definition
resource "aws_ecs_task_definition" "consumer" {
  family                   = "${var.app_name}-consumer"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.consumer_cpu
  memory                   = var.consumer_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.consumer_task.arn

  container_definitions = jsonencode([
    {
      name      = "consumer"
      image     = "${aws_ecr_repository.consumer.repository_url}:latest"
      essential = true

      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "PORT"
          value = "3001"
        },
        {
          name  = "MONGODB_URI"
          value = var.mongodb_uri
        },
        {
          name  = "RABBIT_URL"
          value = var.rabbit_url
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.consumer.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      portMappings = [
        {
          containerPort = 3001
          protocol      = "tcp"
        }
      ]

      healthCheck = {
        command     = ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name        = "${var.app_name}-consumer-task"
    Environment = "production"
    Service     = "consumer"
  }
}

# Security Group para el consumer
resource "aws_security_group" "consumer" {
  name        = "${var.app_name}-consumer-sg"
  description = "Security group for consumer ECS tasks"
  vpc_id      = data.aws_vpc.default.id

  # Egress: permitir todo el tráfico saliente (para conectar a MongoDB y RabbitMQ)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  # Ingress: health check port (opcional, solo si necesitas acceder al health endpoint)
  ingress {
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Health check endpoint"
  }

  tags = {
    Name        = "${var.app_name}-consumer-sg"
    Environment = "production"
    Service     = "consumer"
  }
}

# Data source para obtener la VPC por defecto
data "aws_vpc" "default" {
  default = true
}

# Data source para obtener las subnets de la VPC por defecto
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# ECS Service
resource "aws_ecs_service" "consumer" {
  name            = "${var.app_name}-consumer-service"
  cluster         = aws_ecs_cluster.consumer.id
  task_definition = aws_ecs_task_definition.consumer.arn
  desired_count   = var.consumer_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.aws_subnets.default.ids
    security_groups  = [aws_security_group.consumer.id]
    assign_public_ip = true
  }

  enable_execute_command = true

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  tags = {
    Name        = "${var.app_name}-consumer-service"
    Environment = "production"
    Service     = "consumer"
  }

  lifecycle {
    ignore_changes = [desired_count]
  }
}

# Outputs
output "consumer_ecs_cluster_name" {
  description = "Nombre del cluster ECS del consumer"
  value       = aws_ecs_cluster.consumer.name
}

output "consumer_ecs_service_name" {
  description = "Nombre del servicio ECS del consumer"
  value       = aws_ecs_service.consumer.name
}

output "consumer_task_definition_family" {
  description = "Familia de la task definition del consumer"
  value       = aws_ecs_task_definition.consumer.family
}
