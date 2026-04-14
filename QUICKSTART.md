# Quick Start - 5 Minutes

Get your Personal Wiki running in under 5 minutes.

## 1️⃣ Setup (1 minute)

```bash
# Clone & install
git clone https://github.com/user/karpathy-copilot-wiki
cd karpathy-copilot-wiki/extension
npm install
npm run compile
```

## 2️⃣ Create Folders (30 seconds)

```bash
mkdir -p ../raw ../wiki ../wiki/decisions
```

## 3️⃣ Load Extension in VS Code (2 minutes)

1. Open Command Palette: `Cmd+Shift+P`
2. Run: `Developer: Install Extension from Location`
3. Select `extension/` folder
4. Reload VS Code

## 4️⃣ Create First Page (1 minute)

Place a `.txt` or `.md` file in `../raw/`:

**raw/neural-networks.txt**:
```
Neural Networks Fundamentals

Neural networks are computational models inspired by biological neurons.

Key Concepts:
- Neurons and synapses
- Forward propagation
- Backpropagation
- Loss functions
```

## 5️⃣ Run Ingest

In VS Code:
1. Open Command Palette: `Cmd+Shift+P`
2. Type: `@wiki ingest`
3. Hit Enter

✅ **Page created!** Check `wiki/neural-networks.md`

## 🔍 Try Search

Command Palette → `@wiki search` → type `neural` → see results

## 📝 Next Steps

- Read [USER_GUIDE.md](USER_GUIDE.md) for full features
- Run tests: `npm test`
- Archive your first Copilot conversation

---

**Questions?** Check SOLUTION.md or run tests to verify setup.
