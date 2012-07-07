// Moves the top/left coordinate of the viewBox to x,y (0,0 by default) and
// updates the first coordinate of all <path> elements to keep things the same.
// NOTE: This doesn't handle transforms right or accommodate any other elements!
function moveViewBox(x, y) {
  var d = document
    , s = d.documentElement
    , v = s.viewBox.baseVal
    , p = [].slice.call(d.querySelectorAll('path'))
    ;
  x = x || 0;
  y = y || 0;
  // given all-relative paths (as from a Scour run, say):
  function m(p) {
    p = p.pathSegList.getItem(0);
    p.x -= v.x - x;
    p.y -= v.y - y;
  }
  p.map(m);
  v.x = x;
  v.y = y;
  return (new XMLSerializer).serializeToString(s);
}
