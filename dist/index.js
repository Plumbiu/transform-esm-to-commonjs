import oxc from "oxc-parser";
import MagicString from "magic-string";

//#region src/index.ts
function buildRequireDeclaration(name, source, isDefaultImport) {
	name = isDefaultImport ? name : `{${name}}`;
	return `let ${name}=require('${source}');`;
}
function transformModulesToCommonjs(code, lang = "tsx") {
	const ms = new MagicString(code);
	const ast = oxc.parseSync("es", code, { lang });
	const moudle = ast.module;
	const { staticImports, staticExports, dynamicImports } = moudle;
	if (dynamicImports.length > 0) {
		const inject = "let __require__=(...args)=>new Promise((r)=>r(require(...args)));\n";
		ms.prepend(inject);
	}
	for (const { start, end, moduleRequest } of dynamicImports) {
		const module = code.slice(moduleRequest.start, moduleRequest.end);
		ms.update(start, end, `__require__(${module})`);
	}
	for (const staticImport of staticImports) {
		let defaultImportStr = "";
		const namedImports = [];
		const importSource = staticImport.moduleRequest.value;
		for (const { importName, localName, isType } of staticImport.entries) {
			if (isType) continue;
			const importKind = importName.kind;
			if (importKind === "Default" || importKind === "NamespaceObject") defaultImportStr += buildRequireDeclaration(localName.value, importSource, true);
			else if (importKind === "Name") {
				let value = localName.value;
				if (importName.name && importName.name !== value) value = `${importName.name} as ${localName.value}`;
				namedImports.push(value);
			}
		}
		const namedMembers = namedImports.join(",");
		const namedImportStr = namedMembers.trim() ? buildRequireDeclaration(namedMembers, importSource, false) : "";
		ms.update(staticImport.start, staticImport.end, defaultImportStr + namedImportStr);
	}
	for (const staticExport of staticExports) for (const { exportName, importName, localName } of staticExport.entries) {
		const exportKind = exportName.kind;
		const importKind = importName.kind;
		/**
		* ignore
		* export * from "mod"
		* export * as ns from "mod"
		* export { xxx } from 'mod'
		*/
		if (importKind === "None") {
			if (exportKind === "Default") {
				if (exportName.start == null || exportName.end == null) continue;
				/**
				* localName.kind === 'Name'
				* export default function a() {}
				*/
				/**
				* localName.kind === 'None'
				* export default function() {}
				*/
				/**
				* localName.kind === 'Default'
				* exprt default App
				*/
				ms.appendLeft(exportName.start, ".");
				ms.appendRight(exportName.end, "=");
			} else if (exportKind === "Name") ms.update(staticExport.start, staticExport.end, `exports.${exportName.name}=${localName.name};`);
		}
	}
	return ms.toString();
}
var src_default = transformModulesToCommonjs;
const a = "1";

//#endregion
export { a, src_default as default };