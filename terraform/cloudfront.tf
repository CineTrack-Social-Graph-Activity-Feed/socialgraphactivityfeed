# Distribución CloudFront Frontend (S3 estático)
resource "aws_cloudfront_origin_access_control" "frontend_oac" {
  name                              = "socialgraph-frontend-oac"
  description                       = "OAC for private S3 frontend bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
 
  origin {
    domain_name              = aws_s3_bucket.frontend_bucket.bucket_regional_domain_name
    origin_id                = "${aws_s3_bucket.frontend_bucket.bucket_regional_domain_name}-origin"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend_oac.id
  }
 
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
  target_origin_id       = "${aws_s3_bucket.frontend_bucket.bucket_regional_domain_name}-origin"
    cache_policy_id        = "658327ea-f89d-4fab-a63d-7e88639e58f6"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }
 
  ordered_cache_behavior {
    path_pattern               = "/api/*"
    allowed_methods            = ["GET", "HEAD"]
    cached_methods             = ["GET", "HEAD"]
  target_origin_id           = "${aws_s3_bucket.frontend_bucket.bucket_regional_domain_name}-origin"
    cache_policy_id            = "658327ea-f89d-4fab-a63d-7e88639e58f6"
    response_headers_policy_id = "5cc3b908-e619-4b99-88e5-2cf7f45965bd"
    compress                   = true
    viewer_protocol_policy     = "redirect-to-https"
  }
 
  # Error Handling: Routear 403/404 a index.html
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }
 
  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }
 
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
 
  viewer_certificate {
    cloudfront_default_certificate = true
  }
 
  tags = {
    Name        = "distribution-socialgraph"
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
 
  lifecycle {
    ignore_changes = [tags, tags_all]
  }
}
 
# Distribución CloudFront Backend (Disponibilizar backend en https)
resource "aws_cloudfront_distribution" "backend" {
  enabled         = true
  is_ipv6_enabled = true
 
  origin {
    domain_name = aws_elastic_beanstalk_environment.app_env.cname
    origin_id   = "${aws_elastic_beanstalk_environment.app_env.cname}-origin"
 
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2", "TLSv1.1", "TLSv1", "SSLv3"]
    }
  }
 
  default_cache_behavior {
    allowed_methods          = ["HEAD", "DELETE", "POST", "GET", "OPTIONS", "PUT", "PATCH"]
    cached_methods           = ["GET", "HEAD", "OPTIONS"]
    target_origin_id         = "${aws_elastic_beanstalk_environment.app_env.cname}-origin"
    cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # CachingDisabled
    origin_request_policy_id = "b689b0a8-53d0-40ab-baf2-68738e2966ac" # AllViewerExceptHostHeader
    response_headers_policy_id = "5cc3b908-e619-4b99-88e5-2cf7f45965bd" # CORS-With-Preflight
    compress                 = true
    viewer_protocol_policy   = "redirect-to-https"
  }
 
  ordered_cache_behavior {
    path_pattern               = "*"
    allowed_methods            = ["HEAD", "DELETE", "POST", "GET", "OPTIONS", "PUT", "PATCH"]
    cached_methods             = ["GET", "HEAD"]
    target_origin_id           = "${aws_elastic_beanstalk_environment.app_env.cname}-origin"
    cache_policy_id            = "83da9c7e-98b4-4e11-a168-04f0df8e2c65"
    origin_request_policy_id   = "216adef6-5c7f-47e4-b989-5492eafa07d3"
    response_headers_policy_id = "7cab3b5b-0e08-470c-bcc3-e081e8fc7857"
    compress                   = true
    viewer_protocol_policy     = "redirect-to-https"
  }
 
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
 
  viewer_certificate {
    cloudfront_default_certificate = true
  }
 
  tags = {
    Name        = "socialgraph-backend"
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
 
  lifecycle {
    ignore_changes = [tags, tags_all, default_cache_behavior[0].allowed_methods]
  }

  depends_on = [aws_elastic_beanstalk_environment.app_env]
}