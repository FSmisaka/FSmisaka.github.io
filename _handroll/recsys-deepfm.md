---
layout: handroll-detail
title: "DeepFM"
section: recsys
date: 2026-08-09
order: 20260809
source: "https://github.com/FSmisaka/hand-roll/blob/main/models/deepfm.py"
---

```python
"""
DeepFM 模型

DeepFM: A Factorization-Machine based Neural Network for CTR Prediction
论文: https://arxiv.org/abs/1703.04247v1

架构:
- FM 部分 (记忆): **************
- Deep 部分 (泛化): *************
- 联合输出: ************
"""

import tensorflow as tf

from core.model_utils import (
    build_input_layer,
    build_group_feature_embedding_table_dict,
    concat_group_embedding,
    add_tensor_func,
    get_linear_logits,
)
from core.layers import DNNs

class FM(tf.keras.layers.Layer):
    """因子分解机(Factorization Machine)层
    
    这个层实现了FM的二阶交叉部分，用于捕获特征之间的交互关系。
    FM算法的核心思想是通过隐向量内积来表示特征之间的相互作用。
    
    计算公式: 
    sum_{i=1}^{n}sum_{j=i+1}^{n} <v_i, v_j> x_i x_j
    = 0.5 * (sum(v)^2 - sum(v^2))
    
    其中v是特征的embedding向量，x是特征值。
    """
    def __init__(self, **kwargs):
        """初始化FM层
        
        Args:
            **kwargs: 传递给父类的参数
        """
        super(FM, self).__init__(**kwargs)

    def build(self, input_shape):
        """构建层
        
        Args:
            input_shape: 输入张量的形状，预期为[batch_size, field_num, embedding_size]
        """
        super(FM, self).build(input_shape)

    def call(self, inputs, **kwargs):
        """前向传播
        
        Args:
            inputs: 形状为[batch_size, field_num, embedding_size]的张量
            **kwargs: 额外参数
            
        Returns:
            形状为[batch_size, 1]的张量，表示FM的二阶交互项
        """
        concated_embeds_value = inputs  # shape: [batch_size, field_num, embedding_size]
        
        # 计算(sum(v))^2，先在field维度上求和，再平方
        square_of_sum = tf.square(tf.reduce_sum(concated_embeds_value, axis=1, keepdims=True))  # [batch_size, 1, embedding_size]
        
        # 计算sum(v^2)，先平方，再在field维度上求和
        sum_of_square = tf.reduce_sum(concated_embeds_value * concated_embeds_value, axis=1, keepdims=True)  # [batch_size, 1, embedding_size]
        
        # 计算FM的二阶交互项: 0.5 * ((sum(v))^2 - sum(v^2))
        cross_term = square_of_sum - sum_of_square  # [batch_size, 1, embedding_size]
        cross_term = 0.5 * tf.reduce_sum(cross_term, axis=2, keepdims=False)  # [batch_size, 1]

        return cross_term

def build_deepfm_model(feature_columns, model_config):
    """
    构建 deepfm 模型。

    Args:
        feature_columns: FeatureColumn 列表。
        model_config: 模型配置字典

    Returns:
        (model, None, None): 排序模型返回 (主模型, None, None)
    """

    dnn_units = model_config.get("dnn_units")
    dnn_dropout_rate = model_config.get("dnn_dropout_rate")

    input_layer_dict = build_input_layer(feature_columns)
    group_embedding_feature_dict = build_group_feature_embedding_table_dict(
        feature_columns, input_layer_dict, prefix="embedding/"
    )

    fm_feature = concat_group_embedding(group_embedding_feature_dict, "deepfm", axis=1, flatten=False)  # [B, N, D]
    fm_out = FM()(fm_feature)  # [B, 1]

    deep_feature = concat_group_embedding(
        group_embedding_feature_dict, "deepfm", axis=1, flatten=True
    )  # [B, (N * D)]

    dnn_out = DNNs(
        units=dnn_units,
        dropout_rate=dnn_dropout_rate,
    )(deep_feature)  # [B, dnn_units[-1]]
    deep_out = tf.keras.layers.Dense(1, activation=None)(dnn_out)  # [B, 1]

    # FM 一阶线性项：每特征 dim-1 embedding 加权求和（复用 Wide&Deep 基础设施）
    linear_logits = get_linear_logits(input_layer_dict, feature_columns)  # [B, 1, 1]
    linear_logits = tf.keras.layers.Flatten()(linear_logits)  # [B, 1, 1] → [B, 1]

    deepfm_logits = add_tensor_func(
        [linear_logits, fm_out, deep_out], name="deepfm_logits"
    )
    output = tf.keras.layers.Activation("sigmoid")(deepfm_logits)

    model = tf.keras.Model(inputs=list(input_layer_dict.values()), outputs=output)

    return model, None, None
```
