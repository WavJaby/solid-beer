declare module '*?examples' {
  const source: Record<
    string,
    {
      name: string;
      api?: string;
      native?: string;
      apiTemplate?: (props: Record<string, unknown>) => string;
      nativeTemplate?: (props: Record<string, unknown>) => string;
      report?: import('../../src/vite').SolidBeerTransformReport;
    }
  >;
  export default source;
}
