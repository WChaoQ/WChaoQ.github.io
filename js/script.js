document.addEventListener('DOMContentLoaded', async function() {
  // 检查是否在笔记详情页面
  const urlParams = new URLSearchParams(window.location.search);
  const noteFilename = urlParams.get('note');
  
  if (noteFilename) {
    // 如果是笔记详情页面，加载对应笔记
    await loadNoteDetail(noteFilename);
  } else {
    // 如果是主页面，加载笔记列表
    await loadNotes();
  }
});

// 改进的颜色方案函数
function getRandomColor() {
  // 定义一组更柔和的颜色
  const colors = [
    '#3b82f6', // 蓝色
    '#10b981', // 绿色
    '#f97316', // 橙色
    '#8b5cf6', // 紫色
    '#ec4899', // 粉色
    '#ef4444', // 红色
    '#6366f1', // 靛蓝色
    '#14b8a6', // 青色
    '#f59e0b'  // 琥珀色
  ];
  // 随机选择一个颜色
  return colors[Math.floor(Math.random() * colors.length)];
}

async function loadNotes() {
  const notesContainer = document.getElementById('notes-container');
  
  try {
    // 获取notes文件夹下的所有Markdown文件列表
    const response = await fetch('/notes/index.json');
    const notes = await response.json();
    
    // 清空现有笔记容器
    notesContainer.innerHTML = '';
    
    // 按日期降序排序笔记（最新的在前面）
    notes.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // 为每个笔记创建卡片
    for (const note of notes) {
      // 加载笔记内容
      const contentResponse = await fetch(`/notes/${note.filename}`);
      const markdownContent = await contentResponse.text();
      
      // 解析Markdown内容
      const content = parseMarkdown(markdownContent, true); // 只提取概览
      
      // 生成随机颜色
      const randomColor = getRandomColor();
      
      // 创建笔记卡片
      const noteCard = document.createElement('div');
      noteCard.className = 'note-card';
      noteCard.style.borderLeftColor = randomColor;
      noteCard.setAttribute('data-filename', note.filename);
      
      // 填充笔记卡片内容（只显示概览）
      noteCard.innerHTML = `
        <h3>${content.title || note.title}</h3>
        <p class="date">${formatDate(note.date)}</p>
        <div class="note-overview">${content.summary}</div>
      `;
      
      // 添加到容器
      notesContainer.appendChild(noteCard);
      
      // 添加点击事件（点击整个卡片跳转到笔记详情页）
      noteCard.addEventListener('click', function() {
        window.location.href = `note.html?note=${encodeURIComponent(note.filename)}`;
      });
      
      // 添加鼠标悬停动画效果
      noteCard.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-8px)';
        this.style.boxShadow = '0 12px 20px rgba(0, 0, 0, 0.15)';
      });
      
      noteCard.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
      });
    }
    
    // 添加滚动时的动画效果
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, {
      threshold: 0.1
    });
    
    document.querySelectorAll('.note-card').forEach(card => {
      observer.observe(card);
    });
    
  } catch (error) {
    console.error('加载笔记失败:', error);
    notesContainer.innerHTML = '<p>无法加载笔记。请确保您已创建 /notes/index.json 文件。</p>';
  }
}

// 改进的Markdown解析函数
function parseMarkdown(markdown, summaryOnly = false) {
  // 从Markdown中提取标题和完整内容
  const lines = markdown.split('\n');
  let title = '';
  let summary = '';
  let fullContent = '';
  
  // 寻找第一个标题作为笔记标题
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('# ')) {
      title = lines[i].substring(2).trim();
      break;
    }
  }
  
  // 提取更好的概览（跳过标题和代码块，提取前两个段落的文本）
  let paragraphs = [];
  let inCodeBlock = false;
  let currentParagraph = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 检测代码块
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    
    // 在代码块内，跳过
    if (inCodeBlock) continue;
    
    // 跳过标题行
    if (line.startsWith('#')) continue;
    
    // 如果是空行且已有当前段落内容，则结束当前段落
    if (line === '' && currentParagraph !== '') {
      paragraphs.push(currentParagraph);
      currentParagraph = '';
    } 
    // 非空行且不在代码块内，添加到当前段落
    else if (line !== '') {
      currentParagraph += ' ' + line;
    }
  }
  
  // 处理最后一个段落
  if (currentParagraph !== '') {
    paragraphs.push(currentParagraph);
  }
  
  // 使用前两个段落作为概览
  if (paragraphs.length > 0) {
    summary = paragraphs.slice(0, 2).join(' ').trim();
    
    // 如果概览超过250个字符，截断并添加省略号
    if (summary.length > 250) {
      summary = summary.substring(0, 250) + '...';
    }
    
    // 将概览转换为HTML
    summary = `<p>${summary}</p>`;
  }
  
  // 如果只需要概览，则返回
  if (summaryOnly) {
    return { title, summary };
  }
  
  // 否则进行完整的Markdown到HTML转换
  fullContent = markdownToHtml(markdown);
  
  return { title, summary, fullContent };
}

// 改进的Markdown到HTML转换函数 - 添加语法高亮支持
function markdownToHtml(markdown) {
  // 处理代码块 (```code```)
  let html = markdown.replace(/```(.*?)\n([\s\S]*?)```/g, function(match, language, code) {
    return `<pre class="code-block"><code class="language-${language.trim()}">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
  });
  
  // 处理标题
  html = html
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
    
    // 处理斜体和粗体
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // 处理链接
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    
    // 处理行内代码
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    
    // 处理无序列表
    .replace(/^\s*[\-\*]\s+(.*$)/gm, '<li>$1</li>')
    
    // 处理有序列表
    .replace(/^\s*(\d+)\.\s+(.*$)/gm, '<li>$2</li>')
    
    // 处理段落 (避免处理已经处理过的HTML标签)
    .replace(/^(?!<[a-z]|\s*$)(.*$)/gm, '<p>$1</p>');
  
  // 处理列表 (将连续的列表项包装在<ul>或<ol>中)
  html = html.replace(/(<li>.*<\/li>)(\s*<li>)/g, '$1<ul>$2');
  html = html.replace(/(<\/li>)(?!\s*<li>|\s*<ul>|\s*<ol>)/g, '$1</ul>');
  
  return html;
}

// 加载笔记详情页面的内容
async function loadNoteDetail(filename) {
  const notesContainer = document.getElementById('note-detail');
  if (!notesContainer) return;

  try {
    // 先获取索引信息
    const indexResponse = await fetch('/notes/index.json');
    const notes = await indexResponse.json();
    
    // 查找匹配的笔记
    const note = notes.find(n => n.filename === filename);
    if (!note) {
      notesContainer.innerHTML = '<p>找不到请求的笔记</p>';
      return;
    }
    
    // 加载笔记内容
    const contentResponse = await fetch(`/notes/${filename}`);
    const markdownContent = await contentResponse.text();
    
    // 解析Markdown内容
    const content = parseMarkdown(markdownContent);
    
    // 更新页面标题
    document.title = content.title || note.title;
    
    // 生成随机颜色
    const randomColor = getRandomColor();
    
    // 填充详情页内容，使用返回图标而非按钮
    notesContainer.innerHTML = `
      <div class="note-header" style="border-left-color: ${randomColor}">
        <h1>${content.title || note.title}</h1>
        <p class="date">${formatDate(note.date)}</p>
      </div>
      <div class="note-content">
        ${content.fullContent}
      </div>
      <div class="note-footer">
        <a href="index.html#notes" class="back-btn" title="返回笔记列表">
          <svg class="back-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </svg>
        </a>
      </div>
    `;
    
    // 添加页面加载动画
    document.querySelector('.note-header').style.animation = 'fadeIn 0.8s ease-in-out';
    document.querySelector('.note-content').style.animation = 'slideUp 1s ease-in-out';
    
  } catch (error) {
    console.error('加载笔记详情失败:', error);
    notesContainer.innerHTML = '<p>加载笔记失败。请返回<a href="index.html">首页</a>重试。</p>';
  }
}

// 格式化日期 - 优化为更友好的格式
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('zh-CN', options);
}
