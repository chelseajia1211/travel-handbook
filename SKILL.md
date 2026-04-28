---
name: travel-handbook
description: |
  创建可打印的旅行手册（A5 小册子）。从行程规划到排版输出 PDF 的完整工作流。
  输出：HTML + CSS → Puppeteer → 打印级 A5 PDF。
  Use when: user wants to create a travel handbook, travel guide, trip booklet, printable itinerary, or 旅行手册.
  Triggers: 旅行手册, travel handbook, 行程手册, trip booklet, 旅行指南制作, 打印手册, printable guide.
user-invocable: true
argument-hint: <目的地 + 日期 + 人数/关系>
---

# 旅行手册制作工作流

将一段旅行行程转化为可打印的 A5 小册子——集行程指南、知识读本、互动纪念于一体。

---

## Phase 0：需求采集

开始前必须向用户确认以下信息：

| 必填项 | 示例 |
|--------|------|
| 目的地 | 西双版纳 + 普洱 |
| 日期 | 2026.4.29 - 5.5 |
| 出发地/返回地 | 上海 |
| 人数与关系 | 情侣 / 家庭 / 朋友 |
| 每人兴趣标签（2-3 个） | 他：交通、历史、地理；她：艺术、文化、故事 |
| 手册定位 | 旅途翻阅 / 出发前阅读 / 纪念品 / 综合 |
| 已有行程？ | 用户可能已有粗略日程，也可能需要从零规划 |

可选项：手册标题偏好、语言风格偏好、是否需要专题文章、是否需要互动区域。

**停下来等用户确认后再进入 Phase 1。**

---

## Phase 1：设计方案

根据需求制定设计方案，包含以下决策：

### 1.1 内容结构设计

根据旅行天数和定位，设计手册结构。典型结构：

```
手册
├── 封面（全出血图片）
├── 地图页（1-2 页全出血）
├── Part I 行程主线
│   ├── 每日行程页 × N（行程 + 互动，每天 2 页）
│   ├── 特色互动页（品鉴笔记 / 植物采集 / 默契卡等）
│   ├── 味觉编年史（1 页）
│   └── 实用速查（1 页）
├── Part II 专题读本（可选）
│   └── 专题文章 × M（每篇 2 页）
├── 附录（1-2 页）
└── 封底（全出血图片）
```

**页数估算**：封面 1 + 地图 1-2 + 每天 2 页 + 速查 1 + 专题 × 2 + 附录 1-2 + 封底 1。
7 天旅行 + 7 篇专题 ≈ 37 页。控制在 40 页以内以控制打印成本。

### 1.2 视觉设计系统

为每本手册定制配色和字体。以下是设计模板：

```css
:root {
  /* 主色调——根据目的地特征选取 */
  --primary:     #______;  /* 标题、边框、强调 */
  --secondary:   #______;  /* 知识卡片、专题标题 */
  --background:  #______;  /* 页面背景 */
  --text-dark:   #2C2C2C;  /* 正文 */

  /* 辅助色 */
  --accent:      #______;  /* 页眉、线条装饰 */
  --accent-alt:  #______;  /* 极少量点缀 */
  --card-bg-a:   #______;  /* 甲方卡片底色 */
  --card-bg-b:   #______;  /* 乙方卡片底色 */

  /* 页面尺寸 */
  --page-width: 148mm;
  --page-height: 210mm;
  --margin-outer: 10mm;
  --margin-inner: 15mm;  /* 装订侧 */
  --margin-top: 12mm;
  --margin-bottom: 12mm;

  /* 字号（户外阅读优化，偏大） */
  --font-h1: 22pt;
  --font-h2: 16pt;
  --font-h3: 13pt;
  --font-body: 10.5pt;
  --font-card-title: 11pt;
  --font-card-body: 10pt;
  --font-small: 8pt;
}
```

配色选择原则：
- 从目的地的自然/文化元素中提取（如：热带→土地棕+雨林绿，海岛→海蓝+珊瑚橙，古城→墨灰+朱红）
- 背景色用暖白/米白，避免纯白（打印不友好）
- 卡片底色用主色调的极淡变体

### 1.3 内容风格

根据用户偏好选择：
- **杂志编辑风**（《国家地理》式纪实叙述）—— 适合文化/自然类目的地
- **轻松对话风** —— 适合城市/度假类旅行
- **学术探索风** —— 适合历史/考古类目的地

**将设计方案呈现给用户，确认后进入 Phase 2。**

---

## Phase 2：技术框架搭建

### 2.1 文件结构

```
handbook-project/
├── index.html       # 主文件（所有内容，浏览器打印用）
├── style.css        # A5 打印排版样式
├── print.js         # Puppeteer PDF 生成脚本
└── images/          # 插图（封面、地图、专题题图等）
```

所有内容集中在单个 `index.html` 中，不分拆文件——Puppeteer 需要一次性渲染所有页面。

### 2.2 CSS 核心框架

#### 打印分页

```css
@page {
  size: A5 portrait;
  margin: 0;  /* 关键：所有 margin 由 .page 控制 */
}
```

#### 页面容器

```css
.page {
  width: var(--page-width);
  height: var(--page-height);  /* 必须用 height 而非 min-height */
  padding: var(--margin-top) var(--margin-outer) var(--margin-bottom) var(--margin-inner);
  page-break-after: always;
  break-after: page;
  position: relative;
  background: var(--background);
  overflow: hidden;  /* 关键：防止内容溢出到下一页 */
  counter-increment: page-counter;
}
```

**WYSIWYG 要点**：
- `.page` 使用固定 `height`（非 `min-height`），加 `overflow: hidden`
- 屏幕预览时模拟纸张效果：

```css
@media screen {
  body {
    background: #666;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding: 20px 0;
  }
  .page {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }
}
```

#### 页码系统

```css
.page::after {
  content: counter(page-counter);
  position: absolute;
  bottom: 6mm;
  left: 50%;
  transform: translateX(-50%);
  font-size: 9pt;
  color: var(--accent);
}

/* 封面、全出血页不显示页码也不计入 */
.page.cover, .page.full-bleed {
  counter-increment: none;
  padding: 0;
}
.page.cover::after, .page.full-bleed::after {
  display: none;
}
```

#### 全出血图片页

```css
.page.full-bleed {
  padding: 0;
  overflow: hidden;
}
.page.full-bleed img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
```

### 2.3 Puppeteer PDF 生成

```javascript
// print.js
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(
    'file:///absolute/path/to/index.html',
    { waitUntil: 'networkidle0', timeout: 30000 }
  );

  await page.pdf({
    path: 'output.pdf',
    preferCSSPageSize: true,   // 使用 CSS @page 尺寸
    printBackground: true,     // 打印背景色和图片
    displayHeaderFooter: false, // 不显示浏览器默认页眉页脚
    margin: { top: 0, bottom: 0, left: 0, right: 0 },  // 与 @page margin: 0 配合
  });

  await browser.close();
  console.log('PDF generated successfully.');
})();
```

**安装依赖**：`npm install puppeteer`（首次需要）。

---

## Phase 3：内容撰写

### 3.1 每日行程页模板（2 页/天）

#### 第 1 页：行程页

```html
<div class="page">
  <div class="page-header">
    <span class="day-label">DAY 01</span>
    <span class="date-label">04.29 · 主题关键词</span>
  </div>

  <!-- 时间轴 -->
  <div class="timeline">
    <div class="timeline-item">
      <span class="timeline-time">17:10</span>
      <span class="timeline-place"> 出发地 → 目的地</span>
      <div class="timeline-detail">交通方式 · 时长 · 费用 <span class="timeline-tag">¥XX</span></div>
    </div>
    <!-- 3-6 个时间节点 -->
  </div>

  <!-- 味觉指南 -->
  <div class="flavor-guide">
    <h4>今日味觉</h4>
    <p><strong>菜名</strong> — 一句话描述</p>
    <p><strong>菜名</strong> — 一句话描述</p>
  </div>

  <hr class="divider">

  <!-- 知识卡片（双人旅行时按兴趣分配） -->
  <div class="card-row">
    <div class="card card-his">
      <div class="card-label">🗺️ 他的卡片</div>
      <h4>卡片标题</h4>
      <p>卡片正文（80-120字，信息密度高，一段话讲清一个知识点）</p>
    </div>
    <div class="card card-her">
      <div class="card-label">🎨 她的卡片</div>
      <h4>卡片标题</h4>
      <p>卡片正文</p>
    </div>
  </div>
</div>
```

#### 第 2 页：互动页

每天的互动页包含固定元素 + 当日特色互动：

```html
<div class="page">
  <div class="page-header">
    <span class="day-label">DAY 01</span>
    <span class="date-label">互动 &amp; 纪念</span>
  </div>

  <!-- 当日特色互动（每天不同） -->
  <!-- 例如：旅途开篇/植物采集/默契卡/品茶笔记/建筑速写/密封信 -->

  <!-- 固定：今日切片 -->
  <div class="daily-slice">
    <h4>📝 今日切片</h4>
    <p class="interactive-hint">今天最想记住的一个画面——</p>
    <div class="slice-row">
      <div class="slice-col"><span class="slice-label">A：</span></div>
      <div class="slice-col"><span class="slice-label">B：</span></div>
    </div>
  </div>

  <!-- 固定：粘贴区 -->
  <div class="paste-area" style="min-height:30mm;">
    <div class="paste-hint">📎 粘贴区<br>
      <span style="font-size:var(--font-small);">门票 · 小票 · 名片</span>
    </div>
  </div>
</div>
```

### 3.2 互动类型库

根据旅行类型混搭使用，避免重复：

| 类型 | 适用场景 | 空间占用 |
|------|---------|---------|
| ✍️ 手写区（开篇/尾声） | 第一天、最后一天 | 大（50mm+） |
| 🌿 标本采集页（2×2 格） | 植物园、雨林、花海 | 整页 |
| 🃏 默契测试卡 | 旅途中段、倒数第二天 | 中（3-4 题） |
| 🍵 品鉴笔记（茶/酒/咖啡） | 产地体验 | 中 |
| 🏠 建筑速写框 | 古镇、古建筑 | 中（并排双框） |
| 📊 对比表 | 两种体验对比 | 小 |
| 💌 密封信 | 最后一天 | 大 |
| 🎲 随机任务卡 | 自由行程日 | 小 |

### 3.3 知识卡片撰写要求

- **字数**：80-120 字/卡，卡片在页面上空间有限
- **信息密度**：一张卡讲清一个知识点，不泛泛而谈
- **结构**：开头一句抓人 → 核心事实 → 与当日行程的关联
- **事实核查**：涉及历史年代、地理数据、文化习俗时，必须通过网络检索验证
- **双人分配**：按各自兴趣标签分配（如：他=交通/历史/地理，她=艺术/文化/故事）

### 3.4 专题文章撰写（Part II，可选）

每篇 2 页，结构：

**第 1 页**：hero 图片 + 正文（首字下沉）
```html
<div class="page">
  <div class="topic-hero">
    <img src="images/topic-XX.jpg" alt="...">
    <div class="topic-hero-text">
      <h1>专题标题</h1>
      <div class="topic-lead">一句话引言</div>
    </div>
  </div>
  <div class="topic-body">
    <p>首段（无缩进，首字下沉）...</p>
    <p>后续段落（2em 缩进）...</p>
  </div>
</div>
```

**第 2 页**：续页正文 + 侧边栏

```html
<div class="page">
  <div class="topic-body topic-body-cont">
    <p>续页段落...</p>
  </div>
  <div class="topic-sidebar">
    <h4>速查 / 数据 / 大事记</h4>
    <p>补充信息</p>
  </div>
</div>
```

Hero 图片的 CSS（图片延伸到页面边缘）：

```css
.topic-hero {
  position: relative;
  width: calc(100% + var(--margin-inner) + var(--margin-outer));
  margin-left: calc(-1 * var(--margin-inner));
  margin-top: calc(-1 * var(--margin-top));
  margin-bottom: 10pt;
  overflow: hidden;
}
.topic-hero img {
  width: 100%;
  height: 70mm;
  object-fit: cover;
  display: block;
}
.topic-hero-text {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  padding: 30pt var(--margin-inner) 12pt;
  background: linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0.35) 65%, transparent);
}
.topic-hero-text h1 {
  color: white;
  font-size: 18pt;
  text-shadow: 0 1px 4px rgba(0,0,0,0.5);
}
```

专题文章写作要求：
- 2500-3000 字/篇（分 2 页）
- 杂志编辑风：叙事性强，有画面感
- 交织多个视角，不是干巴巴的百科条目
- 与行程中的具体地点形成呼应
- 关键事实必须检索验证

---

## Phase 4：AI 插图生成

需要的插图：
- 封面 1 张（全出血，A5 竖版，比例 2:3）
- 地图 1-2 张（全出血）
- 专题题图 × M 张（横版，比例 3:2，hero 区域 70mm 高）
- Part II 分隔页 1 张（全出血）
- 封底 1 张（全出血）

生图要求：
- 风格统一（同一本手册内所有插图保持一致的风格和色调）
- 与手册配色系统协调
- 分辨率至少 2K

如有 `image-gen` skill 可用，使用它生成：

```bash
python3 ~/.claude/skills/image-gen/scripts/image_gen.py "<prompt>" -q 2K -a 2:3
```

---

## Phase 5：排版质量保证

### 5.1 溢出检测（关键步骤）

**每次内容修改后必须运行此检测。** 使用 Puppeteer 检查每页内容是否超出页面高度：

```javascript
// 溢出检测脚本（嵌入 node -e 运行）
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('file:///path/to/index.html', {waitUntil: 'networkidle0', timeout: 30000});

  const results = await page.evaluate(() => {
    const pages = document.querySelectorAll('.page');
    const overflows = [];
    pages.forEach((p, i) => {
      const diff = p.scrollHeight - p.clientHeight;
      const header = p.querySelector('.page-header');
      const label = header ? header.textContent.trim() : (p.classList.contains('cover') ? '封面' : '全出血');
      if (diff > 2) {
        overflows.push({page: i+1, label, overflow: diff + 'px (' + Math.round(diff/7.56*10)/10 + 'mm)'});
      }
    });
    return {total: pages.length, overflows};
  });

  console.log('Total pages:', results.total);
  if (results.overflows.length === 0) console.log('No overflows detected!');
  else results.overflows.forEach(o => console.log('  Page ' + o.page + ' [' + o.label + ']: ' + o.overflow));
  await browser.close();
})();
```

### 5.2 溢出修复策略

按溢出量从小到大选择策略：

| 溢出量 | 策略 |
|--------|------|
| < 5px (< 1mm) | 减小 divider/card-row/timeline 的 margin（inline style） |
| 5-20px (1-3mm) | 精简卡片文字（删冗余修饰，保留信息量） |
| 20-50px (3-7mm) | 缩小互动区（paste-area/writing-area 高度）或减少内容条目 |
| 50-100px (7-14mm) | 拆分为 2 页，或移除低优先级区块（如行李寄存） |
| > 100px (> 14mm) | 必须拆页 |

修复原则：
- **优先减间距**，再减内容，最后拆页
- 用 inline style 做页面级覆盖，避免影响全局 CSS
- 粘贴区/手写区是最容易压缩的缓冲区（最低 10mm）
- 卡片文字精简时保留核心信息，只删修饰性语句

### 5.3 常见排版陷阱

1. **`min-height` vs `height`**：`.page` 必须用 `height`，用 `min-height` 会导致 PDF 和预览不一致
2. **`@page margin` 冲突**：`@page { margin: 0 }` 是唯一正确设置。不要用 named page rules
3. **`@media print` 覆盖过多**：只需 `box-shadow: none`，不要在 print 里改 `.page` 的尺寸或 padding
4. **全出血页的 padding**：`.full-bleed` 必须 `padding: 0`，否则图片无法铺满
5. **卡片 HTML 结构**：`card-row > card + card` 三层嵌套缺一不可，标签缺失会导致渲染错乱
6. **专题页的 hero 负 margin**：用 `calc(-1 * var(--margin-inner))` 而非硬编码值
7. **字体加载**：Google Fonts 通过 `@import` 在 CSS 顶部引入，Puppeteer 的 `waitUntil: 'networkidle0'` 会等待字体加载

---

## Phase 6：输出 PDF

所有溢出修复完成后，运行 `node print.js` 生成最终 PDF。

验收清单：
- [ ] 所有页面零溢出
- [ ] 封面/封底/地图全出血铺满
- [ ] 页码正确（封面和全出血页不显示）
- [ ] 字体正常渲染（中文宋体/黑体）
- [ ] 知识卡片双栏并排不错位
- [ ] 互动区留白充足可手写
- [ ] 粘贴区虚线框清晰

---

## 快速参考：HTML 页面类型

| 类型 | class | 页码 | padding | 用途 |
|------|-------|------|---------|------|
| 普通页 | `page` | 有 | 标准 | 行程/互动/速查/附录 |
| 封面 | `page cover` | 无 | 0 | 封面图片 |
| 全出血 | `page full-bleed` | 无 | 0 | 地图/分隔页/封底 |

## 快速参考：组件清单

| 组件 | class | 用途 |
|------|-------|------|
| 页眉 | `.page-header` | 日期标签 |
| 时间轴 | `.timeline > .timeline-item` | 每日行程 |
| 知识卡片 | `.card-row > .card.card-his + .card.card-her` | 双人知识点 |
| 味觉指南 | `.flavor-guide` | 每日推荐食物 |
| 今日切片 | `.daily-slice` | 双人各写一行 |
| 粘贴区 | `.paste-area` | 门票/小票 |
| 手写区 | `.handwriting-area > .writing-lines` | 长段手写 |
| 默契卡 | `.quiz-card > .quiz-question` | 情侣/朋友互动 |
| 品鉴笔记 | `.tea-note` | 茶/酒/咖啡品鉴 |
| 速写框 | `.sketch-frame` | 建筑/风景速写 |
| 标本格 | `.specimen-grid > .specimen-cell` | 植物/标本收集 |
| 分隔线 | `.divider` / `.divider-gold` | 区块分隔 |
| 专题 hero | `.topic-hero` | 专题文章题图 |
| 专题正文 | `.topic-body` / `.topic-body-cont` | 专题文章内容 |
| 专题侧栏 | `.topic-sidebar` | 补充数据/速查 |
| 参考表格 | `.reference-table` | 速查表/对照表 |
| 附录列表 | `.appendix-list` | 推荐阅读等 |

---

## 工作流总结

```
Phase 0  需求采集（停等确认）
   ↓
Phase 1  设计方案：结构 + 配色 + 风格（停等确认）
   ↓
Phase 2  技术框架：HTML 骨架 + CSS + print.js
   ↓
Phase 3  内容撰写：行程页 → 互动页 → 专题 → 附录
   ↓    ↻ 每完成一批页面，运行溢出检测
Phase 4  AI 插图生成（如需要）
   ↓
Phase 5  排版 QA：溢出检测 → 修复 → 再检测（循环至零溢出）
   ↓
Phase 6  输出 PDF（node print.js）
```

**核心原则**：先让内容完整呈现，再打磨排版细节。Phase 5 的溢出检测-修复循环是保证打印质量的关键。
