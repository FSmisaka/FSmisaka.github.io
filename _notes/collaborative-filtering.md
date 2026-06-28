---
title: "Collaborative Filtering: Memory-Based & Model-Based"
category: "recommendation-systems"
date: 2025-06-02
excerpt: "Comparing user-based CF, item-based CF, and matrix factorization approaches."
---

# Collaborative Filtering: Memory-Based & Model-Based

Collaborative Filtering (CF) is the cornerstone of modern recommendation systems. Let's examine the two main paradigms.

## 1. Memory-Based CF

### User-Based CF

Find similar users and recommend what they liked:

1. Compute user-user similarity (Pearson, Cosine)
2. For target user $u$, find the $k$ most similar users
3. Predict rating: weighted average of those users' ratings

$$
\hat{r}_{ui} = \bar{r}_u + \frac{\sum_{v \in N_k(u)} \text{sim}(u, v) \cdot (r_{vi} - \bar{r}_v)}{\sum_{v \in N_k(u)} |\text{sim}(u, v)|}
$$

### Item-Based CF

Find items similar to what the user already liked:

1. Compute item-item similarity
2. For each candidate item, look at how similar it is to items the user rated highly
3. Predict rating accordingly

**Pros**: Interpretable, no training needed
**Cons**: Scalability issues ($O(n^2)$ similarity computation), cold-start for new users/items

## 2. Model-Based CF: Matrix Factorization

Decompose the user-item rating matrix $R \in \mathbb{R}^{m \times n}$ into latent factors:

$$
R \approx P^T Q
$$

Where $P \in \mathbb{R}^{k \times m}$ (user factors) and $Q \in \mathbb{R}^{k \times n}$ (item factors).

### Optimization Objective

$$
\min_{P, Q} \sum_{(u,i) \in \text{observed}} (r_{ui} - p_u^T q_i)^2 + \lambda(\|p_u\|^2 + \|q_i\|^2)
$$

### SGD Implementation

```python
def sgd_matrix_factorization(R, k, steps, lr, lambda_):
    m, n = R.shape
    P = np.random.normal(0, 0.1, (m, k))
    Q = np.random.normal(0, 0.1, (n, k))

    for step in range(steps):
        for u in range(m):
            for i in range(n):
                if R[u, i] > 0:  # observed rating
                    error = R[u, i] - np.dot(P[u], Q[i])
                    P[u] += lr * (error * Q[i] - lambda_ * P[u])
                    Q[i] += lr * (error * P[u] - lambda_ * Q[i])
    return P, Q
```

## 3. Comparison

| Aspect | Memory-Based | Model-Based (MF) |
|--------|-------------|-------------------|
| Training | None | SGD / ALS optimization |
| Inference | Compute similarities | Dot product of latent vectors |
| Scalability | Poor for large datasets | Good (sub-linear with approximations) |
| Cold-start | Problematic | Handles better with features |
| Interpretability | High (explain via similar users/items) | Low (latent dimensions are opaque) |

> **Note**: In practice, model-based methods (MF, neural CF) dominate. Memory-based methods are still useful for cold-start and as baselines.
