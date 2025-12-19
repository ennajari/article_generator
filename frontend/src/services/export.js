import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

/**
 * Export article as PDF
 */
export const exportToPDF = (article) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Helper function to add text with word wrap
  const addText = (text, fontSize = 12, isBold = false) => {
    doc.setFontSize(fontSize);
    if (isBold) {
      doc.setFont(undefined, 'bold');
    } else {
      doc.setFont(undefined, 'normal');
    }

    const lines = doc.splitTextToSize(text, maxWidth);
    lines.forEach((line) => {
      if (yPosition > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += fontSize * 0.5;
    });
    yPosition += 5; // Add spacing after paragraph
  };

  // Title
  addText(article.query, 20, true);
  yPosition += 5;

  // Metadata
  doc.setFontSize(10);
  doc.setTextColor(100);
  addText(`Generated on: ${new Date(article.created_at).toLocaleDateString()}`);
  addText(`Model: ${article.model}`);
  doc.setTextColor(0);
  yPosition += 10;

  // Outline
  addText('Outline', 16, true);
  addText(article.outline);
  yPosition += 10;

  // Content
  addText('Content', 16, true);

  // Parse markdown-style content
  const contentLines = article.content.split('\n');
  contentLines.forEach((line) => {
    if (line.startsWith('# ')) {
      yPosition += 5;
      addText(line.substring(2), 18, true);
    } else if (line.startsWith('## ')) {
      yPosition += 3;
      addText(line.substring(3), 14, true);
    } else if (line.trim()) {
      addText(line);
    } else {
      yPosition += 3;
    }
  });

  // Save PDF
  const fileName = `${article.query.substring(0, 50).replace(/[^a-z0-9]/gi, '_')}.pdf`;
  doc.save(fileName);
};

/**
 * Export article as DOCX
 */
export const exportToDOCX = async (article) => {
  const children = [];

  // Title
  children.push(
    new Paragraph({
      text: article.query,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 }
    })
  );

  // Metadata
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated on: ${new Date(article.created_at).toLocaleDateString()}`,
          size: 20,
          color: '666666'
        })
      ],
      spacing: { after: 100 }
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Model: ${article.model}`,
          size: 20,
          color: '666666'
        })
      ],
      spacing: { after: 400 }
    })
  );

  // Outline
  children.push(
    new Paragraph({
      text: 'Outline',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 200 }
    })
  );

  article.outline.split('\n').forEach((line) => {
    if (line.trim()) {
      children.push(
        new Paragraph({
          text: line,
          spacing: { after: 100 }
        })
      );
    }
  });

  // Content
  children.push(
    new Paragraph({
      text: 'Content',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 }
    })
  );

  // Parse markdown-style content
  const contentLines = article.content.split('\n');
  contentLines.forEach((line) => {
    if (line.startsWith('# ')) {
      children.push(
        new Paragraph({
          text: line.substring(2),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 200 }
        })
      );
    } else if (line.startsWith('## ')) {
      children.push(
        new Paragraph({
          text: line.substring(3),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 150 }
        })
      );
    } else if (line.startsWith('### ')) {
      children.push(
        new Paragraph({
          text: line.substring(4),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 150, after: 100 }
        })
      );
    } else if (line.trim()) {
      children.push(
        new Paragraph({
          text: line,
          spacing: { after: 150 }
        })
      );
    } else {
      children.push(new Paragraph({ text: '' }));
    }
  });

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children
      }
    ]
  });

  // Generate and save
  const blob = await Packer.toBlob(doc);
  const fileName = `${article.query.substring(0, 50).replace(/[^a-z0-9]/gi, '_')}.docx`;
  saveAs(blob, fileName);
};