const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const TOKEN = process.argv[2];
const REPO = 'azmainwork0011/Prime---ALRMS-';
const API = 'https://api.github.com/repos/' + REPO;

function api(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const u = new URL(API + urlPath);
    const opts = {
      hostname: u.hostname, path: u.pathname, method,
      headers: {
        'Authorization': 'Bearer ' + TOKEN,
        'User-Agent': 'push-v2',
        'Content-Type': 'application/json',
      }
    };
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve({ raw: d, code: res.statusCode }); } });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  const t0 = Date.now();
  console.log('=== PU-ALRMS GitHub Push ===\n');

  // Get tracked files
  const allFiles = execSync('git ls-files', { cwd: '/home/z/my-project', encoding: 'utf8' })
    .trim().split('\n').filter(f => f && !f.includes('keep-server') && !f.includes('node_modules'));

  // Filter by size (< 5MB)
  const files = allFiles.filter(f => {
    try { return fs.statSync(path.join('/home/z/my-project', f)).size < 5_000_000; } catch { return false; }
  });

  console.log(`Files to push: ${files.length}`);

  // Create blobs in batches of 5 concurrent
  const treeEntries = [];
  let ok = 0, fail = 0;

  for (let i = 0; i < files.length; i += 5) {
    const batch = files.slice(i, i + 5);
    const results = await Promise.all(batch.map(async file => {
      try {
        const content = fs.readFileSync(path.join('/home/z/my-project', file)).toString('base64');
        const blob = await api('POST', '/git/blobs', { content, encoding: 'base64' });
        if (blob.sha) return { path: file, mode: '100644', type: 'blob', sha: blob.sha };
      } catch (e) {}
      return null;
    }));

    for (const r of results) {
      if (r) { treeEntries.push(r); ok++; } else { fail++; }
    }
    if ((i + 5) % 50 === 0 || i + 5 >= files.length) {
      console.log(`  Progress: ${Math.min(i + 5, files.length)}/${files.length} (${ok} ok)`);
    }
  }

  console.log(`\nBlobs: ${ok} created, ${fail} failed`);
  if (treeEntries.length === 0) { console.log('ABORT: No blobs'); return; }

  // Create tree
  console.log('Creating tree...');
  const tree = await api('POST', '/git/trees', { tree: treeEntries });
  if (!tree.sha) { console.log('ABORT: Tree failed', JSON.stringify(tree).substring(0, 300)); return; }
  console.log('Tree:', tree.sha);

  // Get current commit parent
  const refResp = await api('GET', '/git/ref/heads/main');
  const parentSha = refResp.object?.sha || null;

  // Create commit
  console.log('Creating commit...');
  const commit = await api('POST', '/git/commits', {
    message: 'feat: PU-ALRMS v2.0 — Complete Vercel Deployment\n\n- 20 page components, 45 API routes\n- JWT auth, OpenAI ChatGPT integration\n- Quiz system, Code Quest, Community Chat\n- Auto database setup via /api/setup\n- Turso cloud DB support\n- Profile photos as base64 (serverless-ready)',
    tree: tree.sha,
    parents: parentSha ? [parentSha] : []
  });
  if (!commit.sha) { console.log('ABORT: Commit failed', JSON.stringify(commit).substring(0, 300)); return; }
  console.log('Commit:', commit.sha);

  // Update ref
  console.log('Updating main branch...');
  const ref = await api('PATCH', '/git/refs/heads/main', { sha: commit.sha, force: true });
  console.log('Ref updated:', ref.object?.sha ? 'OK' : JSON.stringify(ref).substring(0, 200));

  console.log(`\n✅ DONE in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  console.log(`Vercel will auto-deploy from: https://github.com/azmainwork0011/Prime---ALRMS-`);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
