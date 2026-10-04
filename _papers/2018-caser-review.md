---
title: "[2018] caser"
paper_title: "Personalized Top-N Sequential Recommendation via Convolutional Sequence Embedding"
year: 2018
domain: "Recommendation Systems"
model: "Caser"
venue: "WSDM"
---

# 通过卷积学习用户交互历史的表征 + BCE Loss

## 1. 任务

序列推荐，输入是历史交互序列，输出是下一个推荐的物品

## 2. 数据

用大小 $L+T$ 的窗口在用户序列上滑动。

- 输入：前 $L$ 个物品 $S_{t-L:t-1}$ 组成的”图像“ $E^{(u,t)}$
- 目标：后 $T$ 个物品 $S_{t:t+T-1}$

每个物品 $i$ 有嵌入 $Q_i \in \mathbb{R}^d$。按顺序堆叠输入物品的嵌入：

$$
E^{(u,t)}=
\begin{bmatrix}
Q_{S_{t-L}^u}\\
\vdots\\
Q_{S_{t-1}^u}
\end{bmatrix}
\in \mathbb{R}^{L\times d}
$$

用户嵌入 $P_u \in \mathbb{R}^d$ 先保留，后面使用。

## 3. 前向传播

### 水平卷积

有 $n$ 个水平过滤器 $F^k \in \mathbb{R}^{h\times d}$，高度 $h$ 代表处理 $h$ 个物品。过滤器在 $E$ 的行方向滑动：

$$
c_i^k=\phi_c\big(\langle E_{i:i+h-1},F^k\rangle\big)
$$

$$
c^k=[c_1^k,\dots,c_{L-h+1}^k] \in \mathbb{R}^{L-h+1}
$$

每个 $c^k$ 都是一个列向量，对它们做 max pooling：

$$
o=[\max(c^1),\dots,\max(c^n)]\in\mathbb{R}^n
$$

作用：捕捉连续 $h$ 个物品的联合序列模式。

### 垂直卷积

有 $\tilde n$ 个垂直过滤器 $\tilde F^k \in \mathbb{R}^{L\times 1}$。它与 $E$ 的每一列做内积，等价于对 $L$ 个历史物品嵌入做加权和：

$$
\tilde c^k=\sum_{l=1}^{L}\tilde F_l^k E_l \in \mathbb{R}^d
$$

输出拼接为：

$$
\tilde o=[\tilde c^1,\dots,\tilde c^{\tilde n}]\in\mathbb{R}^{d\tilde n}
$$

不做 max pooling，代表与顺序无关的全局偏好。

### 全连接与输出

拼接水平卷积和垂直卷积的输出：

$$
z=\phi_a(W[o;\tilde o]+b)
$$

$z\in\mathbb{R}^d$ 是卷积序列嵌入。再拼接用户嵌入 $P_u$，输出每个物品的分数：

$$
y^{(u,t)}=W'[z;P_u]+b'\in\mathbb{R}^{|\mathcal I|}
$$

本仓库的实现：$y=z \times \text{Emb}^\top \in \mathbb{R}^{d} \times \mathbb{R}^{d \times |\mathcal I|} = \mathbb{R}^{|\mathcal I|}$，也就是让卷积序列嵌入和每个 $item$ 嵌入做点积

## 4. 损失函数：BCE

1 个正样本（真实下一个点击的 item）、3 个负样本（简单随机负样本），首先在 $y \in \mathbb{R}^{|\mathcal{I}|}$ 上索引到模型给 4 个样本的打分，然后分别经过 sigmoid 得到目标物品概率：

$$
p(S_t^u\mid S_{t-1}^u,\dots,S_{t-L}^u)=\sigma(y_{S_t^u}^{(u,t)})
$$

之后算 BCE 并加和得到 Loss。若 $T>1$，模型同时预测未来 $T$ 个物品，用来建模 skip behavior。

## 5. 推理

给模型输入历史交互序列 $L$，得到卷积序列表示 $\mathbf z_L$，与所有 item embedding 做点积：

$$
y_{L,j}=\mathbf z_L^\top\mathbf e_j.
$$

按分数排序，取 top-N 推荐

## 6. 为什么有效

前面模型只能做到 point-level 的序列推荐，Caser 想做到 union-level 和 skip behavior

![motivation](/images/papers/Personalized%20Top-N%20Sequential%20Recommendation%20via%20Convolutional%20Sequence%20Embedding/motivation.png)