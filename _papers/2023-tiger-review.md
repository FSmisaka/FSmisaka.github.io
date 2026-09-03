---
title: "[2023] tiger"
paper_title: "Recommender Systems with Generative Retrieval"
year: 2023
domain: "Recommendation Systems"
model: "TIGER"
venue: "NIPS"
---

# TIGER、Semantic ID 和 生成式推荐

## 1. Intro

TIGER (Tranformer Index for GEnerative Recommenders):  
item 基本信息 $\xrightarrow{Content Encoder}$ Embedding $\xrightarrow{Quantization}$ Semantic ID

作者剧透了 TIGER 的优点:  
1. 相似物品可以共享知识（有语义了）；  

2. 缓解 Feedback Loop 问题（模型过去的推荐决定了用户能够接触到什么，用户由此产生的交互又进入未来的训练数据，从而进一步影响模型的后续推荐。这个过程会放大 popularity bias、selection/sampling bias 等问题）：Semantic ID 可以对冷门/长尾物品做推荐；  

3. 大幅降低 Item Corpus 的表示空间。传统的 Sparse ID 太悉数了。而 Semantic ID 的表示空间是每个 code 取值数量的乘积  

![overview](/images/papers/Recommender%20Systems%20with%20Generative%20Retrieval/overview_of_tiger.png)

## 2. Method

分为两个阶段：
1. Semantic ID generation  

    ![RA-VAE](/images/papers/Recommender%20Systems%20with%20Generative%20Retrieval/RQ-VAE.png)  

    <b>RQ</b>：

    &emsp;&emsp;假设最左边 DNN Encoder 输出的向量是 $r_0$（蓝色）。它会找到 codebook 1 中最相似的向量 $e_{c_0}$（红色），$c_0$ 是该 code 的编号，比如图中就是 7。然后会计算残差 $r_1 = r_0 - e_{c_0}$。并把 $r_1$ 扔到下一个 codebook 中做匹配。  

    &emsp;&emsp;最终得到的 code 组合 $\{c_0, c_1, c_2\}$ 就是 Semantic ID

    &emsp;&emsp;希望 Semantic IDs 有如下的性质：相似物品的 ID 应当有重叠；

    <b>VAE</b>：

    &emsp;&emsp;首先是 <b>AE</b>，即入口处出口处的 Encoder 和 Decoder。AE 希望学习 $x \xrightarrow{Encoder} z \xrightarrow{Decoder} x$，这样就能够在 <b>latent space</b> 潜空间里面随机采样一个 $z$，利用 $z \rightarrow x$ 来生成数据。

    &emsp;&emsp;<b>VAE</b>：AE 的 Encoder 会映射到离散的高维向量上。这出现的问题是，随机采样的 $z$ 不一定能够通过 Decoder 映射回一个有意义的 $x$。于是 VAE 修正 Encoder 将 $x$ 映射到一个高维向量分布上。也就是说 $z$ 会对应一小部分概率区域。Decoder 也是同理，会根据具体的向量 $z$（不是分布）生成 $x$ 的概率分布。

    <b>RQ-VAE 的训练</b>：

    &emsp;&emsp;训练目标：
    $$
    L=L_{\mathrm{recon}}+L_{\mathrm{RQ}}
    $$
    其中 $L_{\mathrm{recon}}$ 使 Decoder 能由 $z_q$ 重建原始输入；$L_{\mathrm{RQ}}$ 用于约束 Encoder latent 与选中的 codebook vectors 对齐，通常包含 codebook loss + commitment loss。

    &emsp;&emsp;由于 nearest-neighbor / $\arg\min$ 不可导，训练时通常使用 Straight-Through Estimator (STE)，使 reconstruction gradient 能穿过 quantization 回传到 Encoder。前向传播时真正使用量化后的 $z_q$（去 codebook 里找到的最近的向量），反向传播时则假装 quantization 是恒等映射（假装没有去 codebook 里找最近的向量，而是直接传递给 Decoder 了），让梯度直接“穿过去”。典型写法：
    $$
    z_{\mathrm{ST}}=z+\operatorname{sg}(z_q-z)
    $$
    前向时 $z_{\mathrm{ST}}=z_q$，但反向时
    $$
    \frac{\partial z_{\mathrm{ST}}}{\partial z}=1
    $$
    因此 reconstruction gradient 可以继续更新 Encoder。

2. 训练一个生成式推荐系统  

    &emsp;&emsp;用户行为序列 $\rightarrow (c_{1, 0}, \dots, c_{1, m-1}, c_{2, 0}, \dots, c_{2, m-1}, \dots, c_{n,0}, \dots, c_{n, m-1})$。根据用户下一个点击的物品来训练一个序列到序列模型。

    &emsp;&emsp;推理：用户历史 LastN $\xrightarrow{Tokenizer}$ Semantic ID 序列 $\xrightarrow{Seq2Seq}$ 某个（可能存在也可能不存在）物料的 Semantic ID $\xrightarrow{Decoder}$ 物料