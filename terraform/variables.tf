variable "aws_region" {
  description = "AWS region for resources"
  default     = "us-east-2"
  type        = string
}
 
variable "app_name" {
  description = "Application name"
  default     = "social-graph-app"
  type        = string
}
 
variable "env_name" {
  description = "Elastic Beanstalk environment name"
  default     = "Social-graph-app-env"
  type        = string
}
 
variable "frontend_s3_bucket_name" {
  description = "S3 bucket name for frontend assets"
  default     = "cloudfront-files-socialgraph"
  type        = string
}
 
variable "eb_s3_bucket_name" {
  description = "S3 bucket name for Elastic Beanstalk versions"
  default     = "elasticbeanstalk-us-east-2-857679140175"
  type        = string
}
 
variable "mongodb_uri" {
  description = "MongoDB connection URI"
  type        = string
  sensitive   = true
}

variable "rabbit_url" {
  description = "RabbitMQ connection URL"
  type        = string
  sensitive   = true
}

variable "enable_random_suffix" {
  description = "If true, append a random suffix to core resource names so brand-new infrastructure can be created without clashes."
  type        = bool
  default     = true
}

# NOTE: Terraform appends a random suffix when enable_random_suffix=true. Override the base
# names above (or set enable_random_suffix=false) if you need predictable names for an existing
# stack or a migration scenario.

