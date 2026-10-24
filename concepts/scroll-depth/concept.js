/* G-Spot Lab scroll concept — desktop demonstration only. */
(function(){
  const panels=[...document.querySelectorAll('.scene-panel')];
  const shell=document.querySelector('.experience-shell');
  const buttons=[...document.querySelectorAll('[data-scroll-mode]')];
  const status=document.getElementById('lab-stage-status');
  const caption=document.getElementById('lab-mode-description');
  if(!shell||!panels.length)return;
  const desktop=matchMedia('(min-width:1101px)');
  const motion=matchMedia('(prefers-reduced-motion:no-preference)');
  const modes={depth:'Глубина — активный блок приближается, предыдущий темнеет',stack:'Стопка — следующая панель накрывает предыдущую',original:'Без эффекта — обычные отдельные секции'};
  let mode='depth',scheduled=false;
  const clamp=(v)=>Math.max(0,Math.min(1,v));
  panels.forEach((p,i)=>p.style.setProperty('--scene-layer',String(i+1)));
  function render(){
    scheduled=false;
    const enabled=desktop.matches&&motion.matches&&mode!=='original';
    const vh=innerHeight;
    const top=shell.getBoundingClientRect().top;
    let selected=0,closest=Infinity;
    panels.forEach((p,i)=>{
      let scale=1,dark=0,shift=0,tilt=0;
      const pos=top+p.offsetTop;
      if(enabled&&mode==='depth'){
        const relative=(pos+p.offsetHeight/2-vh*.49)/(vh*.96);
        const proximity=clamp(1-Math.abs(relative));
        const smooth=proximity*proximity*(3-2*proximity);
        scale=.905+.095*smooth;
        dark=.46*(1-smooth);
        shift=(relative<0?-1:1)*18*(1-smooth);
        tilt=(relative<0?1:-1)*2.3*(1-smooth);
        const dist=Math.abs(pos+p.offsetHeight/2-vh*.49);
        if(dist<closest){closest=dist;selected=i;}
      }else if(enabled&&mode==='stack'){
        const next=panels[i+1];
        const nextTop=next?top+next.offsetTop:Infinity;
        const t=next?clamp((vh*.95-nextTop)/(vh*.95-82)):0;
        scale=1-t*.085;
        dark=t*.54;
        if(pos<Math.min(460,vh*.57))selected=i;
      }
      p.style.setProperty('--scene-scale',scale.toFixed(4));
      p.style.setProperty('--scene-darkness',dark.toFixed(3));
      p.style.setProperty('--scene-shift',shift.toFixed(1)+'px');
      p.style.setProperty('--scene-tilt',tilt.toFixed(2)+'deg');
      p.classList.toggle('is-near',enabled);
    });
    panels.forEach((p,i)=>p.classList.toggle('is-current',enabled&&i===selected));
    if(status)status.textContent=enabled?(String(selected+1).padStart(2,'0')+' / '+String(panels.length).padStart(2,'0')+' · '+panels[selected].dataset.sceneLabel):'STATIC · NO ANIMATION';
  }
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(render);}}
  function measure(){
    panels.forEach(p=>p.classList.toggle('is-oversized',innerWidth>1100&&p.scrollHeight>innerHeight*1.14));
    schedule();
  }
  function choose(next){
    if(!modes[next])return;
    const changed=mode!==next;
    mode=next;
    document.body.classList.remove('mode-depth','mode-stack','mode-original');
    document.body.classList.add('mode-'+next);
    buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scrollMode===next)));
    if(caption)caption.textContent=modes[next];
    if(changed){
      const previous=document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior='auto';
      window.scrollTo(0,0);
      document.documentElement.style.scrollBehavior=previous;
    }
    measure();
  }
  buttons.forEach(b=>b.addEventListener('click',()=>choose(b.dataset.scrollMode)));
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',measure,{passive:true});
  choose('depth');
})();
