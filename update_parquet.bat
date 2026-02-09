@echo off
setlocal
cd /d "%~dp0"
npm run update:data
echo.
echo Finalizado. Pressione qualquer tecla para sair.
pause >nul
