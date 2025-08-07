@echo off
echo ========================================
echo        Smart Dorm Backend Server        
echo ========================================

:: หยุด Node.js processes ทั้งหมด
echo [1/3] Stopping existing Node.js processes...
taskkill /f /im node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Stopped existing processes
) else (
    echo ✓ No running processes found
)

:: รอสักครู่
timeout /t 2 /nobreak >nul

:: ตรวจสอบ port 3001
echo [2/3] Checking port 3001...
netstat -ano | findstr :3001 >nul
if %errorlevel% equ 0 (
    echo ✗ Port 3001 is still in use
    echo Trying to free port...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do taskkill /f /pid %%a >nul 2>&1
    timeout /t 1 /nobreak >nul
) else (
    echo ✓ Port 3001 is available
)

:: ไปยัง directory ที่ถูกต้อง
cd /d "c:\รวมทั้งหมด\TRUE2\Backend"

:: เริ่ม server
echo [3/3] Starting backend server...
echo Server starting on http://localhost:3001
echo Press Ctrl+C to stop the server
echo ========================================
node index.js
pause
