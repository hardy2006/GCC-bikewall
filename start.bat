@echo off
echo ========================================
echo   ???????? - Bike Repair System
echo ========================================
echo.

echo [1/4] Installing server dependencies...
cd /d "%~dp0server"
call npm install --silent 2>nul

echo [2/4] Installing client dependencies...
cd /d "%~dp0client"
call npm install --silent 2>nul

echo [3/4] Initializing database with demo data...
cd /d "%~dp0server"
call npx tsx src/seed.ts 2>nul

echo [4/4] Starting servers...
echo.
echo Starting backend server (port 3001)...
start "BikeRepair-API" cmd /c "cd /d %~dp0server && npx tsx src/index.ts"
echo Starting frontend server (port 5173)...
start "BikeRepair-Web" cmd /c "cd /d %~dp0client && npx vite --host"

echo.
echo ========================================
echo   Backend:  http://localhost:3001
echo   Frontend: http://localhost:5173
echo ========================================
echo.
echo Demo accounts (password: 123456):
echo   Customer:   customer1
echo   Technician: tech1
echo   Operator:   operator1
echo.
pause
