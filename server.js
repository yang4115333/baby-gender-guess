const http = require('http');
const fs = require('fs');
const path = require('path');

const VOTES_FILE = path.join(__dirname, 'votes.json');
const ANSWER_FILE = path.join(__dirname, 'answer.json');
const BLESSINGS_FILE = path.join(__dirname, 'blessings.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Admin token - simple auth for setting answer
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'change-me';

// Load votes from file
function loadVotes() {
  try {
    if (fs.existsSync(VOTES_FILE)) {
      return JSON.parse(fs.readFileSync(VOTES_FILE, 'utf8'));
    }
  } catch(e) {}
  return [];
}

// Save votes to file
function saveVotes(votes) {
  fs.writeFileSync(VOTES_FILE, JSON.stringify(votes, null, 2));
}

// Load answer from file
function loadAnswer() {
  try {
    if (fs.existsSync(ANSWER_FILE)) {
      const data = JSON.parse(fs.readFileSync(ANSWER_FILE, 'utf8'));
      return data.answer || null;
    }
  } catch(e) {}
  return null;
}

// Save answer to file
function saveAnswer(answer) {
  fs.writeFileSync(ANSWER_FILE, JSON.stringify({ answer, time: new Date().toISOString() }, null, 2));
}

// Load blessings from file
function loadBlessings() {
  try {
    if (fs.existsSync(BLESSINGS_FILE)) {
      return JSON.parse(fs.readFileSync(BLESSINGS_FILE, 'utf8'));
    }
  } catch(e) {}
  return [];
}

// Save blessings to file
function saveBlessings(blessings) {
  fs.writeFileSync(BLESSINGS_FILE, JSON.stringify(blessings, null, 2));
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // API: POST /api/vote
  if (req.method === 'POST' && req.url === '/api/vote') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { name, vote } = JSON.parse(body);
        if (!name || !vote || !['boy', 'girl'].includes(vote)) {
          res.writeHead(400, {'Content-Type':'application/json'});
          res.end(JSON.stringify({ok:false, error:'Invalid data'}));
          return;
        }
        const votes = loadVotes();
        const existing = votes.findIndex(v => v.name === name);
        const entry = { name, vote, time: new Date().toISOString() };
        if (existing >= 0) {
          votes[existing] = entry;
        } else {
          votes.push(entry);
        }
        saveVotes(votes);
        res.writeHead(200, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ok:true, votes}));
      } catch(e) {
        res.writeHead(400, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ok:false, error:'Parse error'}));
      }
    });
    return;
  }

  // API: GET /api/stats
  if (req.method === 'GET' && req.url === '/api/stats') {
    const votes = loadVotes();
    const answer = loadAnswer();
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify({ok:true, votes, answer}));
    return;
  }

  // API: POST /api/blessing — submit a blessing
  if (req.method === 'POST' && req.url === '/api/blessing') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { name, text } = JSON.parse(body);
        if (!name || !text || text.trim().length === 0) {
          res.writeHead(400, {'Content-Type':'application/json'});
          res.end(JSON.stringify({ok:false, error:'Name and text required'}));
          return;
        }
        if (text.length > 200) {
          res.writeHead(400, {'Content-Type':'application/json'});
          res.end(JSON.stringify({ok:false, error:'Message too long (max 200 chars)'}));
          return;
        }
        const blessings = loadBlessings();
        const entry = { name: name.trim(), text: text.trim(), time: new Date().toISOString() };
        blessings.push(entry);
        saveBlessings(blessings);
        res.writeHead(200, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ok:true, blessing: entry}));
      } catch(e) {
        res.writeHead(400, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ok:false, error:'Parse error'}));
      }
    });
    return;
  }

  // API: GET /api/blessings — get all blessings
  if (req.method === 'GET' && req.url === '/api/blessings') {
    const blessings = loadBlessings();
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify({ok:true, blessings}));
    return;
  }

  // API: POST /api/reveal — set the answer (admin only)
  if (req.method === 'POST' && req.url === '/api/reveal') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { answer, token } = JSON.parse(body);
        if (token !== ADMIN_TOKEN) {
          res.writeHead(403, {'Content-Type':'application/json'});
          res.end(JSON.stringify({ok:false, error:'Unauthorized'}));
          return;
        }
        if (!answer || !['boy', 'girl'].includes(answer)) {
          res.writeHead(400, {'Content-Type':'application/json'});
          res.end(JSON.stringify({ok:false, error:'Answer must be boy or girl'}));
          return;
        }
        saveAnswer(answer);
        console.log(`🎉 Answer revealed: ${answer}`);
        res.writeHead(200, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ok:true, answer}));
      } catch(e) {
        res.writeHead(400, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ok:false, error:'Parse error'}));
      }
    });
    return;
  }

  // Static files
  let filePath = req.url.split('?')[0];
  if (filePath === '/') filePath = '/index.html';
  const fullPath = path.join(PUBLIC_DIR, filePath);

  // Security: prevent path traversal
  if (!fullPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    const ext = path.extname(fullPath).toLowerCase();
    res.writeHead(200, {'Content-Type': MIME[ext] || 'application/octet-stream'});
    res.end(data);
  });
});

const PORT = 8899;
server.listen(PORT, () => {
  console.log(`🍼 Baby Guess server running at http://localhost:${PORT}`);
});
