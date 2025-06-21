import * as fs from 'fs';
import * as path from 'path';
import MdMTables from 'markdown-it-multimd-table'
// @ts-expect-error
import MdReg from 'markdown-it-regexp'
import type { MarkdownRenderer } from 'vitepress'
import { headersPlugin } from '../markdown/headers'
import { figure } from '@mdit/plugin-figure'
import { imgLazyload } from '@mdit/plugin-img-lazyload'
import { align } from '@mdit/plugin-align'
import { imgSize } from '@mdit/plugin-img-size'
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs'
import { emojiRender } from './emoji'

const tooltips: {
  [key: string]: {
    title?: string;
    icon?: string;
    content: string;
  };
} = {};

const tooltipsDir = path.resolve(__dirname, 'tooltips');

try {
  const tooltipFiles = fs.readdirSync(tooltipsDir);
  for (const file of tooltipFiles) {
    if (path.extname(file) === '.md') {
      const tooltipKey = path.basename(file, '.md');
      const filePath = path.join(tooltipsDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      tooltips[tooltipKey] = {
        content: fileContent.trim(),
      };
    }
  }
} catch (error) {
  console.error("Error reading tooltips directory:", error);
  // Keep tooltips object empty or handle error as appropriate if dir doesn't exist
}

export function configureMarkdown(md: MarkdownRenderer) {
  md.use(emojiRender)
  md.use(imgLazyload)
  md.use(align)
  md.use(figure)
  md.use(tabsMarkdownPlugin)
  md.use(imgSize)
  md.use(headersPlugin)
  md.use(MdMTables, {
    multiline: true,
    rowspan: true,
    headerless: true,
    multibody: true,
    aotolabel: true
  })
  renderTooltip(md)
  renderInlineTooltip(md)
}

function renderInlineTooltip(md: MarkdownRenderer) {
  md.use(
    MdReg(
      /\^\[(.*?)\]\((.+?)\)/,
      ([, cont, hint]) =>
        '<VTooltip theme="hint">' +
        span(md.renderInline(cont)) +
        '<template v-slot:popper>' +
        md.renderInline(hint) +
        '</template></VTooltip>'
    )
  )
}

function renderTooltip(md: MarkdownRenderer) {
  md.use(
    MdReg(/==(.+?)==/, ([, cont]) => {
      const keys = Object.keys(tooltips)
      if (!keys.includes(cont)) return 'No tooltip found for ' + cont
      const item = tooltips[cont]

      const icon = item.icon ? `icon="${item.icon}"` : ''
      const title = item.title ? `title="${item.title}"` : ''
      const props = icon + title
      const renderedContent = md.render(item.content)

      return `<Tooltip ${props}>` + renderedContent + '</Tooltip>'
    })
  )
}

function span(
  content: string,
  attrs: Record<string, any> | undefined = undefined
) {
  let html = '<span'
  if (attrs)
    for (const [key, value] of Object.entries(attrs)) {
      html += ` ${key}="${value}"`
    }
  html += `>${content}</span>`
  return html
}
