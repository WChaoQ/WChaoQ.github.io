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
      
      // 使用专门的Markdown解析器解析内容
      const content = window.mdParser.parseMarkdown(markdownContent, true); // 只提取概览
      
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
    
    // 使用专门的Markdown解析器解析内容
    const content = window.mdParser.parseMarkdown(markdownContent);
    
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
    
    // 应用代码高亮
    window.mdParser.applyCodeHighlighting();
    
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
