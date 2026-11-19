---
layout: handroll-detail
title: "Multi-Head Attention"
section: llm
date: 2026-08-16
order: 20260816
difficulty: "Hard"
---

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np

def transpose_input(X, num_heads):
    X = X.reshape(X.shape[0], X.shape[1], num_heads, -1)
    X = X.permute(0, 2, 1, 3)
    return X.reshape(-1, X.shape[2], X.shape[3])

class MultiHeadAttention(nn.Module):

    def __init__(self, d_model: int, num_heads: int):
        super().__init__()
        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        self.W_o = nn.Linear(d_model, d_model)
        self.num_heads = num_heads

    def forward(self, Q, K, V):
        # [b, n, d_model]
        Q = transpose_input(self.W_q(Q), self.num_heads)
        K = transpose_input(self.W_k(K), self.num_heads)
        V = transpose_input(self.W_v(V), self.num_heads)
        # [b*h, n, d_k]

        out = torch.bmm(
            torch.softmax(
                torch.bmm(
                    Q, 
                    K.transpose(1, 2)
                )/math.sqrt(Q.shape[-1]), 
                dim=-1
            ), 
            V
        )

        out = out.reshape(-1, self.num_heads, out.shape[1], out.shape[2])  # [b, h, n, d_k]
        out = out.permute(0, 2, 1, 3)  # [b, n, h, d_k]
        out = out.reshape(out.shape[0], out.shape[1], -1)
        return self.W_o(out)

```
