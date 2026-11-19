---
layout: handroll-detail
title: "DCN (Deep & Cross)"
section: recsys
date: 2026-08-04
order: 20260804
source: "https://github.com/FSmisaka/hand-roll/blob/main/models/dcn.py"
---

```python
"""
DCN 模型

Deep & Cross Network for Recommender Systems
论文: https://arxiv.org/abs/1708.05123

架构:
- Cross 部分 (记忆): **************
- Deep 部分 (泛化): *************
- 联合输出: ************
"""

import tensorflow as tf

from core.model_utils import (
    build_input_layer,
    build_group_feature_embedding_table_dict,
    concat_group_embedding,
    concat_func,
)
from core.layers import DNNs

class DCN(tf.keras.layers.Layer):
    """
    Reference:
        Deep & Cross Network for Ad Click Predictions
    """

    def __init__(self, num_cross_layers, l2_reg=1e-5):
        super(DCN, self).__init__()        
        self.num_cross_layers = num_cross_layers
        self.l2_reg = l2_reg
    
    def build(self, input_shape):        
        # input_shape : batch_size x (feat_nums * embed_dims)
        self.input_dim = input_shape[-1]

        self.ws = [self.add_weight(
            name='cross_weight_{}'.format(i),
            shape=(self.input_dim, 1),
            initializer='glorot_normal',
            regularizer=tf.keras.regularizers.l2(self.l2_reg),
            trainable=True
        ) for i in range(self.num_cross_layers)]

        self.bs = [self.add_weight(
            name='cross_bias_{}'.format(i),
            shape=(self.input_dim, 1),
            initializer='zeros',
            regularizer=tf.keras.regularizers.l2(self.l2_reg),
            trainable=True
        ) for i in range(self.num_cross_layers)]
        
    def call(self, x_0):
        """
        实现交叉层的计算: x_{l+1} = x_0 * x_l^T * w_l + b_l + x_l
        
        Args:
            x_0: 原始输入，shape: (batch_size, feature_embedding_dim)            
        """
        # x_l 是上一层的输出，shape: (batch_size, feature_embedding_dim)

        x_l = x_0
        for i in range(self.num_cross_layers):      
            # 计算 x_l^T * w_l        
            xlw = tf.matmul(x_l, self.ws[i]) # (batch_size, 1)
            
            # 计算 x_0 * (x_l^T * w_l)                
            cross_term = tf.multiply(x_0, xlw) # (batch_size, feature_embedding_dim)

            # 计算 x_0 * x_l^T * w_l + b_l + x_l
            x_l = cross_term + tf.reshape(self.bs[i], (1, -1)) + x_l # (batch_size, feature_embedding_dim)

        return x_l

def build_dcn_model(feature_columns, model_config):
    """
    构建 DCN 模型。

    Args:
        feature_columns: FeatureColumn 列表。
        model_config: 模型配置字典

    Returns:
        (model, None, None): 排序模型返回 (主模型, None, None)
    """
    dnn_units = model_config.get("dnn_units", [64, 32])
    dnn_dropout_rate = model_config.get("dnn_dropout_rate", 0.1)
    num_cross_layer = model_config.get("cross_layer", 3)
    use_bn = model_config.get("use_bn", False)

    input_layer_dict = build_input_layer(feature_columns)

    group_embedding_feature_dict = build_group_feature_embedding_table_dict(
        feature_columns, input_layer_dict, prefix="embedding/"
    )

    group_feature_dict = {}
    for group_name in group_embedding_feature_dict:
        group_feature_dict[group_name] = concat_group_embedding(
            group_embedding_feature_dict, group_name, axis=1, flatten=True
        )  # B x (N * D)

    # Deep 部分: 通过 DNN → 向量
    deep_out = DNNs(
        units=dnn_units,
        activation="relu",
        dropout_rate=dnn_dropout_rate,
        use_bn=use_bn,
    )(group_feature_dict["deep"])

    # Cross 部分: 通过 Cross Network → 向量
    dcn_out = DCN(num_cross_layers=num_cross_layer)(group_feature_dict["cross"])

    # 融合输出
    concat_out = concat_func([deep_out, dcn_out])
    output = tf.keras.layers.Dense(
        1, activation="sigmoid", name="dcn_output"
    )(concat_out)

    model = tf.keras.Model(inputs=list(input_layer_dict.values()), outputs=output)

    return model, None, None
```
