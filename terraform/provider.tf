terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
  # Remote backend (S3) configured at init via -backend-config
  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
}

# Caller identity (account id) used to eliminate hardcoded IDs in policies
data "aws_caller_identity" "current" {}