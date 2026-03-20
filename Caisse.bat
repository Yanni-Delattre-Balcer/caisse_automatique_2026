@echo off
TITLE Caisse  
echo ==========================================
echo           CAISSE  
echo ==========================================
echo.

:: Se deplacer dans le dossier du script
cd /d "%~dp0"
if %errorlevel% neq 0 goto ERROR_PATH

echo [1/3] Verification de Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 goto ERROR_NODE
echo [OK] Node.js est present.
echo.

echo [2/3] Verification des fichiers...
:: Test si Vite est utilisable
call npx vite --version >nul 2>&1
if %errorlevel% neq 0 goto REPAIR

:START_SERVER
echo [OK] Fichiers prets.
echo.
echo [3/3] Demarrage du serveur (Force sur Port 5174)...
echo.
echo [NOTE] Si une erreur "Port 5174 is already in use" apparait,
echo        fermez les autres fenetres noires et relancez.
echo.

:: Demarrage separe
start /b cmd /c "npm run dev"

echo [INFO] Attente du demarrage (10 secondes)...
echo [INFO] Le premier lancement peut être plus long le temps de preparer les fichiers.
timeout /t 10 /nobreak >nul

echo.
echo ======================================================
echo    L'APPLICATION S'OUVRE DANS LE NAVIGATEUR...
echo.
echo    SI UNE ALERTE DE SECURITE APPARAIT :
echo    1. Cliquez sur "Parametres avances"
echo    2. Cliquez sur "Continuer vers localhost (non securise)"
echo.
echo    GARDER CETTE FENETRE OUVERTE PENDANT L'UTILISATION
echo ======================================================
echo.

:: Ouverture du navigateur
start "" "https://localhost:5174"

echo [INFO] Serveur actif sur https://localhost:5174
pause
exit /b

:REPAIR
echo.
echo [ALERTE] Environnement instable detecte.
echo [INFO] Reparation automatique en cours...
echo Cela peut prendre 2 minutes. Ne fermez pas la fenetre.
echo.

if exist "node_modules\" (
    echo [INFO] Nettoyage...
    rd /s /q node_modules
)

echo [INFO] Installation des composants...
call npm install
if %errorlevel% neq 0 goto ERROR_INSTALL

echo.
echo [SUCCES] Reparation terminee.
goto START_SERVER

:ERROR_NODE
echo.
echo [ERREUR] Node.js n'est pas installe.
echo Allez sur https://nodejs.org/ pour l'installer.
pause
exit /b

:ERROR_PATH
echo.
echo [ERREUR] Impossible d'acceder au dossier du projet.
pause
exit /b

:ERROR_INSTALL
echo.
echo [ERREUR] L'installation a echoue. Verifiez votre connexion internet.
pause
exit /b
