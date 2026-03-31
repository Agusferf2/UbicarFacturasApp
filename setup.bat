@echo off
title UbicarFacturas - Instalador
color 0A
cls

echo.
echo  ================================================
echo      Instalador de UbicarFacturas v1.0
echo  ================================================
echo.

REM ── 1. Verificar Node.js ─────────────────────────
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js no esta instalado.
    echo.
    echo  Por favor instala Node.js desde:
    echo  https://nodejs.org  ^(descarga la version LTS^)
    echo.
    echo  Una vez instalado, vuelve a ejecutar este script.
    pause
    exit /b 1
)
echo  [OK] Node.js encontrado
echo.

REM ── 2. Instalar dependencias de la app ───────────
echo  Instalando dependencias de la app...
cd /d "%~dp0"
call npm install --silent
if %errorlevel% neq 0 (
    echo  [ERROR] Fallo la instalacion de dependencias.
    pause
    exit /b 1
)
echo  [OK] Dependencias instaladas
echo.

REM ── 3. Instalar y preparar Evolution API ─────────
echo  Preparando Evolution API...
cd /d "%~dp0evolution"
call npm install --silent --omit=dev
call npx prisma generate --schema=prisma/postgresql-schema.prisma >nul 2>&1
call npx prisma migrate deploy --schema=prisma/postgresql-schema.prisma
if %errorlevel% neq 0 (
    echo  [ERROR] Fallo la configuracion de la base de datos.
    pause
    exit /b 1
)
echo  [OK] Evolution API lista
echo.

REM ── 4. Iniciar Evolution API ──────────────────────
echo  Iniciando Evolution API...
cd /d "%~dp0"
start "Evolution API" /min node evolution/dist/main.js
timeout /t 6 /nobreak >nul
echo  [OK] Evolution API iniciada
echo.

REM ── 5. Conectar WhatsApp ──────────────────────────
echo  ------------------------------------------------
echo   PASO 1: Conectar WhatsApp
echo  ------------------------------------------------
echo.
echo  Se va a abrir una imagen con el codigo QR.
echo  Escanealo con tu WhatsApp:
echo    Ajustes ^> Dispositivos vinculados ^> Vincular dispositivo
echo.
node setup-qr.js
if %errorlevel% neq 0 (
    echo  [ERROR] No se pudo generar el QR.
    pause
    exit /b 1
)
echo.
echo  Presiona Enter cuando hayas escaneado el QR y WhatsApp este conectado...
pause >nul
echo.

REM ── 6. Configurar Google Drive ────────────────────
echo  ------------------------------------------------
echo   PASO 2: Autorizar Google Drive
echo  ------------------------------------------------
echo.
echo  Se va a abrir el navegador para que autorices
echo  el acceso a tu Google Drive.
echo.
node setup-google.js
if %errorlevel% neq 0 (
    echo  [ERROR] Fallo la configuracion de Google Drive.
    pause
    exit /b 1
)
echo.

REM ── 7. Configurar PM2 (inicio automatico) ─────────
echo  Configurando inicio automatico...
call npm install -g pm2 pm2-windows-startup --silent
call pm2 start ecosystem.config.js
call pm2 save
call pm2-startup install
echo  [OK] La app va a iniciar automaticamente con Windows
echo.

REM ── Fin ───────────────────────────────────────────
cls
echo.
echo  ================================================
echo      Instalacion completada exitosamente!
echo  ================================================
echo.
echo  La app esta corriendo. Cada vez que enciendas
echo  la PC, se va a iniciar automaticamente.
echo.
echo  Podes cerrar esta ventana.
echo.
pause
