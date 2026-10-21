import React, {useState,useEffect,useRef,useCallback} from 'react';
import {Maximize,Minimize,Download,Sun,ChevronRight,ChevronLeft,Copy,Check,Play,Pause,RotateCcw,ArrowUpRight,Info,Monitor,Palette,ShieldCheck,Keyboard} from 'lucide-react';
import {tools} from './content.js';
import {rgbFromHex,normalizeHex,validateDimensions,formatDuration,remainingSeconds,isTextControl,gradientEndpoints,copyText} from './utils.js';

const sizes=[['1920 × 1080 · Full HD',1920,1080],['2560 × 1440 · QHD',2560,1440],['3840 × 2160 · 4K',3840,2160],['1080 × 1920 · Portrait',1080,1920],['1080 × 1080 · Square',1080,1080]];
const testColors=['#FFFFFF','#000000','#FF0000','#00FF00','#0000FF'];
const colorNames=['White','Black','Red','Green','Blue'];
const cracks=[[[.52,.46],[.04,.02]],[[.52,.46],[.27,0]],[[.52,.46],[.71,0]],[[.52,.46],[1,.08]],[[.52,.46],[1,.57]],[[.52,.46],[.87,1]],[[.52,.46],[.46,1]],[[.52,.46],[.09,.95]],[[.52,.46],[0,.43]],[[.25,.23],[.18,.4],[.33,.54],[.25,.72]],[[.69,.24],[.79,.36],[.72,.5],[.89,.69]],[[.38,.56],[.49,.66],[.68,.62],[.73,.78]]];

function Rain({speed,paused}) {
  return <div className={'rain '+(paused?'paused':'')} aria-hidden="true">{Array.from({length:24},(_,i)=><span key={i} style={{left:`${i*4.2}%`,animationDuration:`${(7+i%5)/(speed/100)}s`,animationDelay:`-${i*.67}s`}}>{'0101アイウカキ01ナノサシツ0101'.slice(i%7)+String(i)}</span>)}</div>;
}

function CanvasArtwork({kind,color,secondColor,angle,ringWidth,pattern,pixelIndex,clock,use24,remaining,progress,speed,paused,intensity}) {
  if(kind==='clock') return <div className="clock-art"><span className="art-eyebrow">A LITTLE TIME, WELL SPENT</span><div className="digital-clock" suppressHydrationWarning>{clock ? clock.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:!use24}) : (use24?'00:00':'12:00 AM')}</div><p suppressHydrationWarning>{clock?clock.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}):'Your local time'}</p></div>;
  if(kind==='timer') return <div className="timer-art"><span className="art-eyebrow">ONE THING AT A TIME</span><div className="digital-clock">{formatDuration(remaining)}</div><p>{remaining===0?'Session complete. Take a moment.':'A little focus goes a long way.'}</p></div>;
  if(kind==='ring') return <div className="ring-art" style={{background:color,'--ring-width':`${ringWidth}%`}}><div/></div>;
  if(kind==='monitor') {
    if(pattern==='grid') return <div className="grid-art"><div className="grid-center"/></div>;
    if(pattern==='contrast') return <div className="contrast-art">{[0,4,8,12,16,24,40,64,96,128,160,192,216,232,240,248,252,255].map(v=><span key={v} style={{background:`rgb(${v},${v},${v})`,color:v>128?'#111':'#fff'}}>{v}</span>)}</div>;
    return <div className="gray-gradient-art"/>;
  }
  if(kind==='bounce') return <div className={'bounce-area '+(paused?'paused':'')} style={{'--duration':`${12/(speed/100)}s`}}><div className="bounce-x"><div className="bounce-y"><Maximize size={54}/><strong>studio.</strong></div></div></div>;
  if(kind==='rain') return <Rain speed={speed} paused={paused}/>;
  if(kind==='update') return <div className="update-art"><div className={'spinner '+(paused?'paused':'')}/><strong>Getting things ready</strong><p>{Math.round(progress)}% complete</p><div className="progress-track"><span style={{width:`${progress}%`}}/></div><small>Fictional progress display · No update is running</small></div>;
  if(kind==='crack') return <svg className="crack-art" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true" style={{opacity:intensity/100}}>{cracks.map((line,i)=><polyline key={i} points={line.map(([x,y])=>`${x*1000},${y*600}`).join(' ')} fill="none" stroke={i%2?'#c9e3d8':'white'} strokeWidth={i<9?'1.8':'1'}/>)}<circle cx="520" cy="276" r="10" fill="none" stroke="white"/><circle cx="520" cy="276" r="22" fill="none" stroke="#c9e3d8"/></svg>;
  if(kind==='gradient') return <div className="gradient-art" style={{background:`linear-gradient(${angle}deg,${color},${secondColor})`}}/>;
  return null;
}

export default function ToolStudio({tool,home=false}) {
  const [color,setColor]=useState(tool.color),[hex,setHex]=useState(tool.color),[brightness,setBrightness]=useState(100);
  const [secondColor,setSecondColor]=useState('#F5CFB6'),[angle,setAngle]=useState(120),[ringWidth,setRingWidth]=useState(18);
  const [width,setWidth]=useState(1920),[height,setHeight]=useState(1080),[preset,setPreset]=useState('0');
  const [expanded,setExpanded]=useState(false),[status,setStatus]=useState(''),[exporting,setExporting]=useState(false),[copied,setCopied]=useState(false);
  const [pixelIndex,setPixelIndex]=useState(0),[autoCycle,setAutoCycle]=useState(false),[pattern,setPattern]=useState('gradient');
  const [clock,setClock]=useState(null),[use24,setUse24]=useState(true),[minutes,setMinutes]=useState(25),[remaining,setRemaining]=useState(1500),[running,setRunning]=useState(false);
  const [paused,setPaused]=useState(true),[speed,setSpeed]=useState(100),[progress,setProgress]=useState(32),[intensity,setIntensity]=useState(70);
  const [awake,setAwake]=useState(false),[wakeStatus,setWakeStatus]=useState('Off');
  const [hexError,setHexError]=useState(''),[exportError,setExportError]=useState('');
  const canvasRef=useRef(null),expandButtonRef=useRef(null),deadlineRef=useRef(null),wakeRef=useRef(null),previousExpanded=useRef(false);
  const isColor=tool.category==='colors',canExport=isColor||tool.kind==='gradient';
  const animation=['bounce','rain','update'].includes(tool.kind);
  const appliedColor=tool.kind==='pixels'?testColors[pixelIndex]:color;
  const rgb=rgbFromHex(appliedColor);
  const isLight=(rgb[0]*.299+rgb[1]*.587+rgb[2]*.114)*brightness/100>145;
  const darkCanvas=['clock','bounce','rain','update','crack','ring','monitor'].includes(tool.kind)||!isLight;

  useEffect(()=>{if(animation) setPaused(window.matchMedia('(prefers-reduced-motion: reduce)').matches);},[animation]);
  useEffect(()=>{if(tool.kind!=='clock')return;setClock(new Date());const id=setInterval(()=>setClock(new Date()),1000);return()=>clearInterval(id);},[tool.kind]);
  useEffect(()=>{if(!autoCycle)return;const id=setInterval(()=>setPixelIndex(v=>(v+1)%testColors.length),3000);return()=>clearInterval(id);},[autoCycle]);
  useEffect(()=>{if(tool.kind!=='update'||paused)return;const id=setInterval(()=>setProgress(v=>v>=100?0:v+1),2200/(speed/100));return()=>clearInterval(id);},[tool.kind,paused,speed]);
  useEffect(()=>{
    if(!running)return;
    const update=()=>{const left=remainingSeconds(deadlineRef.current);setRemaining(left);if(left===0){setRunning(false);deadlineRef.current=null;}};
    update();const id=setInterval(update,250);return()=>clearInterval(id);
  },[running]);

  const close=useCallback(async()=>{
    try{if(document.fullscreenElement===canvasRef.current)await document.exitFullscreen();}catch{}
    setExpanded(false);
  },[]);
  const toggle=useCallback(async()=>{
    if(expanded){await close();return;}
    setExpanded(true);setStatus('');
    try{if(canvasRef.current?.requestFullscreen&&document.fullscreenEnabled)await canvasRef.current.requestFullscreen();else setStatus('Expanded view is active. Your browser bars may remain visible.');}
    catch{setStatus('Expanded view is active. Your browser bars may remain visible.');}
  },[expanded,close]);
  useEffect(()=>{
    const onChange=()=>{if(document.fullscreenElement===canvasRef.current)setExpanded(true);else if(previousExpanded.current)setExpanded(false);};
    document.addEventListener('fullscreenchange',onChange);return()=>document.removeEventListener('fullscreenchange',onChange);
  },[]);
  useEffect(()=>{
    const onKey=e=>{
      if(isTextControl(e.target)||e.altKey||e.ctrlKey||e.metaKey)return;
      if(e.key==='Escape'){if(expanded){e.preventDefault();close();}return;}
      if(e.key.toLowerCase()==='f'){e.preventDefault();toggle();}
      if(expanded&&tool.kind==='pixels'&&['ArrowRight','ArrowLeft',' '].includes(e.key)){e.preventDefault();setPixelIndex(v=>(v+(e.key==='ArrowLeft'?-1:1)+5)%5);}
      if(expanded&&e.key==='Tab'){
        const buttons=canvasRef.current?.querySelectorAll('button:not([disabled])');
        if(!buttons?.length)return;
        const first=buttons[0],last=buttons[buttons.length-1];
        if(e.shiftKey&&(document.activeElement===first||!canvasRef.current.contains(document.activeElement))){e.preventDefault();last.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
      }
    };
    document.addEventListener('keydown',onKey);return()=>document.removeEventListener('keydown',onKey);
  },[expanded,toggle,close,tool.kind]);
  useEffect(()=>{
    if(expanded){document.body.style.overflow='hidden';canvasRef.current?.querySelector('.canvas-exit')?.focus();}
    else{document.body.style.overflow='';if(previousExpanded.current)expandButtonRef.current?.focus();}
    previousExpanded.current=expanded;
    return()=>{document.body.style.overflow='';};
  },[expanded]);
  useEffect(()=>{
    if(!awake){wakeRef.current?.release().catch(()=>{});wakeRef.current=null;setWakeStatus('Off');return;}
    let disposed=false;
    const request=async()=>{
      if(document.visibilityState!=='visible'||wakeRef.current)return;
      if(!('wakeLock'in navigator)){setWakeStatus('Unavailable');return;}
      try{const lock=await navigator.wakeLock.request('screen');if(disposed){await lock.release();return;}wakeRef.current=lock;setWakeStatus('Active');lock.addEventListener('release',()=>{if(wakeRef.current===lock){wakeRef.current=null;if(!disposed)setWakeStatus('Released');}});}
      catch{if(!disposed)setWakeStatus('Not granted');}
    };
    request();document.addEventListener('visibilitychange',request);
    return()=>{disposed=true;document.removeEventListener('visibilitychange',request);wakeRef.current?.release().catch(()=>{});wakeRef.current=null;};
  },[awake]);

  function updateColor(value){setColor(value.toUpperCase());setHex(value.toUpperCase());setHexError('');}
  function commitHex(){const normalized=normalizeHex(hex);if(normalized)updateColor(normalized);else setHexError('Enter a six-digit hex color, for example #FFFFFF.');}
  function selectSize(value){setPreset(value);if(value!=='custom'){const size=sizes[Number(value)];setWidth(size[1]);setHeight(size[2]);}setExportError('');}
  function chooseMinutes(value){const n=Math.max(1,Math.min(180,Number(value)||1));setMinutes(n);setRunning(false);setRemaining(n*60);deadlineRef.current=null;}
  function toggleTimer(){if(running){setRemaining(remainingSeconds(deadlineRef.current));setRunning(false);}else{const seconds=remaining>0?remaining:minutes*60;setRemaining(seconds);deadlineRef.current=Date.now()+seconds*1000;setRunning(true);}}
  async function download(){
    const dimensions=validateDimensions(width,height);
    if(!dimensions){setExportError('Use whole numbers from 1 to 4,096 for width and height.');return;}
    setExporting(true);setExportError('');
    try{
      const canvas=document.createElement('canvas');canvas.width=dimensions.width;canvas.height=dimensions.height;
      const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas is unavailable');
      if(tool.kind==='gradient'){const gradient=ctx.createLinearGradient(...gradientEndpoints(dimensions.width,dimensions.height,angle));gradient.addColorStop(0,color);gradient.addColorStop(1,secondColor);ctx.fillStyle=gradient;}else ctx.fillStyle=color;
      ctx.fillRect(0,0,dimensions.width,dimensions.height);ctx.fillStyle=`rgba(0,0,0,${1-brightness/100})`;ctx.fillRect(0,0,dimensions.width,dimensions.height);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('Export failed');
      const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${tool.slug}-${dimensions.width}x${dimensions.height}.png`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
      setStatus(`Downloaded ${dimensions.width} × ${dimensions.height} PNG.`);
    }catch{setExportError('The image could not be generated. Try a smaller size or another browser.');}finally{setExporting(false);}
  }
  async function copyColor(){const success=await copyText(color);setCopied(success);if(!success)setStatus('Copy was unavailable. Select and copy the hex field instead.');setTimeout(()=>setCopied(false),1800);}
  function nextPixel(delta=1){setPixelIndex(v=>(v+delta+5)%5);}

  return <section className="tool-studio" aria-label={`${tool.name} interactive tool`}>
    {(isColor||home)&&<div className="color-tabs" aria-label="Choose a color screen">{tools.filter(t=>t.category==='colors'&&t.slug!=='gray-screen').map(t=><a href={`/${t.slug}/`} key={t.slug} className={tool.slug===t.slug?'selected':''} aria-current={tool.slug===t.slug?'page':undefined}><span className={'color-dot '+(t.slug==='custom-color-screen'?'custom-dot':'')} style={{background:t.color}}/>{t.name.replace(' screen','').replace('Custom color','Custom')}</a>)}</div>}
    <div className="studio-layout">
      <div className="preview-column">
        <div className="preview-wrap">
          <div ref={canvasRef} className={`screen-canvas kind-${tool.kind} ${darkCanvas?'canvas-dark':'canvas-light'} ${expanded?'is-expanded':''}`} style={{background:appliedColor}} role={expanded?'dialog':undefined} aria-modal={expanded?'true':undefined} aria-label={expanded?`${tool.name} expanded canvas`:undefined}>
            <div className="canvas-content" style={{filter:`brightness(${brightness}%)`}}>
              <CanvasArtwork kind={tool.kind} color={appliedColor} secondColor={secondColor} angle={angle} ringWidth={ringWidth} pattern={pattern} pixelIndex={pixelIndex} clock={clock} use24={use24} remaining={remaining} progress={progress} speed={speed} paused={paused} intensity={intensity}/>
            </div>
            {!expanded&&<>
              <div className="canvas-label"><span className="live-dot"/>{tool.kind==='pixels'?colorNames[pixelIndex]+' · Pixel check':animation?'LIVE PREVIEW':tool.kind==='crack'?'SIMULATION':'LIVE CANVAS'}</div>
              {['solid','light','gradient','pixels'].includes(tool.kind)&&<button className="preview-enter" onClick={toggle} aria-label={`Open ${tool.name} in full screen`}><Maximize size={35} strokeWidth={1.25}/><span>Click to go full screen</span><small>Less noise. More possibilities.</small></button>}
              {!['solid','light','gradient','pixels'].includes(tool.kind)&&<button className="preview-corner" onClick={toggle} aria-label="Expand canvas"><Maximize size={19}/></button>}
              <span className="canvas-code">{tool.kind==='pixels'?testColors[pixelIndex]:['solid','light'].includes(tool.kind)?color:tool.category==='extras'?'A VISUAL DEMO':'MADE FOR YOUR SCREEN'}</span>
            </>}
            {expanded&&<div className="expanded-toolbar"><span className="expanded-name">{tool.category==='extras'?'SIMULATION · ':''}{tool.name}</span><div>{tool.kind==='pixels'&&<><button onClick={()=>nextPixel(-1)} aria-label="Previous test color"><ChevronLeft size={18}/></button><button onClick={()=>nextPixel()} aria-label="Next test color">Next color <ChevronRight size={18}/></button></>}{animation&&<button onClick={()=>setPaused(v=>!v)}>{paused?<Play size={16}/>:<Pause size={16}/>} {paused?'Play':'Pause'}</button>}{tool.kind==='timer'&&<button onClick={toggleTimer}>{running?<Pause size={16}/>:<Play size={16}/>} {running?'Pause':'Start'}</button>}<button className="canvas-exit" onClick={close}><Minimize size={16}/> Exit <kbd>esc</kbd></button></div></div>}
          </div>
        </div>
        <div className="canvas-caption"><span><Monitor size={14}/>{tool.kind==='pixels'?'Arrow keys to change colors':canExport?'A clean canvas. Just your color.':'Your browser. Your screen.'}</span><span><kbd>F</kbd> Full screen <i/> <kbd>esc</kbd> Exit</span></div>
        {status&&<div className="tool-status" role="status">{status}</div>}
        {home&&<div className="preview-note"><ShieldCheck size={15}/><span>No signup. No camera access. Just open and use.</span><a href="/privacy-policy/">Your privacy <ArrowUpRight size={13}/></a></div>}
      </div>
      <aside className="settings-panel" aria-label="Screen settings">
        <div className="settings-heading"><div><span className="eyebrow">YOUR SCREEN, YOUR WAY</span><h2>Make it yours.</h2></div><Palette size={20}/></div>
        {['solid','light','ring','gradient'].includes(tool.kind)&&<div className="setting"><label htmlFor="canvas-color">{tool.kind==='gradient'?'First color':'Screen color'}</label><div className="color-field"><input type="color" id="canvas-color" value={color} onChange={e=>updateColor(e.target.value)} aria-label="Pick screen color"/><input className="hex-input" aria-label="Six-digit hex color" value={hex} maxLength={7} onChange={e=>{setHex(e.target.value);setHexError('');const valid=normalizeHex(e.target.value);if(valid)setColor(valid);}} onBlur={commitHex} onKeyDown={e=>{if(e.key==='Enter')commitHex();}}/><button onClick={copyColor} aria-label="Copy hex color">{copied?<Check size={17}/>:<Copy size={17}/>}</button></div>{hexError&&<p className="field-error" role="alert">{hexError}</p>}<span className="field-hint">RGB {rgbFromHex(color).join(', ')}</span></div>}
        {tool.kind==='gradient'&&<><div className="setting"><label htmlFor="second-color">Second color</label><div className="color-field"><input type="color" id="second-color" value={secondColor} onChange={e=>setSecondColor(e.target.value.toUpperCase())}/><span className="mono">{secondColor}</span></div></div><div className="setting"><label htmlFor="gradient-angle">Gradient angle <output>{angle}°</output></label><input type="range" id="gradient-angle" min="0" max="360" value={angle} onChange={e=>setAngle(Number(e.target.value))}/></div></>}
        {tool.kind==='light'&&<div className="tone-presets">{[['Neutral','#FFFFFF'],['Warm','#FFF4DF'],['Soft','#FFD7BA']].map(([name,value])=><button className={color===value?'active':''} key={value} onClick={()=>updateColor(value)}>{name}</button>)}</div>}
        {tool.kind==='ring'&&<div className="setting"><label htmlFor="ring-width">Ring width <output>{ringWidth}%</output></label><input id="ring-width" type="range" min="5" max="42" value={ringWidth} onChange={e=>setRingWidth(Number(e.target.value))}/></div>}
        <div className="setting brightness-setting"><label htmlFor="brightness">Visual brightness <output>{brightness}%</output></label><div className="range-row"><Sun size={15}/><input type="range" id="brightness" min="5" max="100" value={brightness} onChange={e=>setBrightness(Number(e.target.value))}/><Sun size={20}/></div><span className="field-hint">Dims the canvas, not your device settings.</span></div>
        {tool.kind==='pixels'&&<><div className="pixel-swatches">{testColors.map((c,i)=><button key={c} style={{background:c}} onClick={()=>setPixelIndex(i)} className={i===pixelIndex?'active':''} aria-label={`${colorNames[i]} test background`} aria-pressed={i===pixelIndex}/>)}</div><div className="button-row"><button className="button secondary compact" onClick={()=>nextPixel(-1)} aria-label="Previous test color"><ChevronLeft size={17}/></button><button className="button secondary compact" onClick={()=>nextPixel()}>Next color <ChevronRight size={17}/></button></div><label className="checkbox-label"><input type="checkbox" checked={autoCycle} onChange={e=>setAutoCycle(e.target.checked)}/>Auto-cycle every 3 seconds</label></>}
        {tool.kind==='monitor'&&<div className="setting"><label htmlFor="pattern">Test pattern</label><select id="pattern" value={pattern} onChange={e=>setPattern(e.target.value)}><option value="gradient">Grayscale gradient</option><option value="contrast">Contrast steps</option><option value="grid">Geometry grid</option></select></div>}
        {tool.kind==='clock'&&<label className="checkbox-label"><input type="checkbox" checked={use24} onChange={e=>setUse24(e.target.checked)}/>Use 24-hour time</label>}
        {tool.kind==='timer'&&<><div className="setting"><label htmlFor="session-minutes">Session length <output>minutes</output></label><input id="session-minutes" type="number" value={minutes} min="1" max="180" onChange={e=>chooseMinutes(e.target.value)}/><div className="minute-presets">{[5,15,25,50].map(m=><button key={m} className={m===minutes?'active':''} onClick={()=>chooseMinutes(m)}>{m}m</button>)}</div></div><div className="button-row"><button className="button secondary compact" onClick={toggleTimer}>{running?<Pause size={16}/>:<Play size={16}/>} {running?'Pause':'Start'}</button><button className="button secondary compact" onClick={()=>chooseMinutes(minutes)}><RotateCcw size={15}/>Reset</button></div>{remaining===0&&<p role="status">Session complete. Take a moment.</p>}</>}
        {animation&&<><div className="setting"><label htmlFor="animation-speed">Animation speed <output>{speed}%</output></label><input id="animation-speed" type="range" min="30" max="180" value={speed} onChange={e=>setSpeed(Number(e.target.value))}/></div><button className="button secondary compact animation-toggle" onClick={()=>setPaused(v=>!v)}>{paused?<Play size={16}/>:<Pause size={16}/>} {paused?'Play animation':'Pause animation'}</button></>}
        {tool.kind==='update'&&<div className="setting"><label htmlFor="update-progress">Progress <output>{Math.round(progress)}%</output></label><input id="update-progress" type="range" min="0" max="100" value={progress} onChange={e=>setProgress(Number(e.target.value))}/></div>}
        {tool.kind==='crack'&&<div className="setting"><label htmlFor="crack-intensity">Effect intensity <output>{intensity}%</output></label><input id="crack-intensity" type="range" min="10" max="100" value={intensity} onChange={e=>setIntensity(Number(e.target.value))}/></div>}
        {canExport&&<div className="export-settings"><div className="setting"><label htmlFor="download-size">Download size</label><select id="download-size" value={preset} onChange={e=>selectSize(e.target.value)}>{sizes.map(([label],i)=><option key={i} value={String(i)}>{label}</option>)}<option value="custom">Custom dimensions</option></select><div className="dimension-fields"><label><span className="sr-only">Image width in pixels</span><input type="number" value={width} min="1" max="4096" onChange={e=>{setWidth(e.target.value);setPreset('custom');setExportError('');}}/><span>W</span></label><span>×</span><label><span className="sr-only">Image height in pixels</span><input type="number" value={height} min="1" max="4096" onChange={e=>{setHeight(e.target.value);setPreset('custom');setExportError('');}}/><span>H</span></label></div></div><button className="button secondary download-button" onClick={download} disabled={exporting}><Download size={17}/>{exporting?'Creating PNG…':'Download PNG'}<span>↓</span></button>{exportError&&<p className="field-error" role="alert">{exportError}</p>}</div>}
        <button className="button primary fullscreen-button" ref={expandButtonRef} onClick={toggle}><Maximize size={18}/>{expanded?'Exit full screen':'Go full screen'}<kbd>F</kbd></button>
        <label className="checkbox-label awake-control"><input type="checkbox" checked={awake} onChange={e=>setAwake(e.target.checked)}/>Keep screen awake <span title="Wake lock status" role="status">{wakeStatus}</span></label>
      </aside>
    </div>
  </section>;
}
