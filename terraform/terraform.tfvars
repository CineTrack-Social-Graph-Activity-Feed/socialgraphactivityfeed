# Intentionally empty: provide this via environment variable or CI secret
# Example (PowerShell):
#   $env:TF_VAR_mongodb_uri = "<your-mongodb-uri>"
# In GitHub Actions, set repository secret MONGODB_URI and export TF_VAR_mongodb_uri.
# mongodb_uri = ""