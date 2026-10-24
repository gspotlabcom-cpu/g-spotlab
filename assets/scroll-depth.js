/* G-Spot Lab / two-pile deck, experimental ?deck=1 only.
   A fixed central card, a stationary upper pile, and a stationary lower
   pile. One-at-a-time, non-crossing handoffs are driven by native scrolling.
   Reverse scrolling walks through the exact same states in reverse order. */
(function(){
  var shell=document.querySelector('.depth-shell');
  if(!shell)return;
  if(new URLSearchParams(window.location.search).get('deck')!=='1')return;

  var stages=Array.prototype.slice.call(shell.querySelectorAll('[data-depth-stage]'));
  if(stages.length<2)return;
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  var compact=window.matchMedia('(max-width: 900px), (max-height: 700px)');
  var track=null,viewport=null,step=0,framePending=false;
  var didInitialHash=false;

  function clamp(n){return Math.max(0,Math.min(1,n));}
  function smooth(n){var t=clamp(n);return t*t*(3-2*t);}
  function mix(a,b,t){return a+(b-a)*t;}

  function restore(){
    if(track){
      // Return original nodes to normal flow, preserving content and links.
      stages.forEach(function(stage){shell.insertBefore(stage,track);});
      track.remove();
      track=null;viewport=null;
    }
    shell.classList.remove('deck-enabled');
    stages.forEach(function(stage){
      stage.classList.remove('is-current');
      stage.style.removeProperty('--deck-y');
      stage.style.removeProperty('--deck-scale');
      stage.style.removeProperty('--deck-dim');
      stage.style.removeProperty('--deck-blur');
      stage.style.zIndex='';
      stage.inert=false;
    });
  }

  function supported(){
    if(reduced.matches||compact.matches)return false;
    var height=window.innerHeight||800;
    // Never crop a tall section to make it fit a card transition.
    return stages.every(function(stage){return stage.offsetHeight<=height-65;});
  }

  function configure(){
    if(!supported()){
      if(track)restore();
      return;
    }
    if(!track){
      track=document.createElement('div');
      track.className='deck-track';
      viewport=document.createElement('div');
      viewport.className='deck-viewport';
      track.appendChild(viewport);
      shell.insertBefore(track,stages[0]);
      stages.forEach(function(stage){viewport.appendChild(stage);});
      shell.classList.add('deck-enabled');
    }
    var height=window.innerHeight||800;
    step=Math.max(440,Math.round(height*.90));
    // A little holding distance at the end gives Support a full-size
    // centered resting state before the footer comes into view.
    track.style.height=Math.round(height+step*(stages.length-1)+height*.42)+'px';
  }

  function pose(stage,y,scale,dim,blur,z,current){
    stage.style.setProperty('--deck-y',y.toFixed(1)+'px');
    stage.style.setProperty('--deck-scale',scale.toFixed(4));
    stage.style.setProperty('--deck-dim',dim.toFixed(3));
    stage.style.setProperty('--deck-blur',blur.toFixed(2)+'px');
    stage.style.zIndex=String(z);
    stage.classList.toggle('is-current',current);
    stage.inert=!current;
  }

  function paint(){
    framePending=false;
    if(!track)return;
    var height=window.innerHeight||800;
    var origin=window.scrollY+track.getBoundingClientRect().top;
    var position=clamp((window.scrollY-origin)/step/(stages.length-1))*(stages.length-1);
    var base=Math.min(stages.length-2,Math.floor(position));
    var t=clamp(position-base);
    var peak=Math.min(255,height*.235);
    var upper=-peak,lower=peak;

    // Three NON-CROSSING phases per card:
    // 0–40%: next card grows in the lower pile; center stays perfectly sharp.
    // 40–68%: center retreats into upper pile; next waits below.
    // 68–100%: next rises from lower pile into the empty center.
    var grow=smooth(t/.40);
    var depart=smooth((t-.40)/.28);
    var arrive=smooth((t-.68)/.32);
    var front=t<.68?base:base+1;

    stages.forEach(function(stage,index){
      var distance,y,scale,dim,blur,z;
      if(index<base){
        distance=base-index;
        y=upper-Math.min(3,distance-1)*8;
        scale=Math.max(.62,.72-Math.min(3,distance-1)*.025);
        dim=Math.min(.94,.87+Math.min(3,distance-1)*.02);
        blur=2.3+Math.min(3,distance-1)*.3;
        z=22+index;
      }else if(index>base+1){
        distance=index-(base+1);
        y=lower+Math.min(3,distance-1)*8;
        scale=Math.max(.62,.72-Math.min(3,distance-1)*.025);
        dim=Math.min(.94,.87+Math.min(3,distance-1)*.02);
        blur=2.3+Math.min(3,distance-1)*.3;
        z=22+(stages.length-index);
      }else if(index===base){
        // Outgoing stays in front until it is safely in the top pile.
        y=mix(0,upper,depart);
        scale=mix(1,.72,depart);
        dim=mix(0,.87,depart);
        blur=mix(0,2.3,depart);
        z=t<.68?100:30+index;
      }else{
        // Incoming is prepared below before the previous card withdraws.
        var readyY=mix(lower,lower*.58,grow);
        var readyScale=mix(.72,.84,grow);
        var readyDim=mix(.87,.48,grow);
        var readyBlur=mix(2.3,1.25,grow);
        y=mix(readyY,0,arrive);
        scale=mix(readyScale,1,arrive);
        dim=mix(readyDim,0,arrive);
        blur=mix(readyBlur,0,arrive);
        z=t<.68?55:100;
      }
      pose(stage,y,scale,dim,blur,z,index===front);
    });
  }

  function requestPaint(){
    if(framePending)return;
    framePending=true;
    window.requestAnimationFrame(paint);
  }
  function goTo(index,behavior){
    if(!track)return;
    var top=window.scrollY+track.getBoundingClientRect().top+index*step;
    window.scrollTo({top:top,behavior:behavior||'smooth'});
  }
  function refresh(){
    configure();
    requestPaint();
    if(track&&!didInitialHash){
      didInitialHash=true;
      var hash=window.location.hash;
      if(hash){
        var target=document.getElementById(decodeURIComponent(hash.slice(1)));
        var index=stages.findIndex(function(stage){return stage.contains(target);});
        if(index>=0)window.requestAnimationFrame(function(){goTo(index,'auto');});
      }
    }
  }

  // Site navigation still works in deck mode (including the hero buttons).
  document.addEventListener('click',function(event){
    if(!track || event.defaultPrevented ||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    var link=event.target.closest('a[href]');
    if(!link || link.origin!==window.location.origin ||
       link.pathname!==window.location.pathname || !link.hash)return;
    if(link.hash==='#top'){
      event.preventDefault();
      window.scrollTo({top:0,behavior:'smooth'});
      return;
    }
    var target=document.getElementById(decodeURIComponent(link.hash.slice(1)));
    if(!target)return;
    var index=stages.findIndex(function(stage){return stage.contains(target);});
    if(index<0)return;
    event.preventDefault();
    history.replaceState(null,'',link.hash?window.location.pathname+window.location.search+link.hash:window.location.href);
    goTo(index,'smooth');
  });

  window.addEventListener('scroll',requestPaint,{passive:true});
  window.addEventListener('resize',refresh,{passive:true});
  window.addEventListener('load',refresh,{once:true});
  if(reduced.addEventListener)reduced.addEventListener('change',refresh);
  if(compact.addEventListener)compact.addEventListener('change',refresh);
  refresh();
})();
