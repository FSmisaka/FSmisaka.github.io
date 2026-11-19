---
layout: handroll-detail
title: "AutoInt"
section: recsys
date: 2026-08-13
order: 20260813
source: "https://github.com/FSmisaka/hand-roll/blob/main/models/autoint.py"
---

```python
"""
autoint 模型

AutoInt: Automatic Feature Interaction Learning  via Self-Attentive Neural Networks
论文: https://dl.acm.org/doi/10.1145/3357384.3357925
"""

import tensorflow as tf

from core.model_utils import (
    build_input_layer,
    build_group_feature_embedding_table_dict,
    concat_group_embedding,
    add_tensor_func,
    get_linear_logits,
)

class MultiHeadAttentionLayer(tf.keras.layers.Layer):
    """
    Reference:
        AutoInt: Automatic Feature Interaction Learning via Self-Attentive Neural Networks
    """
    def __init__(self, attention_dim, num_heads, use_residual=True):
        super().__init__()
        self.attention_dim = attention_dim  # 注意力层的维度 d'
        self.num_heads = num_heads          # 注意力头数量 H
        self.use_residual = use_residual    # 是否使用残差连接
        
    def build(self, input_shape):
        # input_shape: B x N x D
        self.feat_num = input_shape[1]
        self.embed_dim = input_shape[2]
        
        # 为每个注意力头创建查询(Query)、键(Key)和值(Value)的权重矩阵
        self.query_weights = []
        self.key_weights = []
        self.value_weights = []
        
        for i in range(self.num_heads):
            self.query_weights.append(
                self.add_weight(
                    name=f'query_weights_{i}',
                    shape=[self.embed_dim, self.attention_dim],
                    initializer='glorot_uniform',
                    trainable=True
                )
            )
            
            self.key_weights.append(
                self.add_weight(
                    name=f'key_weights_{i}',
                    shape=[self.embed_dim, self.attention_dim],
                    initializer='glorot_uniform',
                    trainable=True
                )
            )
            
            self.value_weights.append(
                self.add_weight(
                    name=f'value_weights_{i}',
                    shape=[self.embed_dim, self.attention_dim],
                    initializer='glorot_uniform',
                    trainable=True
                )
            )

        self.output_weights = self.add_weight(
            shape=(self.attention_dim * self.num_heads, self.attention_dim),
            initializer="glorot_uniform"
        )
        
        # 残差连接的权重矩阵
        if self.use_residual:
            self.residual_weights = self.add_weight(
                name='residual_weights',
                shape=[self.embed_dim, self.attention_dim * self.num_heads],
                initializer='glorot_uniform',
                trainable=True
            )
    
    def call(self, inputs):
        # 存储每个注意力头的输出
        head_outputs = []
        
        for i in range(self.num_heads):
            # 计算查询、键、值矩阵
            query = tf.einsum('bfe,ea->bfa', inputs, self.query_weights[i])  # [batch_size, feat_num, attention_dim]
            key = tf.einsum('bfe,ea->bfa', inputs, self.key_weights[i])      # [batch_size, feat_num, attention_dim]
            value = tf.einsum('bfe,ea->bfa', inputs, self.value_weights[i])  # [batch_size, feat_num, attention_dim]
            
            # 计算注意力得分
            attention_score = tf.matmul(query, key, transpose_b=True)  # [batch_size, feat_num, feat_num]
            
            # 对注意力分数进行归一化处理
            attention_weights = tf.nn.softmax(attention_score, axis=-1)  # [batch_size, feat_num, feat_num]
            
            # 计算注意力加权和
            head_output = tf.matmul(attention_weights, value)  # [batch_size, feat_num, attention_dim]
            head_outputs.append(head_output)
        
        # 将所有注意力头的输出拼接在一起
        multi_head_output = tf.concat(head_outputs, axis=-1)  # [batch_size, feat_num, attention_dim * num_heads]

        multi_head_output = tf.tensordot(
            multi_head_output,
            self.output_weights,
            axes=[[2], [0]]
        )
        
        # 应用残差连接
        if self.use_residual:
            # 将原始输入通过线性变换后的结果与注意力输出相加
            residual_input = inputs  # [batch_size, feat_num, attention_dim]
            
            output = tf.keras.layers.ReLU()(multi_head_output + residual_input)  # [batch_size, feat_num, attention_dim]
        else:
            output = tf.keras.layers.ReLU()(multi_head_output)
        
        return output # B x N x D

def build_autoint_model(feature_columns, model_config):
    """
    构建 autoint 模型。

    Args:
        feature_columns: FeatureColumn 列表。
        model_config: 模型配置字典，支持:
            - dnn_units: DNN 各层单元数 (默认 [64, 32])
            - dnn_dropout_rate: Dropout 比率 (默认 0.1)

    Returns:
        (model, None, None): 排序模型返回 (主模型, None, None)
    """

    input_layer_dict = build_input_layer(feature_columns)
    group_embedding_feature_dict = build_group_feature_embedding_table_dict(feature_columns, input_layer_dict, prefix="embedding/")

    num_interaction_layers = model_config.get("num_interaction_layers", 2)
    attention_factor = model_config.get("attention_factor", 8)
    num_heads = model_config.get("num_heads", 2)
    use_residual = model_config.get("use_residual", True)

    autoint_outputs = []
    for group_name in group_embedding_feature_dict:
        if not group_name.startswith("autoint"): continue
        autoint_feature = concat_group_embedding(
            group_embedding_feature_dict, group_name, axis=1, flatten=False
        )  # [B, N, D]

        for _ in range(num_interaction_layers):
            autoint_feature = MultiHeadAttentionLayer(
                attention_dim=attention_factor,
                num_heads=num_heads,
                use_residual=use_residual
            )(autoint_feature)

        flattened_attention = tf.keras.layers.Flatten()(autoint_feature)  # [B, (N * D)]
        group_output = tf.keras.layers.Dense(1)(flattened_attention)      # [B, 1]
        autoint_outputs.append(group_output)

    # [B, 1]
    autoint_logit = add_tensor_func(autoint_outputs)
    linear_logit = get_linear_logits(input_layer_dict, feature_columns)
    final_logits = add_tensor_func([autoint_logit, linear_logit])

    final_logits = tf.keras.layers.Flatten()(final_logits)  # (B, 1, 1) → (B, 1)
    output = tf.keras.layers.Dense(1, activation="sigmoid", name="autoint_output")(final_logits)
    model = tf.keras.Model(inputs=list(input_layer_dict.values()), outputs=output)

    return model, None, None


```
