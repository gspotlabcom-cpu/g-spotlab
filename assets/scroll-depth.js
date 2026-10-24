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
    var focal=height*.48;
    var reach=Math.max(250,height*.66);
    var small=narrow.matches;
    // Read all geometries first, then apply styles to avoid interleaved layout.
    var boxes=stages.map(function(stage){return stage.getBoundingClientRect();});
    boxes.forEach(function(rect,i){
      var distance=0;
      if(rect.top>focal) distance=rect.top-focal;
      else if(rect.bottom<focal) distance=focal-rect.bottom;
      var away=Math.min(1,Math.max(0,distance/reach));
      // The currently viewed panel is full-size; passed and upcoming panels
      // gently recede. Mobile devices use less movement and dimming.
      stages[i].style.setProperty('--depth-scale',(1-away*(small?.018:.043)).toFixed(4));
      stages[i].style.setProperty('--depth-offset',Math.round(away*(small?6:16))+'px');
      stages[i].style.setProperty('--depth-dim',(away*(small?.11:.23)).toFixed(3));
      stages[i].classList.toggle('is-current',away<.06);
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
