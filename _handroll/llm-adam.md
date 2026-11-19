---
layout: handroll-detail
title: "Adam Optimizer"
section: llm
date: 2026-08-19
order: 20260819
difficulty: "Medium"
---

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np

class MyAdam:

    def __init__(self, params, lr=0.001, betas=(0.9, 0.999), eps=1e-08):
        self.params = params
        self.lr = lr
        self.beta1, self.beta2 = betas
        self.eps = eps
        self.t = 0
        self.v = [torch.zeros_like(p) for p in params]
        self.s = [torch.zeros_like(p) for p in params]

    def step(self):
        self.t += 1
        with torch.no_grad():
            for i, p in enumerate(self.params):
                if p.grad is None:
                    # 可能这次前向传播没有经过某个参数 p 
                    continue
                self.v[i] = self.beta1 * self.v[i] + (1-self.beta1) * (p.grad)
                self.s[i] = self.beta2 * self.s[i] + (1-self.beta2) * (p.grad ** 2)
                v_hat = self.v[i] / (1 - self.beta1 ** self.t)
                s_hat = self.s[i] / (1 - self.beta2 ** self.t)
                self.params[i] -= (self.lr * v_hat / torch.sqrt(s_hat) + self.eps)

    def zero_grad(self):
        for i, p in enumerate(self.params):
            if p.grad is not None:
                p.grad.zero_()
```
