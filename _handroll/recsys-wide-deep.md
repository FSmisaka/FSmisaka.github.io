---
layout: handroll-detail
title: "Wide & Deep"
section: recsys
date: 2026-07-24
order: 20260724
source: "https://github.com/FSmisaka/hand-roll/blob/main/models/wide_deep.py"
---

```python
"""
Wide & Deep 模型

Wide & Deep Learning for Recommender Systems
(https://arxiv.org/abs/1606.07792)

架构:
- Wide 部分 (记忆): 线性模型 + 特征交叉，捕获历史共现模式
- Deep 部分 (泛化): Embedding + DNN，学习高阶特征交互
- 联合输出: sigmoid(Wide_logits + Deep_logits)
"""

import tensorflow as tf

from core.model_utils import (
    build_input_layer,
    build_group_feature_embedding_table_dict,
    concat_group_embedding,
    add_tensor_func,
    get_linear_logits,
    get_cross_logits,
)
from core.layers import DNNs


def build_wide_deep_model(feature_columns, model_config):
    """
    构建 Wide & Deep 模型。

    Args:
        feature_columns: FeatureColumn 列表。
        model_config: 模型配置字典，支持:
            - dnn_units: DNN 各层单元数 (默认 [64, 32])
            - dnn_dropout_rate: Dropout 比率 (默认 0.1)

    Returns:
        (model, None, None): 排序模型返回 (主模型, None, None)
    """
    dnn_units = model_config.get("dnn_units", [64, 32])
    dnn_dropout_rate = model_config.get("dnn_dropout_rate", 0.1)

    # 1. 构建输入层
    input_layer_dict = build_input_layer(feature_columns)

    # 2. 构建特征 embedding 表
    group_embedding_feature_dict = build_group_feature_embedding_table_dict(
        feature_columns, input_layer_dict, prefix="embedding/"
    )

    # 3. 拼接各组特征
    group_feature_dict = {}
    for group_name in group_embedding_feature_dict:
        group_feature_dict[group_name] = concat_group_embedding(
            group_embedding_feature_dict, group_name, axis=1, flatten=True
        )  # B x (N * D)

    # 4. Deep 部分: 每个特征组通过 DNN → 标量 logit
    deep_logits = []
    for group_name, group_feature in group_feature_dict.items():
        deep_out = DNNs(
            units=dnn_units,
            activation="relu",
            dropout_rate=dnn_dropout_rate,
        )(group_feature)
        deep_logit = tf.keras.layers.Dense(1, activation=None)(deep_out)
        deep_logits.append(deep_logit)

    # 5. Wide 部分: 线性 logits + 交叉 logits
    linear_logit = get_linear_logits(input_layer_dict, feature_columns)
    cross_logit = get_cross_logits(input_layer_dict, feature_columns)

    # 6. 融合输出
    wide_deep_logits = add_tensor_func(deep_logits + [linear_logit, cross_logit])
    wide_deep_logits = tf.keras.layers.Flatten()(wide_deep_logits)
    output = tf.keras.layers.Dense(
        1, activation="sigmoid", name="wide_deep_output"
    )(wide_deep_logits)
    output = tf.keras.layers.Flatten()(output)

    model = tf.keras.Model(inputs=list(input_layer_dict.values()), outputs=output)

    # 排序模型: (model, None, None)
    return model, None, None

```
