declare namespace Editor {
  // FontSizePlugin
  namespace FontSize {
    type MarkType<S> = {
      name: string;
      schema: S;
      spec: MarkSpec;
    };

    type Mark = {
      type: MarkType<S>;
      attrs: Attr;
    };

    type Attr = {
      htmlAttrs: Record<string, string> | null;
      htmlInline: boolean | null;
      classNames: string | null;
    };

    interface PluginOptions {
      preset?: string[];
    }

    export default function fontSizePlugin(
      context: import('@toast-ui/editor').PluginContext,
      options: PluginOptions,
    ): import('@toast-ui/editor').PluginInfo;
  }
}
