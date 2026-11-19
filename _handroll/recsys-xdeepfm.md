---
layout: handroll-detail
title: "xDeepFM"
section: recsys
date: 2026-08-10
order: 20260810
source: "https://github.com/FSmisaka/hand-roll/blob/main/models/xdeepfm.py"
---

```python
import tensorflow as tf

from core.model_utils import (
    build_input_layer,
    build_group_feature_embedding_table_dict,
    concat_group_embedding,
    add_tensor_func,
    get_linear_logits,
)
from core.layers import DNNs

class CIN(tf.keras.layers.Layer):
    """CIN层"""
    def __init__(self, cin_layer_list, l2_reg=1e-5, **kwargs):
        """初始化

        Args:
            cin_layer_list: 每层 CIN 的神经元数，如 [128, 128]
            l2_reg: L2 正则化系数
        """
        super(CIN, self).__init__(**kwargs)
        self.cin_layer_list = cin_layer_list
        self.l2_reg = l2_reg
        self.cin_layers = []

    def build(self, input_shape):
        """构建层

        Args:
            input_shape: 输入张量的形状，预期为[batch_size, field_num, embedding_size]
        """
        embedding_dim = input_shape[-1]
        # 预计算每层 CIN 的 reshape 目标维度，避免 call() 中用 -1 导致静态 shape 丢失
        self.z_dims = []
        prev_dim = embedding_dim
        for h in self.cin_layer_list:
            self.z_dims.append(embedding_dim * prev_dim)
            prev_dim = h

        super(CIN, self).build(input_shape)
        for i, h in enumerate(self.cin_layer_list):
            self.cin_layers.append(
                tf.keras.layers.Dense(
                    h,
                    activation=None,
                    use_bias=False,
                    kernel_regularizer=tf.keras.regularizers.l2(self.l2_reg),
                    name=f"cin_dense_{i+1}",
                )
            )

    def call(self, x_0):
        """前向传播
        
        Args:
            x_0: 形状为[batch_size, field_num, embedding_size]的张量
            
        Returns:
            形状为[batch_size, 1]的张量
        """

        x_l = x_0
        pooling = []
        for i, dense_layer in enumerate(self.cin_layers):
            x0_exp = tf.expand_dims(x_0, axis=-1)  # [B, N, D, 1]
            xl_exp = tf.expand_dims(x_l, axis=-2)  # [B, N, 1, H_{i-1}]

            z_l = tf.matmul(x0_exp, xl_exp)        # [B, N, D, H_{i-1}]
            z_l = tf.reshape(z_l, [tf.shape(z_l)[0], tf.shape(z_l)[1], self.z_dims[i]])
            x_l = dense_layer(z_l)  # [B, N, H_i]

            pooling.append(tf.reduce_sum(x_l, axis=1))  # [B, H_i]
        return tf.concat(pooling, axis=1)  # [B, H_concat]
        

def build_xdeepfm_model(feature_columns, model_config):
    """
    构建 xdeepfm 模型。

    Args:
        feature_columns: FeatureColumn 列表。
        model_config: 模型配置字典

    Returns:
        (model, None, None): 排序模型返回 (主模型, None, None)
    """

    dnn_units = model_config.get("dnn_units")
    dnn_dropout_rate = model_config.get("dnn_dropout_rate")
    cin_layer_list = model_config.get("cin_layer_list")
    l2_reg = model_config.get("l2_reg", 1e-5)

    input_layer_dict = build_input_layer(feature_columns)
    group_embedding_feature_dict = build_group_feature_embedding_table_dict(
        feature_columns, input_layer_dict, prefix="embedding/"
    )

    cin_feature = concat_group_embedding(group_embedding_feature_dict, "xdeepfm", axis=1, flatten=False)  # [B, N, D]
    cin_out = CIN(cin_layer_list, l2_reg=l2_reg)(cin_feature)  # [B, H_concat]

    deep_feature = concat_group_embedding(
        group_embedding_feature_dict, "xdeepfm", axis=1, flatten=True
    )  # [B, (N * D)]

    dnn_out = DNNs(
        units=dnn_units,
        dropout_rate=dnn_dropout_rate,
    )(deep_feature)  # [B, dnn_units[-1]]

    # FM 一阶线性项：每特征 dim-1 embedding 加权求和（复用 Wide&Deep 基础设施）
    linear_logits = get_linear_logits(input_layer_dict, feature_columns)  # [B, 1, 1]
    linear_logits = tf.keras.layers.Flatten()(linear_logits)  # [B, 1, 1] → [B, 1]

    xdeepfm_concat = tf.keras.layers.Concatenate(axis=1)([linear_logits, cin_out, dnn_out])  # [B, 1 + H_concat + dnn_units[-1]]
    xdeepfm_logit = tf.keras.layers.Dense(1, activation=None)(xdeepfm_concat)  # [B, 1]
    output = tf.keras.layers.Activation("sigmoid")(xdeepfm_logit)        # [B, 1]

    model = tf.keras.Model(inputs=list(input_layer_dict.values()), outputs=output)

    return model, None, None
```
