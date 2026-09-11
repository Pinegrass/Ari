// Explicit known UI literals only. Never descend into handlers, predicates,
// identifiers, styles, arbitrary call arguments or user-authored values.
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const known=new Set();
for(const file of ['src/i18n/phrases.ts','src/i18n/phrasesExtra.ts']){
 const tree=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);
 const collect=n=>{if(ts.isPropertyAssignment(n)&&ts.isStringLiteral(n.name))known.add(n.name.text);ts.forEachChild(n,collect);};collect(tree);
}
const decode=s=>s.replaceAll('&apos;',"'").replaceAll('&quot;','"').replaceAll('&amp;','&').replaceAll('&nbsp;',' ');
const attributes=new Set(['title','subtitle','label','placeholder','accessibilityLabel','accessibilityHint','aria-label','hint','description','emptyMessage']);
let total=0;
function scan(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){
 const file=path.join(dir,item.name);if(item.name==='__tests__')continue;if(item.isDirectory()){scan(file);continue;}if(!file.endsWith('.tsx'))continue;
 let source=fs.readFileSync(file,'utf8');const tree=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),edits=[];
 const roots=[];const discover=n=>{if((ts.isFunctionDeclaration(n)||ts.isFunctionExpression(n))&&n.name&&/^[A-Z]/.test(n.name.text)&&n.body)roots.push(n);else if(ts.isVariableDeclaration(n)&&ts.isIdentifier(n.name)&&/^[A-Z]/.test(n.name.text)&&n.initializer&&ts.isArrowFunction(n.initializer)&&ts.isBlock(n.initializer.body))roots.push(n.initializer);else ts.forEachChild(n,discover);};discover(tree);
 for(const fn of roots){const before=edits.length;
  function literal(n){const text=decode(n.text);if(known.has(text))edits.push([n.getStart(tree),n.end,`localizeCopy(${JSON.stringify(text)})`]);}
  function visible(n){if(ts.isParenthesizedExpression(n)||ts.isAsExpression(n)||ts.isNonNullExpression(n)){visible(n.expression);}else if(ts.isStringLiteral(n))literal(n);else if(ts.isConditionalExpression(n)){visible(n.whenTrue);visible(n.whenFalse);}else if(ts.isBinaryExpression(n)&&[ts.SyntaxKind.AmpersandAmpersandToken,ts.SyntaxKind.BarBarToken,ts.SyntaxKind.QuestionQuestionToken].includes(n.operatorToken.kind)){visible(n.right);}else if(ts.isJsxElement(n)||ts.isJsxSelfClosingElement(n)||ts.isJsxFragment(n))walk(n);}
  function walk(n){
   if(ts.isJsxText(n)){const text=decode(n.text.replace(/\s+/g,' ').trim());if(known.has(text))edits.push([n.getStart(tree),n.end,`{localizeCopy(${JSON.stringify(text)})}`]);return;}
   if(ts.isJsxAttribute(n)){if(!attributes.has(n.name.getText(tree)))return;if(n.initializer&&ts.isStringLiteral(n.initializer)){const text=decode(n.initializer.text);if(known.has(text))edits.push([n.initializer.getStart(tree),n.initializer.end,`{localizeCopy(${JSON.stringify(text)})}`]);}else if(n.initializer&&ts.isJsxExpression(n.initializer)&&n.initializer.expression)visible(n.initializer.expression);return;}
   if(ts.isJsxExpression(n)){if(n.expression){visible(n.expression);if(ts.isCallExpression(n.expression)&&ts.isPropertyAccessExpression(n.expression.expression)&&n.expression.expression.name.text==='map')n.expression.arguments.forEach(arg=>{if(ts.isArrowFunction(arg))walk(arg.body);});}return;}
   ts.forEachChild(n,walk);
  }walk(fn.body);
  if(edits.length>before&&!fn.body.getText(tree).includes('phrase:localizeCopy'))edits.push([fn.body.getStart(tree)+1,fn.body.getStart(tree)+1,'\n const {phrase:localizeCopy}=useCopyLanguage();']);
 }
 if(!edits.length)continue;
 const unique=[...new Map(edits.map(e=>[`${e[0]}:${e[1]}`,e])).values()];unique.sort((a,b)=>b[0]-a[0]).forEach(([start,end,value])=>{source=source.slice(0,start)+value+source.slice(end);});
 if(!source.includes('useLanguage as useCopyLanguage')){
  const web=file.startsWith('aritomo-web');let relative=web?'@/lib/i18n/LanguageProvider':path.relative(path.dirname(file),'src/i18n/LanguageContext').replaceAll('\\','/');if(!web&&!relative.startsWith('.'))relative='./'+relative;
  const directive=source.match(/^['"]use client['"];?\r?\n/);const at=directive?directive[0].length:0;
  source=source.slice(0,at)+`${web&&!directive?"'use client';\n":''}import {useLanguage as useCopyLanguage} from '${relative}';\n`+source.slice(at);
 }
 fs.writeFileSync(file,source);total+=unique.length;process.stdout.write(file+': '+unique.length+' edits\n');
}}
for(const root of ['src/screens','src/components','aritomo-web/components'])scan(root);
process.stdout.write('Total edits: '+total+'\n');
