//#region src/index.d.ts
declare function transformModulesToCommonjs(code: string, lang?: 'js' | 'jsx' | 'ts' | 'tsx'): string;
declare const a = "1";
//#endregion
export { a, transformModulesToCommonjs as default };