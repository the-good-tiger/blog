import { marked } from 'marked';
import hljs from 'highlight.js';

/**
 * Enhanced markdown processor with security features
 */
export class MarkdownProcessor {
    constructor() {
        this.configureParser();
    }
    
    configureParser() {
        marked.setOptions({
            highlight: (code, lang) => {
                const language = hljs.getLanguage(lang) ? lang : 'plaintext';
                return hljs.highlight(code, { language }).value;
            },
            breaks: true,
            gfm: true,
            sanitize: false, // We trust our content, but could enable for user content
            smartLists: true,
            smartypants: true
        });
    }
    
    /**
     * Process markdown content with security validation
     */
    async process(content, options = {}) {
        try {
            // Basic security checks
            if (this.detectMaliciousContent(content)) {
                throw new Error('Potential security issue detected in markdown');
            }
            
            const html = marked.parse(content);
            return this.sanitizeOutput(html, options);
        } catch (error) {
            console.error('Markdown processing error:', error);
            return `<div class="error">Error processing content: ${error.message}</div>`;
        }
    }
    
    detectMaliciousContent(content) {
        // Basic XSS pattern detection
        const dangerousPatterns = [
            /<script[^>]*>/i,
            /javascript:/i,
            /onload\s*=/i,
            /onerror\s*=/i
        ];
        
        return dangerousPatterns.some(pattern => pattern.test(content));
    }
    
    sanitizeOutput(html, options) {
        // Simple HTML sanitization - in production, use a library like DOMPurify
        if (options.sanitize) {
            return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        }
        return html;
    }
    
    /**
     * Extract excerpt from markdown (first paragraph)
     */
    extractExcerpt(markdown, maxLength = 200) {
        const paragraphs = markdown.split('\n\n');
        const firstParagraph = paragraphs.find(p => p.trim().length > 0);
        
        if (!firstParagraph) return '';
        
        // Remove markdown formatting
        const plainText = firstParagraph
            .replace(/[#*`\[\]]/g, '')
            .replace(/\n/g, ' ')
            .trim();
            
        return plainText.length > maxLength 
            ? plainText.substring(0, maxLength) + '...' 
            : plainText;
    }
}