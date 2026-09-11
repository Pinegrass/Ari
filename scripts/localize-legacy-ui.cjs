// One-time, conservative JSX migration: known catalog copy only. Does not touch
// business values, user text, API identifiers, styles or navigation route keys.
const ts = require('typescript');
const fs = require('node:fs');
const catalog = ts.createSourceFile('phrases.ts', fs.readFileSync('src/i18n/phrases.ts','utf8'), ts.ScriptTarget.Latest, true);
const known = new Set();
function collect(node) { if(ts.isPropertyAssignment(node) && ts.isStringLiteral(node.name)) known.add(node.name.text); ts.forEachChild(node,collect); }
collect(catalog);
const files = [
  ['src/screens/LoginScreen.tsx','LoginScreen',"../i18n/LanguageContext"],
  ['src/screens/RegisterScreen.tsx','RegisterScreen',"../i18n/LanguageContext"],
  ['src/screens/OnboardingScreen.tsx','OnboardingScreen',"../i18n/LanguageContext"],
  ['src/screens/AddTransactionScreen.tsx','AddTransactionScreen',"../i18n/LanguageContext"],
  ['aritomo-web/components/AuthForm.tsx','AuthForm',"@/lib/i18n/LanguageProvider"],
  ...['Settings','Tomo','Transactions','Paywall','Budget'].map(name => [`src/screens/${name}Screen.tsx`,`${name}Screen`, '../i18n/LanguageContext']),
  ...['Accountant','Bills','RecurringPayments'].map(name => [`src/screens/${name}Screen.tsx`,`${name}Screen`, '../i18n/LanguageContext']),
];
for (const [path,name,importPath] of files) {
  let source=fs.readFileSync(path,'utf8');
  const migrated = source.includes('const { phrase } = useLanguage()');
  const tree=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const changes=[];
  const fn=tree.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name);
  if(!fn?.body) throw new Error('Missing component '+name);
  function walk(node) {
    if(ts.isJsxText(node)) {
      const text=node.text.replace(/\s+/g,' ').trim();
      if(known.has(text)) changes.push([node.getStart(tree),node.end,`{phrase(${JSON.stringify(text)})}`]);
    } else if(ts.isJsxAttribute(node)&&node.initializer&&ts.isStringLiteral(node.initializer)&&known.has(node.initializer.text)&&['label','title','placeholder','accessibilityLabel'].includes(node.name.getText(tree))) {
      changes.push([node.initializer.getStart(tree),node.initializer.end,`{phrase(${JSON.stringify(node.initializer.text)})}`]);
      return;
    } else if(ts.isJsxExpression(node)&&node.expression) {
      function expr(n) {
        // Never enter handlers, calls, object values or predicates: these may
        // contain route names and other program identifiers, not visible copy.
        if(ts.isCallExpression(n) || ts.isArrowFunction(n) || ts.isFunctionExpression(n) || ts.isObjectLiteralExpression(n)) return;
        if(ts.isConditionalExpression(n)) { expr(n.whenTrue); expr(n.whenFalse); return; }
        if(ts.isBinaryExpression(n)) return;
        if(ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n)) { walk(n); return; }
        if(ts.isStringLiteral(n)&&known.has(n.text)) changes.push([n.getStart(tree),n.end,`phrase(${JSON.stringify(n.text)})`]);
        else ts.forEachChild(n,expr);
      }
      expr(node.expression); return;
    }
    ts.forEachChild(node,walk);
  }
  walk(fn.body);
  if(!migrated) changes.push([fn.body.getStart(tree)+1,fn.body.getStart(tree)+1,'\n  const { phrase } = useLanguage();']);
  changes.sort((a,b)=>b[0]-a[0]).forEach(([start,end,text])=>{source=source.slice(0,start)+text+source.slice(end);});
  const importAt=source.startsWith("'use client';")?source.indexOf('\n')+1:0;
  if(!migrated) source=source.slice(0,importAt)+`\nimport { useLanguage } from '${importPath}';\n`+source.slice(importAt);
  fs.writeFileSync(path,source);
  process.stdout.write(`${path}: ${changes.length-(migrated?0:1)} UI messages\n`);
}
