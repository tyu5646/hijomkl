# VS Code Performance Optimizer Script
# สคริปต์สำหรับเพิ่มประสิทธิภาพ VS Code

Write-Host "🚀 VS Code Performance Optimizer" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# 1. ปิด VS Code ทั้งหมด
Write-Host "1. ปิด VS Code processes..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*Code*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# 2. ทำความสะอาด Cache
Write-Host "2. ทำความสะอาด Cache..." -ForegroundColor Yellow

# Cache paths
$userDataPath = $env:APPDATA + "\Code\User"
$cachePaths = @(
    $userDataPath + "\workspaceStorage",
    $userDataPath + "\logs",
    $userDataPath + "\CachedExtensions",
    $env:APPDATA + "\Code\CachedExtensions",
    $env:TEMP + "\vscode*"
)

foreach ($path in $cachePaths) {
    if (Test-Path $path) {
        Write-Host "   - ทำความสะอาด: $path" -ForegroundColor Gray
        if ($path -like "*workspaceStorage") {
            # ลบ workspace cache เก่า (อายุ > 7 วัน)
            Get-ChildItem $path -Directory -ErrorAction SilentlyContinue | 
                Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-7)} | 
                Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        } elseif ($path -like "*logs") {
            # ลบ log files เก่า
            Get-ChildItem $path -File -ErrorAction SilentlyContinue | 
                Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-3)} | 
                Remove-Item -Force -ErrorAction SilentlyContinue
        } else {
            # ลบทั้งหมด
            Remove-Item $path -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

# 3. ปรับปรุง settings สำหรับ performance
Write-Host "3. ปรับปรุง VS Code settings..." -ForegroundColor Yellow

$settingsPath = $userDataPath + "\settings.json"
$performanceSettings = @{
    "files.watcherExclude" = @{
        "**/node_modules/**" = $true
        "**/.git/objects/**" = $true
        "**/.git/subtree-cache/**" = $true
        "**/dist/**" = $true
        "**/build/**" = $true
        "**/.vscode/**" = $true
        "**/uploads/**" = $true
    }
    "search.exclude" = @{
        "**/node_modules" = $true
        "**/bower_components" = $true
        "**/*.code-search" = $true
        "**/dist" = $true
        "**/build" = $true
        "**/uploads" = $true
    }
    "files.exclude" = @{
        "**/node_modules" = $true
        "**/.git" = $true
        "**/.DS_Store" = $true
        "**/Thumbs.db" = $true
        "**/uploads" = $true
    }
    "typescript.preferences.includePackageJsonAutoImports" = "off"
    "typescript.suggest.autoImports" = $false
    "javascript.suggest.autoImports" = $false
    "editor.suggest.snippetsPreventQuickSuggestions" = $false
    "editor.acceptSuggestionOnCommitCharacter" = $false
    "editor.suggestOnTriggerCharacters" = $false
    "explorer.confirmDelete" = $false
    "explorer.confirmDragAndDrop" = $false
    "workbench.startupEditor" = "none"
    "git.autofetch" = $false
    "git.autoRepositoryDetection" = $false
    "extensions.autoUpdate" = $false
    "update.mode" = "manual"
    "telemetry.telemetryLevel" = "off"
    "workbench.settings.enableNaturalLanguageSearch" = $false
}

try {
    $currentSettings = @{}
    if (Test-Path $settingsPath) {
        $currentSettings = Get-Content $settingsPath -Raw | ConvertFrom-Json -AsHashtable -ErrorAction SilentlyContinue
        if (-not $currentSettings) { $currentSettings = @{} }
    }
    
    # Merge settings
    foreach ($key in $performanceSettings.Keys) {
        $currentSettings[$key] = $performanceSettings[$key]
    }
    
    $currentSettings | ConvertTo-Json -Depth 10 | Set-Content $settingsPath -Encoding UTF8
    Write-Host "   ✅ อัปเดต settings.json เรียบร้อย" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  ไม่สามารถอัปเดต settings.json ได้: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. รายงานผล
Write-Host "4. รายงานผลการทำความสะอาด..." -ForegroundColor Yellow

$extensions = code --list-extensions 2>$null
$extensionCount = if ($extensions) { $extensions.Count } else { 0 }

Write-Host "================================" -ForegroundColor Cyan
Write-Host "📊 สรุปผลการทำความสะอาด:" -ForegroundColor Green
Write-Host "   • Extensions ทั้งหมด: $extensionCount" -ForegroundColor White
Write-Host "   • Cache files ถูกลบแล้ว" -ForegroundColor White  
Write-Host "   • Performance settings อัปเดตแล้ว" -ForegroundColor White
Write-Host "================================" -ForegroundColor Cyan

# 5. คำแนะนำ
Write-Host "💡 คำแนะนำเพิ่มเติม:" -ForegroundColor Cyan
Write-Host "   1. ปิด extensions ที่ไม่จำเป็น" -ForegroundColor Yellow
Write-Host "   2. ใช้ workspace settings แทน global settings" -ForegroundColor Yellow
Write-Host "   3. ปิด auto-save หากไม่จำเป็น" -ForegroundColor Yellow
Write-Host "   4. เปิดเฉพาะไฟล์ที่ต้องใช้งาน" -ForegroundColor Yellow
Write-Host "   5. ใช้ .gitignore และ .vscodeignore ให้เหมาะสม" -ForegroundColor Yellow

Write-Host ""
Write-Host "🎉 เสร็จสิ้น! กรุณาเปิด VS Code ใหม่" -ForegroundColor Green
