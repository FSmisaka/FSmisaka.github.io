---
title: "RLHF: Aligning LLMs with Human Preferences"
category: "llms"
date: 2025-06-18
excerpt: "Understanding Reinforcement Learning from Human Feedback — the technique behind ChatGPT and Claude."
---

# RLHF: Aligning LLMs with Human Preferences

RLHF (Reinforcement Learning from Human Feedback) is the technique that transforms a raw language model into a helpful, harmless assistant.

## 1. The Three-Stage Pipeline

### Stage 1: Supervised Fine-Tuning (SFT)

Fine-tune a pretrained LLM on high-quality demonstration data:

- Human annotators write ideal responses to diverse prompts
- Model learns to follow instructions and format outputs
- Result: **SFT model** — already decent, but can be improved

### Stage 2: Reward Model Training

Train a model to predict which response humans prefer:

1. For each prompt, SFT model generates multiple responses
2. Human annotators rank responses (A > B > C)
3. Train a reward model $r_\phi(x, y)$ using the Bradley-Terry preference model:

$$
P(y_1 \succ y_2 \mid x) = \frac{\exp(r_\phi(x, y_1))}{\exp(r_\phi(x, y_1)) + \exp(r_\phi(x, y_2))}
$$

The loss function:

$$
\mathcal{L}(\phi) = -\mathbb{E}_{(x, y_w, y_l)}[\log \sigma(r_\phi(x, y_w) - r_\phi(x, y_l))]
$$

### Stage 3: RL Fine-Tuning

Optimize the SFT model against the reward model using PPO:

$$
\max_\theta \mathbb{E}_{x \sim \mathcal{D}, y \sim \pi_\theta(y|x)}[r_\phi(x, y)] - \beta \cdot \text{KL}(\pi_\theta \| \pi_{\text{SFT}})
$$

The **KL penalty** prevents the model from diverging too far from the SFT model (reward hacking).

## 2. Why RL Instead of Just SFT?

- **Diversity**: SFT learns from fixed examples; RL explores the response space
- **Nuance**: Reward model can capture subtle preferences (tone, safety, helpfulness)
- **Optimization**: RL directly optimizes for human preference, not just mimicking behavior

## 3. Alternatives to PPO

| Method | Approach | Advantage |
|--------|----------|-----------|
| PPO | On-policy RL | Proven, stable |
| DPO | Direct preference optimization | Simpler, no reward model needed |
| RRHF | Rank responses, fine-tune | Very simple |
| Constitutional AI | AI feedback instead of human | Scalable |

### DPO (Direct Preference Optimization)

DPO eliminates the separate reward model. The key insight:

$$
\mathcal{L}_{\text{DPO}}(\theta) = -\mathbb{E}[\log \sigma(\beta \log \frac{\pi_\theta(y_w|x)}{\pi_{\text{ref}}(y_w|x)} - \beta \log \frac{\pi_\theta(y_l|x)}{\pi_{\text{ref}}(y_l|x)})]
$$

This directly optimizes the policy from preference pairs — **simpler, more stable**.

## 4. Practical Considerations

- **Reward hacking**: Models exploit loopholes in the reward model. Mitigation: KL penalty, iterative training
- **Preference data quality**: Garbage in, garbage out. Clear annotation guidelines are crucial
- **Compute**: PPO requires running the model multiple times per update. DPO is more efficient

> **Key takeaway**: RLHF is not magic — it's a principled framework for optimizing LLMs toward human values. The quality of preference data and reward modeling determines the quality of the final model.
