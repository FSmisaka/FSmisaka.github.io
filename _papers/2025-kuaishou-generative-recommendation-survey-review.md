---
title: "[2025] kuaishou Survey: Generative Recommendation"
paper_title: "A Survey of Generative Recommendation from a Tri-Decoupled Perspective: Tokenization, Architecture, and Optimization"
year: 2025
domain: "Recommendation Systems"
model: "Survey"
venue: "arxiv"
---

# 生成式推荐：SID、架构 & 偏好对齐

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

## 2. Tokenization

> [3] Tokenizer

### Why Tokenization
生成式搜推想要模仿 LLM 的 Next-token Prediction，做 Next-item_token Prediction。于是按照惯例就需要把 item 给 tokenize 化  
**Q**：为什么一定要做 tokenization，而不能直接 Next-word Prediction 和 Next-item Prediction 呢？  
**A**：说实话推荐领域没想很明白，但是 LLM 领域做 token 粒度的生成是有原因的：  
1. 不可计算：word 粒度的话，词表太大  
2. 泛化能力：token 粒度可以生成新词（token concatenation）

### Sparse ID-based、Text-based、Semantic ID-based
一共三种 Tokenizer：Sparse ID-based、Text-based、Semantic ID-based

| Tokenizer | token形式 | 优点 | 局限 |
| :--: | :--: | :--: | :--: |
| Sparse ID-based | item ID -> 嵌入向量 | ID 唯一 | 冷启问题 (缺乏语义信息)；<br>词表太大 |
| Text-based | text | 语义信息丰富 | Grounding 问题 |
| Semantic ID-based | 一系列 codeword | ^ ^ | SID Collision 问题；<br>2 个阶段 (Embedding Extraction，Quantization) 的优化目标不一致 |

- 传统推荐就是用 **Sparse ID**，即每一个 item 用一个 ID 来表示，然后接 embedding layer 得到嵌入。主要的问题是冷启动问题，长尾物品和新物品的 embedding 由于缺乏交互数据学不准。另外，Sparse ID 的词表太大  
- **Text-based** 的出现能够缓解冷启问题，可以不依赖交互数据来做 tokenization，但是会出现 grounding 的问题，即生成的 text 没办法回应到具体的 item  
- 为了同时发挥 text-based 方法的优势，同时避免 grounding 问题，**Semantic ID-based** 应运而生，并成为最主流的方法。**它比纯 Text 更容易 Grounding，比纯 ID 更有语义**。主要分为两个阶段：**Embedding Extraction** 和 **Quntization**。举个例子， embedding extraction 阶段用 BERT/CLIP，quantization 阶段用 RQ-VAE  

### Quantization - RQ-VAE
记录一下 RQ-VAE 的主要算法流程：
$$
\text{item}
\xrightarrow{\text{BERT/CLIP}}
z
\xrightarrow{\text{RQ-VAE}}
[c_1,c_2,\dots,c_M]
$$

其中，$z\in\mathbb{R}^{d}$ 表示 item embedding，$[c_1,c_2,\dots,c_M]$ 表示生成的 Semantic ID。

**Algorithm Pipeline:**

```
Input:
    Item i

Step 1: Semantic Representation Extraction
    z_i = Encoder(i)

Step 2: Residual Quantization
    Initialize residual:
        r_i^0 = z_i

    For m = 1,...,M:

        Select nearest code:
        c_i^m = argmin_k ||r_i^(m-1)-e_k^m||_2^2

        Obtain quantized vector:
        q_i^m = e_(c_i^m)^m

        Update residual:
        r_i^m = r_i^(m-1)-q_i^m

Step 3: Semantic Token Generation

    Token_i = [c_i^1,c_i^2,...,c_i^M]
```

<details markdown="1">
<summary>详细的算法描述</summary>  

**Step 1: Item Representation Learning**

首先利用预训练模型获得 item 的连续语义表示：

$$
z_i=Encoder(i)
$$

其中 Encoder 可以是 BERT：编码文本信息或 CLIP：编码图文多模态信息。

**Step 2: Residual Quantization**

RQ-VAE 采用多层 residual quantization，而不是直接进行一次向量量化。  
首先，初始化 residual $r_i^0=z_i$

对于第 $m$ 个 quantization layer，从 codebook $\mathcal{C}^{m}=\{e_1^m,e_2^m,\dots,e_K^m\}$ 中寻找距离 residual 最近的 code：

$$
c_i^m=
\arg\min_k
\left\|
r_i^{m-1}-e_k^m
\right\|_2^2
$$

得到对应的 quantized representation $q_i^m=e_{c_i^m}^{m}$，然后更新 residual $r_i^m=r_i^{m-1}-q_i^m$。经过 $M$ 层量化后：

$$
z_i\approx
\sum_{m=1}^{M}q_i^m
$$

**Step 3: Semantic Token Generation**

最终将每一层选择的 code index 作为 $Token_i=[c_i^1,c_i^2,\dots,c_i^M]$，例如：$Token_i=[23,781,56,902]$，表示该 item 的 Semantic ID。

**Training Objective**

RQ-VAE 通过重构损失优化离散表示：

$$
\mathcal{L}_{rec}
=
||z_i-\hat{z}_i||_2^2
$$

其中，$\hat{z}_i=\sum_{m=1}^{M}q_i^m$

</details>

## 3. Architecture

> [4] Model Architecture

### Encoder-Decoder、Decoder-only、Diffusion-based

| Architecture | 特点和优势 | 局限 |
| :--: | :--: | :--: |
| Encoder-Decoder | 适合输入输出异构的推荐场景；<br>Encoder有双向注意力 | 扩展性 scaling 问题 |
| Decoder-only | 易扩展 scalable；<br>承接 LLM 生态 | 单向建模的约束 |
| Diffusion-based | 支持双向建模；<br>特定任务有奇效 | 多步迭代的采样 -> 推理延迟 |

**Encoder-Decoder** 架构的输入侧专门负责理解，输出侧专门负责生成，适合输入信息丰富、需要模型形成对输入特征的理解、输入和输出相对异质化的场景。**Decoder-only** 架构把一切都平摊为一个序列，然后做 Next-item Generation，不明显区分输入和输出。优点是 Scalable、易承接 LLM 生态。**Diffusion-based** 架构是一个有前景但不主流的方向，优势在于不依赖序列的因果关系。

![模型架构的趋势](/images/papers/A%20Survey%20of%20Generative%20Recommendation%20from%20a%20Tri-Decoupled%20Perspective:%20Tokenization,%20Architecture,%20and%20Optimization/Trends%20in%20model%20architecture.PNG)

## 4. Optimization

> [5] Optimization Strategy

**主流优化框架**：Supervised Next-token Prediction 作为基础训练目标；Reinforcement Learning-based Preference Alignment 用于优化多维用户偏好和平台目标  
- **SFT**：**NTP** 直接套用 LLM 的训练范式，但面临 Softmax 损失计算压力大的问题。**NCE** / **Sampled-Softmax** 通过采样负样本解决该问题，适合 Sparse ID-based Tokenizer 
    <details markdown="1">

    <summary><b>对 NTP 训练流程的理解</b></summary>
    
    <h3>数据定义</h3>
    **一个样本**：$(X,Y)$  
    其中：
    - $X=[x_1,x_2,...,x_T]$：用户历史行为序列（item token）
    - $Y=[y_1,y_2,...,y_M]$：用户未来行为序列（预测目标）
    - $V$：item token vocabulary，大小为 $|V|$
    - $\theta$：生成模型的参数

    **一个 batch**：$B=\{(X_i,Y_i)\}_{i=1}^{N}$  
    其中：
    - $N$：batch size
    - 每个样本包含用户历史序列和真实下一行为


    <h3>单个 Batch 的训练</h3>
    <h4>Step 1：Forward</h4>

    将输入序列送入 Transformer：$h_t=Transformer_\theta(x_{\leq t})$，代笔第 $t$ 个位置的 hidden state  
    通过输出层得到每个 token 的预测概率：

    $$
    P_\theta(y_t|x_{<t})
    =
    softmax(Wh_t)
    $$

    其中：
    - $W$：输出层参数

    <h4>Step 2：计算 NTP Loss</h4>
    目标是最大化真实 item token 的概率  
    损失函数：

    $$
    L_{NTP}
    =
    -\sum_{t=1}^{M}
    \log P_\theta(y_t|x_{<t})
    $$

    会驱使模型学会预测真实 item

    <h4>Step 3：反向传播与参数更新</h4>
    $$
    \theta
    \leftarrow
    \theta-\eta\nabla_\theta L_{NTP}
    $$

    其中：

    - $\eta$：learning rate

    <h3>NTP 总结</h3>
    NTP 学习 $P_\theta(item_t|user\ history)$。即根据用户过去行为，预测用户下一步可能发生的行为。

    优点：
    - 训练稳定；
    - 与 Transformer 架构天然匹配。

    缺点：
    - softmax需要遍历整个 item vocabulary；
    - 当 $|V|$ 很大时计算成本高。
    </details>

- **RL**：由于 SFT 的目标与推荐系统现实目标有差距，前者促使用户产生点击行为，后者除了关注用户的满意，也关注平台收益和生态如 GMV、留存率、多样性等。于是，基于强化学习的偏好对齐应运而生。其中，**DPO** 是在强化学习老祖宗 RLHF、PPO 的基础上发展而来，优势在于不需要训练 Reward Model，直接上数据优化现有模型。其效果高度依赖偏好对的构建，属于 Pairwise 方法。**GRPO** 则有所不同，使用 Listwise 的 Group Reward。

    <details markdown="1">

    <summary><b>对 DPO 训练流程的理解</b></summary>

    <h3>数据定义</h3>
    **一个训练样本**：$(x,y_w,y_l)$

    其中：
    - $x$：用户信息、历史行为
    - $y_w$：preferred response，用户更喜欢的推荐结果
    - $y_l$：rejected response，用户不喜欢的推荐结果

    **一个 batch**：$B=\{(x_i,y_i^w,y_i^l)\}_{i=1}^{N}$

    <h3>单个 Batch 的训练</h3>
    <h4>Step 1：计算当前模型概率</h4>

    使用当前推荐模型 $\pi_\theta$ 计算 $\pi_\theta(y_w|x)$，$\pi_\theta(y_l|x)$  
    即模型生成 preferred 和 rejected item 的概率。

    <h4>Step 2：计算 DPO Loss</h4>

    DPO 希望 $P(y_w|x)>P(y_l|x)$  
    Loss 的设计如下，即希望新模型比原模型更能推荐用户喜欢的，更不推荐用户不喜欢的

    $$
    L_{DPO}
    =
    -\log\sigma
    (
    \beta
    (
    \log
    \frac{\pi_\theta(y_w|x)}
    {\pi_{ref}(y_w|x)}
    -
    \log
    \frac{\pi_\theta(y_l|x)}
    {\pi_{ref}(y_l|x)}
    )
    )
    $$

    其中：
    - $\pi_\theta$：当前待训练模型（新模型）
    - $\pi_{ref}$：冻结的参考模型（原模型）
    - $\beta$：控制偏好优化强度
    - $\sigma$：sigmoid 函数

    <h4>Step 3：参数更新</h4>
    $$
    \theta
    \leftarrow
    \theta-\eta\nabla_\theta L_{DPO}
    $$

    <h3>DPO 总结</h3>
    DPO：$\boxed{提高chosen概率，降低rejected概率}$  
    相比 RLHF 不需要：
    - reward model；
    - PPO强化学习。

    优点：
    - 简单稳定；
    - 训练形式接近监督学习。

    缺点：
    - 强依赖 preference pair 质量；
    - 无法直接表达复杂排序目标。
    </details>

    <details markdown="1">

    <summary><b>对 GRPO 训练流程的理解</b></summary>

    <h3>数据定义</h3>
    给定用户输入 $x$，模型生成 $G=\{y_1,y_2,...,y_K\}$

    其中：
    - $K$：candidate 数量
    - $y_i$：模型生成的第 $i$ 个推荐结果
    

    <h3>Reward计算</h3>
    每个候选由 reward system 评分 $r_i=R(x,y_i)$  
    reward通常由多个指标组成，每个指标可能由单独的模型计算：

    $$
    R
    =
    w_1CTR
    +
    w_2GMV
    +
    w_3Diversity
    $$

    其中：
    - CTR：点击概率预测
    - GMV：预期成交价值
    - Diversity：推荐多样性
    - $w_i$：不同目标权重

    <h3>单个 Batch 的训练</h3>
    <h4>Step 1：模型生成候选</h4>
    当前策略 $\pi_\theta$ 对于每个用户生成 $G_i=\{y_1,...,y_K\}$

    <h4>Step 2：计算 Advantage</h4>
    计算 group 平均 reward：

    $$
    \bar r
    =
    \frac1K
    \sum_{i=1}^{K}r_i
    $$

    计算每个候选优势：

    $$
    A_i=r_i-\bar r
    $$

    其中：
    - $A_i>0$：该推荐优于平均水平
    - $A_i<0$：该推荐低于平均水平

    <h4>Step 3：计算 GRPO Loss</h4>
    GRPO 希望提高高 reward item 的生成概率。策略梯度形式：

    $$
    L_{GRPO}
    =
    -
    \sum_i
    A_i
    \log
    \pi_\theta(y_i|x)
    $$

    reward高于平均则增大推荐概率；反之降低推荐概率  
    通常额外加入 KL 约束防止模型偏离原始模型太多

    $$
    L
    =
    L_{GRPO}
    +
    \beta KL(\pi_\theta||\pi_{ref})
    $$

    <h4>Step 4：参数更新</h4>

    $$
    \theta
    \leftarrow
    \theta-\eta\nabla_\theta L
    $$

    <h3>GRPO 总结</h3>
    GRPO：$\boxed{最大化推荐结果reward}$

    | |DPO|GRPO|
    |-|-|-|
    |比较对象|两个结果|多个结果|
    |反馈形式|chosen/rejected|连续reward|
    |优化目标|偏好排序|整体reward最大化|
    |适合任务|二分类偏好|推荐排序、多目标优化|

    GRPO 符合工业推荐场景，因为推荐系统通常同时优化用户满意度、商业价值和内容生态。
    </details>

![优化策略](/images/papers/A%20Survey%20of%20Generative%20Recommendation%20from%20a%20Tri-Decoupled%20Perspective:%20Tokenization,%20Architecture,%20and%20Optimization/Landscape%20of%20optimization%20strategy%20taxonomy.png)

## 5. Application, Challenges & Future Directions

> [6] Application + [7] Challenges and Future Directions

### 对现有判别式推荐 Pipeline 的优化

- **召回**：基于相似度 (双塔等) -> 生成，引入召回阶段的偏好对齐和多兴趣召回
- **排序**：CTR -> 用户行为序列的生成建模
- **重排**：两阶段范式：生成器—评估器 -> 单一阶段的多目标优化。两阶段范式说实话有点理解不了。在我的理解里，重排就是在精排的基础上引入 MR、行列式点过程 DPP 等重排分数重新排一下
- **端到端（End-to-end）**：最明确的趋势是用统一模型替代级联 Pipeline，从而减少误差累积、提高硬件利用率，并使基于强化学习的偏好对齐成为平衡用户目标与平台目标的关键手段

### 业务场景中的应用

- **冷启动**：语义理解与 Semantic ID 有助于泛化到长尾 item 和新 item
- **跨域推荐**：统一语义表示、面向域的结构设计和域自适应解码，有助于跨场景知识迁移
- **搜索**：生成式搜索试图处理歧义查询，统一召回、排序和个性化，并推动搜索与推荐的融合
- **自动出价**：生成式方法用于建模长时序出价轨迹，并同时平衡转化、CPA 和预算等多目标

### Challenges and Future Directions

- **端到端建模**：更大规模模型，同时满足低延迟要求；设计真正统一的奖励，而不是只优化单一指标
- **效率问题**：缺少算法与系统的协同设计。流式训练和低延迟推理仍是难点，超长行为建模也依然受限，可以探索记忆增强和 RAG 增强等领域
- **推理能力**：未来模型应能结合上下文与外部信号推断短期和长期兴趣，但 CoT 构造、低时延下的自适应推理，以及自进化推荐仍存在问题
- **数据优化**：语义建模有助于缓解稀疏和缺失数据问题，但训练数据偏差，以及高质量 CoT、偏好和意图标注，仍然是主要瓶颈
- **交互式智能体**：对话式推荐有望统一对话、推荐和工具使用，但个性化的对话解释以及以用户为中心的记忆机制仍未解决
