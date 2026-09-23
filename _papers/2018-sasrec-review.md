---
title: "[2018] sasrec"
paper_title: "Self-Attentive Sequential Recommendation"
year: 2018
domain: "Recommendation Systems"
model: "SASRec"
venue: "ICDM"
---

# Self-Attention + BCE Loss

## foward

用带 Causal Mask 的 Transformer 对用户历史交互序列进行编码，得到每个时间位置的序列表示，并利用该表示预测下一次交互的 item。

1. Embedding + 位置编码

    item embedding：$\mathbf E \in \mathbb R^{|\mathcal I|\times d}$，每个 item $i_t$ 被映射为 $\mathbf e_t = \mathbf E[i_t]\in\mathbb R^d$；加入 positional embedding：$
    \mathbf x_t = \mathbf e_t+\mathbf p_t$。整个输入为

    $$
    \mathbf X=[\mathbf x_1,\dots,\mathbf x_L]
    \in\mathbb R^{B\times L\times d}.
    $$

2. Causal Self-Attention

    $$
    \operatorname{Attention}(\mathbf Q,\mathbf K,\mathbf V)
    =
    \operatorname{softmax}
    \left(
    \frac{\mathbf Q\mathbf K^\top}{\sqrt d}
    +\mathbf M
    \right)
    \mathbf V.
    $$

    $$
    M_{t,j}
    =
    \begin{cases}
    0,&j\le t\\
    -\infty,&j>t.
    \end{cases} \in \mathbb{R}^ {L \times L}，
    t \ 能看到 \ j \ 就是 \ 0，否则是 -\infty
    $$

    其实就是把 padding 和后续的 item 给 mask 掉

3. Transformer 输出

    经过若干层 Transformer 后得到 $\mathbf H = [\mathbf h_1,\mathbf h_2,\dots,\mathbf h_L]\in\mathbb R^{B\times L\times d}$  
    $\mathbf h_t$ 就是截止到第 $t$ 个 item 时，Transformer 对用户历史兴趣状态的表征

4. Next-Item Prediction

    用点积计算当前序列表示 $\mathbf{h}_t$ 与 item 的匹配分数：

    $$
    r_{t,j}
    =
    \mathbf h_t^\top\mathbf e_j.
    $$

    BCE（Binary Cross-Entropy Loss）（单个负样本 $\mathbf{e}_{j_t^-}$）：
    $$
    \mathcal L_t
    =
    -\log\sigma
    \left(
    \mathbf h_t^\top\mathbf e_{i_{t+1}}
    \right)
    -
    \log\sigma
    \left(
    -\mathbf h_t^\top\mathbf e_{j_t^-}
    \right)
    $$

    $$
    目的是让 \quad
    \mathbf h_t^\top\mathbf e_{i_{t+1}}
    \rightarrow +\infty, \quad
    \mathbf h_t^\top\mathbf e_{j_t^-}
    \rightarrow -\infty.
    $$

    对所有有效的时间位置求和：

    $$
    \mathcal L_u
    =
    \sum_{t\in\mathcal T_u}
    \mathcal L_t,
    $$

    再对 batch 求平均：

    $$
    \boxed{
    \mathcal L
    =
    \frac{1}{B}
    \sum_{u=1}^{B}
    \mathcal L_u
    }
    $$