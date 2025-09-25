import { readFile } from 'fs/promises';
import path from 'path';

/**
 * Template engine for generating HTML pages
 */
export class HTMLGenerator {
    constructor(templateDir = './scripts/templates') {
        this.templateDir = templateDir;
        this.templateCache = new Map();
    }
    
    /**
     * Load template with caching
     */
    async loadTemplate(templateName) {
        if (this.templateCache.has(templateName)) {
            return this.templateCache.get(templateName);
        }
        
        const templatePath = path.join(this.templateDir, templateName);
        try {
            const template = await readFile(templatePath, 'utf-8');
            this.templateCache.set(templateName, template);
            return template;
        } catch (error) {
            throw new Error(`Template not found: ${templateName} - ${error.message}`);
        }
    }
    
    /**
     * Render template with data
     */
    renderTemplate(template, data) {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            // Handle nested properties and arrays
            const value = this.getNestedValue(data, key);
            return value !== undefined ? this.escapeHtml(value) : match;
        });
    }
    
    /**
     * Safe HTML escaping
     */
    escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return unsafe;
        
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }
    
    /**
     * Generate complete HTML page
     */
    async generatePage(templateName, data, outputPath) {
        const template = await this.loadTemplate(templateName);
        const html = this.renderTemplate(template, data);
        return html;
    }
    
    /**
     * Generate post listings HTML for homepage/category pages
     */
    generatePostListings(posts, options = {}) {
        return posts.map((post, index) => `
            <article class="post-preview" data-animate="fade-up" style="--index: ${index};">
                <h2><a href="/${post.htmlFile}" class="post-link">${post.title}</a></h2>
                <div class="post-meta">
                    <time datetime="${post.date}">${post.formattedDate}</time>
                    ${post.categories ? `
                        <span class="categories">
                            ${post.categories.map(cat => 
                                `<a href="/category/${cat}.html" class="category-tag">${cat}</a>`
                            ).join('')}
                        </span>
                    ` : ''}
                </div>
                ${post.excerpt ? `<p class="excerpt">${post.excerpt}</p>` : ''}
                ${options.showReadMore ? 
                    `<a href="/${post.htmlFile}" class="read-more">Read more →</a>` : ''}
            </article>
        `).join('');
    }
}