import DOMPurify from 'dompurify';

export function SanitizedText({ text = '', className = '', allowHtml = false }) {
  if (!text) return null;

  if (allowHtml) {
    const cleanHtml = DOMPurify.sanitize(text, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'code', 'pre', 'p', 'br', 'ul', 'ol', 'li', 'span'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    });

    return (
      <span
        className={className}
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    );
  }

  return <span className={className}>{text}</span>;
}

export default SanitizedText;
