---
title: "[2025] kuaishou Survey: Generative Recommendation"
paper_title: "A Survey of Generative Recommendation from a Tri-Decoupled Perspective: Tokenization, Architecture, and Optimization"
year: 2024
domain: "Recommendation Systems"
model: "Survey"
venue: "arxiv"
---

# 生成式推荐的语义ID表示学习、架构以及强化学习对齐

## 1. Motivation

> Abstarct + [1] Introduction + [2] Background and Preliminary

### 传统推荐算法的瓶颈
1. **Embedding的问题**:  
    【冷启动问题】: embedding是靠交互数据学出来的，冷门物品、新物品冷启动差  
    【计算低效】: embedding稀疏且庞大，查表效率低  

2. **模型架构的问题**:  
    【MFU (Model FLOPs Utilization) 低】: 判别式搜推都是小而碎的异构算子，不是端到端的矩阵运算  
    【Scaling up】: 模型 Modest-sized 规模，Scale 不上去  

3. **优化目标的问题**:  
    【优化目标是局部的】: 只在正负样本之间划边界，而且不同阶段 (比如召回和排序) 的目标还不一样  
    【预测误差的级联】  

### 生成式推荐 & 想解决什么
1. **Tokenization - Semantic ID**:  
    带语义的embedding解决冷启动问题；词表更紧凑，计算更高效  

2. **Architecture - Encoder-Decoder｜Decoder only｜Diffusion-based**:  
    架构改变带来 MFU 的提高；能随时用上 LLM 的最新技术  

3. **Optimization - Next-Token Prediction & RL 偏好对齐**:  
    直接端到端优化  

![生成式 vs 判别式](/images/papers/A%20Survey%20of%20Generative%20Recommendation%20from%20a%20Tri-Decoupled%20Perspective:%20Tokenization,%20Architecture,%20and%20Optimization/Comparison%20of%20discriminative%20and%20generative%20recommendation%20paradigms.PNG)