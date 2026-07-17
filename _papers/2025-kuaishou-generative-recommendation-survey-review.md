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

### Why Tokenization
生成式搜推想要模仿 LLM 的 Next-token Prediction，做 Next-item_token Prediction。于是按照惯例就需要把 item 给 tokenize 化  
Q：为什么一定要做 tokenization，而不能直接 Next-word Prediction 和 Next-item Prediction 呢？  
A：说实话推荐领域没想很明白，但是 LLM 领域做 token 粒度的生成是有原因的：  
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

<details>
<summary>详细的算法描述</summary>  

---

**Step 1: Item Representation Learning**

首先利用预训练模型获得 item 的连续语义表示：

$$
z_i=Encoder(i)
$$

其中 Encoder 可以是：

- BERT：编码文本信息；
- CLIP：编码图文多模态信息。

---

**Step 2: Residual Quantization**

RQ-VAE 采用多层 residual quantization，而不是直接进行一次向量量化。

初始化 residual：

$$
r_i^0=z_i
$$


对于第 $m$ 个 quantization layer：

从 codebook：

$$
\mathcal{C}^{m}
=
\{e_1^m,e_2^m,\dots,e_K^m\}
$$

中寻找距离 residual 最近的 code：

$$
c_i^m=
\arg\min_k
\left\|
r_i^{m-1}-e_k^m
\right\|_2^2
$$


得到对应的 quantized representation：

$$
q_i^m=e_{c_i^m}^{m}
$$


然后更新 residual：

$$
r_i^m=r_i^{m-1}-q_i^m
$$


经过 $M$ 层量化后：

$$
z_i\approx
\sum_{m=1}^{M}q_i^m
$$


---

**Step 3: Semantic Token Generation**

最终将每一层选择的 code index 作为 token：

$$
Token_i=[c_i^1,c_i^2,\dots,c_i^M]
$$


例如：

$$
Token_i=[23,781,56,902]
$$

表示该 item 的 Semantic ID。


---

**Training Objective**

RQ-VAE 通过重构损失优化离散表示：

$$
\mathcal{L}_{rec}
=
||z_i-\hat{z}_i||_2^2
$$


其中：

$$
\hat{z}_i=
\sum_{m=1}^{M}q_i^m
$$

</details>

## 3. Architecture
