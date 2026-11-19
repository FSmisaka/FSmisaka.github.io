---
layout: handroll-detail
title: "Kaiming Initialization"
section: llm
date: 2026-08-18
order: 20260818
difficulty: "Easy"
---

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import math

def kaiming_init(weight):
    # ~N(0, sqrt(2/维度))
    with torch.no_grad():
        weight.normal_(
            0, 
            math.sqrt(2 / (weight.shape[0] if weight.dim() == 1 else weight.shape[1]))
        )
    return weight
```
