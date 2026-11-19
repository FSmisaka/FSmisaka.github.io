---
layout: handroll-detail
title: "【4】寻找两个正序数组的中位数"
section: leetcode
date: 2026-03-22
order: 20260322
source: "https://github.com/FSmisaka/Algorithm/blob/main/Algorithm/01%20DivideAndConquer/%E3%80%904%E3%80%91%E5%AF%BB%E6%89%BE%E4%B8%A4%E4%B8%AA%E6%AD%A3%E5%BA%8F%E6%95%B0%E7%BB%84%E7%9A%84%E4%B8%AD%E4%BD%8D%E6%95%B0.md"
---

# 二分

思想：假设从 `nums1` 中取出前 $m_1$ 个，从 nums2 中取出前 $m_2$ 个  
$m_2 = \frac{l_1 + l_2}{2} - m_1$

然后对 $m_1$ 做二分即可  
需要先简单确定一下 $m_1$ 的范围

```python
class Solution:
    def findMedianSortedArrays(self, nums1: List[int], nums2: List[int]) -> float:
        l1, l2 = len(nums1), len(nums2)
        inf = float('inf')
        isOdd = (l1+l2)%2

        # 确定 m1 和 m2 的范围，最少取 0 个，最多取 l 个
        # 0 <= m1 <= l1
        # 0 <= mid - m1 <= l2
        # mid - l2 <= m1 <= mid
        # max(0, mid - l2) <= m1 <= min(l1, mid)

        left, right = max(0, (l1+l2)//2-l2), min(l1, (l1+l2)//2)
        while left <= right:
            m1 = (left + right) // 2  # 选 m1 个
            m2 = (l1 + l2) // 2 - m1

            if (nums1[m1-1] if m1 else -inf) <= (nums2[m2] if m2 < l2 else inf) and (nums2[m2-1] if m2 else -inf) <= (nums1[m1] if m1 < l1 else inf):
                if isOdd:
                    return min((nums1[m1] if m1 < l1 else inf), (nums2[m2] if m2 < l2 else inf))
                else:
                    return (max((nums1[m1-1] if m1 else -inf), (nums2[m2-1] if m2 else -inf)) + min((nums1[m1] if m1 < l1 else inf), (nums2[m2] if m2 < l2 else inf))) / 2
            elif (nums1[m1-1] if m1 else -inf) <= (nums2[m2] if m2 < l2 else inf):
                left = m1+1
            else:
                right = m1-1
```
