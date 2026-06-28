---
title: "Gradient Boosting from Scratch"
category: "machine-learning"
date: 2025-05-20
excerpt: "Understanding gradient boosting by implementing it step by step."
---

# Gradient Boosting from Scratch

Gradient Boosting is one of the most powerful ensemble learning techniques. Let's build it from the ground up.

## 1. Intuition

The key idea behind gradient boosting is simple:

- Start with a weak model (e.g., a simple average)
- Iteratively add new models that correct the **residuals** (errors) of the previous ensemble
- Each new model is fitted to the **negative gradient** of the loss function

Mathematically, at step $m$, we fit a weak learner $h_m(x)$ to the pseudo-residuals:

$$
r_{im} = -\left[ \frac{\partial L(y_i, F(x_i))}{\partial F(x_i)} \right]_{F(x)=F_{m-1}(x)}
$$

## 2. The Algorithm

For a regression problem with squared error loss:

1. **Initialize**: $F_0(x) = \arg\min_{\gamma} \sum_{i=1}^{n} L(y_i, \gamma)$
2. **For** $m = 1$ to $M$:
   - Compute pseudo-residuals: $r_{im} = y_i - F_{m-1}(x_i)$
   - Fit a weak learner $h_m(x)$ to $\{(x_i, r_{im})\}_{i=1}^n$
   - Compute step size: $\gamma_m = \arg\min_{\gamma} \sum L(y_i, F_{m-1}(x_i) + \gamma h_m(x_i))$
   - Update: $F_m(x) = F_{m-1}(x) + \nu \cdot \gamma_m \cdot h_m(x)$

Where $\nu$ is the **learning rate** (shrinkage parameter).

## 3. Python Implementation

```python
import numpy as np
from sklearn.tree import DecisionTreeRegressor

class GradientBoostingRegressor:
    def __init__(self, n_estimators=100, learning_rate=0.1, max_depth=3):
        self.n_estimators = n_estimators
        self.learning_rate = learning_rate
        self.max_depth = max_depth
        self.trees = []
        self.f0 = None

    def fit(self, X, y):
        self.f0 = np.mean(y)
        F = np.full(len(y), self.f0)

        for _ in range(self.n_estimators):
            residuals = y - F
            tree = DecisionTreeRegressor(max_depth=self.max_depth)
            tree.fit(X, residuals)
            predictions = tree.predict(X)
            F += self.learning_rate * predictions
            self.trees.append(tree)

    def predict(self, X):
        F = np.full(X.shape[0], self.f0)
        for tree in self.trees:
            F += self.learning_rate * tree.predict(X)
        return F
```

## 4. Why It Works

- **Bias reduction**: Each tree focuses on the mistakes of the ensemble, progressively reducing bias
- **Learning rate prevents overfitting**: Small $\nu$ means each tree contributes less, requiring more trees but generalizing better
- **Any differentiable loss**: The framework works with any loss function — just compute the gradient

> **Key insight**: Gradient boosting is essentially **gradient descent in function space**.
