const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

// Enable CORS
app.use(cors());
app.use(express.json());

// The Master List
let globalPrompts = [];

/**
 * Checks if 70% of the words in 'input' exist in 'target'
 */
function isSemanticallySimilar(input, target) {
  // 1. Clean and tokenize (remove punctuation, split by space)
  const tokenize = (str) => str.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 0);
  
  const inputWords = tokenize(input);
  const targetWords = tokenize(target);
  
  if (inputWords.length === 0) return false;

  // 2. Count matches
  const targetSet = new Set(targetWords);
  let matchCount = 0;
  
  inputWords.forEach(word => {
    if (targetSet.has(word)) matchCount++;
  });

  // 3. Calculate percentage
  const similarity = matchCount / inputWords.length;
  
  // Return true if 70% or more words match
  return similarity >= 0.7;
}

// Endpoint 1: Check similarity (No longer returns the match text)
app.post('/check', (req, res) => {
  const { text } = req.body;
  if (!text || text.length < 2) return res.json({ found: false });

  for (const prompt of globalPrompts) {
    if (isSemanticallySimilar(text, prompt)) {
      // found: true, but WE DO NOT SEND back the 'match' text anymore
      return res.json({ found: true });
    }
  }

  res.json({ found: false });
});

// Endpoint 2: Add prompt
app.post('/add', (req, res) => {
  const { text } = req.body;
  if (text && !globalPrompts.includes(text)) {
    globalPrompts.push(text);
    console.log(`[Server] Added: ${text}`);
  }
  res.sendStatus(200);
});

// Endpoint 3: Clear list
app.post('/clear', (req, res) => {
  globalPrompts = [];
  console.log(`[Server] List cleared`);
  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Gartic Server running at http://localhost:${port}`);
});
