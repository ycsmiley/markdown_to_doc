interface MarkdownPreviewProps {
  markdown: string;
}

interface TableData {
  headers: string[];
  rows: string[][];
  alignments: ('left' | 'center' | 'right')[];
}

export function MarkdownPreview({ markdown }: MarkdownPreviewProps) {
  const lines = markdown.split('\n');
  const elements: JSX.Element[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('```')) {
      const language = line.substring(3).trim();
      i++;
      let codeContent = '';
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeContent += lines[i] + '\n';
        i++;
      }
      elements.push(
        <div key={elements.length} className="my-4">
          <div className="bg-gray-800 rounded-t-lg px-4 py-2 text-xs text-gray-300 font-mono">
            {language || 'code'}
          </div>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-b-lg overflow-x-auto">
            <code className="text-sm font-mono whitespace-pre">{codeContent.trimEnd()}</code>
          </pre>
        </div>
      );
      i++;
    } else if (isTableLine(line) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const tableData = parseTable(lines, i);
      elements.push(renderTable(tableData, elements.length));
      i += tableData.rows.length + 2;
    } else if (line.startsWith('# ')) {
      elements.push(
        <h1 key={elements.length} className="text-3xl font-bold mt-8 mb-4 text-gray-900 border-b-2 border-gray-200 pb-2">
          {renderInlineFormatting(line.substring(2))}
        </h1>
      );
      i++;
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={elements.length} className="text-2xl font-bold mt-6 mb-3 text-gray-900">
          {renderInlineFormatting(line.substring(3))}
        </h2>
      );
      i++;
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={elements.length} className="text-xl font-semibold mt-5 mb-2 text-gray-800">
          {renderInlineFormatting(line.substring(4))}
        </h3>
      );
      i++;
    } else if (line.startsWith('#### ')) {
      elements.push(
        <h4 key={elements.length} className="text-lg font-semibold mt-4 mb-2 text-gray-800">
          {renderInlineFormatting(line.substring(5))}
        </h4>
      );
      i++;
    } else if (line.startsWith('> ')) {
      let quoteContent = line.substring(2);
      i++;
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteContent += '\n' + lines[i].substring(2);
        i++;
      }
      elements.push(
        <blockquote key={elements.length} className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 text-gray-700 italic">
          {renderInlineFormatting(quoteContent)}
        </blockquote>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const listItems: JSX.Element[] = [];
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        listItems.push(
          <li key={listItems.length} className="mb-1">
            {renderInlineFormatting(lines[i].substring(2))}
          </li>
        );
        i++;
      }
      elements.push(
        <ul key={elements.length} className="list-disc list-inside my-3 space-y-1 text-gray-700">
          {listItems}
        </ul>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const listItems: JSX.Element[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        listItems.push(
          <li key={listItems.length} className="mb-1">
            {renderInlineFormatting(lines[i].replace(/^\d+\.\s/, ''))}
          </li>
        );
        i++;
      }
      elements.push(
        <ol key={elements.length} className="list-decimal list-inside my-3 space-y-1 text-gray-700">
          {listItems}
        </ol>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={elements.length} className="h-4" />);
      i++;
    } else {
      elements.push(
        <p key={elements.length} className="my-3 text-gray-700 leading-relaxed">
          {renderInlineFormatting(line)}
        </p>
      );
      i++;
    }
  }

  return <div className="prose max-w-none">{elements}</div>;
}

function isTableLine(line: string): boolean {
  return line.includes('|') && line.trim().startsWith('|') && line.trim().endsWith('|');
}

function isTableSeparator(line: string): boolean {
  return /^\|[\s\-:|]+\|$/.test(line.trim());
}

function parseTable(lines: string[], startIndex: number): TableData {
  const headerLine = lines[startIndex].trim();
  const separatorLine = lines[startIndex + 1].trim();

  const headers = headerLine
    .split('|')
    .slice(1, -1)
    .map((h) => h.trim());

  const alignments = separatorLine
    .split('|')
    .slice(1, -1)
    .map((s) => {
      const trimmed = s.trim();
      if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
      if (trimmed.endsWith(':')) return 'right';
      return 'left';
    });

  const rows: string[][] = [];
  let i = startIndex + 2;
  while (i < lines.length && isTableLine(lines[i])) {
    const row = lines[i]
      .trim()
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());
    rows.push(row);
    i++;
  }

  return { headers, rows, alignments };
}

function renderTable(tableData: TableData, key: number): JSX.Element {
  const { headers, rows, alignments } = tableData;

  const getAlignmentClass = (alignment: 'left' | 'center' | 'right') => {
    if (alignment === 'center') return 'text-center';
    if (alignment === 'right') return 'text-right';
    return 'text-left';
  };

  return (
    <div key={key} className="my-6 overflow-x-auto">
      <table className="min-w-full border-collapse bg-white shadow-sm rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gradient-to-r from-blue-600 to-blue-700">
            {headers.map((header, index) => (
              <th
                key={index}
                className={`px-6 py-3 text-sm font-semibold text-white border-r border-blue-500 last:border-r-0 ${getAlignmentClass(
                  alignments[index]
                )}`}
              >
                {renderInlineFormatting(header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${
                rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'
              }`}
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={`px-6 py-3 text-sm text-gray-700 border-r border-gray-200 last:border-r-0 ${getAlignmentClass(
                    alignments[cellIndex]
                  )}`}
                >
                  {renderInlineFormatting(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderInlineFormatting(text: string) {
  const parts: JSX.Element[] = [];
  let currentText = '';
  let i = 0;
  let key = 0;

  while (i < text.length) {
    if (text[i] === '*' && text[i + 1] === '*') {
      if (currentText) {
        parts.push(<span key={key++}>{currentText}</span>);
        currentText = '';
      }

      i += 2;
      let boldText = '';
      while (i < text.length - 1) {
        if (text[i] === '*' && text[i + 1] === '*') {
          parts.push(
            <strong key={key++} className="font-bold text-gray-900">
              {boldText}
            </strong>
          );
          i += 2;
          break;
        }
        boldText += text[i];
        i++;
      }
    } else if (text[i] === '*') {
      if (currentText) {
        parts.push(<span key={key++}>{currentText}</span>);
        currentText = '';
      }

      i += 1;
      let italicText = '';
      while (i < text.length) {
        if (text[i] === '*') {
          parts.push(
            <em key={key++} className="italic text-gray-800">
              {italicText}
            </em>
          );
          i += 1;
          break;
        }
        italicText += text[i];
        i++;
      }
    } else if (text[i] === '`') {
      if (currentText) {
        parts.push(<span key={key++}>{currentText}</span>);
        currentText = '';
      }

      i += 1;
      let codeText = '';
      while (i < text.length) {
        if (text[i] === '`') {
          parts.push(
            <code
              key={key++}
              className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-sm font-mono border border-blue-200"
            >
              {codeText}
            </code>
          );
          i += 1;
          break;
        }
        codeText += text[i];
        i++;
      }
    } else {
      currentText += text[i];
      i++;
    }
  }

  if (currentText) {
    parts.push(<span key={key++}>{currentText}</span>);
  }

  return parts.length > 0 ? parts : text;
}
