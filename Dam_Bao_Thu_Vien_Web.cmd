@echo off
setlocal
cd /d "%~dp0"
if exist "%~dp0node_modules\vinext\dist\cli.js" exit /b 0
echo Thu vien web dang thieu. Dang tu khoi phuc...
call npm install
if errorlevel 1 (
  echo KHONG THE KHOI PHUC THU VIEN WEB.
  exit /b 1
)
if not exist "%~dp0node_modules\vinext\dist\cli.js" (
  echo Da cai thu vien nhung van thieu vinext.
  exit /b 1
)
echo DA KHOI PHUC THU VIEN WEB.
exit /b 0
