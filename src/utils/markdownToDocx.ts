import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  Shading,
  ShadingType,
} from 'docx';

export interface ConversionOptions {
  author?: string;
  title?: string;
}

interface TableData {
  headers: string[];
  rows: string[][];
  alignments: ('left' | 'center' | 'right')[];
}

export function parseMarkdownToDocx(markdown: string, options: ConversionOptions = {}): Document {
  const lines = markdown.split('\n');
  const elements: (Paragraph | Table)[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('```')) {
      const language = line.substring(3).trim();
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }

      elements.push(
        new Paragraph({
          text: language || 'code',
          shading: {
            type: ShadingType.SOLID,
            color: 'E0E0E0',
          },
          spacing: { before: 120, after: 0 },
        })
      );

      codeLines.forEach((codeLine, index) => {
        elements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: codeLine,
                font: 'Courier New',
                size: 20,
              }),
            ],
            shading: {
              type: ShadingType.SOLID,
              color: 'F5F5F5',
            },
            spacing: {
              before: index === 0 ? 0 : 0,
              after: index === codeLines.length - 1 ? 120 : 0,
              line: 240,
            },
          })
        );
      });
      i++;
    } else if (isTableLine(line) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const tableData = parseTable(lines, i);
      elements.push(createDocxTable(tableData));
      i += tableData.rows.length + 2;
    } else if (line.startsWith('> ')) {
      let quoteContent = line.substring(2);
      i++;
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteContent += ' ' + lines[i].substring(2);
        i++;
      }
      elements.push(
        new Paragraph({
          children: processInlineFormatting(quoteContent),
          shading: {
            type: ShadingType.SOLID,
            color: 'E3F2FD',
          },
          spacing: { before: 120, after: 120 },
          indent: { left: 720 },
        })
      );
    } else if (line.startsWith('# ')) {
      elements.push(
        new Paragraph({
          children: processInlineFormatting(line.substring(2)),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 },
        })
      );
      i++;
    } else if (line.startsWith('## ')) {
      elements.push(
        new Paragraph({
          children: processInlineFormatting(line.substring(3)),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );
      i++;
    } else if (line.startsWith('### ')) {
      elements.push(
        new Paragraph({
          children: processInlineFormatting(line.substring(4)),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 160, after: 80 },
        })
      );
      i++;
    } else if (line.startsWith('#### ')) {
      elements.push(
        new Paragraph({
          children: processInlineFormatting(line.substring(5)),
          heading: HeadingLevel.HEADING_4,
          spacing: { before: 120, after: 60 },
        })
      );
      i++;
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        new Paragraph({
          children: processInlineFormatting(line.substring(2)),
          bullet: { level: 0 },
          spacing: { before: 60, after: 60 },
        })
      );
      i++;
    } else if (/^\d+\.\s/.test(line)) {
      const text = line.replace(/^\d+\.\s/, '');
      elements.push(
        new Paragraph({
          children: processInlineFormatting(text),
          numbering: { reference: 'default-numbering', level: 0 },
          spacing: { before: 60, after: 60 },
        })
      );
      i++;
    } else if (line.trim() === '') {
      elements.push(new Paragraph({ text: '' }));
      i++;
    } else {
      const textRuns = processInlineFormatting(line);
      elements.push(
        new Paragraph({
          children: textRuns,
          spacing: { before: 60, after: 60 },
        })
      );
      i++;
    }
  }

  return new Document({
    creator: options.author || 'Markdown to DOC Converter',
    title: options.title || 'Converted Document',
    sections: [
      {
        properties: {},
        children: elements,
      },
    ],
    numbering: {
      config: [
        {
          reference: 'default-numbering',
          levels: [
            {
              level: 0,
              format: 'decimal',
              text: '%1.',
              alignment: AlignmentType.LEFT,
            },
          ],
        },
      ],
    },
  });
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

function createDocxTable(tableData: TableData): Table {
  const { headers, rows, alignments } = tableData;

  const getAlignment = (alignment: 'left' | 'center' | 'right') => {
    if (alignment === 'center') return AlignmentType.CENTER;
    if (alignment === 'right') return AlignmentType.RIGHT;
    return AlignmentType.LEFT;
  };

  const headerRow = new TableRow({
    children: headers.map((header, index) =>
      new TableCell({
        children: [
          new Paragraph({
            children: processInlineFormatting(header),
            alignment: getAlignment(alignments[index]),
          }),
        ],
        shading: {
          type: ShadingType.SOLID,
          color: '2563EB',
        },
        margins: {
          top: 100,
          bottom: 100,
          left: 100,
          right: 100,
        },
      })
    ),
  });

  const dataRows = rows.map(
    (row, rowIndex) =>
      new TableRow({
        children: row.map((cell, cellIndex) =>
          new TableCell({
            children: [
              new Paragraph({
                children: processInlineFormatting(cell),
                alignment: getAlignment(alignments[cellIndex]),
              }),
            ],
            shading: {
              type: ShadingType.SOLID,
              color: rowIndex % 2 === 0 ? 'F9FAFB' : 'FFFFFF',
            },
            margins: {
              top: 80,
              bottom: 80,
              left: 100,
              right: 100,
            },
          })
        ),
      })
  );

  return new Table({
    rows: [headerRow, ...dataRows],
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
    },
  });
}

function processInlineFormatting(text: string): TextRun[] {
  const runs: TextRun[] = [];
  let currentText = '';
  let i = 0;

  while (i < text.length) {
    if (text[i] === '*' && text[i + 1] === '*') {
      if (currentText) {
        runs.push(new TextRun({ text: currentText }));
        currentText = '';
      }

      i += 2;
      let boldText = '';
      while (i < text.length - 1) {
        if (text[i] === '*' && text[i + 1] === '*') {
          runs.push(new TextRun({ text: boldText, bold: true }));
          i += 2;
          break;
        }
        boldText += text[i];
        i++;
      }
    } else if (text[i] === '*') {
      if (currentText) {
        runs.push(new TextRun({ text: currentText }));
        currentText = '';
      }

      i += 1;
      let italicText = '';
      while (i < text.length) {
        if (text[i] === '*') {
          runs.push(new TextRun({ text: italicText, italics: true }));
          i += 1;
          break;
        }
        italicText += text[i];
        i++;
      }
    } else if (text[i] === '`') {
      if (currentText) {
        runs.push(new TextRun({ text: currentText }));
        currentText = '';
      }

      i += 1;
      let codeText = '';
      while (i < text.length) {
        if (text[i] === '`') {
          runs.push(
            new TextRun({
              text: codeText,
              font: 'Courier New',
              color: '1E3A8A',
              shading: {
                type: ShadingType.SOLID,
                color: 'DBEAFE',
              },
            })
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
    runs.push(new TextRun({ text: currentText }));
  }

  return runs.length > 0 ? runs : [new TextRun({ text })];
}
