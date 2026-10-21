import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import path from 'node:path';
import {render,routes,getSeo,site} from '../.ssr/entry-server.js';

const root=process.cwd(),out=path.join(root,'dist');
const template=await readFile(path.join(out,'index.html'),'utf8');
const escape=(value)=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const json=(value)=>JSON.stringify(value).replace(/</g,'\\u003c');
function breadcrumbs(meta){
  const entries=[{name:'Home',url:site.url+'/'}];
  if(meta.type==='tool'){
    const categorySlug={colors:'color-screens',tests:'screen-tests',lighting:'lighting-tools',savers:'screensavers',extras:'screen-demos'};
    const categoryName={colors:'Color screens',tests:'Screen tests',lighting:'Lighting tools',savers:'Screensavers',extras:'Screen demos'};
    entries.push({name:categoryName[meta.tool.category],url:`${site.url}/${categorySlug[meta.tool.category]}/`});
    entries.push({name:meta.tool.name,url:meta.canonical});
  }else if(meta.type==='guide'){
    entries.push({name:'Guides',url:site.url+'/guides/'});entries.push({name:meta.guide.title,url:meta.canonical});
  }else if(meta.type!=='home')entries.push({name:meta.title.split(' | ')[0],url:meta.canonical});
  return {'@type':'BreadcrumbList',itemListElement:entries.map((e,i)=>({'@type':'ListItem',position:i+1,name:e.name,item:e.url}))};
}
function structured(meta){
  const graph=[{'@type':'Organization','@id':site.url+'/#organization',name:site.owner,url:site.url,logo:site.url+'/favicon.svg'}];
  graph.push({'@type':'WebSite','@id':site.url+'/#website',name:site.name,url:site.url,inLanguage:'en',publisher:{'@id':site.url+'/#organization'}});
  graph.push({'@type':'WebPage','@id':meta.canonical+'#webpage',url:meta.canonical,name:meta.title,description:meta.description,isPartOf:{'@id':site.url+'/#website'},inLanguage:'en'});
  if(meta.type!=='home')graph.push(breadcrumbs(meta));
  if(meta.type==='tool')graph.push({'@type':'WebApplication',name:meta.tool.name,url:meta.canonical,description:meta.description,applicationCategory:'UtilitiesApplication',operatingSystem:'Any',browserRequirements:'A modern browser with JavaScript enabled',offers:{'@type':'Offer',price:'0',priceCurrency:'USD'}});
  if(meta.type==='guide')graph.push({'@type':'Article',headline:meta.guide.title,description:meta.description,datePublished:site.updated,dateModified:site.updated,author:{'@type':'Organization',name:'WhiteScreen Studio',url:site.url+'/editorial-policy/'},publisher:{'@id':site.url+'/#organization'},mainEntityOfPage:meta.canonical,inLanguage:'en'});
  return {'@context':'https://schema.org','@graph':graph};
}
function page(pathname){
  const meta=getSeo(pathname);
  let head=`<meta name="robots" content="${meta.noindex?'noindex,follow':'index,follow,max-image-preview:large'}" />\n`;
  if(!meta.noindex)head+=`<link rel="canonical" href="${escape(meta.canonical)}" />\n`;
  head+=`<meta property="og:type" content="${meta.type==='guide'?'article':'website'}" /><meta property="og:site_name" content="${escape(site.name)}" /><meta property="og:title" content="${escape(meta.title)}" /><meta property="og:description" content="${escape(meta.description)}" /><meta property="og:url" content="${escape(meta.canonical)}" /><meta property="og:image" content="${site.url}/social-card.svg" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${escape(meta.title)}" /><meta name="twitter:description" content="${escape(meta.description)}" />\n`;
  if(!meta.noindex)head+=`<script type="application/ld+json">${json(structured(meta))}</script>`;
  const adReady=site.adsEnabled&&/^ca-pub-\d{16}$/.test(site.adClient)&&/^\d+$/.test(site.adSlot)&&/^https:\/\//.test(site.cmpScript);
  if(adReady)head+=`\n<script async src="${escape(site.cmpScript)}" data-consent-manager="true"></script>`;
  return template.replace(/<title>[^<]*<\/title>/,`<title>${escape(meta.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/?\s*>/,`<meta name="description" content="${escape(meta.description)}" />`)
    .replace('<!--app-head-->',head)
    .replace('<!--app-html-->',render(pathname))
    .replace('</body>','<noscript><p style="padding:12px;text-align:center;font:14px sans-serif">Guides and page links work without JavaScript. Enable JavaScript for interactive full screen tools and PNG downloads.</p></noscript></body>');
}
for(const route of routes){const dir=route==='/'?out:path.join(out,route);await mkdir(dir,{recursive:true});await writeFile(path.join(dir,'index.html'),page(route));}
await writeFile(path.join(out,'404.html'),page('/not-a-real-page/'));
const locations=routes.map(route=>`  <url><loc>${escape(site.url+route)}</loc><lastmod>${site.updated}</lastmod></url>`).join('\n');
await writeFile(path.join(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${locations}\n</urlset>\n`);
await writeFile(path.join(out,'robots.txt'),`User-agent: *\n${site.indexable?'Allow: /':'Disallow: /'}\n\nSitemap: ${site.url}/sitemap.xml\n`);
if(site.adsEnabled&&/^ca-pub-\d{16}$/.test(site.adClient))await writeFile(path.join(out,'ads.txt'),`google.com, ${site.adClient.replace('ca-','')}, DIRECT, f08c47fec0942fa0\n`);
else await rm(path.join(out,'ads.txt'),{force:true});
await writeFile(path.join(out,'build-info.json'),JSON.stringify({name:site.name,pages:routes.length,origin:site.url,builtAt:new Date().toISOString(),advertising:site.adsEnabled},null,2));
if(site.adsEnabled&&!/^https:\/\//.test(site.cmpScript))throw new Error('Ad integration requires an HTTPS CMP bootstrap URL. Keep advertising disabled until consent is configured.');
if(site.adsEnabled&&(!/^ca-pub-\d{16}$/.test(site.adClient)||!/^\d+$/.test(site.adSlot)))throw new Error('Ad integration requires a valid publisher ID and slot.');
console.log(`Pre-rendered ${routes.length} React pages and a noindex 404. Generated sitemap.xml, robots.txt, and social metadata.`);
