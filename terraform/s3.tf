# Bucket S3 Frontend (Público para CloudFront)
resource "aws_s3_bucket" "frontend_bucket" {
  bucket = local.frontend_bucket_final
  force_destroy = true
 
  tags = {
    Name        = "Frontend assets"
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
 
  lifecycle {
    ignore_changes = [tags, tags_all, force_destroy]
  }
}
 
resource "aws_s3_bucket_public_access_block" "frontend_bucket_public_access" {
  bucket = aws_s3_bucket.frontend_bucket.id
 
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}# Política para CloudFront OAC
resource "aws_s3_bucket_policy" "frontend_bucket_policy" {
  bucket = aws_s3_bucket.frontend_bucket.id
 
  depends_on = [
    aws_s3_bucket_public_access_block.frontend_bucket_public_access,
    aws_cloudfront_distribution.frontend
  ]
 
  policy = jsonencode({
    Version = "2012-10-17"
    Id      = "PolicyForCloudFrontPrivateContent"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipalReadObjects"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.frontend_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/${aws_cloudfront_distribution.frontend.id}"
          }
        }
      },
      {
        Sid    = "AllowCloudFrontServicePrincipalListBucket"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.frontend_bucket.arn
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/${aws_cloudfront_distribution.frontend.id}"
          }
        }
      }
    ]
  })
}
 
# Bucket S3 para Elastic Beanstalk (Privado)
resource "aws_s3_bucket" "eb_bucket" {
  bucket = local.eb_bucket_final
  force_destroy = true
 
  tags = {
    Name      = "Elastic Beanstalk Versions"
    ManagedBy = "Terraform"
  }
 
  lifecycle {
    ignore_changes = [tags, tags_all, force_destroy]
  }
}
 
resource "aws_s3_bucket_public_access_block" "eb_bucket_public_access" {
  bucket = aws_s3_bucket.eb_bucket.id
 
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}
 
resource "aws_s3_bucket_policy" "eb_bucket_policy" {
  bucket = aws_s3_bucket.eb_bucket.id
 
  policy = jsonencode({
    Version = "2008-10-17"
    Statement = [
      {
        Sid    = "eb-ad78f54a-f239-4c90-adda-49e5f56cb51e"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/aws-elasticbeanstalk-ec2-role"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.eb_bucket.arn}/resources/environments/logs/*"
      },
      {
        Sid    = "eb-af163bf3-d27b-4712-b795-d1e33e331ca4"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/aws-elasticbeanstalk-ec2-role"
        }
        Action = [
          "s3:ListBucket",
          "s3:ListBucketVersions",
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = [
          aws_s3_bucket.eb_bucket.arn,
          "${aws_s3_bucket.eb_bucket.arn}/resources/environments/*"
        ]
      },
      {
        Sid    = "eb-58950a8c-feb6-11e2-89e0-0800277d041b"
        Effect = "Deny"
        Principal = {
          AWS = "*"
        }
        Action   = "s3:DeleteBucket"
        Resource = aws_s3_bucket.eb_bucket.arn
      }
    ]
  })
}