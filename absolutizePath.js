// Turns all path commands into absolute coordinates, in-place. Origin: Phrogz,
// http://stackoverflow.com/questions/9677885/convert-svg-path-to-absolute-commands
function absolutizePath(path) {
  var segs = path.pathSegList
    , len  = segs.numberOfItems
    , M    = 'createSVGPathSegMovetoAbs'
    , L    = 'createSVGPathSegLinetoAbs'
    , H    = 'createSVGPathSegLinetoHorizontalAbs'
    , V    = 'createSVGPathSegLinetoVerticalAbs'
    , C    = 'createSVGPathSegCurvetoCubicAbs'
    , S    = 'createSVGPathSegCurvetoCubicSmoothAbs'
    , Q    = 'createSVGPathSegCurvetoQuadraticAbs'
    , T    = 'createSVGPathSegCurvetoQuadraticSmoothAbs'
    , A    = 'createSVGPathSegArcAbs'
    , seg, abs, x, y, i, c, x0, y0, x1, y1, x2, y2;
  for (x = y = i = 0; i < len; i++) {
    seg = segs.getItem(i);
    c   = seg.pathSegTypeAsLetter;
    abs = undefined;
    if (/[MLHVCSQTA]/.test(c)) {
      // already absolute; just update current coord
      if ('x' in seg) x = seg.x;
      if ('y' in seg) y = seg.y;
    }
    else {
      if ('x1' in seg) x1 = x + seg.x1;
      if ('x2' in seg) x2 = x + seg.x2;
      if ('y1' in seg) y1 = y + seg.y1;
      if ('y2' in seg) y2 = y + seg.y2;
      if ('x'  in seg) x += seg.x;
      if ('y'  in seg) y += seg.y;
      switch (c) {
        case 'm': abs = path[M](x, y); break;
        case 'l': abs = path[L](x, y); break;
        case 'h': abs = path[H](x); break;
        case 'v': abs = path[V](y); break;
        case 'c': abs = path[C](x, y, x1, y1, x2, y2); break;
        case 's': abs = path[S](x, y, x2, y2); break;
        case 'q': abs = path[Q](x, y, x1, y1); break;
        case 't': abs = path[T](x, y); break;
        case 'a': abs = path[A](x, y, seg.r1, seg.r2, seg.angle,
                                seg.largeArcFlag, seg.sweepFlag); break;
        case 'z':
        case 'Z': x = x0; y = y0; break;
      }
      if (abs) segs.replaceItem(abs, i);
    }
    // Record the start of a subpath
    if (c == 'M' || c == 'm') {
      x0 = x;
      y0 = y;
    }
  }
}
