/*
 * FontSizePlugin
 * TUI Editor 폰트사이즈 플러그인
 */
import type { PluginContext, PluginInfo, HTMLMdNode } from '@toast-ui/editor';
import type { Context } from '@toast-ui/editor/types/toastmark';

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 24, 30, 36, 48, 60, 72, 96];

function createToolbarItemOption(dropDown: HTMLDivElement) {
  return {
    name: 'font-size',
    text: 'F',
    tooltip: '폰트 크기',
    className: 'toastui-editor-toolbar-icons',
    style: { border: 0, backgroundImage: 'unset', fontSize: '20px', color: '#fff' },
    popup: {
      body: dropDown,
      style: { overflow: 'auto', width: '100px', maxHeight: '200px' },
    },
  };
}

// TODO: 정규식으로 기존 값 대체
const assignFontSize = (prevStyle: string, fontSize: string) => {
  if (prevStyle.includes('font-size')) {
    const styles = prevStyle.split(';');
    const newStyle = styles.map((style) => {
      if (style.includes('font-size')) {
        return `font-size: ${fontSize}`;
      }
      return style;
    });

    return newStyle.join(';');
  }
  return `font-size: ${fontSize}; ${prevStyle}`;
};

function hasClass(element: HTMLElement, className: string) {
  return element.classList.contains(className);
}

export function findParentByClassName(el: HTMLElement, className: string) {
  let currentEl: HTMLElement | null = el;

  while (currentEl && !hasClass(currentEl, className)) {
    currentEl = currentEl.parentElement;
  }

  return currentEl;
}

function getCurrentEditorEl(colorPickerEl: HTMLElement, containerClassName: string) {
  const editorDefaultEl = findParentByClassName(colorPickerEl, 'toastui-editor-defaultUI')!;
  return editorDefaultEl.querySelector<HTMLElement>(`.${containerClassName} .ProseMirror`)!;
}

let containerClassName: string;
let currentEditorEl: HTMLElement;

export default function fontSizePlugin(
  context: PluginContext,
  _options: Editor.FontSize.PluginOptions = {},
): PluginInfo {
  const { eventEmitter, pmState } = context;

  eventEmitter.listen('focus', (editType) => {
    containerClassName = `toastui-editor-${editType === 'markdown' ? 'md' : 'ww'}-container`;
  });

  const container = document.createElement('div');

  const elUl = document.createElement('ul');
  elUl.classList.add('drop-down');

  FONT_SIZES.forEach((fontSize) => {
    const elLi = document.createElement('li');
    elLi.classList.add('drop-down-item');
    const elButton = document.createElement('button');
    elButton.type = 'button';
    elButton.title = `${fontSize}px`;
    elButton.ariaLabel = `${fontSize}px`;
    elButton.onclick = (event: MouseEvent) => {
      event.preventDefault();
      eventEmitter.emit('command', 'fontSize', { fontSize });
      eventEmitter.emit('closePopup');
      currentEditorEl = getCurrentEditorEl(container, containerClassName);
      currentEditorEl.focus();
    };
    elButton.innerHTML = `${fontSize}px`;
    elLi.appendChild(elButton);
    elUl.appendChild(elLi);
  });

  const input = document.createElement('input');
  input.type = 'number';
  input.classList.add('size-input');
  input.onkeyup = (event) => {
    event.preventDefault();
    if (event.code === 'Enter') {
      eventEmitter.emit('command', 'fontSize', { fontSize: input.value });
      eventEmitter.emit('closePopup');
      currentEditorEl = getCurrentEditorEl(container, containerClassName);
      currentEditorEl.focus();
    }
  };

  container.appendChild(input);
  container.appendChild(elUl);

  const toolbarItem = createToolbarItemOption(container);

  return {
    markdownCommands: {
      fontSize: ({ fontSize }, { tr, selection, schema }, dispatch) => {
        if (fontSize) {
          const slice = selection.content();
          const textContent = slice.content.textBetween(0, slice.content.size, '\n');

          const openTag = `<span style="font-size:${fontSize}px;">`;
          const closeTag = '</span>';
          const fontSized = `${openTag}${textContent}${closeTag}`;

          const SelectionClass = pmState.TextSelection;

          const { mapping, doc } = tr;
          const { from, to, empty } = selection;
          const mappedFrom = mapping.map(from) + openTag.length;
          const mappedTo = mapping.map(to) - closeTag.length;
          const nextSelection = empty
            ? SelectionClass.create(doc, mappedTo, mappedTo)
            : SelectionClass.create(doc, mappedFrom, mappedTo);

          tr.replaceSelectionWith(schema.text(fontSized)).setSelection(nextSelection);
          dispatch(tr);

          return true;
        }
        return false;
      },
    },
    wysiwygCommands: {
      fontSize: ({ fontSize }, { tr, selection, schema }, dispatch) => {
        if (fontSize) {
          let prevAttrs: Editor.FontSize.Attr = {
            htmlAttrs: null,
            htmlInline: null,
            classNames: null,
          };
          const { from, to } = selection;
          const slicedContent = selection.content();
          slicedContent.content.nodesBetween(0, slicedContent.content.size, (node: any) => {
            if (node.marks.length > 0) {
              node.marks.forEach((mark: Editor.FontSize.Mark) => {
                if (mark.type.name === 'span') {
                  prevAttrs = mark.attrs;
                }
              });
            }
          });
          const style = assignFontSize(prevAttrs.htmlAttrs?.style ?? '', `${fontSize}px`);
          const attrs = prevAttrs.htmlAttrs
            ? { htmlAttrs: { ...prevAttrs.htmlAttrs, style } }
            : { htmlAttrs: { style: `font-size: ${fontSize}px;` } };
          const mark = schema.marks.span.create(attrs);

          tr.addMark(from, to, mark);
          dispatch!(tr);

          return true;
        }
        return false;
      },
    },
    toolbarItems: [{ groupIndex: 0, itemIndex: 0, item: toolbarItem }],
    toHTMLRenderers: {
      htmlInline: {
        span(node: HTMLMdNode, { entering }: Context) {
          return entering
            ? { type: 'openTag', tagName: 'span', attributes: node.attrs! }
            : { type: 'closeTag', tagName: 'span' };
        },
      },
    },
  };
}
