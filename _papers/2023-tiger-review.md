---
title: "[2023] tiger"
paper_title: "Recommender Systems with Generative Retrieval"
year: 2023
domain: "Recommendation Systems"
model: "TIGER"
venue: "NIPS"
---

# TIGER、Semantic ID 和 生成式推荐

## 0. 论文
### Intro

TIGER (Tranformer Index for GEnerative Recommenders):  
item 基本信息 $\xrightarrow{Content Encoder}$ Embedding $\xrightarrow{Quantization}$ Semantic ID

作者剧透了 TIGER 的优点:  
1. 相似物品可以共享知识（有语义了）；  

2. 缓解 Feedback Loop 问题（模型过去的推荐决定了用户能够接触到什么，用户由此产生的交互又进入未来的训练数据，从而进一步影响模型的后续推荐。这个过程会放大 popularity bias、selection/sampling bias 等问题）：Semantic ID 可以对冷门/长尾物品做推荐；  

3. 大幅降低 Item Corpus 的表示空间。传统的 Sparse ID 太悉数了。而 Semantic ID 的表示空间是每个 code 取值数量的乘积  

![overview](/images/papers/Recommender%20Systems%20with%20Generative%20Retrieval/overview_of_tiger.png)

### Method

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

## 1. 任务

序列推荐（next-item prediction），但范式从判别式的「全目录打分 + 排序」换成**生成式检索（Generative Retrieval）**：输入用户历史交互序列，模型像机器翻译一样**自回归地逐 token 生成下一个物品的 Semantic ID（SID）**，再由 SID 映射回具体物品。这一范式源自信息检索中的 DSI（Differentiable Search Index：把检索当成「生成 doc ID」的 seq2seq 任务）；TIGER 是第一个把它引入推荐、并用 RQ-VAE 语义 ID 定义「物品 ID 该长什么样」的工作。

## 2. 数据

每个物品的 SID 由 RQ-VAE 离线产出：$\mathrm{SID}(i)=(c_{i,0},c_{i,1},\dots,c_{i,m-1})$，共 $m$ 层码，每层取值 $[0,K)$（本仓库 $m=3,\ K=256$）。

- 输入（encoder 侧）：历史物品的 SID 按层展平拼接 $(c_{1,0},c_{1,1},c_{1,2},\ c_{2,0},c_{2,1},c_{2,2},\ \dots)$，取最近 $N$ 个物品（本仓库 $N=10$，即最多 $3N=30$ 个 token）
- 目标（decoder 侧）：下一个物品的 SID + 结束符 $(c^\star_0,c^\star_1,c^\star_2,\langle\mathrm{EOS}\rangle)$，定长 4 个 token

词表大小 $=2+mK$（2 个特殊 token：PAD/EOS；本仓库 $2+3\times 256=770$）。第 $\ell$ 层的码 $c$ 编码为 token id $2+\ell K+c$，即**同一个码值在不同层是不同的 token**；解码时用 $(t-2)\bmod K$ 还原码值。

本仓库的实现：每个样本一行（`history_item_sid`, `item_sid`），batch 内按最长序列 padding（PAD=0）并配 `attention_mask`。

## 3. 前向传播

backbone 是标准 encoder-decoder Transformer。本仓库直接用 HuggingFace `T5ForConditionalGeneration` 从零训练（d_model=128、d_ff=512、encoder/decoder 各 2 层、4 头、dropout 0.1，ReLU FFN）。

### Encoder：双向编码历史

对历史 SID token 序列做**双向** self-attention（只 mask padding），得到上下文表征：

$$
\mathbf H_e=\mathrm{Enc}(\mathbf x_1,\dots,\mathbf x_{3N})\in\mathbb R^{L\times d}.
$$

Encoder Block:  
```text
x → LN → Self-Attention（双向，只 mask padding）→ Dropout → +x（残差连接）  
  → LN → FFN(128→512→ReLU→128) → Dropout → +x
```

### Decoder：自回归 + 交叉注意力

训练时 teacher forcing：每一步都拿真值前缀当输入，而不是用模型自己输出的 token 当输入。每一步 = causal self-attention（只看已生成的部分）+ cross-attention（看 encoder 输出 $\mathbf H_e$）+ FFN，再投影到词表：

$$
P(c_t\mid c_{<t},\ \mathrm{history})=\mathrm{softmax}\big(\mathbf W h_t\big)\in\mathbb R^{|\mathcal V|}.
$$

即：由历史预测第 1 层码；由历史 + 第 1 层码预测第 2 层码；……；最后由完整 SID 预测 EOS。SID 的层级结构就是生成的顺序：由粗到细。

Decoder Block:  
```
x → LN → Causal Self-Attention → +x
  → LN → Cross-Attention（Q 来自 x，K/V 来自 encoder 输出）→ +x
  → LN → FFN → +x
```

（T5 的几个非标准细节：Pre-LN + RMSNorm、相对位置偏置而非绝对位置编码、注意力不做 $1/\sqrt d$ 缩放、embedding 与输出投影 tie 权重。）

## 4. 损失函数

teacher-forcing 交叉熵，对目标序列逐位求和：

$$
\mathcal L=-\sum_{t=1}^{m+1}\log P\big(c^\star_t\mid c^\star_{<t},\ \mathrm{history}\big).
$$

没有负采样、没有排序 loss——「检索物品」被彻底转化为「生成目标 token 序列」的多分类问题。

本仓库的实现：HF T5 自带的 `CrossEntropyLoss`（无 label smoothing；目标定长 4 个 token，无需 -100 mask）。优化器 Adam lr=1e-3（可选 Adafactor），batch 128，最多 100 epoch；每 5 epoch 在 2000 条 valid 子集上做束搜索评估，按 NDCG@10 早停（patience=5）。

## 5. 推理：Trie 约束的束搜索

生成概率链式分解：

$$
P(\mathrm{SID}\mid \mathrm{history})=\prod_{t}P(c_t\mid c_{<t},\ \mathrm{history}).
$$

关键约束：模型不能自由生成，**只有真实物品的 SID 前缀才是合法输出**。把全部物品的 SID 插入前缀树（trie），束搜索每一步只允许扩展 trie 中存在的分支：

- 已生成 $\ell<m$ 个码：候选集 = trie 中该前缀的下一层子节点（先验直接剪掉绝大多数非法 token）；
- 已生成 $m$ 个码：只允许输出 EOS。

束搜索返回 num_beams 条完整 SID，按序列得分（长度归一化的 log 概率）排序；每个 SID 经 SID→items 映射回物品（RQ-VAE 量化可能碰撞：一个 SID 对应多个物品，按 beam 顺序去重补齐），取 top-N。

本仓库的实现：`prefix_allowed_tokens_fn` 做约束解码，num_beams=20、取 top-10、最多生成 4 个 token；评估为全目录排名的 Recall/NDCG@{5,10}。

## 6. 为什么有效

- **语义层级 ID 替代原子 ID**：内容语义被编码进 ID 空间——相似物品共享前缀，对某物品学到的知识可迁移到语义相近的其它物品（参数共享 + 泛化）。论文实测：无交互历史物品的检索效果更好（冷启动友好），长尾物品受益，feedback loop / popularity bias 得到缓解。
- **表示空间压缩**：原子 ID 是 $|\mathcal I|$ 维的稀疏空间；层级 SID 是 $K^m$ 的组合空间，且相近物品在 trie 上互为「近邻」，物品关系的先验结构直接写进了输出空间。
- **层级结构天然适配自回归生成**：每步只是 $K$ 类分类，$m$ 步即可定位一个物品（$m\ll\log_2|\mathcal I|$）；生成顺序由粗到细，先靠语义聚类、再靠细粒度码区分。
- **生成式检索范式**：单个 seq2seq 模型端到端完成「记忆物品 + 个性化检索」，不需要在全目录上维护 embedding 索引 / ANN 检索；beam score 本身就是个性化排序分。
- **约束解码保证合法性**：trie 约束使输出必为真实 SID；碰撞用去重解决（论文在 SID 构造阶段给碰撞物品追加额外码以保证唯一，本仓库用 sid2items 一对多映射 + 去重）。
- 与 SASRec 对照：SASRec 用注意力把历史聚合成兴趣向量，再与每个 item embedding 点积做判别式打分；TIGER 把「检索物品」改写成「生成物品的语义 token 序列」，协同信号与内容语义同时进入一个离散 token 空间，泛化能力来自 SID 本身的语义结构。