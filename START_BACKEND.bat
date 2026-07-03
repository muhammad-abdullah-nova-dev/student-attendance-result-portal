@echo off

cd /d "%~dp0backend"

if not exist ".env" (
    if exist ".env.example" copy ".env.example" ".env"
)

if not exist "node_modules\" (
    npm install
)

npm run migrate

npm start

pause
