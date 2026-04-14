---
title: Transformers and Attention Mechanisms
aliases: ["transformers", "attention", "BERT", "GPT"]
tags: ["machine-learning", "nlp", "transformers", "attention"]
created: 2026-04-14T12:00:00Z
modified: 2026-04-14T12:00:00Z
source: "sample-transformers.txt"
---

# Modern Machine Learning: Transformers and Attention

## The Attention Mechanism

Attention allows a model to focus on specific parts of input based on relevance. Rather than treating all inputs equally, attention weights are learned parameters that adjust importance dynamically.

### Self-Attention
In self-attention, each token attends to all other tokens in the sequence:
- Long-range dependencies without diluted gradients
- Parallel computation (unlike [[RNNs]])
- Interpretable attention weights

**Query, Key, and Value projections:**
- **Query (Q)**: What am I looking for?
- **Key (K)**: What information do I have?
- **Value (V)**: What should I output?

```
Attention score = softmax(Q · K^T / √d) · V
```

### Multi-Head Attention
Multiple attention heads operate in parallel, each learning different relationships:
- Some heads focus on syntax
- Others on semantics or discourse structure
- Results concatenated and projected

## Transformer Architecture

Introduced in "Attention is All You Need" (Vaswani et al., 2017), transformers revolutionized NLP.

### Encoder Stack
- 6-12 layers (BERT: 12, GPT-3: 96)
- Each layer: Multi-head attention + Feed-Forward Network
- Layer normalization and residual connections
- Positional encodings provide position information

### Decoder Stack
- Similar to encoder but with masked self-attention
- Attends to encoder outputs (cross-attention)
- Generates outputs sequentially (autoregressive)

## Key Innovations

- **Parallelization**: Unlike RNNs, all positions can be computed simultaneously
- **Long-range dependencies**: No vanishing gradient problem
- **Interpretability**: Attention weights can be visualized
- **Scalability**: Enables large-scale pre-training

## Applications

Transformers power modern systems like:
- [[BERT]] - Bidirectional Encoder Representations
- GPT series - Generative Pre-trained Transformers
- Machine translation systems
- Question answering models
- Language understanding systems
