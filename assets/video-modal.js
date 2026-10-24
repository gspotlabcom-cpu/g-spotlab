/* Instantiate the privacy-friendly YouTube player only after a preview click.
   Native links are left intact as a fallback when <dialog> is unsupported. */
(function(){
  if(!document.querySelector('a[data-video-id]')) return;
  var dialog=document.createElement('dialog');
  dialog.className='gsl-video-dialog';
  dialog.setAttribute('aria-label','Product demonstration video');
  dialog.innerHTML='<div class="gsl-video-shell"><button type="button" class="gsl-video-close" aria-label="Close video">×</button><div class="gsl-video-frame"></div><div class="gsl-video-bar"><p class="gsl-video-name"></p><a class="gsl-video-external" target="_blank" rel="noopener noreferrer" href="https://www.youtube.com/">Watch on YouTube ↗</a></div></div>';
  document.body.appendChild(dialog);
  var frame=dialog.querySelector('.gsl-video-frame');
  var title=dialog.querySelector('.gsl-video-name');
  var external=dialog.querySelector('.gsl-video-external');
  var lastTrigger=null;
  function close(){if(dialog.open)dialog.close();}
  dialog.querySelector('.gsl-video-close').addEventListener('click',close);
  dialog.addEventListener('click',function(event){if(event.target===dialog)close();});
  dialog.addEventListener('close',function(){
    frame.replaceChildren();
    if(lastTrigger && lastTrigger.isConnected)lastTrigger.focus({preventScroll:true});
  });
  document.addEventListener('click',function(event){
    var trigger=event.target.closest('a[data-video-id]');
    if(!trigger || event.defaultPrevented || event.button!==0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)return;
    if(typeof dialog.showModal!=='function')return;
    var id=trigger.getAttribute('data-video-id');
    if(!/^[A-Za-z0-9_-]{11}$/.test(id))return;
    event.preventDefault();
    lastTrigger=trigger;
    title.textContent=trigger.getAttribute('data-video-title')||'G-Spot Lab demonstration';
    external.href='https://www.youtube.com/watch?v='+id;
    var iframe=document.createElement('iframe');
    iframe.title=title.textContent;
    iframe.src='https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&rel=0';
    iframe.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.referrerPolicy='strict-origin-when-cross-origin';
    iframe.allowFullscreen=true;
    frame.replaceChildren(iframe);
    dialog.showModal();
  });
})();
