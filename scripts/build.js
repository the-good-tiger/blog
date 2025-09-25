import { readFile, readdir, writeFile, mkdir, copyFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import frontMatter from 'front-matter';
import { marked } from 'marked';
import hljs from 'highlight.js';
import { format } from 'date-fns';

// Configure markdown parser
marked.setOptions({
  highlight: function(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
  breaks: true,
  gfm: true
});

async function processMarkdownFiles(contentDir) {
  const files = await readdir(contentDir);
  const posts = [];
  
  for (const file of files) {
    if (file.endsWith('.md') && !file.startsWith('_')) {
      const filePath = path.join(contentDir, file);
      const content = await readFile(filePath, 'utf-8');
      const parsed = frontMatter(content);
      
      const slug = file.replace('.md', '');
      const post = {
        ...parsed.attributes,
        slug: slug,
        content: marked(parsed.body),
        htmlFile: `${slug}.html`,
        date: parsed.attributes.date || new Date().toISOString(),
        formattedDate: format(new Date(parsed.attributes.date || new Date()), 'MMMM dd, yyyy')
      };
      
      posts.push(post);
    }
  }
  
  return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function renderTemplate(template, data) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] || match;
  });
}

async function loadTemplate(templateName) {
  const templatePath = path.join('./scripts/templates', templateName);
  return await readFile(templatePath, 'utf-8');
}

async function generatePostPage(post, outputDir) {
  const template = await loadTemplate('post.html');
  const html = renderTemplate(template, post);
  
  await writeFile(path.join(outputDir, post.htmlFile), html);
}

async function generateHomepage(posts, outputDir) {
  const template = await loadTemplate('index.html');
  
  // Generate post listings HTML
  const postListings = posts.map(post => `
    <article class="post-preview" data-animate="fade-up">
      <h2><a href="/${post.htmlFile}">${post.title}</a></h2>
      <div class="post-meta">
        <time datetime="${post.date}">${post.formattedDate}</time>
        ${post.categories ? `<span class="categories">${post.categories.map(cat => 
          `<a href="/category/${cat}.html">${cat}</a>`
        ).join(', ')}</span>` : ''}
      </div>
      <p class="excerpt">${post.excerpt || ''}</p>
    </article>
  `).join('');
  
  const html = template.replace('{{POST_LISTINGS}}', postListings);
  await writeFile(path.join(outputDir, 'index.html'), html);
}

async function generateCategoryPages(posts, outputDir) {
  const categories = new Set();
  posts.forEach(post => {
    if (post.categories) {
      post.categories.forEach(cat => categories.add(cat));
    }
  });
  
  const categoryTemplate = await loadTemplate('category.html');
  
  for (const category of categories) {
    const categoryPosts = posts.filter(post => 
      post.categories && post.categories.includes(category)
    );
    
    const postListings = categoryPosts.map(post => `
      <article class="post-preview">
        <h2><a href="/${post.htmlFile}">${post.title}</a></h2>
        <div class="post-meta">
          <time datetime="${post.date}">${post.formattedDate}</time>
        </div>
      </article>
    `).join('');
    
    const html = categoryTemplate
      .replace('{{CATEGORY_NAME}}', category)
      .replace('{{POST_LISTINGS}}', postListings);
    
    await writeFile(path.join(outputDir, 'category', `${category}.html`), html);
  }
}

async function copyAssets(outputDir) {
  const assetsDir = path.join(outputDir, 'assets');
  await mkdir(assetsDir, { recursive: true });
  
  // Simple asset copying (in production, you might want to minify/optimize)
  const copyRecursive = async (src, dest) => {
    await mkdir(dest, { recursive: true });
    const items = await readdir(src, { withFileTypes: true });
    
    for (const item of items) {
      const srcPath = path.join(src, item.name);
      const destPath = path.join(dest, item.name);
      
      if (item.isDirectory()) {
        await copyRecursive(srcPath, destPath);
      } else {
        await copyFile(srcPath, destPath);
      }
    }
  };
  
  await copyRecursive('./assets', assetsDir);
}

async function main() {
  try {
    console.log('🚀 Starting blog build process...');
    
    // Ensure output directory exists
    const outputDir = './dist';
    if (!existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true });
    }
    
    // Process all markdown files
    const posts = await processMarkdownFiles('./content');
    console.log(`📝 Processed ${posts.length} posts`);
    
    // Generate individual post pages
    for (const post of posts) {
      await generatePostPage(post, outputDir);
    }
    console.log('✅ Generated post pages');
    
    // Generate homepage
    await generateHomepage(posts, outputDir);
    console.log('✅ Generated homepage');
    
    // Generate category pages
    await mkdir(path.join(outputDir, 'category'), { recursive: true });
    await generateCategoryPages(posts, outputDir);
    console.log('✅ Generated category pages');
    
    // Copy assets
    await copyAssets(outputDir);
    console.log('✅ Copied assets');
    
    console.log('🎉 Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

main();