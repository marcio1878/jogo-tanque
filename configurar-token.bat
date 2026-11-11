@echo off
cd /d "%%~dp0"
echo ==========================================
echo   CONFIGURAR O TOKEN DO NGROK (so 1 vez)
echo ==========================================
echo.
if not exist ngrok.exe (
    echo ERRO: o arquivo ngrok.exe nao esta nesta pasta.
    echo Copie o ngrok.exe para dentro da pasta do jogo e tente de novo.
    pause
    exit
)
echo Copie o token no site do ngrok, clique com o BOTAO DIREITO aqui para colar
echo e aperte ENTER.
echo.
set /p TOKEN=Token: 
ngrok.exe config add-authtoken %%TOKEN%%
echo.
pause
