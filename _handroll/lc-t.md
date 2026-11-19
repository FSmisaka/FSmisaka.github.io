---
layout: handroll-detail
title: "【T】字符串匹配-KMP算法"
section: leetcode
date: 2026-03-22
order: 20260322
source: "https://github.com/FSmisaka/Algorithm/blob/main/DataStructure/01%20ArraysAndStrings/%E3%80%90T%E3%80%91%E5%AD%97%E7%AC%A6%E4%B8%B2%E5%8C%B9%E9%85%8D-KMP%E7%AE%97%E6%B3%95.md"
---

# 算法概述

字符串匹配 - KMP算法（一种”双指针“的应用）  

在暴力遍历字符串的基础上，减少不必要的遍历次数。  
具体做法是，用两个指针，分别指向两个字符串中的字符，如果字符相同，则指针同时向右。如果不同，则 `pattern` 字符串的指针回溯。回溯的方式通过 `next数组` 得到。 `next数组` 的特点是， `next[i] = pattern[0:i]` 这个子串最长重合前缀后缀的长度。构造方式是，用两个指针 `i` , `j` ， `i` 指向此时需要填写的 `next数组` 位置， `j` 不断变动，指向潜在的和 `pattern[i]` 有相同字符的特定的位置。（文字描述太难了，看b站的图解就懂力⬇️）  

基本介绍：BV1AY4y157yL  

构造next数组图解：BV16X4y137qw（很清晰）  

# AC代码

```python
class Solution:
    def nextBuild(self, needle: str) -> List[int]:
        ans = [0 for i in range(len(needle))]
        i, j = 1, 0
        while i < len(needle):
            if needle[j] == needle[i]:
                j += 1
                ans[i] = j
                i += 1
            else:
                if j == 0:
                    ans[i] = 0
                    i += 1
                else:
                    j = ans[j-1]
        return ans
    def strStr(self, haystack: str, needle: str) -> int:
        nextLis = self.nextBuild(needle)
        i, j = 0, 0
        while i < len(haystack):
            if haystack[i] == needle[j]:
                i += 1
                j += 1
            elif j > 0:
                j = nextLis[j-1]
            else:
                i += 1
            if j == len(needle):
                return i-len(needle)
        return -1
```
