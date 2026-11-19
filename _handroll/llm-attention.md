---
layout: handroll-detail
title: "Softmax Attention"
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
import math

def scaled_dot_product_attention(Q, K, V):
    return torch.bmm(
        torch.softmax(
            torch.bmm(
                Q, 
                K.transpose(1, 2)
            ) / math.sqrt(Q.shape[-1]), dim=-1
        ), 
        V
    )
```
