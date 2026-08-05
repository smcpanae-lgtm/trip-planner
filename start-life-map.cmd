@echo off
chcp 65001 >nul
title 人生体験マップ / AIドライブプランナー

rem このファイルがある場所（trip-planner）へ移動
cd /d "%~dp0"

echo ============================================
echo  人生体験マップ を起動します
echo ============================================
echo.
echo 開発サーバーを起動中です。初回は少し時間がかかります。
echo （この黒い画面は閉じないでください。閉じるとサーバーが止まります）
echo.

rem サーバーが立ち上がるのを待ってからブラウザを開く
start "" /b cmd /c "timeout /t 8 >nul & start "" http://localhost:3000/life-map"

rem 開発サーバーを起動（この画面で動き続けます）
call npm run dev

echo.
echo サーバーが停止しました。ウィンドウを閉じてください。
pause
