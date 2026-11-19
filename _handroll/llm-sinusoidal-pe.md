---
layout: handroll-detail
title: "Sinusoidal Position Encoding"
section: llm
date: 2026-08-20
order: 20260820
difficulty: "Easy"
---

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np

def sinusoidal_pe(seq_len: int, d_model: int) -> torch.Tensor:
    pos = torch.arange(seq_len).float().unsqueeze(1)  # [seq_len, 1]
    dim = torch.arange(0, d_model, 2).float().unsqueeze(0)  # [1, d_model // 2]
    pe = pos @ (1 / (10000 ** (dim / d_model)))
    ret = torch.zeros(seq_len, d_model)
    ret[:, 0::2] = torch.sin(pe)
    ret[:, 1::2] = torch.cos(pe)
    return ret
```
