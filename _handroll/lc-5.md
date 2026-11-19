---
layout: handroll-detail
title: "【5】最长回文子串"
section: leetcode
date: 2026-03-22
order: 20260322
source: "https://github.com/FSmisaka/Algorithm/blob/main/DataStructure/01%20ArraysAndStrings/%E3%80%905%E3%80%91%E6%9C%80%E9%95%BF%E5%9B%9E%E6%96%87%E5%AD%90%E4%B8%B2.md"
---

# 题目

给定一个字符串 `s`，找到 `s` 中最长的回文子串。

# 样例

## 样例01

输入：`s = "babad"`  
输出：`"bab"`

## 样例02

输入：`s = "a"`  
输出：`"a"`

# 心路历程

## 01 TLE写法

写一个函数用来判断是否为回文串，然后遍历所有子串判断是否为回文  
如果判断为回文子串并且判断子串长度大于目前备选答案的长度，则更新备选答案  

## 02 简单的修正

遍历方式改为按照回文串长度从大到小遍历（从 `len(s)` 到 `1` ），判断为回文子串则直接 `return`  
时间复杂度O(N^3), 空间复杂度O(1); 8000ms左右  

```python
class Solution:
    def isHui(self, st: str) -> bool:
            for i in range(len(st)//2+1):
                if st[i] != st[len(st)-i-1]:
                    return False
            return True
    def longestPalindrome(self, s: str) -> str:
        l = len(s)
        lt = l
        while(lt > 0):
            for i in range(0,l-lt+1):
                if self.isHui(s[i:i+lt]):
                    return s[i:i+lt]
            lt -= 1
```

## 03 中心扩散

枚举中心节点（奇数/偶数）再从节点向两侧扩散  
时间复杂度O(N^2), 空间复杂度O(1); 300ms左右  
可以看出 这个算法的优点主要在于 已经不是回文了就不会再往外扩散了 从而避免了很多不必要的枚举

```python
class Solution:
    def longestPalindrome(self, s: str) -> str:
        maxLen = 0
        l = len(s)
        ansLeft = -1
        ansRight = -1
        for i in range(l):
            left, right = i, i
            while left>=0 and right<l:
                if s[left] != s[right]:
                    break
                left -= 1
                right += 1
            if right-left-1 > maxLen:
                maxLen = right-left-1
                ansLeft = left
                ansRight = right
        for i in range(l-1):
            left, right = i, i+1
            while left>=0 and right<l:
                if s[left] != s[right]:
                    break
                left -= 1
                right += 1
            if right-left-1 > maxLen:
                maxLen = right-left-1
                ansLeft = left
                ansRight = right
        return s[ansLeft+1:ansRight]
```
