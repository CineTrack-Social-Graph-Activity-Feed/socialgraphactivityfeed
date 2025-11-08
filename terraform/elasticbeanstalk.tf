resource "aws_elastic_beanstalk_application" "app" {
  name        = local.app_name_final
  description = "Social Graph Activity Feed Full-Stack App"
 
  lifecycle {
    ignore_changes = [description]
  }
}
 
resource "aws_elastic_beanstalk_environment" "app_env" {
  name                = local.env_name_final
  application         = aws_elastic_beanstalk_application.app.name
  solution_stack_name = "64bit Amazon Linux 2023 v6.6.4 running Node.js 22"
  wait_for_ready_timeout = "20m"
 
  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "IamInstanceProfile"
    value     = "aws-elasticbeanstalk-ec2-role"
  }
 
  setting {
    namespace = "aws:elasticbeanstalk:environment"
    name      = "ServiceRole"
    value     = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/aws-elasticbeanstalk-service-role"
  }
 
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "NODE_ENV"
    value     = "production"
  }
 
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "PORT"
    value     = "8080"
  }
 
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "AWS_REGION"
    value     = var.aws_region
  }
 
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "MONGODB_URI"
    value     = var.mongodb_uri
  }
 
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "CORS_ORIGINS"
    value     = "https://${aws_cloudfront_distribution.frontend.domain_name}"
  }
 
  setting {
    namespace = "aws:elasticbeanstalk:healthreporting:system"
    name      = "SystemType"
    value     = "enhanced"
  }
 
  setting {
    namespace = "aws:elasticbeanstalk:application"
    name      = "Application Healthcheck URL"
    value     = "/health"
  }
 
  setting {
    namespace = "aws:elasticbeanstalk:cloudwatch:logs"
    name      = "StreamLogs"
    value     = "true"
  }
 
  tags = {
    Name        = "${local.app_name_final}-env"
    Environment = "production"
  }
 
  lifecycle {
    ignore_changes = [tags, tags_all, setting, wait_for_ready_timeout]
  }
}