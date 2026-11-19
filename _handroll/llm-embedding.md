---
layout: handroll-detail
title: "Embedding Layer"
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

class MyEmbedding(nn.Module):

    def __init__(self, num_embeddings, embedding_dim):
        super().__init__()
        self.weight = nn.Parameter(torch.randn(num_embeddings, embedding_dim))

    def forward(self, indices):

        return self.weight[indices]
```
