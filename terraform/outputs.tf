output "frontend_s3_bucket_name" {
  description = "Name of the S3 bucket for frontend assets"
  value       = aws_s3_bucket.frontend_bucket.bucket
}
 
output "eb_s3_bucket_name" {
  description = "Name of the S3 bucket for Elastic Beanstalk versions"
  value       = aws_s3_bucket.eb_bucket.bucket
}
 
output "cloudfront_frontend_id" {
  description = "CloudFront Distribution ID for frontend"
  value       = aws_cloudfront_distribution.frontend.id
}
 
output "cloudfront_frontend_url" {
  description = "CloudFront Distribution domain for frontend"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}
 
output "cloudfront_backend_id" {
  description = "CloudFront Distribution ID for backend"
  value       = aws_cloudfront_distribution.backend.id
}
 
output "cloudfront_backend_url" {
  description = "CloudFront Distribution domain for backend"
  value       = "https://${aws_cloudfront_distribution.backend.domain_name}"
}
 
output "elastic_beanstalk_app_name" {
  description = "Elastic Beanstalk application name"
  value       = aws_elastic_beanstalk_application.app.name
}
 
output "elastic_beanstalk_env_name" {
  description = "Elastic Beanstalk environment name"
  value       = aws_elastic_beanstalk_environment.app_env.name
}
 
output "elastic_beanstalk_url" {
  description = "Elastic Beanstalk environment URL"
  value       = "http://${aws_elastic_beanstalk_environment.app_env.cname}"
}