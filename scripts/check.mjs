import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import path from 'node:path';
import {routes,getSeo,render,site} from '../.ssr/entry-server.js';

const root=path.resolve('dist'),known=new Set(routes),titles=new Set(),descriptions=new Set();
let links=0,schemas=0;
for(const route of routes){
  const file=path.join(root,route,'index.html'),html=await readFile(file,'utf8');
  const meta=getSeo(route),title=html.match(/<title>([^<]*)<\/title>/)?.[1],description=html.match(/<meta name="description" content="([^"]*)"/)?.[1];
  assert(title,`${route}: missing title`);assert(description,`${route}: missing description`);
  assert(!titles.has(title),`${route}: duplicate title`);assert(!descriptions.has(description),`${route}: duplicate description`);titles.add(title);descriptions.add(description);
  assert.equal((html.match(/<h1(?:\s[^>]*)?>/g)||[]).length,1,`${route}: expected one H1`);
  assert(!html.includes('<!--app-html-->'),`${route}: missing rendered content`);
  assert(!html.includes('[[/'),`${route}: unexpanded content links`);
  if(!meta.noindex)assert(html.includes(`rel="canonical" href="${meta.canonical}"`),`${route}: wrong canonical`);
  for(const match of html.matchAll(/<script type="application\/ld\+json">([^]*?)<\/script>/g)){const data=JSON.parse(match[1]);assert.equal(data['@context'],'https://schema.org');schemas++;}
  const ids=new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]));
  for(const match of html.matchAll(/href="([^"<>]+)"/g)){
    const href=match[1].replaceAll('&amp;','&');
    if(href.startsWith('#')){assert(ids.has(href.slice(1)),`${route}: missing anchor ${href}`);continue;}
    if(!href.startsWith('/')||href.startsWith('//'))continue;
    const [pathname,fragment]=href.split('#');
    if(pathname.includes('.')){await access(path.join(root,pathname));continue;}
    assert(known.has(pathname),`${route}: broken internal link ${pathname}`);
    if(fragment){const target=await readFile(path.join(root,pathname,'index.html'),'utf8');assert(target.includes(`id="${fragment}"`),`${route}: broken remote fragment ${href}`);}
    links++;
  }
  assert(html.includes('<main'),`${route}: missing semantic main`);
}
const sitemap=await readFile(path.join(root,'sitemap.xml'),'utf8');
assert.equal((sitemap.match(/<loc>/g)||[]).length,routes.length,'Sitemap route count');
assert(!sitemap.includes('your-domain.com'),'Placeholder in sitemap');
const errorPage=await readFile(path.join(root,'404.html'),'utf8');assert(errorPage.includes('noindex,follow'));assert(errorPage.includes('This screen isn’t here.'));
const home=await readFile(path.join(root,'index.html'),'utf8');assert(home.includes('White screen.'));assert(home.includes('Download PNG'));
if(!site.adsEnabled){
  assert(!render('/white-screen/').includes('adsbygoogle'),'Ads must not render with the disabled configuration');
  assert(!home.includes('pagead2.googlesyndication.com/pagead/js'),'No ad network script enabled by default');
}else{
  assert(home.includes('data-consent-manager="true"'),'Enabled advertising requires the consent bootstrap');
  assert(home.includes('aria-label="Advertisement"'),'Enabled ad must have an advertisement label');
  await access(path.join(root,'ads.txt'));
}
const source=await readFile('src/ToolStudio.jsx','utf8');assert(!source.includes('getUserMedia'),'Camera access must not be requested');
console.log(`PASS: ${routes.length} pre-rendered pages, unique titles and descriptions, ${links} internal links, ${schemas} JSON-LD blocks, anchors, assets, sitemap, 404, and ${site.adsEnabled?'configured consent/ad output':'default ad-free output'}.`);
console.log(`Canonical origin: ${site.url}`);
