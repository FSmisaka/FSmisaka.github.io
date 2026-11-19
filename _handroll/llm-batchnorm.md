---
layout: handroll-detail
title: "Implement BatchNorm"
section: llm
date: 2026-08-28
order: 20260828
difficulty: "Medium"
---

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np

def my_batch_norm(x, gamma, beta, running_mean, running_var, eps=1e-05, momentum=0.1, training=True):
    batch_mean = x.mean(dim=0)
    batch_var = x.var(dim=0, unbiased=False)
    if training:
        mean = batch_mean
        var = batch_var
        running_mean.mul_(1 - momentum).add_(momentum * mean.detach())
        running_var.mul_(1 - momentum).add_(momentum * var.detach())
    else:
        mean = running_mean
        var = running_var
    
    x = (x - mean)/torch.sqrt(var + eps)
    return gamma * x + beta
```
