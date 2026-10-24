/* G-Spot Lab / Deck scroll prototype (v7).
   Every desktop panel shares a sticky focal plane. While the next panel
   approaches from below, the current card recedes into the deck and the
   next becomes the foreground. Mobile/short viewports use normal scrolling. */
(function(){
  var shell=document.querySelector('.depth-shell');
  if(!shell)return;
  var stages=Array.prototype.slice.call(shell.querySelectorAll('[data-depth-stage]'));
  if(!stages.length)return;

  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  var compact=window.matchMedia('(max-width: 900px), (max-height: 700px)');
  var requested=false;
  var enabled=false;
  var positions=[];

  function clamp(value){return Math.max(0,Math.min(1,value));}
  function smooth(value){
    var t=clamp(value);
    return t*t*(3-2*t);
  }
  // offsetTop does not change when sticky or visual transforms activate.
  function naturalTop(element){
    var top=0;
    for(var node=element;node;node=node.offsetParent)top+=node.offsetTop;
    return top;
  }
  function reset(){
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
    var h=window.innerHeight||800;
    var fits=stages.every(function(stage){return stage.offsetHeight<=h-45;});
    enabled=!reduced.matches&&!compact.matches&&fits;
    shell.classList.toggle('deck-enabled',enabled);
    if(!enabled){reset();return;}
    positions=stages.map(naturalTop);
  }
  function render(){
    requested=false;
    if(!enabled)return;
    var h=window.innerHeight||800;
    var y=window.scrollY||window.pageYOffset||0;
    var pin=parseFloat(getComputedStyle(shell).getPropertyValue('--deck-top'))||25;
    // Each handoff takes place while the incoming card travels from the
    // lower viewport to the same sticky plane as the current card.
    var distance=Math.max(200,h*.84-pin);
    var progress=[];
    for(var k=0;k<stages.length-1;k++){
      var incomingTop=positions[k+1]-y;
      progress.push(smooth((h*.84-incomingTop)/distance));
    }
    var prominence=[];
    for(var i=0;i<stages.length;i++){
      var entered=i===0?1:progress[i-1];
      var leaving=i===stages.length-1?0:progress[i];
      prominence.push(clamp(entered*(1-leaving)));
    }
    // Let the final stage take foreground at the bottom of the document.
    var remaining=Math.max(0,document.documentElement.scrollHeight-y-h);
    if(remaining<5)prominence[stages.length-1]=1;

    var active=0,most=-1;
    for(var n=0;n<prominence.length;n++){
      if(prominence[n]>=most){most=prominence[n];active=n;}
    }
    stages.forEach(function(stage,index){
      var show=prominence[index];
      var before=index===0?0:1-progress[index-1];
      var after=index===stages.length-1?0:progress[index];
      var shift=before*26-after*30;
      stage.style.setProperty('--deck-scale',(0.70+0.30*show).toFixed(4));
      stage.style.setProperty('--deck-shift',shift.toFixed(1)+'px');
      stage.style.setProperty('--deck-dim',(.92*(1-show)).toFixed(3));
      stage.style.setProperty('--deck-blur',(2.4*(1-show)).toFixed(2)+'px');
      stage.style.zIndex=String(index===active?100:10+index);
      stage.classList.toggle('is-current',index===active);
    });
  }
  function requestRender(){
    if(requested)return;
    requested=true;
    requestAnimationFrame(render);
  }
  function update(){
    measure();
    requestRender();
  }
  window.addEventListener('scroll',requestRender,{passive:true});
  window.addEventListener('resize',update,{passive:true});
  window.addEventListener('load',update,{once:true});
  if(reduced.addEventListener)reduced.addEventListener('change',update);
  if(compact.addEventListener)compact.addEventListener('change',update);
  update();
})();
