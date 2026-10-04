---
title: "[2018] sasrec"
paper_title: "Self-Attentive Sequential Recommendation"
year: 2018
domain: "Recommendation Systems"
model: "SASRec"
venue: "ICDM"
---

# 通过 Self-Attention 学习用户交互历史的表征 + BCE Loss

## 1. 任务

序列推荐，输入用户按时间排序的历史交互序列，预测下一次交互 item。目标是建模用户当前兴趣状态，做 next-item prediction。

## 2. 数据

取最近 $L$ 个 item 作为输入；不足 $L$ 个就 padding。

## 3. 前向传播

### Embedding + 位置编码

   item embedding：$\mathbf E \in \mathbb R^{|\mathcal I|\times d}$，每个 item $i_t$ 被映射为 $\mathbf e_t = \mathbf E[i_t]\in\mathbb R^d$；加入 positional embedding：

   $$
   \mathbf x_t = \mathbf e_t+\mathbf p_t.
   $$

   整个输入为：

   $$
   \mathbf X=[\mathbf x_1,\dots,\mathbf x_L]
   \in\mathbb R^{B\times L\times d}.
   $$

### Causal Self-Attention

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
   M_{q,k}
   =
   \begin{cases}
   0,&k\le q\\
   -\infty,&k>q.
   \end{cases}
   \in \mathbb{R}^{L \times L}
   $$

   作用：$q$ 只能看当前及过去的 $k$，mask 掉 padding 和未来 item。

### Transformer 输出

   经过若干层 Transformer 后得到：

   $$
   \mathbf H = [\mathbf h_1,\mathbf h_2,\dots,\mathbf h_L]\in\mathbb R^{B\times L\times d}.
   $$

   $\mathbf h_t$ 就是截止到第 $t$ 个 item 时，Transformer 对用户历史兴趣状态的表征。

### Next-Item Prediction

   用点积计算当前序列表示 $\mathbf h_t$ 与 item 的匹配分数：

   $$
   r_{t,j}
   =
   \mathbf h_t^\top\mathbf e_j.
   $$

## 4. 损失函数：BCE

BCE（Binary Cross-Entropy Loss），单个负样本 $\mathbf{e}_{j_t^-}$：

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

目的是让：

$$
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

## 5. 推理

给模型输入用户最近 $L$ 个历史交互，取最后一个位置的序列表示 $\mathbf h_L$，与所有 item embedding 做点积：

$$
r_{L,j}=\mathbf h_L^\top\mathbf e_j.
$$

按分数排序，取 top-N 推荐；通常排除已交互 item。

## 6. 为什么有效

- 将 **self-attention / Transformer** 用于序列推荐，用 causal mask 做自回归 next-item 预测。
- 注意力可动态加权历史 item，同时捕捉长短期依赖和 item-item 转移。
- 相比 RNN：可并行训练，无顺序瓶颈；相比 CNN：不受固定局部窗口限制。
- 位置编码保留顺序信息，mask 防止未来泄漏；BCE + 负采样适配隐式反馈排序。
- 相比 Caser：Caser 靠卷积捕捉局部 union-level 和全局偏好；SASRec 用注意力自适应看任意距离历史，长依赖建模更灵活。