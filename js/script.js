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
    const response = await fetch('/notes/');
    const html = await response.text();
    
    // 使用简单的解析来获取文件列表
    const mdFiles = [];
    const regex = /href="([^"]+\.md)"/g;
    let match;
    
    while ((match = regex.exec(html)) !== null) {
      mdFiles.push(match[1]);
    }
    
    // 清空现有笔记容器
    notesContainer.innerHTML = '';
    
    // 加载每个笔记的内容和元信息
    const notesData = [];
    
    for (const filename of mdFiles) {
      try {
        const contentResponse = await fetch(`/notes/${filename}`);
        const markdownContent = await contentResponse.text();
        
        // 解析Markdown内容
        const content = parseMarkdown(markdownContent, true);
        
        // 提取日期 - 尝试从文件内容中获取，格式为yyyy-mm-dd
        let date = new Date();
        const dateMatch = markdownContent.match(/\d{4}-\d{2}-\d{2}/);
        if (dateMatch) {
          date = new Date(dateMatch[0]);
        }
        
        notesData.push({
          filename: filename,
          title: content.title || filename.replace('.md', ''),
          date: date,
          content: markdownContent,
          summary: content.summary
        });
      } catch (error) {
        console.error(`加载笔记 ${filename} 失败:`, error);
      }
    }
    
    // 按日期降序排序笔记（最新的在前面）
    notesData.sort((a, b) => b.date - a.date);
    
    // 颜色列表
    const colors = [
      '#3b82f6', // 蓝色
      '#10b981', // 绿色
      '#f97316', // 橙色
      '#8b5cf6', // 紫色
      '#ef4444', // 红色
      '#06b6d4'  // 青色
    ];
    
    // 为每个笔记创建卡片
    for (const note of notesData) {
      // 随机选择颜色
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      // 创建笔记卡片
      const noteCard = document.createElement('div');
      noteCard.className = 'note-card';
      noteCard.setAttribute('data-filename', note.filename);
      noteCard.style.borderLeft = `4px solid ${randomColor}`;
      
      // 填充笔记卡片内容
      noteCard.innerHTML = `
        <h3>${note.title}</h3>
        <p class="date">${formatDate(note.date)}</p>
        <p class="summary">${note.summary}</p>
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
    notesContainer.innerHTML = '<p>无法加载笔记。请确保/notes/目录中有Markdown文件。</p>';
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

// 增强的Markdown到HTML转换函数
function markdownToHtml(markdown) {
  // 处理代码块 (需要在其他处理之前)
  markdown = markdown.replace(/```([a-z]*)\n([\s\S]*?)\n```/g, (match, language, code) => {
    const lang = language ? ` class="language-${language}"` : '';
    return `<pre><code${lang}>${escapeHtml(code)}</code></pre>`;
  });
  
  let html = markdown
    // 标题
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
    .replace(/^##### (.*$)/gm, '<h5>$1</h5>')
    
    // 斜体和粗体
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // 链接
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    
    // 图片
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="markdown-img">')
    
    // 行内代码
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    
    // 无序列表 (改进列表处理)
    .replace(/^[\s]*[\-\*]\s+(.*$)/gm, '<li>$1</li>')
    
    // 有序列表
    .replace(/^[\s]*\d+\.\s+(.*$)/gm, '<li>$1</li>')
    
    // 水平线
    .replace(/^---+$/gm, '<hr>')
    
    // 段落 (不匹配已经处理的HTML标签)
    .replace(/^(?!<[a-z]|\s*$)(.*$)/gm, '<p>$1</p>');

  // 处理列表 (将连续的列表项组合成一个列表)
  // 无序列表
  html = html.replace(/(<li>.*?<\/li>)(?:\s*)(?=<li>)/gs, '$1');
  html = html.replace(/(?:^|>)(\s*<li>.*?<\/li>\s*)(?=$|<(?!li))/gs, (match, list) => {
    return `><ul>${list}</ul>`;
  });
  
  // 有序列表
  html = html.replace(/(?:^|>)(\s*<li>.*?<\/li>\s*)(?=$|<(?!li))/gs, (match, list) => {
    // 检查是否已经被无序列表处理过
    if (match.includes('<ul>')) return match;
    return `><ol>${list}</ol>`;
  });
  
  return html;
}

// HTML转义函数
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// 加载笔记详情页面的内容
async function loadNoteDetail(filename) {
  const noteDetail = document.getElementById('note-detail');
  if (!noteDetail) return;

  try {
    // 加载笔记内容
    const contentResponse = await fetch(`/notes/${filename}`);
    const markdownContent = await contentResponse.text();
    
    // 解析Markdown内容
    const content = parseMarkdown(markdownContent);
    
    // 提取日期 - 尝试从文件内容中获取，格式为yyyy-mm-dd
    let date = new Date();
    const dateMatch = markdownContent.match(/\d{4}-\d{2}-\d{2}/);
    if (dateMatch) {
      date = new Date(dateMatch[0]);
    }
    
    // 更新页面标题
    document.title = content.title || filename.replace('.md', '');
    
    // 随机颜色
    const colors = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ef4444', '#06b6d4'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    // 填充详情页内容
    noteDetail.innerHTML = `
      <div class="note-header" style="border-left: 4px solid ${randomColor}; padding-left: 1rem;">
        <h1>${content.title}</h1>
        <p class="date">${formatDate(date)}</p>
      </div>
      <div class="note-content">
        ${content.fullContent}
      </div>
      <div class="note-footer">
        <a href="index.html" class="back-btn">返回首页</a>
      </div>
    `;
    
  } catch (error) {
    console.error('加载笔记详情失败:', error);
    noteDetail.innerHTML = '<p>加载笔记失败。请返回<a href="index.html">首页</a>重试。</p>';
  }
}

// 格式化日期
function formatDate(dateObj) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return dateObj.toLocaleDateString('zh-CN', options);
}
