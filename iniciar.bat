@echo off
cd /d "%%~dp0"
echo ==========================================
echo         LIGANDO A BATALHA DE TANQUES
echo ==========================================
echo.
if not exist ngrok.exe (
    echo ERRO: o arquivo ngrok.exe nao esta nesta pasta.
    echo Copie o ngrok.exe para dentro da pasta do jogo e tente de novo.
    pause
    exit
)
echo Instalando o Flask (so demora na primeira vez)...
python -m pip install -r requirements.txt
echo.
echo Ligando o servidor do jogo...
start "SERVIDOR DO JOGO - nao feche" cmd /k python app.py
timeout /t 3 >nul
echo Ligando o ngrok...
start "NGROK - nao feche" cmd /k ngrok.exe http 5000 --url https://plow-juicy-tactics.ngrok-free.dev
echo.
echo PRONTO! Abra no navegador:
echo https://plow-juicy-tactics.ngrok-free.dev
echo.
echo Para desligar, feche as duas janelas pretas que abriram.
pause
