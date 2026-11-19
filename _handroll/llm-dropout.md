---
layout: handroll-detail
title: "Implement Dropout"
section: llm
date: 2026-08-15
order: 20260815
difficulty: "Easy"
---

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np

class MyDropout(nn.Module):

    def __init__(self, p=0.5):
        super().__init__()
        self.p = p

    def forward(self, x):
        if self.training:
            return ((torch.rand(x.shape) > self.p) /(1-self.p)) * x
        else:
            return x
```
