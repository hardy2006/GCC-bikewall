@echo off
chcp 65001 >nul
echo ========================================
echo  推送最新代码到 GitHub
echo ========================================
echo.
cd /d "C:\Users\111\.kun\default_workspace\bike-repair"
echo 当前目录: %CD%
echo.

:: 检查是否已有 .git
if exist ".git" (
    echo [1/3] 暂存文件...
    git add client/.env.production
    
    echo [2/3] 提交改动...
    git commit -m "fix: 修正 API 地址为 api.gcc-bike.top"
    
    echo [3/3] 推送到 GitHub...
    git push
) else (
    echo 仓库不存在，重新初始化...
    echo "# GCC-bikewall" >> README.md
    git init
    git add .
    git commit -m "first commit"
    git branch -M main
    git remote add origin https://github.com/hardy2006/GCC-bikewall.git
    git push -u origin main
)

echo.
if %errorlevel% equ 0 (
    echo ✅ 推送成功！请去 Cloudflare Pages → Deployments → Retry deployment
) else (
    echo ❌ 推送失败，请截图错误信息发给我
)
echo.
pause
