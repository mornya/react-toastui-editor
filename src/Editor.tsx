import React, { useRef, useState, useEffect } from 'react';
import colorSyntaxPlugin from '@toast-ui/editor-plugin-color-syntax';
import { Editor as ReactEditor } from '@toast-ui/react-editor';
import { HookMap } from '@toast-ui/editor/types';
import fontSizePlugin from './plugins/FontSizePlugin';
import '@toast-ui/editor/dist/i18n/ko-kr'; // 표시될 언어
import '@toast-ui/editor/dist/toastui-editor.css';
import '@toast-ui/editor/dist/theme/toastui-editor-dark.css';
import '@toast-ui/editor-plugin-color-syntax/dist/toastui-editor-plugin-color-syntax.css';
import 'tui-color-picker/dist/tui-color-picker.css';

export type Props = {
  value?: string;
  initialCursorPosition?: 'none' | 'begin' | 'end';
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onBeforeAddImage?: NonNullable<HookMap['addImageBlobHook']>; // 이미지 첨부시
  onChange(nextValue: string): any; // 에디터 수정시
};

const Editor: React.FC<Props> = (props) => {
  const { value = '', initialCursorPosition = 'begin', placeholder = '', readOnly = false } = props;
  const editorRef = useRef<ReactEditor | null>(null);
  const [editorPlaceholder, setEditorPlaceholder] = useState<string>('');

  // 글자 길이 제한 처리
  const onChange = () => {
    const nextValue = editorRef.current?.getInstance().getHTML() ?? '';
    props.onChange(nextValue);
  };

  // 이미지 첨부시
  const addImageBlobHook: NonNullable<HookMap['addImageBlobHook']> = (file, callback) => {
    /*
    const dispatch = useDispatch();
    dispatch(
      actions.application.attachment.postAssetUpload({
        file,
        onSuccess: (payload) => {
          if (payload.isSuccess) {
            callback(payload.payload.url);
          }
        },
      }),
    );
    return false;
    */
    props.onBeforeAddImage?.(file, callback);
  };

  useEffect(() => {
    return () => {
      if (editorRef.current) {
        editorRef.current.getInstance().destroy();
        editorRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // placeholder 설정
    const currLength = editorRef.current?.getInstance().getHTML().length;
    setEditorPlaceholder(readOnly && !currLength ? '입력된 내용이 없습니다.' : placeholder);

    // 커서가 위치할 곳에 커서 이동
    if (!readOnly) {
      if (initialCursorPosition === 'begin') {
        editorRef.current?.getInstance().moveCursorToStart(true);
      } else if (initialCursorPosition === 'end') {
        editorRef.current?.getInstance().moveCursorToEnd(true);
      }
    }
  }, [readOnly, placeholder, initialCursorPosition]);

  return (
    <div className={['editor-wrap', props.className].filter(Boolean).join(' ')} style={props.style}>
      <ReactEditor
        ref={editorRef}
        initialValue={value}
        placeholder={editorPlaceholder}
        theme="dark"
        previewStyle="tab"
        height="100%"
        language="ko-KR"
        initialEditType="wysiwyg"
        useCommandShortcut={false}
        usageStatistics={false}
        plugins={[colorSyntaxPlugin, fontSizePlugin]}
        toolbarItems={[
          ['heading', 'bold', 'italic', 'strike'],
          ['hr', 'quote'],
          ['ul', 'ol', 'task', 'indent', 'outdent'],
          ['table', 'image', 'link'],
        ]}
        hooks={{ addImageBlobHook }}
        onChange={onChange}
      />
    </div>
  );
};

export default Editor;
