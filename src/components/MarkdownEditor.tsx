import { useState } from 'react';
import { FileDown, FileText } from 'lucide-react';
import { Packer } from 'docx';
import { parseMarkdownToDocx } from '../utils/markdownToDocx';
import { MarkdownPreview } from './MarkdownPreview';

const SAMPLE_MARKDOWN = `# Welcome to Markdown to DOC Converter

This is a powerful tool to convert Markdown to Microsoft Word documents with beautiful formatting.

## Features

- **Bold text** and *italic text* support
- Headings (H1 to H4)
- Bullet lists and numbered lists
- \`Inline code\` and code blocks
- Tables with custom alignment
- Blockquotes for emphasis

### Example Table

| Feature | Status | Priority |
|:--------|:------:|--------:|
| Bold/Italic | ✓ | High |
| Code Blocks | ✓ | High |
| Tables | ✓ | Medium |
| Images | Coming Soon | Low |

### Code Example

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));
\`\`\`

### How to Use

1. Type or paste your Markdown content in the editor
2. Preview your formatted content in real-time
3. Click the "Convert to DOC" button
4. Download your professionally formatted Word document

> **Tip:** The preview shows exactly how your content will look, including tables and code blocks!

#### Additional Information

You can use standard Markdown syntax:

- Create lists with dashes or asterisks
- Use ** for bold and * for italic
- Use backticks for inline code
- Use # symbols for headings
- Create tables with pipes and dashes

Happy writing!`;

export function MarkdownEditor() {
  const [markdown, setMarkdown] = useState(SAMPLE_MARKDOWN);
  const [isConverting, setIsConverting] = useState(false);

  const handleConvert = async () => {
    setIsConverting(true);
    try {
      const doc = parseMarkdownToDocx(markdown, {
        author: 'User',
        title: 'Markdown Document',
      });

      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `document-${Date.now()}.docx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Conversion error:', error);
      alert('Failed to convert document. Please check your Markdown syntax.');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-7 h-7 text-white" />
          <h1 className="text-xl font-semibold text-white">Markdown to DOC Converter</h1>
        </div>
        <button
          onClick={handleConvert}
          disabled={isConverting || !markdown.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 rounded-lg hover:bg-blue-50 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-medium"
        >
          <FileDown className="w-5 h-5" />
          {isConverting ? 'Converting...' : 'Convert to DOC'}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col border-r border-gray-300">
          <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-6 py-3 border-b border-gray-300">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Markdown Input</h2>
          </div>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="flex-1 p-6 font-mono text-sm resize-none focus:outline-none bg-white text-gray-800 leading-relaxed"
            placeholder="Enter your Markdown here..."
            spellCheck={false}
          />
        </div>

        <div className="flex-1 flex flex-col bg-white">
          <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-6 py-3 border-b border-gray-300">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Preview</h2>
          </div>
          <div className="flex-1 p-8 overflow-auto bg-white">
            <div className="max-w-4xl mx-auto">
              <MarkdownPreview markdown={markdown} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
