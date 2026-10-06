// Controle: uma animacao trivial roda neste ambiente?
var probe = document.createElement('div');
probe.id = 'probe';
probe.style.cssText = 'position:fixed;top:-99px;width:10px;height:10px;opacity:0;animation:probeFade 100ms linear forwards';
var st = document.createElement('style');
st.textContent = '@keyframes probeFade { to { opacity: 1 } }';
document.head.appendChild(st);
document.body.appendChild(probe);

setTimeout(function () {
  var L = [];
  L.push('CONTROLE: animacao trivial opacity=' + getComputedStyle(probe).opacity + ' (esperado 1)');
  L.push('  getAnimations suportado: ' + (typeof probe.getAnimations === 'function'));
  if (probe.getAnimations) {
    var a = probe.getAnimations()[0];
    L.push('  estado: ' + (a ? a.playState + ' currentTime=' + a.currentTime : 'nenhuma animacao'));
  }
  var stats = document.querySelector('.stats');
  var r0 = stats.children[0];
  if (r0.getAnimations) {
    var an = r0.getAnimations()[0];
    L.push('block-in: ' + (an ? an.playState + ' currentTime=' + an.currentTime : 'nenhuma'));
  }
  var fig = document.querySelector('.player-portrait');
  if (fig.getAnimations) {
    var af = fig.getAnimations()[0];
    L.push('lay: ' + (af ? af.playState + ' currentTime=' + af.currentTime : 'nenhuma'));
  }
  var p = document.createElement('pre');
  p.id = '__log';
  p.style.cssText = 'position:fixed;z-index:9999;top:0;left:0;background:#000;color:#0f0;font:11px monospace;padding:8px;white-space:pre-wrap';
  p.textContent = L.join('\n');
  document.body.appendChild(p);
}, 4200);
