# ECR Repository para el consumer
resource "aws_ecr_repository" "consumer" {
  name                 = "${var.app_name}-consumer"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name        = "${var.app_name}-consumer-ecr"
    Environment = "production"
    Service     = "consumer"
  }
}

# Lifecycle policy para limpiar imágenes antiguas
resource "aws_ecr_lifecycle_policy" "consumer" {
  repository = aws_ecr_repository.consumer.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v"]
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Remove untagged images after 1 day"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 1
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# Output del repository URL
output "consumer_ecr_repository_url" {
  description = "URL del repositorio ECR del consumer"
  value       = aws_ecr_repository.consumer.repository_url
}

output "consumer_ecr_repository_name" {
  description = "Nombre del repositorio ECR del consumer"
  value       = aws_ecr_repository.consumer.name
}
