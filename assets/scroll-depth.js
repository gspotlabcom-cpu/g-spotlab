/* G-Spot Lab / primary viewport deck on supported desktop screens.
   Fixed header and footer, centered active card, fixed upper/lower piles.
   Mouse wheel, keyboard, and touch move through reversible transitions.
   Reduced-motion and compact screens keep regular document scrolling.
   ?deck=0 is an optional regular-scroll fallback. */
(function(){
  var shell=document.querySelector('.depth-shell');
  if(!shell || new URLSearchParams(window.location.search).get('deck')==='0')return;

  var stages=Array.prototype.slice.call(shell.querySelectorAll('[data-depth-stage]'));
  if(stages.length<2)return;
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  var compact=window.matchMedia('(max-width: 900px), (max-height: 650px)');
  var viewport=null,enabled=false;
  var position=0,targetIndex=0,animationId=0;
  var wheelSum=0,wheelDirection=0,wheelLast=0,wheelGestureLocked=false;
  var settleUntil=0;
  var touchStart=null,initialized=false;

  function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
  function mix(a,b,t){return a+(b-a)*t;}
  function supported(){return !reduced.matches && !compact.matches;}
  function dialogOpen(){return !!document.querySelector('dialog[open]');}

  function restore(){
    cancelAnimationFrame(animationId);
    animationId=0;
    if(viewport){
      stages.forEach(function(stage){shell.insertBefore(stage,viewport);});
      viewport.remove();
      viewport=null;
    }
    enabled=false;
    document.documentElement.classList.remove('deck-mode');
    shell.classList.remove('deck-enabled');
    stages.forEach(function(stage){
      stage.style.removeProperty('--deck-y');
      stage.style.removeProperty('--deck-scale');
      stage.style.removeProperty('--deck-dim');
      stage.style.removeProperty('--deck-blur');
      stage.style.removeProperty('--deck-opacity');
      stage.style.removeProperty('--deck-glass-opacity');
      stage.style.removeProperty('--deck-saturation');
      stage.style.removeProperty('--deck-brightness');
      stage.style.zIndex='';
      stage.classList.remove('is-current');
      stage.inert=false;
    });
  }

  function activate(){
    if(!supported()){if(enabled)restore();return;}
    if(enabled)return;
    viewport=document.createElement('div');
    viewport.className='deck-viewport';
    shell.insertBefore(viewport,stages[0]);
    stages.forEach(function(stage){viewport.appendChild(stage);});
    shell.classList.add('deck-enabled');
    document.documentElement.classList.add('deck-mode');
    enabled=true;
    // In this mode scroll gestures are navigation, not document motion.
    window.scrollTo(0,0);
    render();
  }

  function pose(stage,y,scale,dim,blur,opacity,z,focused){
    stage.style.setProperty('--deck-y',y.toFixed(1)+'px');
    stage.style.setProperty('--deck-scale',scale.toFixed(4));
    stage.style.setProperty('--deck-dim',dim.toFixed(3));
    stage.style.setProperty('--deck-blur',blur.toFixed(2)+'px');
    stage.style.setProperty('--deck-opacity',opacity.toFixed(3));
    // The central screen builds a stronger glass tint continuously as it
    // moves into focus. Pile cards keep their existing translucent glass.
    var focus=clamp((opacity-.38)/.62,0,1);
    stage.style.setProperty('--deck-glass-opacity',(.65+.30*focus).toFixed(3));
    var depth=clamp((1-opacity)/.88,0,1);
    stage.style.setProperty('--deck-saturation',(1-.64*depth).toFixed(3));
    stage.style.setProperty('--deck-brightness',(1-.15*depth).toFixed(3));
    stage.style.zIndex=String(z);
    stage.classList.toggle('is-current',focused);
    stage.inert=!focused;
  }

  function render(){
    if(!enabled)return;
    var h=viewport.clientHeight || window.innerHeight || 800;
    // The two piles stay IN the viewport; only their outer halves can clip.
    var peak=Math.min(245,Math.max(150,h*.34));
    var upper=-peak,lower=peak;
    var base=Math.min(stages.length-2,Math.floor(position));
    var t=clamp(position-base,0,1);

    // One uninterrupted, linear trajectory for each moving panel.
    // The previous panel leaves for the upper pile, and the next one
    // approaches from below. Neither passes through the center of the other.
    var retiring=clamp(t/.52,0,1);
    var arriving=clamp((t-.18)/.82,0,1);
    var front=t<.56?base:base+1;

    stages.forEach(function(stage,i){
      var distance,y,scale,dim,blur,opacity,z;
      if(i<base){
        distance=base-i;
        y=upper-Math.min(3,distance-1)*7;
        scale=Math.max(.64,.73-Math.min(3,distance-1)*.024);
        // Earlier cards become increasingly translucent and softly defocused
        // the farther they sit back in the upper pile.
        opacity=Math.max(.12,.38-Math.min(3,distance-1)*.11);
        dim=Math.min(.16,.07+Math.min(3,distance-1)*.025);
        blur=7+Math.min(3,distance-1)*2.5;
        z=20+i;
      }else if(i>base+1){
        distance=i-(base+1);
        y=lower+Math.min(3,distance-1)*7;
        scale=Math.max(.64,.73-Math.min(3,distance-1)*.024);
        // Upcoming layers use the same depth curve as the upper pile.
        opacity=Math.max(.12,.38-Math.min(3,distance-1)*.11);
        dim=Math.min(.16,.07+Math.min(3,distance-1)*.025);
        blur=7+Math.min(3,distance-1)*2.5;
        z=20+stages.length-i;
      }else if(i===base){
        y=mix(0,upper,retiring);
        scale=mix(1,.73,retiring);
        dim=mix(0,.07,retiring);
        blur=mix(0,7,retiring);
        opacity=mix(1,.38,retiring);
        z=t<.56?100:30+i;
      }else{
        // No separate 'prepare' and 'activate' movements. Its position,
        // clarity and size all move continuously along the same path.
        y=mix(lower,0,arriving);
        scale=mix(.73,1,arriving);
        dim=mix(.07,0,arriving);
        blur=mix(7,0,arriving);
        opacity=mix(.38,1,arriving);
        z=t<.56?55:100;
      }
      pose(stage,y,scale,dim,blur,opacity,z,i===front);
    });
  }

  function navigateTo(index){
    if(!enabled || dialogOpen())return;
    var to=clamp(index,0,stages.length-1);
    if(Math.abs(to-position)<.0001)return;
    cancelAnimationFrame(animationId);
    targetIndex=to;
    var from=position;
    var started=performance.now();
    // Linear clock speed, without accelerating/decelerating at the front
    // layer change. A separate dwell interval prevents rapid wheel skips.
    var duration=650*Math.max(.75,Math.min(1.7,Math.abs(to-from)));
    function frame(now){
      var t=clamp((now-started)/duration,0,1);
      position=mix(from,to,t);
      render();
      if(t<1)animationId=requestAnimationFrame(frame);
      else{
        position=to;animationId=0;render();
        settleUntil=performance.now()+150;
      }
    }
    animationId=requestAnimationFrame(frame);
  }

  function navigateBy(direction){
    if(animationId || performance.now()<settleUntil)return;
    var next=clamp(targetIndex+direction,0,stages.length-1);
    if(next!==targetIndex)navigateTo(next);
  }

  function currentStage(){
    var index=Math.min(stages.length-1,Math.max(0,Math.round(position)));
    return stages[index];
  }

  function hasInnerScroll(stage,delta){
    if(!stage || stage.scrollHeight<=stage.clientHeight+3)return false;
    if(delta>0)return stage.scrollTop<stage.scrollHeight-stage.clientHeight-3;
    if(delta<0)return stage.scrollTop>3;
    return false;
  }

  function onWheel(event){
    if(!enabled || dialogOpen() || event.ctrlKey)return;
    var delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?window.innerHeight:1);
    if(!delta)return;
    var stage=currentStage();
    // Tall panels can be read internally before changing cards. The page
    // itself never scrolls, and all product controls remain reachable.
    if(stage && hasInnerScroll(stage,delta) && !animationId &&
       (event.target===stage || stage.contains(event.target)))return;
    event.preventDefault();
    var now=performance.now();
    var direction=Math.sign(delta);
    if(now-wheelLast>420){
      wheelSum=0;wheelGestureLocked=false;
    }
    if(direction!==wheelDirection)wheelSum=0;
    wheelLast=now;wheelDirection=direction;
    // Ignore wheel inertia through the motion and centered-card dwell.
    if(animationId || now<settleUntil){
      wheelGestureLocked=true;
      return;
    }
    if(wheelGestureLocked)return;
    wheelSum+=delta;
    if(Math.abs(wheelSum)>=45){
      wheelGestureLocked=true;wheelSum=0;
      navigateBy(direction);
    }
  }

  function onKey(event){
    if(!enabled || dialogOpen() || event.defaultPrevented ||
       event.ctrlKey || event.metaKey || event.altKey)return;
    var target=event.target;
    if(target && target.closest && target.closest('input, textarea, select, [contenteditable="true"]'))return;
    var key=event.key;
    if(key==='Home'){event.preventDefault();navigateTo(0);return;}
    if(key==='End'){event.preventDefault();navigateTo(stages.length-1);return;}
    var direction=(key==='ArrowDown'||key==='PageDown'||key===' ') ? 1 :
                  (key==='ArrowUp'||key==='PageUp') ? -1 : 0;
    if(!direction)return;
    if(key===' ' && target && target.closest &&
       target.closest('button,a,[role="button"]'))return;
    event.preventDefault();
    navigateBy(direction);
  }

  function onTouchStart(event){
    if(!enabled || dialogOpen() || event.touches.length!==1)return;
    touchStart={y:event.touches[0].clientY,origin:event.target};
  }
  function onTouchEnd(event){
    if(!enabled || dialogOpen() || !touchStart || !event.changedTouches.length)return;
    var delta=touchStart.y-event.changedTouches[0].clientY;
    if(Math.abs(delta)>55){
      var stage=currentStage();
      if(!(stage && hasInnerScroll(stage,delta) && stage.contains(touchStart.origin)))
        navigateBy(Math.sign(delta));
    }
    touchStart=null;
  }

  function stageForHash(hash){
    if(!hash)return -1;
    var id;
    try{id=decodeURIComponent(hash.slice(1));}catch(e){return -1;}
    if(id==='top')return 0;
    var target=document.getElementById(id);
    if(!target)return -1;
    return stages.findIndex(function(stage){return stage===target||stage.contains(target);});
  }

  function refresh(){
    activate();
    if(!enabled)return;
    if(!initialized){
      initialized=true;
      var initial=stageForHash(window.location.hash);
      if(initial>=0){position=initial;targetIndex=initial;}
    }
    render();
  }

  document.addEventListener('click',function(event){
    if(!enabled || event.defaultPrevented || event.button!==0 ||
      event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    var anchor=event.target.closest('a[href]');
    if(!anchor || anchor.origin!==window.location.origin ||
       anchor.pathname!==window.location.pathname || !anchor.hash)return;
    var i=stageForHash(anchor.hash);
    if(i<0)return;
    event.preventDefault();
    history.replaceState(null,'',window.location.pathname+window.location.search+anchor.hash);
    navigateTo(i);
  });

  window.addEventListener('wheel',onWheel,{passive:false});
  document.addEventListener('keydown',onKey);
  document.addEventListener('touchstart',onTouchStart,{passive:true});
  document.addEventListener('touchend',onTouchEnd,{passive:true});
  window.addEventListener('resize',refresh,{passive:true});
  window.addEventListener('load',refresh,{once:true});
  window.addEventListener('hashchange',function(){
    var i=stageForHash(window.location.hash);
    if(i>=0 && enabled)navigateTo(i);
  });
  if(reduced.addEventListener)reduced.addEventListener('change',refresh);
  if(compact.addEventListener)compact.addEventListener('change',refresh);
  refresh();
})();
