@echo off
cd /d "%~dp0"
echo 提交前端配置到 GitHub...
git add client/.env.production
git commit -m "fix: 修正 Cloudflare 代理域名为 api.gcc-bike.top"
git push
echo 完成！请去 Cloudflare Pages 触发重新部署。
pause
