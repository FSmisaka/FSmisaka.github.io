---
title: "[2026] ReaRec"
paper_title: "Think Before Recommend: Unleashing the Latent Reasoning Power for Sequential Recommendation"
year: 2026
domain: "Recommendation Systems"
model: "ReaRec"
venue: "TKDE"
---

# ERL 集成多步思考结果 步步思考异质化且有效 & PRL 先广泛后集中 步步思考有效且不偏离好思考

![架构图](/images/papers/Think%20Before%20Recommend:%20Unleashing%20the%20Latent%20Reasoning%20Power%20for%20Sequential%20Recommendation/ThinkBeforeRec.png)

Insight：提高 inference-time computational depth，复刻推理大模型延长思考时间所涌现出的能力。

感受 1：表面上和 LLM-based 的思考模型有显著差异，但仔细一看真挺相似的，baseline 都是直接输出答案，改进都是在直接输出之前想一想。

感受 2：在开始读之前，我能够想象 ReaRec 就是在传统序列模型之后加入一个思考模块，并且能够想象到 GRU4Rec、SASRec 这种序列模型怎么添加 ReaRec 模块。但我无法想象 Caser 这种不典型的序列模型能不能也加上 ReaRec 组件。

## 任务

传统序列推荐。想法就是让已经学会序列推荐的模型对隐藏层多迭代几次，不过立马引入一个问题：隐藏状态的迭代过程没有监督信号。如果只用最终的结果作为监督信号，模型可能会产生无意义或者错误的思考。

## 数据

用户历史 $[v_1, v_2, \dots]$

查 Emb 得到 $[e_1, e_2, \dots]$

## 前向传播, Loss & Inference

![Overview](/images/papers/Think%20Before%20Recommend:%20Unleashing%20the%20Latent%20Reasoning%20Power%20for%20Sequential%20Recommendation/Overview.png)

### ERL Pipeline 
> Ensemble Reasoning Learning

将多个推理步骤的表示集成起来

#### Forward

1. 第 1 次调用 SeqRec：正常编码用户历史，得到 hidden state 向量 $r_0$

    $[e_1, e_2, \dots]$ $\rightarrow$ 位置编码 $\rightarrow$ SeqRec backbone（比如一个 SASRec 的 MHA） $\rightarrow r_0=$ hidden state

2. 第 2、3、... 次调用 SeqRec：开始思考

    第 $i$ 轮 $(i \geq 1)$：  
    $i-1$ 轮的 hidden state $r_{i-1} \rightarrow$ **思考位置编码 RPE** (Reasoning Position Embedding) $\rightarrow$ 拼接在历史之后 $[e_1, e_2, \dots, r_0, \dots, r_{i-1}] \xrightarrow{\text{SeqRec backbone}} r_i$

    作者专门做了消融，表明 RPE 是非常重要的。如果没有 RPE，Naive multi-step reasoning 会比 baseline 还差；但加入了 RPE 以后性能明显提升。

#### Loss

1. **ERL** (Ensemble Reasoning Learning)：在思考的时候做**监督学习**

    每一轮得到的 $r_i$ 都负责预测 Next Item，正样本是真正的 Next Item。Loss 就是算 CE 并求和

    $$
    \mathcal L_{\text{Rec}}
    =
    -\sum_{i=0}^{K}
    \log
    \hat y^{(i)}_{\text{item}^+}
    $$

    $$
    \hat y^{(i)}
    =
    \operatorname{softmax}(r_iE^\top)
    $$

2. **KL Regularization**：避免思考单元 $r_i$ 同质化

    模型在思考阶段，每一步都是完全一样地在预测最终的 Next Item，因此模型可以很偷懒地让 $r_0 \approx r_1 \approx r_2 \approx \dots$。为了避免这种同质化，引入 KL Regularization

    $$
    \mathcal L_{\mathrm{KL}}
    =
    -\sum_{i=0}^{K-1}
    \sum_{j=i+1}^{K}
    D_{\mathrm{KL}}
    \left(
    \hat y^{(i)}
    \parallel
    \hat y^{(j)}
    \right)
    $$

    $$
    \hat y^{(i)}
    =
    \operatorname{softmax}(r_iE^\top)
    $$

    最小化 $\mathcal L_{\mathrm{KL}}$ 就是最大化不同步 Hidden State $r_i$ 的分布 $\hat{y}^{(i)}$ 的差异

3. 总 Loss

    $$
    \mathcal L_{\mathrm{ERL}}
    =
    \mathcal L_{\mathrm{Rec}}
    +
    \lambda\mathcal L_{\mathrm{KL}}
    $$

### PRL Pipeline 
> Progressive Reasoning Learning

随推理深入逐步细化预测分布

#### Forward

1. 约等于做两次 ERL：  

    第一次做加入了 PTA 修正的 ERL，计算 $\mathcal L_{\mathrm{RCL}}$（但不计算 $\mathcal L_{\mathrm{KL}}$），并且保留 $r_i$ 用于后续计算 infoNCE  
    （这里的 $r_i$ 和 ERL 算的 $r_i$ 是完全一致的；但是 $\mathcal L_{\mathrm{RCL}}$ 是和 ERL 不同的，因为加入了温度系数）  

    第二次做加噪的 ERL，把算出来的 $\tilde{r_i}$ 和第一次计算的 $r_i$ 一起拿去算 infoNCE

2. **PTA 修正** (Progressive Temperature Annealing)：早期思考多探索、后期再集中

    $$
    \hat y^{(i)}
    =
    \operatorname{softmax}
    \left(
    \frac{r_iE^\top}{\tau_i}
    \right)
    $$

    $$
    \tau_i=\tau\alpha^{K-i}, \quad \alpha > 1
    $$

    为什么 $\tau$ 越大，分布越平：$\tau$ 越大，值被缩小，值和值之间的差距也被缩小了。

#### Loss

1. **RCL** (Reasoning-aware Contrastive Learning)：作者给模型人为加噪声，让模型具备抗干扰能力

    推理方向可能偏离正确兴趣分布，且误差可能累积

    $$
    \mathcal L_{\mathrm{RCL}}
    =
    -\sum_{k=1}^{K}
    \log
    \frac{
    \exp\left(\operatorname{sim}(\tilde r_k,r_k^+)/\tau\right)
    }{
    \exp\left(\operatorname{sim}(\tilde r_k,r_k^+)/\tau\right)
    +
    \sum_{r_k^-\in\mathcal R_k^-}
    \exp\left(\operatorname{sim}(\tilde r_k,r_k^-)/\tau\right)
    }.
    $$

    其中 $\tilde r_k$ 是加噪再送入 SeqRec 中的输出向量。

2. 总 Loss

    $$
    \mathcal L_{\mathrm{PRL}}
    =
    \mathcal L_{\mathrm{Rec}}
    +
    \mathcal L_{\mathrm{RCL}}
    $$

## 推理

### ERL Pipeline

用 reasoning state $r_i$ 的平均去做推荐（和所有 item Emb 算相似度，取分数最大的 TopN item）

$$
h_u=
\frac{1}{K+1}
\sum_{i=0}^{K}r_i
$$

$$
\hat y=\operatorname{softmax}(h_uE^\top)
$$

### PRL Pipeline

只取最后一步的 $r_K$，不对所有推理状态取平均，也不使用加噪后的 $\tilde r_K$。

$$
\hat y=\operatorname{softmax}(r_KE^\top)
$$

# 论文做了哪些实验

- ReaRec 有用

- 对各个组件的消融

- 思考步数 K = 2 基本上是最优

- 短序列用户和低频 item 收益更大