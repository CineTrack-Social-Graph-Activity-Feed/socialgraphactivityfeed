# Script to update all hardcoded API URLs in components
$replace_pattern = 'fetch\(`http://localhost:3000/api'
$replace_with = 'fetch(`${API_URL}/api'
$components_folder = ".\Frontend\front-cinetrack\src\compenents"

# Find all files with the pattern
$files = Get-ChildItem -Path $components_folder -Recurse -File -Filter "*.jsx" | 
         Select-String -Pattern $replace_pattern | 
         Select-Object -ExpandProperty Path -Unique

# Display the files that will be modified
Write-Host "Files to be updated:"
$files | ForEach-Object { Write-Host "- $_" }

# Confirm before proceeding
$confirm = Read-Host "Do you want to proceed with updating these files? (y/n)"
if ($confirm -ne "y") {
    Write-Host "Operation cancelled."
    exit
}

# Process each file
foreach ($file in $files) {
    $content = Get-Content -Path $file -Raw
    
    # Check if the component already imports API_URL
    if (-not ($content -match "import.*API_URL.*from")) {
        # Add the import statement
        $content = $content -replace "import \{([^}]*)\} from ""react""", "import {`$1} from ""react""`nimport { API_URL } from ""../../config/api"""
    }
    
    # Replace the hardcoded URLs
    $content = $content -replace $replace_pattern, $replace_with
    
    # Write the updated content back to the file
    Set-Content -Path $file -Value $content
    
    Write-Host "Updated: $file"
}

Write-Host "Done! Updated $($files.Count) files."