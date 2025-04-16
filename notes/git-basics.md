# Git和GitHub基础

Git是一个分布式版本控制系统，而GitHub是一个基于Git的代码托管平台。本文记录了我学习Git和GitHub的基础知识。

## Git初始配置

在使用Git前，需要进行一些基本配置：

```bash
# 设置用户名
git config --global user.name "Your Name"

# 设置邮箱
git config --global user.email "your.email@example.com"
```

## 创建仓库

创建一个新的Git仓库：

```bash
# 初始化仓库
git init

# 或者克隆已有仓库
git clone https://github.com/username/repository.git
```

## 基本工作流程

Git的基本工作流程包括：

1. 添加文件到暂存区：
```bash
git add filename
# 或添加所有文件
git add .
```

2. 提交更改：
```bash
git commit -m "提交说明"
```

3. 推送到远程仓库：
```bash
git push origin main
```

## 分支管理

Git分支是非常强大的功能：

```bash
# 创建新分支
git branch branch_name

# 切换分支
git checkout branch_name

# 创建并切换分支
git checkout -b branch_name

# 合并分支
git merge branch_name
```

## GitHub操作

GitHub上的常见操作：

1. Fork：在GitHub上复制别人的仓库到自己的账号下
2. Pull Request：提交更改请求，请求原仓库拥有者合并您的更改
3. Issues：提交问题、错误报告或功能请求

## 总结

Git和GitHub是现代软件开发中不可或缺的工具。Git帮助我们跟踪代码变化，而GitHub则提供了一个协作平台，使团队合作更加高效。学习这些工具对于任何开发者来说都是必备技能。