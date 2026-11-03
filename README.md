# 沪游月票

十二月回上海时用的手机网页 App：从一份人工精选的地点库里，按「今天有多少时间、离出发点多远、下不下雨、想看什么」筛出两三个候选——都是本地人和白领常去、大人孩子都能玩的地方。

## 网站
https://littlewave.github.io/huyou-yuepiao/

## 用法

```bash
npm install
npm run dev        # 本机预览；手机连同一 Wi‑Fi，用终端里显示的 Network 地址打开
npm test           # 逻辑测试 + 地点库质量检查
npm run build      # 生成 dist/，放到任意静态托管即可
```

出发前在手机 Safari 打开部署地址 →「分享」→「添加到主屏幕」。打开一次以后离线也能用。

## 出发前要做

地点资料整理于 2026 年中，**全部标为「未核实」**。出发前请按 `docs/curating-places.md` 最后一节逐个核实，确认开放情况和预约方式，再把 `verifiedAt` 填上。

## 文件

| 文件 | 内容 |
|---|---|
| `PRODUCT.md` | 产品定位、用户、原则 |
| `DESIGN.md` | 视觉系统（月票世界） |
| `GLOSSARY.md` | 统一用语 |
| `CLAUDE.md` | 给 Claude Code 的项目说明 |
| `docs/adr/` | 关键设计决策及原因 |
| `docs/curating-places.md` | 地点收录标准与核实流程 |
| `src/data/places.json` | 地点库 |
