---
title: "[2016] gru4rec"
paper_title: "Session-based Recommendations With Recurrent Neural Networks"
year: 2016
domain: "Recommendation Systems"
model: "GRU4Rec"
venue: "ICLR"
---

# 1-layer GRU + session-parallel mini-batch + batch 内负采样 + BPR Loss

## 0. 论文

论文定义了 Session-based，意思是只根据当前 session 用户的交互 item 来做推荐，而不使用 user profile。  
原因是网站不维护 User Profile（例如用户不登陆），或 User ID 本来就无意义。

2016 年之前的推荐存在各种问题：
1. I2I 召回：只关注最近一次的交互物品
2. Markov / transition model 建模 $P(i_{t+1}|i_t)$：无法把全量历史塞进来
3. Factorization 把 Session 压缩为一个向量：没有建模顺序

彼时 RNN 在 NLP 任务上非常成功，但是直接照搬存在问题：推荐的物品比词表数量大，因此重新进行了设计：

1. **问题层面**：把没有 user ID 的推荐明确建模成 sequence prediction。
2. **模型层面**：用 GRU 记住整个 session，而不是只看最后一个 item。
3. **工程训练层面**：为推荐系统重新设计了 session-parallel mini-batch、output sampling 和 ranking loss，使 RNN 真正能在几十万 item 的推荐空间里训练。

## 1. 任务

序列推荐，只根据交互历史做推荐

## 2. 数据

每个物品都做 One-hot 编码，$x_t = \text{One-hot}(i_t)$。

## 3. 前向传播

每一个时间步接受当前物品和当前 Hidden State，输出下一个 Hidden State
$$
h_{t} = \text{GRU}(x_t, h_{t-1})
$$

GRU 内部则包含 update gate、reset gate 和 candidate state  

1. update gate：$ z_t=\sigma(W_zx_t+U_zh_{t-1}) $

2. reset gate：$ r_t=\sigma(W_rx_t+U_rh_{t-1}) $

3. candidate state：$ \tilde h_t = \tanh \left( Wx_t+U(r_t\odot h_{t-1}) \right) $

4. 最后 $ h_t = (1-z_t)\odot h_{t-1} + z_t\odot\tilde h_t $

对 GRU 的理解：$z_t$ 会由当前物品 $x_t$ 和历史状态 $h_{t-1}$ 决定。当 $x_t$ 和 $h_{t-1}$ 接近时，比如以前一直在看球鞋，现在也在看球鞋，那么 $z_t$ 可能会比较小，维持之前的 hidden state。但是如果以前在看球鞋，现在突然开始看奶瓶，那么 $z_t$ 可能会比较大，会大幅更新 hidden state。

输出层使用 $h_{-1}$ 计算 $[ \hat r_1,\hat r_2,\ldots,\hat r_{|\mathcal{I}|} ]$，其中 $ \hat r_i $ 表示当前 session 下 $\text{item}_{i}$ 作为下一 item 的 preference score。

最后取 $\text{TopK}(\hat{\mathbf r}_t)$ 为推荐结果。

## 4. 训练上的设计

### session-parallel mini-batch

假设 batch size = 3，即有三个 session：

$S_1: A → B → C$  
$S_2: D → E$   
$S_3: F → G → H → I$  

- Mini-batch 1

    输入：$[A,D,F]$  
    目标：$[B,E,G]$  
    输出：$h_1^{S1},h_1^{S2},h_1^{S3}$

- Mini-batch 2

    输入：$[B,E,G]$, $[h_1^{S1},h_1^{S2},h_1^{S3}]$  
    目标：$ [C,\text{end},H] $  
    输出：$h_2^{S1},h_2^{S2},h_2^{S3}$

- Mini-batch 3

    输入：$[C,\_,H]$, $[h_2^{S1},\_,h_2^{S3}]$  
    目标：$ [\text{end},\_,I] $  

    $S_2$ 的位置可以放入一个新 session（session 结束后，将新的 session 放入对应 batch slot，并重置这个位置的 hidden state；不同 session 被假设为相互独立）。  

一个 mini-batch 的状态：
$ (\mathbf X_t,\mathbf h_{t-1}) \xrightarrow{\text {GRU}} (\mathbf h_t,\mathbf{\hat r}_t(\mathbf h_t)) \rightarrow \mathcal L_t \rightarrow \text{GRU 参数} $
  
$\mathbf X_t$：这个 batch 当前时刻的输入 item  
$\mathbf h_{t-1}$：这个 batch 中每个 session 各自携带过来的 hidden state  
$\mathbf h_t$：经过 GRU 后的新 hidden state  
$\hat{\mathbf r}_t$：对候选 item 的 scores  
$\mathcal L_t$：当前 batch 的 loss  

### output sampling：batch 内负采样

目标向量中，本 session 的 item 为正样本，其余 session 的均为负样本

利用 $h_t$ 直接计算被采样 item 对应的 output scores（比如用 $h_t$ 和被采样 item 算点积）：

$$h_t \rightarrow [\hat{r}_{i^+}, \hat{r}_{i_1^-}, \dots, \hat{r}_{i_{BatchSize-1}^-}]$$

### ranking loss：BPR Loss

$$ \mathcal L_{\text{BPR}} = -\frac{1}{N_S} \sum_{j=1}^{N_S} \log \sigma (\hat r_i-\hat r_j) $$

$i$：真实 next item  
$j$：negative item  
$N_S$：negative sample 数量

## 5. 推理

$h_{t} = \text{GRU}(x_t, h_{t-1})$ `for t in sequence`  
$h_{-1} \rightarrow [\hat{r}_{1}, \hat{r}_{2}, \dots, \hat{r}_{|\mathcal{I}|}]$，取 $\text{TopK}(\hat{\mathbf r}_t)$ 为推荐结果。
