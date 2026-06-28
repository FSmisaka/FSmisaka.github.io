---
title: "Deep Learning for Recommendation: A Survey"
category: "recommendation-systems"
date: 2025-06-10
excerpt: "Surveying NCF, DeepFM, DIN, and other deep learning approaches to recommendation."
---

# Deep Learning for Recommendation: A Survey

Deep learning has revolutionized recommendation systems. Here's a structured overview of key architectures.

## 1. Why Deep Learning for RecSys?

Traditional methods (MF, FM) capture **linear** interactions. Deep learning can model **non-linear**, **high-order** feature interactions automatically.

Key advantages:
- Learn complex feature interactions without manual engineering
- Handle diverse data types (text, images, sequences)
- End-to-end training from raw features

## 2. Neural Collaborative Filtering (NCF)

Instead of the inner product $p_u^T q_i$, NCF uses a neural network to learn the interaction function:

```python
# Simplified NCF architecture
user_embedding = Embedding(n_users, latent_dim)(user_input)
item_embedding = Embedding(n_items, latent_dim)(item_input)

# MLP path
mlp = Concatenate()([user_embedding, item_embedding])
mlp = Dense(64, activation='relu')(mlp)
mlp = Dense(32, activation='relu')(mlp)

# GMF path (element-wise product)
gmf = Multiply()([user_embedding, item_embedding])

# Fusion
output = Concatenate()([mlp, gmf])
output = Dense(1, activation='sigmoid')(output)
```

**Key insight**: NCF generalizes MF — the GMF path reduces to MF when using identity activation and no hidden layers.

## 3. DeepFM

Combines **FM** (for low-order interactions) with **DNN** (for high-order interactions):

$$
\hat{y} = \sigma(y_{FM} + y_{DNN})
$$

Where:
- $y_{FM}$ captures order-1 (linear) and order-2 (pairwise) feature interactions
- $y_{DNN}$ captures higher-order interactions through deep layers
- Both share the **same input embeddings** (key design choice!)

## 4. DIN (Deep Interest Network)

For CTR prediction, different user behaviors have **different relevance** to different candidate items:

- Use **attention** to adaptively weight user behavior sequence based on candidate item
- "Activation unit": computes attention weight between each behavior and the candidate
- Pooling is weighted sum rather than simple average

## 5. Two-Tower / DSSM Architecture

Separate user and item towers for efficient retrieval:

1. **User Tower**: Encode user features → user embedding
2. **Item Tower**: Encode item features → item embedding  
3. **Similarity**: Cosine/inner product between embeddings
4. **Training**: Typically sampled softmax or in-batch negatives

**Key advantage**: Item embeddings can be pre-computed and indexed for fast ANN retrieval (FAISS, ScaNN).

## 6. Practical Recommendations

- **Start simple**: FM / DeepFM often beats complex models on tabular data
- **Use two-tower for large-scale retrieval**: Essential for industrial systems
- **Sequence models for user history**: DIN, DIEN, SIM for capturing temporal dynamics
- **Cold start**: Content-based features + warm-start via pretraining

> **Trend**: LLMs are increasingly used for recommendation (LLM4Rec), enabling zero-shot recommendation via natural language understanding.
