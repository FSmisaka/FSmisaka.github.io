---
title: "HSTU — Trillion-Parameter Sequential Transducers for Generative Recommendations"
paper_title: "Actions Speak Louder than Words: Trillion-Parameter Sequential Transducers for Generative Recommendations"
year: 2024
domain: "Recommendation Systems"
model: "HSTU"
venue: "ICML"
---

# HSTU: Generative Recommendations at Meta Scale

> **Paper**: Actions Speak Louder than Words: Trillion-Parameter Sequential Transducers for Generative Recommendations (ICML 2024)

## 1. Core Idea

Traditional recommendation systems use a **retrieve-then-rank** pipeline:
1. Retrieve hundreds of candidates from millions (efficient but coarse)
2. Rank them with a powerful model (accurate but limited to the retrieved set)

HSTU asks: **what if we generate recommendations directly**, like an LLM generates text?

## 2. Architecture

HSTU (Hierarchical Sequential Transduction Unit) is a **trillion-parameter generative model** that:

- Encodes user interaction sequences as a temporal stream
- Uses a novel **sequential transduction** mechanism instead of self-attention
- Generates item tokens autoregressively

The key design choices:

| Component | Design |
|-----------|--------|
| Sequence encoding | Temporal convolution + gating |
| Interaction modeling | Sequential transducer (not transformer) |
| Decoding | Autoregressive with constrained beam search |
| Scale | Up to 1T parameters, deployed at Meta scale |

## 3. Why Sequential Transduction?

The authors argue that self-attention's $O(n^2)$ complexity is wasteful for recommendation sequences:

> User actions are inherently **causal** — what you did yesterday affects what you'll do today, but not vice versa.

Sequential transduction respects this causality while being **linear in sequence length**.

## 4. Results

Massive offline and online gains:
- **+12.4%** CTR improvement in A/B tests
- Generalizes across Instagram, Facebook, and WhatsApp
- Better long-tail item discovery
- Handles cold-start via content features

## 5. Personal Takeaway

This paper represents a paradigm shift: from discriminative to generative recommendation. Key insights:

1. **Scale matters**: Trillion-parameter models learn temporal patterns that smaller models can't capture
2. **Causality is a feature**: Enforcing causal structure improves both efficiency and quality
3. **Engineering is half the battle**: Training and serving 1T-param models requires massive infrastructure innovation

The most exciting implication: if generative recommendation follows the same scaling laws as LLMs, we're at the GPT-2 stage — much more improvement ahead.
