import React from 'react';
import { useEditorStore } from '../../store/editorStore';

interface SEOTemplate {
  id: string;
  name: string;
  description: string;
  contentType: string;
  structure: string[];
  keywordPlacement: string[];
  optimalLength: number;
  requiredElements: string[];
  recommendedElements: string[];
  template: string;
}

const SEO_TEMPLATES: SEOTemplate[] = [
  {
    id: 'blog-post-template',
    name: 'Blog Post Template',
    description: 'Optimized structure for blog posts with SEO best practices',
    contentType: 'blogPost',
    structure: ['title', 'introduction', 'h2-section', 'h2-section', 'h2-section', 'conclusion'],
    keywordPlacement: ['title', 'first-paragraph', 'headings', 'conclusion', 'meta-description'],
    optimalLength: 2500,
    requiredElements: ['h1', 'meta-description', 'internal-links'],
    recommendedElements: ['h2-headings', 'bullet-points', 'images-with-alt'],
    template: `# [Your SEO-Optimized Title with Primary Keyword]

## Introduction
Start with a compelling hook that includes your primary keyword naturally. Explain what readers will learn and why it matters to them.

## [H2 Heading with Secondary Keyword]
Main content section covering your first major point. Include relevant keywords naturally throughout the text.

### [H3 Subheading if needed]
Supporting details and examples.

## [H2 Heading with Related Keywords]
Second major section with valuable information for your audience.

## [H2 Heading - Problem/Solution Focus]
Address common pain points and provide actionable solutions.

## Conclusion
Summarize key takeaways and include a call-to-action. Naturally incorporate your primary keyword one final time.

---
**Meta Description Template:** [Brief 150-160 character description with primary keyword]
**Focus Keyword:** [Your primary keyword]
**Internal Links:** [Link to 2-3 related articles]`
  },
  {
    id: 'article-template',
    name: 'Article Template',
    description: 'Professional article structure for news and informational content',
    contentType: 'article',
    structure: ['title', 'introduction', 'h2-section', 'h2-section', 'conclusion'],
    keywordPlacement: ['title', 'first-paragraph', 'headings', 'conclusion'],
    optimalLength: 1200,
    requiredElements: ['h1', 'meta-description'],
    recommendedElements: ['h2-headings', 'internal-links'],
    template: `# [Article Title with Primary Keyword]

## Lead Paragraph
Who, what, when, where, why - answer the key questions upfront while incorporating your primary keyword.

## [Background/Context Section]
Provide necessary background information and context for your topic.

## [Main Content Section]
Dive deep into the core information, data, or analysis your readers need.

## Conclusion
Wrap up with key insights and implications.

---
**Meta Description:** [120-150 characters with primary keyword]
**Focus Keyword:** [Your primary keyword]`
  },
  {
    id: 'landing-page-template',
    name: 'Landing Page Template',
    description: 'Conversion-focused landing page with SEO optimization',
    contentType: 'landingPage',
    structure: ['headline', 'value-proposition', 'benefits', 'social-proof', 'cta'],
    keywordPlacement: ['headline', 'value-proposition', 'meta-description'],
    optimalLength: 1000,
    requiredElements: ['h1', 'meta-description', 'cta'],
    recommendedElements: ['bullet-points', 'testimonials', 'internal-links'],
    template: `# [Compelling Headline with Primary Keyword]

## Your Solution to [Problem/Need]
Clear value proposition that explains how you solve your audience's primary challenge.

### Key Benefits:
- **Benefit 1:** Specific advantage with supporting details
- **Benefit 2:** Another key benefit that resonates with your audience  
- **Benefit 3:** Third compelling reason to choose your solution

## What Our Customers Say
> "Testimonial that builds trust and credibility..."
> — [Customer Name, Company]

## Ready to Get Started?
[Strong Call-to-Action Button Text]

---
**Meta Description:** [Compelling 150-160 character description with primary keyword]
**Focus Keyword:** [Your primary keyword]
**Conversion Goal:** [What action you want visitors to take]`
  },
  {
    id: 'product-description-template',
    name: 'Product Description Template',
    description: 'E-commerce product page optimization template',
    contentType: 'productDescription',
    structure: ['title', 'description', 'features', 'benefits', 'specifications', 'cta'],
    keywordPlacement: ['title', 'description', 'features', 'meta-description'],
    optimalLength: 500,
    requiredElements: ['h1', 'meta-description', 'product-description'],
    recommendedElements: ['bullet-points', 'internal-links', 'reviews'],
    template: `# [Product Name with Primary Keyword]

## Product Overview
Brief, compelling description that highlights the main value proposition and includes your primary keyword naturally.

### Key Features:
- Feature 1 with specific benefit
- Feature 2 that solves a problem
- Feature 3 that differentiates from competitors

### Why Choose [Product Name]?
- **Benefit 1:** How this improves the customer's life
- **Benefit 2:** Specific advantage over alternatives
- **Benefit 3:** Unique selling proposition

### Specifications:
- Spec 1: Value
- Spec 2: Value
- Spec 3: Value

## Ready to Purchase?
[Add to Cart / Buy Now Button]

---
**Meta Description:** [Product description with primary keyword, 150-160 chars]
**Focus Keyword:** [Your primary keyword]
**Product Category:** [Relevant category]`
  },
  {
    id: 'email-template',
    name: 'Email Newsletter Template',
    description: 'Email marketing template with SEO-friendly web version',
    contentType: 'email',
    structure: ['subject', 'preview-text', 'greeting', 'main-content', 'cta', 'footer'],
    keywordPlacement: ['subject', 'preview-text', 'main-content'],
    optimalLength: 300,
    requiredElements: ['subject-line', 'preview-text', 'cta'],
    recommendedElements: ['personalization', 'social-links'],
    template: `**Subject Line:** [Compelling subject with keyword - under 50 characters]
**Preview Text:** [Additional context that complements subject line]

# Hi [First Name],

## [Engaging Headline]
Opening paragraph that hooks the reader and introduces your main message.

### [Main Content Section]
Your primary message, update, or value-driven content. Keep it concise and actionable.

**[Call-to-Action Button Text]**

## Quick Links:
- [Link 1: Relevant resource]
- [Link 2: Related content]
- [Link 3: Social media]

Best regards,
[Your Name]

---
**Email Type:** [Newsletter/Promotional/Educational]
**Primary Goal:** [What action you want subscribers to take]
**Keywords:** [Relevant keywords for web version]`
  },
  {
    id: 'social-media-template',
    name: 'Social Media Template',
    description: 'Social media post template optimized for engagement',
    contentType: 'socialMedia',
    structure: ['hook', 'main-content', 'hashtags', 'cta'],
    keywordPlacement: ['hook', 'main-content', 'hashtags'],
    optimalLength: 150,
    requiredElements: ['hook', 'hashtags'],
    recommendedElements: ['emoji', 'mentions', 'cta'],
    template: `🎯 [Attention-grabbing hook with primary keyword]

[Main content that provides value, tells a story, or asks a question. Keep it conversational and engaging.]

💡 Key takeaway: [One main insight or tip]

👉 [Call-to-action - what do you want followers to do?]

#PrimaryKeyword #SecondaryKeyword #RelevantHashtag #IndustryHashtag #EngagementHashtag

---
**Platform:** [Instagram/LinkedIn/Twitter/Facebook]
**Post Type:** [Educational/Promotional/Behind-the-scenes/Question]
**Primary Keyword:** [Your main keyword]
**Hashtag Strategy:** [Mix of popular and niche hashtags]`
  }
];

export const SEOTemplates: React.FC = () => {
  const {
    seoTemplateEnabled,
    setSeoTemplateEnabled,
    seoSelectedTemplate,
    setSeoSelectedTemplate,
    setContent,
    setSeoContentType
  } = useEditorStore();

  const handleTemplateSelect = (template: SEOTemplate) => {
    setSeoSelectedTemplate(template.id);
    setSeoContentType(template.contentType as any);
    
    // Ask user if they want to replace current content
    const shouldReplace = window.confirm(
      `This will replace your current content with the ${template.name}. Continue?`
    );
    
    if (shouldReplace) {
      setContent(template.template);
    }
  };

  const selectedTemplateData = SEO_TEMPLATES.find(t => t.id === seoSelectedTemplate);

  if (!seoTemplateEnabled) {
    return (
      <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">SEO Content Templates</h3>
          <p className="text-gray-600 mb-4">
            Use pre-built, SEO-optimized templates to create high-performing content faster.
          </p>
          <button
            onClick={() => setSeoTemplateEnabled(true)}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Enable Templates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">SEO Content Templates</h3>
          <p className="text-sm text-gray-600">Choose from optimized templates for different content types</p>
        </div>
        <button
          onClick={() => setSeoTemplateEnabled(false)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Disable Templates
        </button>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SEO_TEMPLATES.map((template) => (
          <div
            key={template.id}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              seoSelectedTemplate === template.id
                ? 'border-purple-500 bg-purple-50 shadow-md'
                : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
            }`}
            onClick={() => handleTemplateSelect(template)}
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-gray-900">{template.name}</h4>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {template.optimalLength} words
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">{template.description}</p>
            
            <div className="space-y-2">
              <div>
                <span className="text-xs font-medium text-gray-500">STRUCTURE:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {template.structure.slice(0, 3).map((item, index) => (
                    <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {item}
                    </span>
                  ))}
                  {template.structure.length > 3 && (
                    <span className="text-xs text-gray-500">+{template.structure.length - 3} more</span>
                  )}
                </div>
              </div>
              
              <div>
                <span className="text-xs font-medium text-gray-500">KEYWORD PLACEMENT:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {template.keywordPlacement.slice(0, 2).map((item, index) => (
                    <span key={index} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      {item}
                    </span>
                  ))}
                  {template.keywordPlacement.length > 2 && (
                    <span className="text-xs text-gray-500">+{template.keywordPlacement.length - 2} more</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Template Details */}
      {selectedTemplateData && (
        <div className="bg-white border border-purple-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">
              {selectedTemplateData.name} - Details
            </h4>
            <span className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
              Selected Template
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-semibold text-gray-700 mb-2">Required Elements</h5>
              <ul className="space-y-1">
                {selectedTemplateData.requiredElements.map((element, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-center">
                    <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                    {element}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold text-gray-700 mb-2">Recommended Elements</h5>
              <ul className="space-y-1">
                {selectedTemplateData.recommendedElements.map((element, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                    {element}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => handleTemplateSelect(selectedTemplateData)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Use This Template
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SEOTemplates; 