/* G-Spot Lab deck experiment.
   Production homepage defaults to readable, non-sticky panels.
   Append ?deck=1 to opt into the desktop experiment. */
(function(){
  var shell=document.querySelector('.depth-shell');
  if(!shell)return;

  // Never make the public storefront depend on an unapproved experiment.
  var preview=new URLSearchParams(window.location.search).get('deck')==='1';
  if(!preview)return;

  var stages=Array.prototype.slice.call(shell.querySelectorAll('[data-depth-stage]'));
  if(!stages.length)return;

  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  var compact=window.matchMedia('(max-width: 900px), (max-height: 700px)');
  var anchors=stages.map(function(stage){
    // Unlike offsetTop on a sticky element, these non-sticky markers never
    // move with their panel and provide stable progress measurements.
    var anchor=document.createElement('span');
    anchor.className='deck-anchor';
    anchor.setAttribute('aria-hidden','true');
    stage.parentNode.insertBefore(anchor,stage);
    return anchor;
  });

  var enabled=false;
  var requested=false;

  function clamp(value){return Math.max(0,Math.min(1,value));}
  function ease(value){var x=clamp(value);return x*x*(3-2*x);}

  function clear(){
    shell.classList.remove('deck-enabled');
    stages.forEach(function(stage){
      stage.classList.remove('is-current');
      stage.style.removeProperty('--deck-scale');
      stage.style.removeProperty('--deck-shift');
      stage.style.removeProperty('--deck-dim');
      stage.style.removeProperty('--deck-blur');
      stage.style.zIndex='';
    });
  }

  function measure(){
    // All sections must fit the viewport: otherwise sticky panels would
    // trap controls and content. Fall back to ordinary scrolling instead.
    var height=window.innerHeight||800;
    var fits=stages.every(function(stage){return stage.offsetHeight<=height-68;});
    enabled=!reduced.matches&&!compact.matches&&fits;
    if(enabled)shell.classList.add('deck-enabled');
    else clear();
  }

  function render(){
    requested=false;
    if(!enabled)return;

    var h=window.innerHeight||800;
    var pin=parseFloat(getComputedStyle(shell).getPropertyValue('--deck-top'))||25;
    // Keep the handoff short enough that EVERY panel spends time fully
    // sharp between arriving and the following card beginning to depart.
    // The next panel starts surfacing at 84% of the viewport and finishes
    // at 59%. Previous versions used the entire viewport, so consecutive
    // transitions overlapped and intermediate cards never reached weight 1.
    var approach=h*.84;
    var finish=h*.59;
    var travel=Math.max(120,approach-finish);
    var tops=anchors.map(function(anchor){
      return anchor.getBoundingClientRect().top;
    });
    var progress=[];
    for(var i=1;i<stages.length;i++){
      progress.push(ease((approach-tops[i])/travel));
    }

    var visible=[];
    for(var j=0;j<stages.length;j++){
      var entered=j===0?1:progress[j-1];
      var leaving=j===stages.length-1?0:progress[j];
      visible.push(clamp(entered*(1-leaving)));
    }

    var remaining=Math.max(0,document.documentElement.scrollHeight-window.scrollY-h);
    if(remaining<=2)visible[stages.length-1]=1;

    var active=0;
    for(var k=1;k<visible.length;k++){
      if(visible[k]>visible[active])active=k;
    }

    stages.forEach(function(stage,index){
      var weight=visible[index];
      var shift=0;
      if(index>0 && tops[index]>pin){
        // Pre-position the upcoming card JUST behind the active screen,
        // instead of letting it wait a whole viewport down the page.
        // The pull begins while still offscreen and smoothly reaches the
        // focal plane; both pull and handoff use untransformed markers.
        var pull=ease((h*1.54-tops[index])/(h*.60));
        var entered=progress[index-1];
        var targetTop=pin+55*(1-entered);
        shift=(targetTop-tops[index])*pull;
      }
      stage.style.setProperty('--deck-scale',(0.72+weight*.28).toFixed(4));
      stage.style.setProperty('--deck-shift',shift.toFixed(1)+'px');
      stage.style.setProperty('--deck-dim',(.88*(1-weight)).toFixed(3));
      stage.style.setProperty('--deck-blur',(2*(1-weight)).toFixed(2)+'px');
      // Only one card receives foreground priority. Once its entry
      // transition finishes it remains at 100% sharp until the next starts.
      stage.style.zIndex=String(index===active?100:10+index);
      stage.classList.toggle('is-current',index===active);
    });
  }

  function queue(){
    if(requested)return;
    requested=true;
    requestAnimationFrame(render);
  }
  function refresh(){
    measure();
    queue();
  }

  window.addEventListener('scroll',queue,{passive:true});
  window.addEventListener('resize',refresh,{passive:true});
  window.addEventListener('load',refresh,{once:true});
  if(reduced.addEventListener)reduced.addEventListener('change',refresh);
  if(compact.addEventListener)compact.addEventListener('change',refresh);
  refresh();
})();
