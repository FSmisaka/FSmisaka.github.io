---
layout: handroll-detail
title: "Causal Self-Attention"
section: llm
date: 2026-08-20
order: 20260820
difficulty: "Medium"
---

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np

def causal_attention(Q, K, V):
    _, s, d = Q.shape
    query = torch.bmm(Q, K.transpose(1, 2)) / math.sqrt(d)
    row = torch.arange(s).unsqueeze(1)  # [s, 1]
    col = torch.arange(s).unsqueeze(0)  # [1, s]
    mask = (row < col)  # 广播
    query[:, mask] = -float('inf')
    return torch.softmax(query, dim=-1) @ V
```
