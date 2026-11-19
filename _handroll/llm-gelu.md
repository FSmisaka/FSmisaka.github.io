---
layout: handroll-detail
title: "GELU Activation"
section: llm
date: 2026-08-16
order: 20260816
difficulty: "Easy"
---

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import math

def my_gelu(x):
    return x * 0.5 * (1 + torch.erf(x / math.sqrt(2)))
```
