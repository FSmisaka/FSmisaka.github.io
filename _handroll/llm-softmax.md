---
layout: handroll-detail
title: "Implement Softmax"
section: llm
date: 2026-08-02
order: 20260802
difficulty: "Easy"
---

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np

def my_softmax(x: torch.Tensor, dim: int=-1) -> torch.Tensor:
    x -= torch.max(x)
    return torch.exp(x) / torch.exp(x).sum(dim=dim, keepdim=True)
```
