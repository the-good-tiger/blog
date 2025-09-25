/**
 * Category management and validation system
 */
export class Categorizer {
    constructor() {
        this.validCategories = new Set([
            'web-security',
            'tools', 
            'methodology',
            'bug-bounty',
            'penetration-testing',
            'code-review',
            'red-teaming'
        ]);
        
        this.categoryMetadata = {
            'web-security': {
                name: 'Web Security',
                description: 'Web application security techniques and vulnerabilities',
                color: '#ef4444'
            },
            'tools': {
                name: 'Tools',
                description: 'Security tools and automation scripts',
                color: '#3b82f6'
            },
            'methodology': {
                name: 'Methodology',
                description: 'Testing methodologies and approaches',
                color: '#10b981'
            },
            'bug-bounty': {
                name: 'Bug Bounty',
                description: 'Bug bounty program tips and writeups',
                color: '#f59e0b'
            }
        };
    }
    
    /**
     * Validate and normalize categories
     */
    processCategories(categories) {
        if (!categories || !Array.isArray(categories)) {
            return ['uncategorized'];
        }
        
        const normalized = categories
            .map(cat => cat.toLowerCase().trim().replace(/\s+/g, '-'))
            .filter(cat => cat.length > 0);
            
        if (normalized.length === 0) {
            return ['uncategorized'];
        }
        
        // Validate against known categories, allow new ones with warning
        const validated = normalized.map(cat => {
            if (!this.validCategories.has(cat)) {
                console.warn(`New category detected: "${cat}". Consider adding to validCategories.`);
                this.validCategories.add(cat);
            }
            return cat;
        });
        
        return [...new Set(validated)]; // Remove duplicates
    }
    
    /**
     * Get category statistics for all posts
     */
    analyzeCategoryDistribution(posts) {
        const distribution = new Map();
        
        posts.forEach(post => {
            if (post.categories) {
                post.categories.forEach(cat => {
                    distribution.set(cat, (distribution.get(cat) || 0) + 1);
                });
            }
        });
        
        return Array.from(distribution.entries())
            .map(([category, count]) => ({
                category,
                count,
                metadata: this.categoryMetadata[category] || {
                    name: this.formatCategoryName(category),
                    description: `Posts about ${category}`,
                    color: '#6b7280'
                }
            }))
            .sort((a, b) => b.count - a.count);
    }
    
    formatCategoryName(categorySlug) {
        return categorySlug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    
    /**
     * Generate category navigation data
     */
    generateNavigationData(posts) {
        const distribution = this.analyzeCategoryDistribution(posts);
        
        return distribution.map(item => ({
            slug: item.category,
            name: item.metadata.name,
            count: item.count,
            url: `/category/${item.category}.html`
        }));
    }
}