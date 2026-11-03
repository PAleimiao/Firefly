---
title: df 说满了，du 说没满：一场 Linux 磁盘空间失踪案
published: 2026-11-03
description: 磁盘告警 100%，du 翻遍全盘却查不出东西在哪。本文用一次真实的排查实验，讲清 df/du 的统计口径差异、被进程咬住的已删除文件，以及 journal、Docker 这些吞盘巨兽该怎么收拾。
tags: [Linux, 运维, 排查, 磁盘, 踩坑]
category: 技术
slug: df-full-du-empty
image: ./images/df-full-du-empty-cover.jpg
---

> 封面这块裸盘，就是本案的案发现场。

# 案情简介

凌晨两点，监控在群里炸了：某台小主机的根分区使用率 96%，还在缓慢爬升。

上去第一反应永远是那套肌肉记忆：`df -h` 一看，满了；`du -sh /*` 一层一层往下钻——加起来却发现，**du 算出来的总量比 df 少了一大截**。磁盘明明快炸了，du 却两手一摊：我没看见谁在吃。

这就是今天的主角，Linux 磁盘失踪案里最经典的一类：**df 和 du 对不上**。

## 先把两个证人的口径搞清楚

`df` 和 `du` 其实是两个立场完全不同的证人：

- `df`（disk free）直接问**文件系统**：这个分区还剩多少块？它统计的是整个文件系统的真实占用，精确到块。
- `du`（disk usage）是**从目录树往下走**，挨个 stat 它能看见的文件，然后把文件大小加起来。

口径不同，案底就有缝隙。只要存在"df 看得见、du 走不到"的文件，两者的差值就是赃物藏身处。最常见的一共有三类：

1. 已删除、但还被进程抓着不放的文件；
2. 被新挂载点盖住的目录（挂载前目录里已有的东西）；
3. 非 root 用户无权进入的目录，du 默认闭嘴不报。

## 复现一个"幽灵文件"

光说不练假把式，我专门在机器上复现了一次。先造一个 300MB 的文件，再让一个进程把它打开，然后当着进程的面把文件删掉：

```bash
$ dd if=/dev/zero of=/tmp/hole.img bs=1M count=300
$ python3 -c "import os,time; f=open('/tmp/hole.img','rb'); os.unlink('/tmp/hole.img'); time.sleep(120)" &
```

现在看现场，情况相当魔幻：

```bash
$ du -sh /tmp/demo
0       /tmp/demo          # du：我这边什么都没有

$ df -h /
overlay        256G  490M  254G   1%  /   # df：占用实打实多了 300M
```

文件已经不存在于任何目录里，但它的数据块还躺在磁盘上。原因不玄学：Linux 里删除一个文件（unlink）只是把它从目录树里摘掉，**只有当没有任何进程持有它时，内核才会真正回收数据块**。那个 python 进程还攥着文件描述符，块就还能不能释放。

抓凶器的命令就一句：

```bash
$ lsof +L1
COMMAND   PID USER  FD  TYPE DEVICE  SIZE/OFF NODE NAME
python3 118059 root   3r  REG  0,758 314572800 19251 /tmp/hole.img (deleted)
```

`lsof +L1` 专查"链接数为 0 但仍被打开"的文件，`SIZE/OFF` 那列直接告诉你它咬住了多少空间——314572800 字节，正好 300MB，人赃并获。

处理方式看情况：能重启的服务就重启，不能随便重启的（比如正在写日志的数据库），可以用 `: > /proc/<PID>/fd/<FD>` 把文件描述符对应的内容原地截断，空间立刻归还，服务不用动。

## 两个容易被忽略的从犯

### inode 也是会满的

如果 `df -h` 显示还有空间，但写入照样报 `No space left on device`，去看 `df -i`。小文件（几百万个零碎缓存）能把 inode 耗光，块还有剩。这种案子的凶手通常是程序自己，得从源头治理，删文件只是止血。

### systemd journal 这个安静的胖子

很多发行版的 journald 默认不设上限，日志可以安安静静吃掉几个 G。查一下家底：

```bash
$ journalctl --disk-usage
Archived and active journals take up 2.1G in the file system.
```

觉得多就限额，一条命令生效：

```bash
sudo journalctl --vacuum-size=500M
# 想永久生效，在 /etc/systemd/journald.conf 里设 SystemMaxUse=500M
```

Docker 同理，`docker system df` 先看账本，再 `docker system prune` 大扫除。另外 `kill -9` 掉的程序如果在 core dump 开着的环境下崩过，去 `/var/lib/systemd/coredump/` 和 `/var/crash/` 瞄一眼，经常有惊喜。

## 结案报告

这套排查流程浓缩成五步，基本能破掉 90% 的磁盘失踪案：

1. `df -h` + `df -i`：确定是块满了还是 inode 满了；
2. `du -x -d2 / | sort -h | tail`：逐层下钻找大头（`-x` 别越过文件系统边界）；3. `df` 与 `du` 差值大 → `lsof +L1` 揪 deleted-but-open；
4. 惯犯点名：journal、Docker、旧内核、core dump、被挂载盖住的目录；
5. 止血之后做预防：journald 限额、日志轮转、监控告警提前到 80%。

说到底，磁盘失踪案从来不是玄学，只是 du 这个证人只肯招供它看得见的部分。下次告警再响，别急着 rm，先把 df 和 du 的口供对一对——凶手通常就藏在差值里，正咬着文件描述符冲你笑。

> 参考：[lsof(8) 手册](https://man7.org/linux/man-pages/man8/lsof.8.html) · [Arch Wiki: systemd-journald](https://wiki.archlinux.org/title/Systemd/Journal) · [Docker 官方文档: system prune](https://docs.docker.com/reference/cli/docker/system/prune/)
