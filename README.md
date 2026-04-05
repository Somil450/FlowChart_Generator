# 🚀 100% Accuracy Flowchart Maker

A **production-grade, deterministic flowchart generation tool** powered by **AST/MIR parsing** and **Peggy.js grammars**.

---

## 📌 Features

* 🔍 Deterministic Control Flow Graph (CFG) extraction
* 🧠 Supports **JavaScript, Python, and Rust**
* ✍️ Natural language → flowchart (via Peggy.js grammar)
* ✅ Mandatory review system for **100% accuracy**
* 📤 Export as **SVG** or **Mermaid code**
* ⚡ Modern UI with **React Flow + Glassmorphism 2.0**

---

## 🚀 Quick Start (Local Development)

### 1️⃣ Prerequisites

Make sure you have:

* **Node.js** (v18+)
* **Python 3** (for Python AST parsing)
* **Rustc** (for Rust MIR parsing)
* **Gemini API Key**

Set your API key as an environment variable:

```bash
export GEMINI_API_KEY=your_api_key_here
```

---

### 2️⃣ Setup & Installation

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

---

### 3️⃣ Running the Application

You need to run both **Backend** and **Frontend**:

#### ▶️ Start Backend (Port 3001)

```bash
cd backend/src
node index.js
```

#### ▶️ Start Frontend (Port 5173)

```bash
cd client
npm run dev
```

---

## ⚙️ Deterministic Accuracy Workflow

1. **Paste Code**
   Supports: `JavaScript`, `Python`, `Rust`
   → Generates deterministic CFG

2. **Describe Process**
   Natural language → parsed via Peggy.js

3. **Mandatory Review**

   * Modal appears
   * You must confirm/correct all nodes & edges

4. **Export**

   * Download as **SVG**
   * Copy **Mermaid Code**

---

## 🛠️ Architecture

| Component     | Technology Used            |
| ------------- | -------------------------- |
| JS Parser     | Acorn + Esgraph            |
| Python Parser | Native `ast` (subprocess)  |
| Rust Parser   | `rustc --emit=mir`         |
| Text Parser   | Peggy.js BNF Grammar + LLM |
| UI            | React Flow + Vite          |

---

## 📂 Project Structure

```
flow_maker/
│
├── backend/
├── client/
├── uploads/
├── package.json
├── README.md
```

---

## 🔐 Environment Variables

Create a `.env` file in root:

```
GEMINI_API_KEY=your_api_key_here
```

---

## 📌 Future Improvements

* 🌐 Deployment (Cloud + Docker)
* 🤖 Advanced AI-based flow optimization
* 📊 Real-time collaboration
* 🎨 More export formats (PNG, PDF)

---

## 🤝 Contributing

Contributions are welcome!
Feel free to fork the repo and submit a PR.

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!
