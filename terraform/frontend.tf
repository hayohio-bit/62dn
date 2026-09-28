# ==============================
# S3 Bucket (프론트엔드 정적 호스팅)
# ==============================
resource "aws_s3_bucket" "frontend" {
  bucket        = "dn-platform-frontend-62dn"
  force_destroy = true
  tags          = { Name = "dn-platform-frontend" }
}

resource "aws_s3_bucket_ownership_controls" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket                  = aws_s3_bucket.frontend.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ==============================
# CloudFront OAC
# ==============================
resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "dn-platform-frontend-oac"
  description                       = "OAC for DN Platform Frontend"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ==============================
# CloudFront Distribution
# ==============================
resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
    origin_id                = "S3-frontend"
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = "S3-frontend"
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  # SPA 라우팅 지원 (React/Vite)
  custom_error_response {
    error_code            = 403
    response_code         = 200
    error_caching_min_ttl = 10
    response_page_path    = "/index.html"
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    error_caching_min_ttl = 10
    response_page_path    = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = { Name = "dn-platform-cloudfront" }
}

# ==============================
# S3 Bucket Policy (CloudFront OAC 전용)
# ==============================
resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontOAC"
        Effect    = "Allow"
        Principal = { Service = "cloudfront.amazonaws.com" }
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.frontend.arn
          }
        }
      }
    ]
  })
}

# ==============================
# Outputs
# ==============================
output "cloudfront_domain" {
  value       = aws_cloudfront_distribution.frontend.domain_name
  description = "CloudFront domain for frontend access"
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.frontend.bucket
  description = "S3 bucket for frontend files"
}
