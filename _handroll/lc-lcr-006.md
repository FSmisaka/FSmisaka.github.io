---
layout: handroll-detail
title: "【LCR 006】两数之和II"
section: leetcode
date: 2026-03-22
order: 20260322
source: "https://github.com/FSmisaka/Algorithm/blob/main/DataStructure/01%20ArraysAndStrings/%E3%80%90LCR%20006%E3%80%91%E4%B8%A4%E6%95%B0%E4%B9%8B%E5%92%8CII.md"
---

# 题目

给定一个下标从 `1` 开始的整数数组 `numbers` ，该数组已按非递减顺序排列，请你从数组中找出满足相加之和等于目标数 `target` 的两个数

# 样例

输入：`numbers = [2,3,4]`, `target = 6`  
输出：`[1,3]`

# 快慢双指针

```python
class Solution:
    def twoSum(self, numbers: List[int], target: int) -> List[int]:
        i, j = 0, len(numbers)-1
        while True:
            sumNum = numbers[i] + numbers[j]
            if sumNum == target:
                return list((i+1,j+1))
            elif sumNum > target:
                j -= 1
            else:
                i += 1
```
