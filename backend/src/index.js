const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const { parseImage } = require('./parsers/imageParser');
const { parseCode } = require('./parsers/codeParser');
const { parseText } = require('./parsers/textParser');
const { validatePerfect } = require('./validation/perfectValidator');
const { compileToMermaid } = require('./compiler/mermaidCompiler');

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());
const upload = multer({ dest: 'uploads/' });

// ---------------------------------------------------------
// API Endpoints (Deterministic Logic)
// ---------------------------------------------------------

app.post('/api/parse-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('No image uploaded.');
    const result = await parseImage(req.file.path, req.file.mimetype);
    const validation = validatePerfect(result);
    // Always compile what we have, but flag for review
    const mermaid = compileToMermaid(result);

    res.json({
      ...result,
      mermaid_code: mermaid,
      validation,
      success: validation.is_valid && !result.needs_manual_review
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (req.file) fs.unlinkSync(req.file.path);
  }
});

app.post('/api/parse-code', async (req, res) => {
  const { code, language } = req.body;
  try {
    const result = await parseCode(code, language);
    const validation = validatePerfect(result);
    const mermaid = compileToMermaid(result);

    res.json({
      ...result,
      mermaid_code: mermaid,
      validation,
      success: validation.is_valid
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/parse-text', async (req, res) => {
  const { description } = req.body;
  try {
    const result = await parseText(description);
    const validation = validatePerfect(result);
    const mermaid = compileToMermaid(result);

    res.json({
      ...result,
      mermaid_code: mermaid,
      validation,
      success: validation.is_valid
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`100% Accuracy Flowchart Backend running at http://localhost:${port}`);
});
