---
title: "FlashAttention — IO-Aware Exact Attention"
paper_title: "FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness"
year: 2022
domain: "LLMs"
model: "FlashAttention"
venue: "NIPS"
---

# FlashAttention: Making Long-Context Transformers Practical

> **Paper**: FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness (NIPS 2022)

## 1. The Problem

Standard self-attention has $O(n^2)$ memory complexity because it materializes the full attention matrix:

```python
# Standard attention — O(n²) memory
Q, K, V = ...  # [n, d]
S = Q @ K.T   # [n, n] — THIS is the bottleneck
P = softmax(S)
O = P @ V
```

For a sequence of 8K tokens with head_dim=64, that's 8K×8K = 64M elements in FP16 ≈ 128MB **per head per layer**. GPT-3 with 96 layers × 96 heads would need ~1.2 TB!

## 2. The Key Insight: IO-Awareness

The authors observe that attention is **memory-bound, not compute-bound** on modern GPUs:

| Operation | Speed |
|-----------|-------|
| HBM → SRAM (load) | Slow (1.5 TB/s on A100) |
| SRAM → HBM (store) | Slow |
| Computation in SRAM | Fast (312 TFLOPS on A100) |

The bottleneck is moving data between HBM and SRAM. FlashAttention **minimizes HBM reads/writes** by:

1. **Tiling**: Process attention in small blocks that fit in SRAM
2. **Recomputation**: Recompute softmax statistics in backward pass instead of storing the attention matrix

## 3. The Algorithm

### Forward Pass

For each block of Q and K,V:
1. Load Q_block, K_block, V_block into SRAM
2. Compute partial attention scores
3. Use **online softmax** (running max + sum) to avoid storing the full matrix
4. Accumulate output and write back to HBM

### Backward Pass

Recompute attention scores from stored Q,K,V (cheaper than loading the attention matrix from HBM).

## 4. Results

| Metric | Standard Attention | FlashAttention |
|--------|-------------------|----------------|
| Memory | $O(n^2)$ | $O(n)$ |
| Wall-clock time | Baseline | **2-4× faster** |
| Numerics | Exact | **Exact** (not approximate!) |

Enables training on sequences up to 64K tokens with standard hardware.

## 5. Evolution

- **FlashAttention-2** (2023): Better parallelism, 2× faster, better GPU utilization
- **FlashAttention-3** (2024): FP8 support, Hopper architecture optimizations

## 6. Personal Takeaway

FlashAttention is a masterclass in systems-ML co-design:

1. **Know your hardware**: Understanding GPU memory hierarchy unlocks 2-4× speedup with zero accuracy loss
2. **Exact > approximate (when possible)**: Unlike sparse/linear attention, FlashAttention is exact — no quality degradation
3. **Pioneering IO-awareness**: Inspired a wave of IO-aware kernels (FlashDecoding, FlashFFT, etc.)

The paper changed how I think about optimization: **the bottleneck is often data movement, not computation**.
