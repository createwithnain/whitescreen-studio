import React from 'react';
import {hydrateRoot,createRoot} from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
const root=document.getElementById('root');
const app=<App path={window.location.pathname}/>;
if(root.querySelector('main'))hydrateRoot(root,app);else createRoot(root).render(app);
