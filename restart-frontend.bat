@echo off
echo 🔄 Restarting Vite Development Server...
echo.

cd "c:\รวมทั้งหมด\TRUE2\Frontend\smart-Frontend"

echo 📁 Current directory: %CD%
echo.

echo 🧹 Clearing Vite cache...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo ✅ Vite cache cleared
) else (
    echo ℹ️  No Vite cache found
)

echo.
echo 🚀 Starting development server...
echo ⚠️  If you see import errors, press Ctrl+C and run:
echo    npm run dev
echo.

timeout /t 3 /nobreak > nul
npm run dev
