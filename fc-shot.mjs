import { chromium } from '@playwright/test';
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p = await b.newPage({ forcedColors: 'active', viewport:{width:900,height:1400} });
for (const s of process.argv.slice(2)) {
  await p.goto('http://127.0.0.1:4000/components/'+s); await p.waitForTimeout(400);
  await p.screenshot({ path: '/tmp/claude-0/-home-user-pixel-perfect/83962141-5a98-5d24-b473-0dbfe37ea0bf/scratchpad/fc/'+s+'.png' });
}
await b.close();
