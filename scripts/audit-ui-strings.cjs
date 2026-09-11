// Review inventory, not an automatic translation of domain/user content.
const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');
const rows = [];
function scan(dir) {
  for (const item of fs.readdirSync(dir, {withFileTypes:true})) {
    if (['__tests__','node_modules','.next','i18n'].includes(item.name)) continue;
    const file = path.join(dir,item.name);
    if(item.isDirectory()) { scan(file); continue; }
    if(!/\.tsx?$/.test(file)) continue;
    const source=fs.readFileSync(file,'utf8');
    const tree=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true);
    function walk(node) {
      let text,kind;
      if(ts.isJsxText(node)) {text=node.text.replace(/\s+/g,' ').trim();kind='jsx';}
      if(ts.isStringLiteral(node) && node.parent && (
        (ts.isJsxAttribute(node.parent) && /^(title|label|placeholder|accessibilityLabel|aria-label)$/.test(node.parent.name.getText(tree))) ||
        (ts.isPropertyAssignment(node.parent) && /^(title|label|subtitle|message|description|placeholder)$/.test(node.parent.name.getText(tree))))) {text=node.text;kind='copy';}
      if(text && /[A-Za-z]{2}/.test(text)) rows.push({file:file.replaceAll('\\','/'),line:tree.getLineAndCharacterOfPosition(node.getStart(tree)).line+1,kind,text});
      ts.forEachChild(node,walk);
    }
    walk(tree);
  }
}
for(const root of ['src','aritomo-web/app','aritomo-web/components']) scan(root);
fs.writeFileSync('docs/product-programme-2026-09/localisation-inventory.json',JSON.stringify({note:'Static JSX and UI-copy fields. Dynamic strings, server errors, provider-hosted UI and legal documents require separate review; this is not proof of complete translation.',rows},null,2)+'\n');
process.stdout.write(`${rows.length} candidate UI messages inventoried\n`);
