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
  aliases             = ["socialgraph.cine-track.com.ar"]
 
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
    acm_certificate_arn      = "arn:aws:acm:us-east-1:857679140175:certificate/865e45ac-9979-4192-ad3d-2ee70d5ed3c5"
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
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
resource "aws_cloudfront_response_headers_policy" "backend_cors" {
  name = "socialgraph-backend-cors-policy"

  cors_config {
    access_control_allow_credentials = true

    access_control_allow_headers {
      # Debe ser explícito si allow_credentials = true; no se permite '*'
      items = [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Origin"
      ]
    }

    access_control_allow_methods {
      items = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    }

    access_control_allow_origins {
      items = [
        "https://socialgraph.cine-track.com.ar",
        "https://${aws_cloudfront_distribution.frontend.domain_name}"
      ]
    }

    access_control_expose_headers {
      items = [
        "Content-Type",
        "Authorization",
        "ETag"
      ]
    }

    origin_override = true
  }

  security_headers_config {
    content_type_options {
      override = true
    }
    frame_options {
      frame_option = "SAMEORIGIN"
      override     = true
    }
    referrer_policy {
      referrer_policy = "no-referrer-when-downgrade"
      override        = true
    }
    xss_protection {
      protection = true
      mode_block = true
      override   = true
    }
  }
}

resource "aws_cloudfront_distribution" "backend" {
  enabled         = true
  is_ipv6_enabled = true
  aliases         = ["socialgraphbe.cine-track.com.ar"]
 
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
    cache_policy_id          = "658327ea-f89d-4fab-a63d-7e88639e58f6" # CachingOptimized - cachea OPTIONS
    origin_request_policy_id = "b689b0a8-53d0-40ab-baf2-68738e2966ac" # AllViewerExceptHostHeader
    response_headers_policy_id = aws_cloudfront_response_headers_policy.backend_cors.id
    compress                 = true
    viewer_protocol_policy   = "redirect-to-https"
  }
 
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
 
  viewer_certificate {
    acm_certificate_arn      = "arn:aws:acm:us-east-1:857679140175:certificate/92dc88af-7caf-4947-a2e7-a7af8a500cb8"
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
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