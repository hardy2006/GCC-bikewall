const { execSync } = require('child_process');
const path = require('path');

const repoDir = path.resolve(__dirname);
process.chdir(repoDir);

try {
  console.log('=== Commit & Push .env.production ===\n');

  // Check status
  const status = execSync('git status --short').toString();
  console.log('Changed files:\n' + (status || '  (none)'));

  // Stage and commit
  execSync('git add client/.env.production', { stdio: 'inherit' });
  execSync('git commit -m "fix: 修正 API 地址为 api.gcc-bike.top"', { stdio: 'inherit' });
  
  // Push
  execSync('git push', { stdio: 'inherit' });

  console.log('\n✅ 推送成功！');
  console.log('👉 请去 Cloudflare Pages → Deployments → Retry deployment');
} catch (e) {
  console.error('\n❌ 推送失败:', e.message);
}
