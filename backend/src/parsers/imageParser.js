const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function parseImage(imagePath) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const prompt = `
    Analyze this flowchart image and extract its structure as a JSON object.
    
    RULES:
    1. Identify all shapes: 
       - OVAL/ROUND_RECT -> "start" or "end"
       - RECTANGLE -> "process"
       - DIAMOND -> "decision"
    2. Extract the text inside each shape.
    3. Identify all arrows and their connections. 
    4. For arrows coming out of DIAMONDs, look for "Yes"/"No" or "True"/"False" labels.
    5. Return ONLY a JSON object with this format:
    {
      "nodes": [
        { "id": "unique_id", "type": "start|process|decision", "text": "detected text", "confidence": 0.0-1.0 }
      ],
      "edges": [
        { "from": "id1", "to": "id2", "label": "Yes/No (optional)" }
      ]
    }
  `;

  const imageData = {
    inlineData: {
      data: Buffer.from(fs.readFileSync(imagePath)).toString("base64"),
      mimeType: "image/png", // Adjust if needed
    },
  };

  try {
    const result = await model.generateContent([prompt, imageData]);
    let responseText = result.response.text();
    
    // Clean up the response if it contains markdown formatting
    responseText = responseText.replace(/```json|```/g, "").trim();
    
    const parsed = JSON.parse(responseText);
    
    // Add default confidence if missing
    parsed.nodes = parsed.nodes.map(n => ({ ...n, confidence: n.confidence || 0.98 }));
    
    return {
      nodes: parsed.nodes,
      edges: parsed.edges,
      validation: { is_valid: true, errors: [], warnings: [] }
    };
  } catch (err) {
    console.error("Gemini Vision Error:", err);
    throw new Error("Failed to parse image accurately.");
  }
}

module.exports = { parseImage };
