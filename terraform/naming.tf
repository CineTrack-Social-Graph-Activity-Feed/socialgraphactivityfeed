resource "random_string" "suffix" {
	count  = var.enable_random_suffix ? 1 : 0
	length = 6
	upper  = false

	special = false

	# Changing the base name should force a new suffix to avoid collisions
	keepers = {
		app_name    = var.app_name
		env_name    = var.env_name
		frontend_id = var.frontend_s3_bucket_name
		eb_id       = var.eb_s3_bucket_name
	}
}

locals {
	random_suffix = var.enable_random_suffix ? random_string.suffix[0].result : ""

	app_name_final = local.random_suffix != "" ? "${var.app_name}-${local.random_suffix}" : var.app_name
	env_name_final = local.random_suffix != "" ? "${var.env_name}-${local.random_suffix}" : var.env_name

	frontend_bucket_final = local.random_suffix != "" ? "${var.frontend_s3_bucket_name}-${local.random_suffix}" : var.frontend_s3_bucket_name
	eb_bucket_final       = local.random_suffix != "" ? "${var.eb_s3_bucket_name}-${local.random_suffix}" : var.eb_s3_bucket_name
}