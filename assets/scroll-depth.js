/* Progressive scroll-depth effect for homepage panels only.
   No sticky sections or scroll trapping: long product grids remain accessible. */
(function(){
  var shell=document.querySelector('.depth-shell');
  if(!shell)return;
  var stages=Array.prototype.slice.call(shell.querySelectorAll('[data-depth-stage]'));
  if(!stages.length)return;

  var motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  var narrow=window.matchMedia('(max-width: 760px)');
  var frameRequested=false;

  function render(){
    frameRequested=false;
    if(motion.matches){
      stages.forEach(function(stage){
        stage.style.removeProperty('--depth-scale');
        stage.style.removeProperty('--depth-offset');
        stage.style.removeProperty('--depth-dim');
        stage.classList.remove('is-current');
      });
      return;
    }
    var height=window.innerHeight||800;
    var focal=height*.50;
    // Depth now changes over a shorter scroll distance, so the handoff
    // between panels is noticeable instead of reading as a static page.
    var reach=Math.max(260,height*.48);
    var small=narrow.matches;
    // Read all geometries first, then apply styles to avoid interleaved layout.
    var boxes=stages.map(function(stage){return stage.getBoundingClientRect();});
    boxes.forEach(function(rect,i){
      var distance=0;
      if(rect.top>focal) distance=rect.top-focal;
      else if(rect.bottom<focal) distance=focal-rect.bottom;
      // Ease into the depth effect earlier, while keeping the active panel
      // crisp and full-size when the viewport focus is inside it.
      var away=Math.sqrt(Math.min(1,Math.max(0,distance/reach)));
      var direction=rect.bottom<focal?-1:1;
      stages[i].style.setProperty('--depth-scale',(1-away*(small?.055:.15)).toFixed(4));
      stages[i].style.setProperty('--depth-offset',Math.round(direction*away*(small?12:38))+'px');
      stages[i].style.setProperty('--depth-dim',(away*(small?.23:.54)).toFixed(3));
      stages[i].classList.toggle('is-current',away<.12);
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
