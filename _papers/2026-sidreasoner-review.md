---
title: "[2026] sidreasoner"
paper_title: "Reasoning over Semantic IDs Enhances Generative  Recommendation"
year: 2026
domain: "Recommendation Systems"
model: "SIDReasoner"
venue: "KDD"
---

# SID、SID-language 对齐、Reinforced Reasoning Enhancement

## 1. 动机

两个 fundamental challenges:  
1. LLM 不认识 SID，SID token 是人为加入进 tokenizer vocabulary 的  
2. 推荐的 Reasoning 缺乏监督信号，无法获知用户是在怎样的思考下先购买了 A B C，最后买了 D  

论文要解决的问题：如何不依赖大量人工 推荐CoT 标注，让 pretrained LLM 理解 SID，并完成 Reasoning

1. 对齐：LLM 具备推理能力，不需要教 LLM 推理，只需要教 LLM SID 语言
2. 推理：用 GRPO 挑选效果最好的推理链路

## 2. Methodology

### 离线准备 SID

item $\rightarrow$ Emb $\rightarrow$ SID $\rightarrow$ LLM vocab

### SID-language 对齐

1. teacher 模型合成语料  
    - Item-centric Semantic Enrichment：结构化分析商品 $\rightarrow$ 融合成连贯文字（item 替换为 SID tokens）
    - User-centric Semantic Enrichment：以分析师口吻，分析和推理用户交互历史（item 替换为 SID tokens）

2. 多任务混合训练 SFT  
构造 8 种语料，全部扔进一个池子打乱，用同一个 NTP 损失训练 LLM。所谓的多任务只代表训练数据的多样性

### 强化推理

1. 冷启动 SFT  
对 LLM 做全参微调，按照自回归的范式做训练。每一个训练样本将 system、user 和 assistant prompt 拼在一起。只会对 assistant 部分算 loss，目的是让模型学会按照格式输出（`<think> </think> SID`），而不是学会推理。

```
[user] The user has sequentially interacted with items <a_1><b_25><c_254>, ... Let's think step by step ...
[assistant] <think>\n这位用户明显偏爱策略 RPG，<a_1><b_25><c_254>和<a_1><b_25><c_194>都指向火纹系列...\n</think>\n\n<a_162><b_214><c_137>
```

2. GRPO  
每个 prompt 生成 16 条思维链 + SID，相当于同一个考试让考生写 16 条答案。于是能找到相对更好/更差的答案，从而更新思维链上每个 token 的生成概率。

### 推理

- 输入：prompt + 用户交互历史的 SID 拼接
- 输出：推理 $\rightarrow$ 生成 next-item-SID $\rightarrow$ grounding 到具体的 item
- 评估：用 beam search 得到每个用户的前 K 个 SID 候选。用用户真实交互的下一个 SID 来计算 Recall@K 和 NDCG@K。

## 3. 论文中一些有意思的观点

1. LLM 会推理，只是看不懂 SID
2. 对于监督信号的缺失，可以用验证的结果作为 reward、绕开有监督的训练
3. 学术界的规模能做 SID-LLM 对齐，前提是需要强 teacher 来合成语料。（之前认为需要工业级预训练）