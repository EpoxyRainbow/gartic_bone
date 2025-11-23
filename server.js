const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

// Enable CORS so the Chrome Extension can talk to this server
app.use(cors());
app.use(express.json());

// The Master List
let globalPrompts = [];

// Helper: Levenshtein Distance (Same logic as before, but on server side)
function getEditDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
      }
    }
  }
  return matrix[b.length][a.length];
}

// Endpoint 1: Check if text is similar to anything in the list
app.post('/check', (req, res) => {
  const { text } = req.body;
  if (!text || text.length < 3) return res.json({ found: false });

  const normalize = (str) => str.toLowerCase().trim();
  const current = normalize(text);

  for (const prompt of globalPrompts) {
    const saved = normalize(prompt);

    // Exact/Substring match
    if (current.includes(saved) || saved.includes(current)) {
      return res.json({ found: true, match: prompt });
    }

    // Fuzzy match
    if (getEditDistance(current, saved) <= 2 && current.length > 4) {
      return res.json({ found: true, match: prompt });
    }
  }

  res.json({ found: false });
});

// Endpoint 2: Add a new prompt to the list
app.post('/add', (req, res) => {
  const { text } = req.body;
  if (text && !globalPrompts.includes(text)) {
    globalPrompts.push(text);
    console.log(`[Server] Added: ${text}`);
  }
  res.sendStatus(200);
});

// Endpoint 3: Clear list (optional, for admin)
app.post('/clear', (req, res) => {
  globalPrompts = [];
  console.log(`[Server] List cleared`);
  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Gartic Server running at http://localhost:${port}`);
});