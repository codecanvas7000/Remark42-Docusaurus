@echo off
REM Remark42 Setup Script for Windows
REM This script helps you start the Remark42 comment system

echo 🚀 Starting Remark42 Comment System Setup
echo ========================================

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker first.
    pause
    exit /b 1
)

REM Check if ngrok is installed
where ngrok >nul 2>&1
if errorlevel 1 (
    echo ❌ ngrok is not installed.
    echo 📦 Please install ngrok from: https://ngrok.com/download
    pause
    exit /b 1
)

echo ✅ Docker and ngrok are available

REM Start ngrok in the background - Fixed version without input redirection
echo 🔗 Starting ngrok tunnel...
start "ngrok tunnel" /min cmd /c "ngrok http 8081"

REM Wait for ngrok to start
echo ⏳ Waiting for ngrok to initialize...
timeout /t 8 /nobreak >nul

REM Get the ngrok URL using PowerShell with better error handling
echo 🔍 Getting ngrok tunnel URL...
for /f "tokens=*" %%i in ('powershell -command "try { $tunnels = (Invoke-RestMethod -Uri http://localhost:4040/api/tunnels -ErrorAction Stop).tunnels; $httpsUrl = ($tunnels | Where-Object {$_.proto -eq 'https'} | Select-Object -First 1).public_url; if ($httpsUrl) { Write-Output $httpsUrl } else { Write-Output 'ERROR' } } catch { Write-Output 'ERROR' }"') do set NGROK_URL=%%i

if "%NGROK_URL%"=="ERROR" (
    echo ❌ Failed to get ngrok URL
    echo 💡 Troubleshooting steps:
    echo    1. Make sure ngrok is properly configured with your authtoken
    echo    2. Visit: https://dashboard.ngrok.com/get-started/your-authtoken
    echo    3. Run: ngrok config add-authtoken YOUR_TOKEN
    echo    4. Check if ngrok is running: http://localhost:4040
    pause
    exit /b 1
)

if "%NGROK_URL%"=="" (
    echo ❌ No ngrok URL received
    echo 💡 Please check if ngrok started correctly
    pause
    exit /b 1
)

echo ✅ ngrok tunnel created: %NGROK_URL%

REM Check if Node.js is available
where node >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo 📦 Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

REM Update configuration
echo ⚙️ Updating configuration files...
if exist "update-ngrok.js" (
    node update-ngrok.js "%NGROK_URL%"
    if errorlevel 1 (
        echo ❌ Failed to update configuration
        pause
        exit /b 1
    )
    echo ✅ Configuration updated successfully
) else (
    echo ❌ update-ngrok.js not found in current directory
    echo 💡 Make sure you're running this script from the project root directory
    echo 📁 Current directory: %CD%
    pause
    exit /b 1
)

REM Wait for Docker to be ready
echo ⏳ Waiting for Remark42 server to be ready...
timeout /t 15 /nobreak >nul

REM Test if Remark42 is responding using PowerShell with better error handling
echo 🧪 Testing Remark42 server...
powershell -command "try { $response = Invoke-RestMethod -Uri '%NGROK_URL%/api/v1/ping' -TimeoutSec 10 -ErrorAction Stop; Write-Host '✅ Remark42 server is ready!' } catch { Write-Host '⚠️ Remark42 server is still starting up (this may take a moment)' }"

echo.
echo 🎉 Setup Complete!
echo ==================
echo 📝 Remark42 URL: %NGROK_URL%
echo 🌐 Blog URL: http://localhost:3000
echo 🔗 ngrok Dashboard: http://localhost:4040
echo.
echo Next steps:
echo 1. Start your Docusaurus dev server: npm start
echo 2. Visit http://localhost:3000 and navigate to any blog post
echo 3. You should see the Remark42 comment widget
echo.
echo 💡 Keep this window open - ngrok is running in the background
echo 🛑 Press Ctrl+C to stop ngrok when you're done
echo.

REM Keep the script running so ngrok stays active
:wait_loop
echo ⏸️ Press 'q' + Enter to stop ngrok and exit, or just press Enter to continue...
set /p user_input=
if /i "%user_input%"=="q" goto cleanup
goto wait_loop

:cleanup
REM Kill ngrok processes
echo 🛑 Stopping ngrok...
taskkill /f /im ngrok.exe >nul 2>&1
echo ✅ ngrok stopped.
echo 👋 Goodbye!