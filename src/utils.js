export function normalizeHex(value) {
  const hex = String(value || '').trim().replace(/^#/, '');
  return /^[a-f\d]{6}$/i.test(hex) ? '#' + hex.toUpperCase() : null;
}
export function rgbFromHex(value) {
  const hex = normalizeHex(value) || '#FFFFFF';
  return [1,3,5].map(offset=>parseInt(hex.slice(offset, offset+2),16));
}
export function clamp(value,min,max) { return Math.min(max,Math.max(min,Number(value))); }
export function validateDimensions(width,height) {
  const w=Number(width),h=Number(height);
  if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w>4096||h>4096) return null;
  return {width:w,height:h};
}
export function formatDuration(seconds) {
  const safe=Math.max(0,Math.ceil(seconds));
  return `${String(Math.floor(safe/60)).padStart(2,'0')}:${String(safe%60).padStart(2,'0')}`;
}
export function remainingSeconds(deadline,now=Date.now()) { return Math.max(0,Math.ceil((deadline-now)/1000)); }
export function isTextControl(target) { return !!target?.closest?.('input,textarea,select,[contenteditable="true"]'); }
export function dimmedRgb(hex, brightness) {return rgbFromHex(hex).map(c=>Math.round(c*clamp(brightness,0,100)/100));}
export function gradientEndpoints(width,height,angle) {
  const radians=(90-angle)*Math.PI/180;
  const dx=Math.cos(radians),dy=-Math.sin(radians);
  const length=Math.abs(width*dx)+Math.abs(height*dy);
  return [width/2-dx*length/2,height/2-dy*length/2,width/2+dx*length/2,height/2+dy*length/2];
}
export async function copyText(text) {
  if(navigator.clipboard?.writeText) {try {await navigator.clipboard.writeText(text);return true;}catch{/* fall through */}}
  const field=document.createElement('textarea');field.value=text;field.style.position='fixed';field.style.opacity='0';
  document.body.appendChild(field);field.select();let success=false;
  try{success=document.execCommand('copy');}finally{field.remove();}
  return success;
}
