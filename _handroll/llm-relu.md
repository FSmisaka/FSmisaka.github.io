---
layout: handroll-detail
title: "Implement ReLU"
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

def relu(x: torch.Tensor) -> torch.Tensor:
    return torch.where(x > 0, x, torch.zeros_like(x))
```
