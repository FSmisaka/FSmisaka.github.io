---
layout: handroll-detail
title: "DIN"
section: recsys
date: 2026-09-04
order: 20260904
source: "https://github.com/FSmisaka/hand-roll/blob/main/models/din.py"
---

```python
import tensorflow as tf

from core.model_utils import (
    build_input_layer,
    build_group_feature_embedding_table_dict,
    concat_group_embedding,
    get_linear_logits,
    add_tensor_func,
    parse_din_feature_columns,
    concat_func,
)
from core.layers import DNNs, FeedForwardLayer

class DinAttentionLayer(tf.keras.layers.Layer):
    """ DIN Attention:

    Reference:
        Deep Interest Network for Click-Through Rate Prediction

    Args:
        ffn_hidden_units: 前馈神经网络隐藏层单元数
        ffn_activation: 前馈神经网络激活函数
        query_ffn: 是否使用前馈神经网络对查询输入进行处理，当查询和键的维度不同时必须启用
        query_activation: 查询前馈神经网络激活函数
    """
    def __init__(
        self,
        ffn_hidden_units=[80, 40],
        ffn_activation="dice",
        query_ffn=False,
        query_activation="prelu",
        **kwargs
    ):
        self.query_ffn = query_ffn
        self.query_activation = query_activation
        self.query_ffn_layer = None
        
        self.ffn_layer = FeedForwardLayer(ffn_hidden_units, ffn_activation)
        self.dense = tf.keras.layers.Dense(1)
        super().__init__(**kwargs)
    
    def build(self, input_shape):
        assert len(input_shape) == 2 and len(input_shape[0]) == 3 and len(input_shape[1]) == 3
        if self.query_ffn:
            self.query_ffn_layer = tf.keras.layers.Dense(input_shape[1][-1], self.query_activation)

    def call(self, inputs, mask=None, **kwargs):
        # query: [B, 1, H]
        # keys: [B, L, H]
        query, keys = inputs
        query = tf.squeeze(query, axis=1)
        if self.query_ffn_layer is not None:
            query = self.query_ffn_layer(query)

        length = tf.shape(keys)[-2]
        query = tf.expand_dims(query, axis=1)
        att_inputs = tf.concat([tf.tile(query, [1, length, 1]),
                                keys, query - keys, query * keys], axis=-1)
        hidden_layer = self.ffn_layer(att_inputs)
        scores = self.dense(hidden_layer)
        scores = tf.reshape(scores, [-1, 1, length])

        if mask is not None:
            mask = mask[1]

            mask = tf.expand_dims(mask, axis=1)

            scores += (1.0 - tf.cast(mask, keys.dtype)) * (-1e9)

        scores /= keys.get_shape().as_list()[-1] ** 0.5
        scores = tf.nn.softmax(scores)

        att_outputs = tf.matmul(scores, keys)

        return tf.squeeze(att_outputs, axis=1)

def build_din_model(feature_columns, model_config):
    """
    构建 DIN (深度兴趣网络) 排序模型。

    参数:
        feature_columns: FeatureColumn 列表
        model_config: 包含以下参数的字典:
            - dnn_units: list, 隐藏层单元数包括输出大小 (默认 [128, 64, 1])
            - linear_logits: bool, 是否添加线性项 (默认 True)

    返回:
        (model, None, None): 排序模型元组
    """
    dnn_units = model_config.get("dnn_units", [128, 64, 1])

    # 输入和嵌入
    input_layer_dict = build_input_layer(feature_columns)
    group_embedding_feature_dict = build_group_feature_embedding_table_dict(
        feature_columns, input_layer_dict, prefix="embedding/"
    )

    # 来自 'dnn' 组的基础 DNN 输入
    dnn_inputs = concat_group_embedding(group_embedding_feature_dict, "dnn")

    # 对序列特征进行 DIN 注意力机制
    din_output_list = []
    din_feature_list = parse_din_feature_columns(feature_columns)
    for k_name, v_name in din_feature_list:
        query_feature = group_embedding_feature_dict["din_sequence"][k_name]
        key_feature = group_embedding_feature_dict["din_sequence"][v_name]
        din_output = DinAttentionLayer(name=v_name + "_din_layer")(
            [
                query_feature,
                key_feature,
            ]
        )
        din_output_list.append(din_output)
    din_output = concat_func(din_output_list, axis=1, flatten=True)
    dnn_inputs = concat_func([dnn_inputs, din_output], axis=-1)

    # DNN 塔
    dnn_logits = DNNs(dnn_units, use_bn=True)(dnn_inputs)
    linear_logit = get_linear_logits(input_layer_dict, feature_columns)
    dnn_logits = add_tensor_func([dnn_logits, linear_logit])

    # 输出: 遵循排序约定以确保 (batch,) 标签兼容性
    final_logits = tf.keras.layers.Flatten()(dnn_logits)
    output = tf.keras.layers.Dense(1, activation="sigmoid", name="din_output")(final_logits)

    model = tf.keras.models.Model(
        inputs=list(input_layer_dict.values()), outputs=output
    )

    return model, None, None

```
