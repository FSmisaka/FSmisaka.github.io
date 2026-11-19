---
layout: handroll-detail
title: "Cross-Entropy Loss"
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

def cross_entropy_loss(logits, targets):
    # log-sum-exp 
    log_probs = torch.log_softmax(logits, dim=1)
    return -log_probs[
        torch.arange(logits.shape[0]), targets
    ].mean()
```
