# Script para importar recursos existentes de AWS a Terraform
Write-Host "=== IMPORTANDO RECURSOS EXISTENTES A TERRAFORM ===" -ForegroundColor Cyan
 
Write-Host "`n[1/10] Importando S3 bucket frontend..." -ForegroundColor Yellow
terraform import aws_s3_bucket.frontend_bucket cloudfront-files-socialgraph
 
Write-Host "`n[2/10] Importando S3 bucket EB..." -ForegroundColor Yellow
terraform import aws_s3_bucket.eb_bucket elasticbeanstalk-us-east-2-857679140175
 
Write-Host "`n[3/10] Importando public access block frontend..." -ForegroundColor Yellow
terraform import aws_s3_bucket_public_access_block.frontend_bucket_public_access cloudfront-files-socialgraph
 
Write-Host "`n[4/10] Importando public access block EB..." -ForegroundColor Yellow
terraform import aws_s3_bucket_public_access_block.eb_bucket_public_access elasticbeanstalk-us-east-2-857679140175
 
Write-Host "`n[5/10] Importando S3 policy frontend..." -ForegroundColor Yellow
terraform import aws_s3_bucket_policy.frontend_bucket_policy cloudfront-files-socialgraph
 
Write-Host "`n[6/10] Importando S3 policy EB..." -ForegroundColor Yellow
terraform import aws_s3_bucket_policy.eb_bucket_policy elasticbeanstalk-us-east-2-857679140175
 
Write-Host "`n[7/10] Importando CloudFront distribution frontend..." -ForegroundColor Yellow
terraform import aws_cloudfront_distribution.frontend E1JFIB24BE49F3
 
Write-Host "`n[8/10] Importando CloudFront distribution backend..." -ForegroundColor Yellow
terraform import aws_cloudfront_distribution.backend E30C8M1GXX60HD
 
Write-Host "`n[9/10] Importando Elastic Beanstalk application..." -ForegroundColor Yellow
terraform import aws_elastic_beanstalk_application.app social-graph-app
 
Write-Host "`n[10/10] Importando Elastic Beanstalk environment..." -ForegroundColor Yellow
terraform import aws_elastic_beanstalk_environment.app_env e-vi6s34pmpr
 
Write-Host "`n=== IMPORTACION COMPLETADA ===" -ForegroundColor Green
Write-Host "Ejecuta terraform plan para verificar" -ForegroundColor Cyan