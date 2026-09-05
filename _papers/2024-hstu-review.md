---
title: "[2024] HSTU"
paper_title: "Actions Speak Louder than Words: Trillion-Parameter Sequential Transducers for Generative Recommendations"
year: 2024
domain: "Recommendation Systems"
model: "HSTU"
venue: "ICML"
---

# 笔记正文不需要赘述论文题目了

## 1. Intro

HSTU 不像 TIGER，只把用户行为序列 tokenize，还希望把各种其它特征也 tokenize，把 DLRM 中各种 feature 整合到一个统一的 time series 中。在这个背景下，论文开头剧透了 3 点生成式推荐在 Scaling 上的问题。

1. features in recommendation systems lack explicit structures  

    我的理解是，现有的特征是做过特征工程以后被送到 DNN 里，但他们没办法直接组成一个序列嵌入生成式的架构中。HSTU 后续的做法是尽可能把 feature 还原成 sequence，让模型从 sequence 本身重新构造这些信息，而不再人工构建 features。

2. recommendation systems use billion-scale vocabularies that change continuously  

    vocab_size 很大、而且 vocab 还老变化；HSTU 的目标之一是 large, non-stationary vocabularies。

3. computational cost represents the main bottleneck in enabling large-scale sequential models

    计算量太大。用户序列很长，而 Transformer 一直害怕处理长用户序列。

针对这些问题，作者剧透了一下 HSTU 的核心贡献（也是我自己读完 Intro 的总体感受）。

1. 把 DLRM 的特征还原成序列特征

2. 新的结构 HSTU，Hierarchical Sequential Transduction Units

3. 采用特定的 Generative Training 训练方法（M-FALCON）

## 2. 把特征转换成一个序列

### 2.1 Unifying heterogeneous feature spaces in DLRMs

&emsp;&emsp;先找一条主时间轴（一般选用户交互数据），然后把其它基本不变的 sparse/categorical feature 给塞到主时间轴上（连续相同状态只保留该片段最早出现的记录）  

&emsp;&emsp;高频变化的 dense feature 不显示建模，而是由 sequence model 隐式学习

对于 dense statistics 统计数据（比如 past CTR、watch time 等），如果它们所依赖的 categorical entities 已经被 sequentialized 了，那么就不 tokenize 了。因为一个足够强的 sequential transduction architecture 应当可以从事件序列中学习出 handcrafted numerical features 所表达的信息。

### 2.2 Reformulating ranking and retrieval as sequential  transduction tasks

这部分主要讨论怎么把 **召回** 和 **排序** 转化为 sequential transduction tasks。其中召回是根据交互序列来预测下一个 item，而排序是根据交互序列和 item 来预测用户会采取的动作。

$$\text{Retrieval}: (\Phi_0, a_0), (\Phi_1, a_1), ..., (\Phi_n, a_n) \rightarrow \Phi_{n+1}$$

$$\text{Ranking}: \Phi_0, a_0, \Phi_1, a_1, ..., \Phi_n \rightarrow a_n$$

其中，$\Phi$ 是 item，$a$ 是用户采取的行动。

### 2.3 Generative training

训练的时候就是一个 NTP 的范式（我感觉），但是不会去一轮一轮地重复计算。而是一次 forward 预测多个结果。

## 3. HSTU

### 架构

![HSTU vs DLRM](/images/papers/Actions%20Speak%20Louder%20than%20Words:%20Trillion-Parameter%20Sequential%20Transducers%20for%20Generative%20Recommendations/DLRMvsHSTU.png)

$$
\boxed{
\begin{aligned}
X^{(l)}
&\xrightarrow{\text{pointwise projection}}
\{U^{(l)},V^{(l)},Q^{(l)},K^{(l)}\}
\xrightarrow{\,QK^{T}+\mathrm{rab}^{p,t}\,}
A^{(l)}
\\
&\xrightarrow{\,\times V^{(l)}\,}
A^{(l)}V^{(l)}
\xrightarrow{\mathrm{Norm}}
\mathrm{Norm}\!\left(A^{(l)}V^{(l)}\right)
\xrightarrow{\,\odot U^{(l)}\,}
\mathrm{Norm}\!\left(A^{(l)}V^{(l)}\right)\odot U^{(l)}
\\
&\xrightarrow{f_2}
Y^{(l)}
\xrightarrow{\,+X^{(l)}\,}
X^{(l+1)}
\end{aligned}
}
$$

每个 HSTU layer 包含 3 个部分。分别是

1. __Step 1__: Pointwise Projection 得到 Q、K、V、U。这个时候还没有特征交叉

2. __Step 2__: 特征交叉 $QK^TV$。除了语义信息之外，还加入了 $rab^{p, t}$ 为模型带来序列的时间和位置信息

3. __Step 3__: Pointwise Transformation。会做 $\text{Norm}() \odot U$，我理解就是替换了原本 Transformer 的 FFN，也是作者的创新点（我猜）

每个 layer 结束之后，会做残差连接：$X = \text{HSTU}_\text{layer}(X) + X$

### 训练

不同任务 loss 不同。  
**Retrieval** 应该会用 Sampled Softmax，要让每个位置预测的 item 尽可能接近正样本、尽可能远离负样本；  
**Ranking** 应该会用 Binary Cross Entropy，要让每个位置预测的用户行为（比如点击率）尽可能接近真实标签。