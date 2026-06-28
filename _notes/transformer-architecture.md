---
title: "Transformer Architecture: Attention Is All You Need"
category: "llms"
date: 2025-05-28
excerpt: "A detailed walkthrough of the Transformer architecture, from self-attention to positional encoding."
---

# Transformer Architecture: Attention Is All You Need

The Transformer, introduced by Vaswani et al. (2017), is the foundation of modern LLMs. Let's dissect it.

## 1. Why Transformers?

Before Transformers, sequence modeling was dominated by RNNs/LSTMs, which process tokens **sequentially**. This has two problems:

- **Slow training**: Can't parallelize across time steps
- **Long-range dependencies**: Information decays as it passes through many RNN steps

The Transformer solves both with **self-attention**: every token attends to every other token in $O(1)$ steps.

## 2. Self-Attention Mechanism

### Scaled Dot-Product Attention

$$
\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right) V
$$

Where:
- $Q$ (Query): What am I looking for?
- $K$ (Key): What do I contain?
- $V$ (Value): What information do I pass?
- $\sqrt{d_k}$: Scaling factor to prevent softmax saturation

### Multi-Head Attention

Instead of one attention function, use $h$ parallel heads:

$$
\text{MultiHead}(Q, K, V) = \text{Concat}(\text{head}_1, \ldots, \text{head}_h) W^O
$$

$$
\text{head}_i = \text{Attention}(QW_i^Q, KW_i^K, VW_i^V)
$$

Each head can learn different relationships — syntactic, semantic, positional, etc.

## 3. Full Architecture

```
Input → Embedding + Positional Encoding
     → [Multi-Head Attention → Add & Norm → FFN → Add & Norm] × N
     → Linear → Softmax
```

### Positional Encoding

Since attention is permutation-invariant, we need to inject position information:

$$
PE_{(pos, 2i)} = \sin\left(\frac{pos}{10000^{2i/d_{model}}}\right)
$$

$$
PE_{(pos, 2i+1)} = \cos\left(\frac{pos}{10000^{2i/d_{model}}}\right)
$$

### Feed-Forward Network

$$
\text{FFN}(x) = \max(0, xW_1 + b_1)W_2 + b_2
$$

Two linear transformations with ReLU (now often GELU or SwiGLU) in between.

## 4. Computational Complexity

| Layer | Complexity |
|-------|-----------|
| Self-Attention | $O(n^2 \cdot d)$ |
| FFN | $O(n \cdot d^2)$ |
| Total per layer | $O(n^2d + nd^2)$ |

The $O(n^2)$ attention is the bottleneck for long sequences — this is why efficient attention variants (FlashAttention, sparse attention) are critical for long-context LLMs.

## 5. Evolution to Modern LLMs

| Model | Key Innovation |
|-------|---------------|
| GPT | Decoder-only, autoregressive |
| BERT | Encoder-only, bidirectional |
| T5 | Encoder-decoder, text-to-text |
| GPT-3/4 | Scaling laws, emergent abilities |
| LLaMA | Open-source, efficient architecture |
| Claude | RLHF, constitutional AI |

> **Core insight**: The Transformer's power comes from letting *every token talk to every other token* in parallel. This is both its greatest strength (global context) and weakness (quadratic complexity).
