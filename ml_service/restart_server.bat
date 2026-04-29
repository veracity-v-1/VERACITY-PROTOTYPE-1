@echo off
echo Killing existing Python processes...
taskkill /F /IM python.exe /T 2>nul
taskkill /F /IM uvicorn.exe /T 2>nul
timeout /t 2 /nobreak >nul

echo Checking ports...
netstat -ano | findstr :8080
netstat -ano | findstr :8000

echo Starting server...
uvicorn main:app --port 8080