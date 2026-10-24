/* Overlapping scroll-stage depth effect.
   Panels remain in normal document flow: no sticky scroll lock, no focus traps.
   Uses untransformed layout positions to avoid feedback/jitter while scaling. */
(function(){
  var shell=document.querySelector('.depth-shell');
  if(!shell)return;
  var stages=Array.prototype.slice.call(shell.querySelectorAll('[data-depth-stage]'));
  if(!stages.length)return;

  // Incoming panels cover the edge of earlier panels, like stacked sheets.
  stages.forEach(function(stage,index){stage.style.zIndex=String(index+1);});

  var motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  var narrow=window.matchMedia('(max-width: 760px)');
  var frameRequested=false;

  function naturalTop(element){
    var top=0;
    for(var node=element;node;node=node.offsetParent)top+=node.offsetTop;
    return top;
  }

  function render(){
    frameRequested=false;
    if(motion.matches){
      stages.forEach(function(stage,index){
        stage.style.zIndex=String(index+1);
        stage.style.removeProperty('--depth-scale');
        stage.style.removeProperty('--depth-offset');
        stage.style.removeProperty('--depth-dim');
        stage.classList.remove('is-current');
      });
      return;
    }

    var height=window.innerHeight||800;
    var scrollY=window.scrollY||window.pageYOffset||0;
    var remaining=Math.max(0,document.documentElement.scrollHeight-scrollY-height);
    // The focal point moves toward the lower viewport as the page ends.
    // Thus Support becomes fully active even when there is no more scroll.
    var nearingEnd=1-Math.min(1,remaining/(height*.65));
    var focal=height*(.50+.29*nearingEnd);
    var reach=Math.max(260,height*.48);
    var small=narrow.matches;
    var positions=stages.map(function(stage){
      var top=naturalTop(stage)-scrollY;
      return {top:top,bottom:top+stage.offsetHeight};
    });
    var active=0;
    positions.forEach(function(pos,i){
      if(pos.top<=focal && pos.bottom>=focal)active=i;
      else if(pos.bottom<focal && active<i)active=i;
    });
    if(remaining<=2)active=stages.length-1;

    positions.forEach(function(pos,i){
      var distance=0;
      if(pos.top>focal)distance=pos.top-focal;
      else if(pos.bottom<focal)distance=focal-pos.bottom;
      var away=Math.sqrt(Math.min(1,Math.max(0,distance/reach)));
      // Explicit endpoint correction, without injecting empty footer space.
      if(i===stages.length-1 && remaining<=2)away=0;
      // Moving away pulls previous panels toward the next, not apart.
      var direction=pos.bottom<focal?1:-1;
      stages[i].style.setProperty('--depth-scale',(1-away*(small?.055:.30)).toFixed(4));
      stages[i].style.setProperty('--depth-offset',Math.round(direction*away*(small?12:38))+'px');
      stages[i].style.setProperty('--depth-dim',(away*(small?.23:.75)).toFixed(3));
      // The focused panel must always paint above both neighboring panels.
      // Non-focused panels retain document-order layering behind it.
      stages[i].style.zIndex=String(i===active?stages.length+10:i+1);
      stages[i].classList.toggle('is-current',i===active);
    });
  }

  function requestRender(){
    if(frameRequested)return;
    frameRequested=true;
    window.requestAnimationFrame(render);
  }
  window.addEventListener('scroll',requestRender,{passive:true});
  window.addEventListener('resize',requestRender,{passive:true});
  if(typeof motion.addEventListener==='function')motion.addEventListener('change',requestRender);
  if(typeof narrow.addEventListener==='function')narrow.addEventListener('change',requestRender);
  requestRender();
})();
