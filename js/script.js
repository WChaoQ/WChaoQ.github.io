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
      
      // 解析Markdown内容（只需要标题和摘要）
      const content = parseMarkdown(markdownContent, true);
      
      // 确定笔记类别样式
      let categoryClass = 'default';
      if (note.tags) {
        const lowerTags = note.tags.map(tag => tag.toLowerCase());
        if (lowerTags.includes('python')) categoryClass = 'python';
        else if (lowerTags.includes('git')) categoryClass = 'git';
      }
      
      // 创建笔记卡片
      const noteCard = document.createElement('div');
      noteCard.className = `note-card ${categoryClass}`;
      noteCard.setAttribute('data-filename', note.filename);
      
      // 填充笔记卡片内容
      noteCard.innerHTML = `
        <h3>${content.title || note.title}</h3>
        <p class="date">${formatDate(note.date)}</p>
        ${note.tags ? note.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ') : ''}
        <p class="summary">${content.summary}</p>
        <a class="read-more" href="note.html?note=${encodeURIComponent(note.filename)}">阅读全文</a>
      `;
      
      // 添加到容器
      notesContainer.appendChild(noteCard);
      
      // 添加点击事件（点击整个卡片跳转到笔记详情页）
      noteCard.addEventListener('click', function(e) {
        // 如果点击的不是"阅读全文"链接（避免重复触发）
        if (!e.target.classList.contains('read-more')) {
          window.location.href = `note.html?note=${encodeURIComponent(note.filename)}`;
        }
      });
    }
    
  } catch (error) {
    console.error('加载笔记失败:', error);
    notesContainer.innerHTML = '<p>无法加载笔记。请确保您已创建 /notes/index.json 文件。</p>';
  }
}

// Markdown解析函数
function parseMarkdown(markdown, summaryOnly = false) {
  // 从Markdown中提取标题、摘要和完整内容
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
  
  // 提取摘要（第一段非标题文字）
  let paragraphCount = 0;
  let contentBuffer = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 跳过标题行
    if (line.startsWith('#')) continue;
    
    // 收集段落
    if (line !== '') {
      contentBuffer.push(line);
    } else if (contentBuffer.length > 0) {
      // 找到段落结束
      if (paragraphCount < 1) {
        // 第一段作为摘要
        summary += contentBuffer.join(' ');
        paragraphCount++;
      }
      contentBuffer = [];
    }
  }
  
  // 如果还有未处理的内容，并且还没有摘要
  if (contentBuffer.length > 0 && paragraphCount < 1) {
    summary += contentBuffer.join(' ');
  }
  
  // 限制摘要长度
  summary = summary.length > 150 ? summary.substring(0, 150) + '...' : summary;
  
  // 如果只需要摘要信息，不处理完整内容
  if (!summaryOnly) {
    // 对Markdown进行HTML转换
    fullContent = markdownToHtml(markdown);
  }
  
  return { title, summary, fullContent };
}

// 简单的Markdown到HTML转换函数
function markdownToHtml(markdown) {
  let html = markdown
    // 标题
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
    
    // 斜体和粗体
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // 链接
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    
    // 代码块
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    
    // 行内代码
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    
    // 列表
    .replace(/^\s*[\-\*]\s+(.*$)/gm, '<li>$1</li>')
    
    // 段落
    .replace(/^(?!<[a-z]|\s*$)(.*$)/gm, '<p>$1</p>');
  
  // 将连续的列表项包装在<ul>中
  html = html.replace(/(<li>.*<\/li>)(\s*<li>)/g, '$1<ul>$2');
  html = html.replace(/(<\/li>)(?!\s*<li>|\s*<ul>)/g, '$1</ul>');
  
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
    
    // 确定笔记类别样式
    let categoryClass = 'default';
    if (note.tags) {
      const lowerTags = note.tags.map(tag => tag.toLowerCase());
      if (lowerTags.includes('python')) categoryClass = 'python';
      else if (lowerTags.includes('git')) categoryClass = 'git';
    }
    
    // 填充详情页内容
    notesContainer.innerHTML = `
      <div class="note-header ${categoryClass}">
        <h1>${content.title || note.title}</h1>
        <p class="date">${formatDate(note.date)}</p>
        <div class="tags">
          ${note.tags ? note.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ') : ''}
        </div>
      </div>
      <div class="note-content">
        ${content.fullContent}
      </div>
      <div class="note-footer">
        <a href="index.html#notes" class="btn back-btn">返回笔记列表</a>
      </div>
    `;
    
  } catch (error) {
    console.error('加载笔记详情失败:', error);
    notesContainer.innerHTML = '<p>加载笔记失败。请返回<a href="index.html">首页</a>重试。</p>';
  }
}

// 格式化日期
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('zh-CN', options);
}
