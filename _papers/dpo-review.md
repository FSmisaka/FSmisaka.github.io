---
title: "DPO — Direct Preference Optimization"
paper_title: "Direct Preference Optimization: Your Language Model is Secretly a Reward Model"
year: 2024
domain: "LLMs"
model: "DPO"
venue: "NIPS"
---

# DPO: Direct Preference Optimization

> **Paper**: Direct Preference Optimization: Your Language Model is Secretly a Reward Model (NIPS 2023)

## 1. Motivation

Standard RLHF has three stages:
1. **SFT**: Fine-tune on demonstrations
2. **Reward Modeling**: Train a reward model on human preferences
3. **PPO**: Optimize the policy against the reward model

This is **complex, unstable, and resource-intensive**. DPO asks: do we really need stages 2 and 3?

## 2. The Key Insight

The authors derive a **closed-form mapping** between the optimal reward function and the optimal policy:

$$
r^*(x, y) = \beta \log \frac{\pi^*(y|x)}{\pi_{\text{ref}}(y|x)} + \beta \log Z(x)
$$

This means: **you can express preferences directly as a function of the policy**, without an explicit reward model.

Plugging this into the Bradley-Terry preference model yields the DPO loss:

$$
\mathcal{L}_{\text{DPO}} = -\mathbb{E}_{(x, y_w, y_l)} \left[ \log \sigma \left( \beta \log \frac{\pi_\theta(y_w|x)}{\pi_{\text{ref}}(y_w|x)} - \beta \log \frac{\pi_\theta(y_l|x)}{\pi_{\text{ref}}(y_l|x)} \right) \right]
$$

## 3. Why This Works

The loss has an intuitive interpretation:

- **Increase** the log-probability of the preferred response $y_w$ relative to the reference model
- **Decrease** the log-probability of the dispreferred response $y_l$ relative to the reference model
- $\beta$ controls how far the policy can deviate from the reference

This is essentially a **binary cross-entropy loss** on preference pairs — no RL needed.

## 4. Results

- Matches or exceeds PPO-based RLHF on summarization and dialogue
- More stable training (no reward model divergence)
- Computationally cheaper (no sampling from the policy during training)
- Better at avoiding reward hacking

## 5. Personal Takeaway

DPO is elegant in its simplicity. Key insights:

1. **The reward model was always redundant**: If preferences come from a Bradley-Terry model, the optimal policy implicitly defines the optimal reward
2. **Simplicity wins**: DPO has been adopted by most open-source LLM projects (Zephyr, Llama 3, etc.)
3. **Limitations**: DPO assumes pairwise preferences; real human feedback is often more complex. Also, DPO can still overfit to preference data

The natural next step: extending DPO to handle more complex feedback types (rankings, critiques, demonstrations).
