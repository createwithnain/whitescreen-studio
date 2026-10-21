import React from 'react';
import {renderToString} from 'react-dom/server';
import App,{routes,getSeo} from './App.jsx';
import {site} from './config.js';
export {routes,getSeo,site};
export function render(path){return renderToString(<App path={path}/>);}
