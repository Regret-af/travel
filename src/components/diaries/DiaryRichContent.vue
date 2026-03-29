<template>
  <section class="rich-content" v-html="renderedContent" />
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  content?: string;
}>();

const allowedTags = new Set([
  'p',
  'br',
  'strong',
  'em',
  'b',
  'i',
  'ul',
  'ol',
  'li',
  'blockquote',
  'h2',
  'h3',
  'h4',
  'img',
  'a',
  'figure',
  'figcaption'
]);
const blockedTags = new Set(['script', 'style', 'iframe', 'object', 'embed']);

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const sanitizeHtml = (raw: string) => {
  const parser = new DOMParser();
  const documentNode = parser.parseFromString(raw, 'text/html');

  const visit = (node: Node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName.toLowerCase();

      if (blockedTags.has(tagName)) {
        element.remove();
        return;
      }

      if (!allowedTags.has(tagName)) {
        const fragment = document.createDocumentFragment();

        while (element.firstChild) {
          fragment.appendChild(element.firstChild);
        }

        element.replaceWith(fragment);
        fragment.childNodes.forEach(visit);
        return;
      }

      [...element.attributes].forEach((attribute) => {
        const attributeName = attribute.name.toLowerCase();
        const isSafeImageAttr = tagName === 'img' && ['src', 'alt', 'title'].includes(attributeName);
        const isSafeLinkAttr = tagName === 'a' && ['href', 'title', 'target', 'rel'].includes(attributeName);

        if (!isSafeImageAttr && !isSafeLinkAttr) {
          element.removeAttribute(attribute.name);
        }
      });

      if (tagName === 'a') {
        const href = element.getAttribute('href') || '';

        if (!/^https?:\/\//i.test(href)) {
          element.removeAttribute('href');
        } else {
          element.setAttribute('target', '_blank');
          element.setAttribute('rel', 'noopener noreferrer');
        }
      }

      if (tagName === 'img') {
        const src = element.getAttribute('src') || '';

        if (!src.trim()) {
          element.remove();
          return;
        }
      }
    }

    node.childNodes.forEach(visit);
  };

  documentNode.body.childNodes.forEach(visit);
  return documentNode.body.innerHTML;
};

const normalizePlainText = (raw: string) => {
  const paragraphs = raw
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return paragraphs
    .map((paragraph) => {
      const html = escapeHtml(paragraph).replace(/\n/g, '<br />');
      return `<p>${html}</p>`;
    })
    .join('');
};

const renderedContent = computed(() => {
  const raw = props.content?.trim() || '';

  if (!raw) {
    return '<p>这篇内容还在整理中。</p>';
  }

  const hasHtml = /<\/?[a-z][\s\S]*>/i.test(raw);
  return hasHtml ? sanitizeHtml(raw) : normalizePlainText(raw);
});
</script>

<style scoped lang="scss">
.rich-content {
  color: #334155;
  font-size: 17px;
  line-height: 1.95;

  :deep(p) {
    margin: 0;
  }

  :deep(p + p),
  :deep(p + figure),
  :deep(figure + p),
  :deep(blockquote + p),
  :deep(ul + p),
  :deep(ol + p),
  :deep(p + h2),
  :deep(p + h3),
  :deep(p + h4) {
    margin-top: 1.6em;
  }

  :deep(h2),
  :deep(h3),
  :deep(h4) {
    margin-bottom: 0;
    color: #111827;
    line-height: 1.22;
  }

  :deep(h2) {
    font-size: 30px;
    margin-top: 2.1em;
  }

  :deep(h3) {
    font-size: 24px;
    margin-top: 1.9em;
  }

  :deep(h4) {
    font-size: 20px;
    margin-top: 1.7em;
  }

  :deep(strong),
  :deep(b) {
    color: #111827;
    font-weight: 700;
  }

  :deep(em),
  :deep(i) {
    font-style: italic;
  }

  :deep(ul),
  :deep(ol) {
    margin: 1.4em 0 0;
    padding-left: 1.4em;
  }

  :deep(li + li) {
    margin-top: 0.55em;
  }

  :deep(blockquote) {
    margin: 1.8em 0 0;
    padding: 1.1em 1.2em;
    border-left: 3px solid rgba(212, 175, 55, 0.7);
    border-radius: 0 18px 18px 0;
    background: linear-gradient(90deg, rgba(212, 175, 55, 0.08), rgba(255, 255, 255, 0));
    color: #475569;
  }

  :deep(figure) {
    margin: 2.1em 0;
  }

  :deep(img) {
    display: block;
    width: 100%;
    border-radius: 26px;
    box-shadow: 0 22px 56px rgba(15, 23, 42, 0.12);
  }

  :deep(figcaption) {
    margin-top: 0.9em;
    color: #64748b;
    font-size: 13px;
    text-align: center;
  }

  :deep(a) {
    color: #9a7313;
    text-decoration: none;
    border-bottom: 1px solid rgba(212, 175, 55, 0.35);
  }
}

@media (max-width: 767px) {
  .rich-content {
    font-size: 16px;
    line-height: 1.9;

    :deep(h2) {
      font-size: 26px;
    }

    :deep(h3) {
      font-size: 22px;
    }

    :deep(img) {
      border-radius: 20px;
    }
  }
}
</style>
