// Turns all path commands into absolute coordinates (in-place). Origin: Phrogz,
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

// Calculates a new <path d> attribute relative to a given root (<svg>) element,
// folding in all the transforms into the path data itself so it can move there,
// and get rid of its transform attribute.
// NOTE: This doesn't yet work for the elliptical arc commands, as those require
//       translation to béziers first, in the generic case; non-uniform scaling
//       of an arc command can not always be represented by a mere arc command.
// TODO: Translate arc commands to their bézier approximations first -- see:
// http://stackoverflow.com/questions/734076/geometrical-arc-to-bezier-curve
function applyTransforms(path, root) {
  function point(x, y) { var p = svg.createSVGPoint(); p.x=x; p.y=y; return p; }

  // add a copy of the path at the same level of the hierarchy to see transforms
  path = path.parentElement.appendChild(path.cloneNode(false));

  var svg    = path.ownerDocument.documentElement
    , normal = (root||svg).getCTM().inverse() // compensation for root's scaling
    , matrix = normal.multiply(path.getCTM()) // transform, relative to svg root

    , _      = ''
    , coords = [_, 1, 2] // main and optional handle 1 and 2 coordinates
    , segs   = path.pathSegList
    , len    = segs.numberOfItems
    , x      = { 0: 0, '': 0, 1: 0, 2: 0 }
    , y      = { 0: 0, '': 0, 1: 0, 2: 0 }
    , i      = -1
    , seg, cmd
    ;

  // simplify the logic by normalizing to absolute coordinates first
  absolutizePath(path);

  // walk the path, applying all transforms between us and the root as we go
  while (++i < len) {
    seg = segs.getItem(i);
    cmd = seg.pathSegTypeAsLetter;

    // TODO: if ('A' === cmd) convertArcToBéziers here

    // Apply the transform to all coordinates and handles
    coords.forEach(function(sfx) {
      var xn = 'x'+sfx, yn = 'y'+sfx
        , xc = seg[xn], yc = seg[yn]
        , coord;
      if ((xc != null) || (yc != null)) {
        if (xc == null) xc = x[_];
        if (yc == null) yc = y[_];
        coord = point(xc, yc).matrixTransform(matrix);
        x[sfx] = seg[xn] = coord.x;
        y[sfx] = seg[yn] = coord.y;
      }
    });

    // record (and recall) start-of-subpath
    switch (cmd) {
      case 'm': case 'M': x[0] = x[_]; y[0] = y[_]; break;
      case 'z': case 'Z': x[_] = x[0]; y[_] = y[0]; break;
    }
  }

  // remove our work copy; it's served us well
  path.parentElement.removeChild(path);
  return path.getAttribute('d');
}

// split an SVG path into its tokens, with no loss of precision due to parsing
var lexSVGPath = (function() {
  function dropWhitespace(s) { return /\S/.test(s); }
  var cmds = '[AaCcHhLlMmQqSsTtVvZz]'
    , floats = '[-+]?(?:(?:[\\d]*\\.[\\d]+)|(?:[\\d]+\\.?))(?:[Ee][-+]?[\\d]+)?'
    , ints = '[-+]?[\\d]+'
    , path_re = new RegExp('(' + [cmds, floats, ints].join('|') + ')', 'g')
    ;
  return function lexSVGPath(d) {
    if ('string' !== typeof d && d && 'function' === typeof d.getAttribute)
      d = d.getAttribute('d');
    return d.split(path_re).filter(dropWhitespace);
  };
})();
