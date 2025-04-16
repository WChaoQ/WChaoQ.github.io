# Python基础入门

Python是一种高级编程语言，以其简洁易读的语法和强大的功能而闻名。本文记录了我学习Python的基础知识。

## 变量和数据类型

Python中的变量无需声明类型，可以直接赋值使用：

```python
# 整数
x = 10
# 浮点数
y = 3.14
# 字符串
name = "Python"
# 布尔值
is_active = True
```

## 条件语句

Python使用缩进来表示代码块：

```python
age = 18
if age >= 18:
    print("成年人")
else:
    print("未成年人")
```

## 循环结构

Python中的循环有for和while两种：

```python
# for循环
for i in range(5):
    print(i)  # 输出0,1,2,3,4

# while循环
count = 0
while count < 5:
    print(count)
    count += 1
```

## 函数定义

在Python中定义函数使用def关键字：

```python
def greet(name):
    return f"Hello, {name}!"

message = greet("World")
print(message)  # 输出: Hello, World!
```

## 列表和字典

Python的两个重要数据结构：

```python
# 列表
fruits = ["apple", "banana", "cherry"]
fruits.append("orange")

# 字典
person = {
    "name": "Alice",
    "age": 25,
    "city": "Beijing"
}
print(person["name"])  # 输出: Alice
```

## 总结

Python是一门非常适合初学者的语言，它的语法简洁明了，有丰富的第三方库支持。学习Python可以帮助我们快速实现各种功能，从数据分析到网站开发。