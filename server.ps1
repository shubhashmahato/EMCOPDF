# EMCOPDF Lightweight Offline Server
# Runs natively on any Windows computer without Node.js, Python, or IIS.

$port = 8000
$dir = Join-Path $PSScriptRoot "dist"
if (-not (Test-Path $dir)) { 
    $dir = $PSScriptRoot 
}

# Ensure the Httplistener is supported
if (-not [System.Net.HttpListener]::IsSupported) {
    Write-Error "HttpListener is not supported on this system."
    Exit
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "             EMCOPDF OFFLINE LOCAL SERVER                 " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Running at: http://localhost:$port/" -ForegroundColor Yellow
Write-Host "Serving files from: $dir" -ForegroundColor Gray
Write-Host "Press Ctrl+C in this window to stop the server." -ForegroundColor DarkGray
Write-Host "----------------------------------------------------------"

try {
    $listener.Start()
    
    # Open default web browser automatically
    Start-Process "http://localhost:$port/"
    
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $urlPath = $request.Url.LocalPath
        # Route root to index.html
        if ($urlPath -eq "/") { 
            $urlPath = "/index.html" 
        }
        
        # Native URL Decode path (handles spaces in file paths correctly)
        $decodedPath = [System.Uri]::UnescapeDataString($urlPath)
        $trimmedPath = $decodedPath.TrimStart("/").TrimStart("\")
        
        $filePath = Join-Path $dir $trimmedPath
        
        # Serve index.html as fallback for SPA routing (only if path is extensionless or .html)
        if (-not (Test-Path $filePath -PathType Leaf)) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            if ($ext -eq "" -or $ext -eq ".html") {
                $filePath = Join-Path $dir "index.html"
            }
        }
        
        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            
            # Determine correct content type
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".png"  { "image/png" }
                ".jpg"  { "image/jpeg" }
                ".jpeg" { "image/jpeg" }
                ".svg"  { "image/svg+xml" }
                ".pdf"  { "application/pdf" }
                ".json" { "application/json" }
                ".ico"  { "image/x-icon" }
                default { "application/octet-stream" }
            }
            
            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate")
            $response.Headers.Add("Access-Control-Allow-Origin", "*")
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
        }
        $response.Close()
    }
}
catch {
    Write-Host "Error occurred: $_" -ForegroundColor Red
}
finally {
    $listener.Close()
}
