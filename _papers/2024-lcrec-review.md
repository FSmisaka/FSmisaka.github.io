---
title: "[2024] LCRec"
paper_title: "Adapting Large Language Models by Integrating Collaborative Semantics for Recommendation"
year: 2024
domain: "Recommendation Systems"
model: "LCRec"
venue: "ICDE"
---

# 均匀语义映射 & 用 LLM 而不是 Transformer

## Uniform Semantic Mapping

LLM 学的是 language semantics，而推荐系统蕴含的是 collaborative semantics，两者之间存在巨大的 semantic gap

LC-Rec 相较于 TIGER 等方法的关键创新在于**均匀语义映射 (Uniform Semantic Mapping) 机制**。标准的向量量化方法存在索引冲突问题：多个不同物品可能被映射到相同的索引序列。这是不可接受的。为此，TIGER 通常通过增加额外的索引层来解决冲突，但这会引入语义无关的噪声，影响模型对索引语义的理解。

LC-Rec 提出的均匀语义映射方法从根源上缓解这一问题。其核心思想是在最后一层量化时引入均匀分布约束，确保物品在码本向量上的分配尽可能均衡。形式上建模为最优传输问题：

$$
\begin{aligned}
\min_{\mathbf{r}_H}\quad
&\sum_{\mathbf{r}_H\in\mathcal{B}}\sum_{k=1}^{K}
q(c_H=k\mid\mathbf{r}_H)
\left\|\mathbf{r}_H-\mathbf{v}_k^{H}\right\|^2\\
\text{s.t.}\quad
&\sum_{k=1}^{K}q(c_H=k\mid\mathbf{r}_H)=1
\end{aligned}
$$

理解：给定最后一层的残差 $\mathbf r_H$，对于码本中的第 $k$ 个码 $\mathbf v_k^H$，残差到码的距离 $\|\mathbf{r}_H-\mathbf{v}_k^{H}\|^2$ 越大，映射到这个码的概率 $q(c_H=k\mid\mathbf r_H)$ 越小。

## Alignment Tuning

设计了 5 类任务来微调 LLM，让 LLM 认识这些 SID

![SFT](/images/papers/Adapting%20Large%20Language%20Models%20by%20Integrating%20Collaborative%20Semantics%20for%20Recommendation/SFT.png)

1. [A] Sequential Item Prediction

    $P(\text{target index}\mid\text{historical indices})$，给历史 SID，预测 SID  
    SIDReasoner 任务 3

2. [B] Explicit Index-Language Alignment

    $\text{title + description} \xleftrightarrow{\text {LLM}} \text{SID}$  
    SIDReasoner 任务 6

3. [C1] Asymmetric Item Prediction

    SID 序列 $\xrightarrow{预测}$ title + description  
    title + description 序列 $\xrightarrow{预测}$ SID  
    SIDReasoner 任务 4、5

4. [C2] Item Prediction Based on User Intention

    用户意图 (搜索) $\rightarrow$ SID  
    类似 SIDReasoner 任务 7、8

5. [C3] Personalized Preference Inference

    SID 序列 $\rightarrow$ 自然语言描述的用户偏好  
    类似 SIDReasoner 任务 7、8