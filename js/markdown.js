/**
 * markdown.js - 专门用于处理Markdown解析和渲染的工具
 * 提供了Markdown到HTML的转换功能，支持代码高亮和其他Markdown语法
 */

// 解析Markdown内容并返回解析后的对象
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
  
  // 提取概览（跳过标题和代码块，提取前两个段落的文本）
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

// Markdown到HTML的转换函数 - 支持语法高亮
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
    .replace(/^##### (.*$)/gm, '<h5>$1</h5>')
    .replace(/^###### (.*$)/gm, '<h6>$1</h6>')
    
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
    
    // 处理水平线
    .replace(/^---+$/gm, '<hr>')
    
    // 处理图片
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
    
    // 处理段落 (避免处理已经处理过的HTML标签)
    .replace(/^(?!<[a-z]|\s*$)(.*$)/gm, '<p>$1</p>');
  
  // 处理列表 (将连续的列表项包装在<ul>或<ol>中)
  html = html.replace(/(<li>.*<\/li>)(\s*<li>)/g, '$1<ul>$2');
  html = html.replace(/(<\/li>)(?!\s*<li>|\s*<ul>|\s*<ol>)/g, '$1</ul>');
  
  // 处理引用块
  html = html.replace(/^&gt; (.*$)/gm, '<blockquote>$1</blockquote>');
  
  return html;
}

// 添加语法高亮功能
function applyCodeHighlighting() {
  // 找到所有代码块
  const codeBlocks = document.querySelectorAll('pre.code-block code');
  
  // 为每个代码块应用简单的语法高亮
  codeBlocks.forEach(block => {
    const language = block.className.replace('language-', '').trim();
    highlightCode(block, language);
  });
}

// 简单的语法高亮实现
function highlightCode(element, language) {
  // 获取代码内容
  let code = element.textContent;
  
  // 根据不同的语言应用不同的高亮规则
  switch(language) {
    case 'python':
      // 高亮Python关键字
      code = code
        .replace(/(def|class|if|else|elif|for|while|import|from|return|True|False|None|try|except|finally|with|as|in|is|not|and|or)\b/g, '<span class="keyword">$1</span>')
        .replace(/(#.*)$/gm, '<span class="comment">$1</span>')
        .replace(/(".*?"|'.*?')/g, '<span class="string">$1</span>')
        .replace(/\b(\d+)\b/g, '<span class="number">$1</span>');
      break;
      
    case 'javascript':
    case 'js':
      // 高亮JavaScript关键字
      code = code
        .replace(/(var|let|const|function|return|if|else|for|while|switch|case|break|continue|new|this|class|import|export|default|async|await|try|catch|finally|throw)\b/g, '<span class="keyword">$1</span>')
        .replace(/(\/\/.*|\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>')
        .replace(/(".*?"|'.*?'|`.*?`)/g, '<span class="string">$1</span>')
        .replace(/\b(\d+)\b/g, '<span class="number">$1</span>');
      break;
      
    case 'bash':
    case 'shell':
      // 高亮Shell脚本关键字
      code = code
        .replace(/(if|then|else|fi|for|do|done|while|echo|read|function|return|exit|cd|ls|mkdir|rm|git|npm|yarn|docker)\b/g, '<span class="keyword">$1</span>')
        .replace(/(#.*)$/gm, '<span class="comment">$1</span>')
        .replace(/(".*?"|'.*?')/g, '<span class="string">$1</span>');
      break;
      
    case 'html':
      // 高亮HTML标签
      code = code
        .replace(/(&lt;[\/]?[a-zA-Z0-9]+)(\s+[a-zA-Z0-9-]+=["|'].*?["|'])*(&gt;)/g, '<span class="tag">$1$2$3</span>')
        .replace(/(&lt;!--.*?--&gt;)/g, '<span class="comment">$1</span>');
      break;
      
    case 'css':
      // 高亮CSS规则
      code = code
        .replace(/([a-zA-Z-]+:)/g, '<span class="property">$1</span>')
        .replace(/(#[a-fA-F0-9]{3,6})\b/g, '<span class="color">$1</span>')
        .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>');
      break;
      
    // 可以添加更多语言的处理
  }
  
  // 将高亮后的代码应用到元素中
  element.innerHTML = code;
  
  // 添加一个语言标签
  if (language && language !== 'undefined') {
    const container = element.parentElement;
    const langLabel = document.createElement('div');
    langLabel.className = 'lang-label';
    langLabel.textContent = language;
    container.appendChild(langLabel);
  }
}

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseMarkdown,
    markdownToHtml,
    applyCodeHighlighting
  };
} else {
  // 浏览器环境
  window.mdParser = {
    parseMarkdown,
    markdownToHtml,
    applyCodeHighlighting
  };
}
