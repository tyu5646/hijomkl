# Smart Dorm Backend Server Launcher
# แก้ปัญหา EADDRINUSE และจัดการ port conflicts

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "        Smart Dorm Backend Server        " -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to kill processes using port 3001
function Stop-ProcessOnPort {
    param([int]$Port)
    
    Write-Host "[1/4] Checking for processes using port $Port..." -ForegroundColor Blue
    
    try {
        $connections = netstat -ano | Select-String ":$Port "
        if ($connections) {
            $pids = @()
            foreach ($connection in $connections) {
                $fields = $connection.ToString().Split(' ', [System.StringSplitOptions]::RemoveEmptyEntries)
                $pid = $fields[-1]
                if ($pid -match '^\d+$') {
                    $pids += [int]$pid
                }
            }
            
            $uniquePids = $pids | Sort-Object -Unique
            foreach ($pid in $uniquePids) {
                try {
                    $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                    if ($process) {
                        Write-Host "  Killing process: $($process.ProcessName) (PID: $pid)" -ForegroundColor Yellow
                        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                    }
                } catch {
                    # Ignore errors
                }
            }
            Write-Host "✓ Cleaned up port $Port" -ForegroundColor Green
        } else {
            Write-Host "✓ Port $Port is available" -ForegroundColor Green
        }
    } catch {
        Write-Host "✓ Port $Port appears to be available" -ForegroundColor Green
    }
}

# Function to stop all Node.js processes
function Stop-AllNodeProcesses {
    Write-Host "[2/4] Stopping all Node.js processes..." -ForegroundColor Blue
    
    try {
        $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
        if ($nodeProcesses) {
            $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
            Write-Host "✓ Stopped $($nodeProcesses.Count) Node.js process(es)" -ForegroundColor Green
        } else {
            Write-Host "✓ No Node.js processes found" -ForegroundColor Green
        }
    } catch {
        Write-Host "✓ No Node.js processes to stop" -ForegroundColor Green
    }
}

# Function to wait for port to be free
function Wait-ForPortFree {
    param([int]$Port, [int]$MaxWaitSeconds = 10)
    
    Write-Host "[3/4] Waiting for port $Port to be free..." -ForegroundColor Blue
    
    for ($i = 0; $i -lt $MaxWaitSeconds; $i++) {
        try {
            $connections = netstat -ano | Select-String ":$Port "
            if (-not $connections) {
                Write-Host "✓ Port $Port is now free" -ForegroundColor Green
                return $true
            }
        } catch {
            Write-Host "✓ Port $Port is now free" -ForegroundColor Green
            return $true
        }
        
        Start-Sleep -Seconds 1
        Write-Host "  Waiting... ($($i + 1)/$MaxWaitSeconds)" -ForegroundColor Gray
    }
    
    Write-Host "⚠ Port $Port may still be in use, but proceeding..." -ForegroundColor Yellow
    return $false
}

# Main execution
try {
    # Stop processes on port 3001
    Stop-ProcessOnPort -Port 3001
    
    # Stop all Node.js processes
    Stop-AllNodeProcesses
    
    # Wait for port to be free
    Wait-ForPortFree -Port 3001 -MaxWaitSeconds 5
    
    # Change to backend directory
    Set-Location "C:\รวมทั้งหมด\TRUE2\Backend"
    
    # Start the server
    Write-Host "[4/4] Starting backend server..." -ForegroundColor Blue
    Write-Host ""
    Write-Host "🚀 Server starting on http://localhost:3001" -ForegroundColor Green
    Write-Host "📁 Static files: http://localhost:3001/uploads" -ForegroundColor Green
    Write-Host "❤️  Health check: http://localhost:3001/health" -ForegroundColor Green
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Start Node.js server
    node index.js
    
} catch {
    Write-Host ""
    Write-Host "❌ Error starting server: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
} finally {
    Write-Host ""
    Write-Host "Server stopped. Press any key to exit..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
