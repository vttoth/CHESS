let selectedSquare = null;
let userTurn = 'w'; // starts with white

function fenToSvg(fen)
{
  const pieceCodes =
  {
    'r': '&#9820;', 'n': '&#9822;', 'b': '&#9821;', 'q': '&#9819;',
    'k': '&#9818;', 'p': '&#9823;', 'R': '&#9814;', 'N': '&#9816;',
    'B': '&#9815;', 'Q': '&#9813;', 'K': '&#9812;', 'P': '&#9817;'
  };

  const board = fen.split(' ')[0];
  const rows = board.split('/');
  const squareSize = 50;

  let svg = `<svg width="${8 * squareSize}" height="${8 * squareSize}" xmlns="http://www.w3.org/2000/svg" id="svgboard">`;

  for (let row = 0; row < 8; row++)
  {
    let col = 0;
    for (const char of rows[row])
    {
      if (char in pieceCodes)
      {
        const isLightSquare = (row + col) % 2 === 0;
        const squareColor = isLightSquare ? '#f0d9b5' : '#b58863';
        const squareId = `${String.fromCharCode(97 + col)}${8 - row}`;

        // Highlight selected square
        if (squareId === selectedSquare)
        {
          svg += `<rect x="${col * squareSize}" y="${row * squareSize}" width="${squareSize}" ` +
                 ` height="${squareSize}" fill="yellow" data-square="${squareId}" onclick="handleClick('${squareId}')" />`;
        }
        else
        {
          svg += `<rect x="${col * squareSize}" y="${row * squareSize}" width="${squareSize}" height="${squareSize}" ` +
                 `fill="${squareColor}" data-square="${squareId}" onclick="handleClick('${squareId}')" />`;
        }

        const pieceColor = char === char.toUpperCase() ? 'w' : 'b';
        svg += `<text x="${col * squareSize + squareSize / 2}" y="${row * squareSize + squareSize * 0.75}" ` +
               `font-size="${squareSize}px" text-anchor="middle" font-family="Arial" ` +
               `fill="${pieceColor === 'w' ? 'white' : 'black'}" pointer-events="none">${pieceCodes[char]}</text>`;
        col++;
      }
      else
      {
        const numEmptySquares = parseInt(char);
        for (let i = 0; i < numEmptySquares; i++)
        {
          const isLightSquare = (row + col) % 2 === 0;
          const squareColor = isLightSquare ? '#f0d9b5' : '#b58863';
          const squareId = `${String.fromCharCode(97 + col)}${8 - row}`;

          if (squareId === selectedSquare)
          {
            svg += `<rect x="${col * squareSize}" y="${row * squareSize}" width="${squareSize}" height="${squareSize}" ` +
                   `fill="yellow"  data-square="${squareId}" onclick="handleClick('${squareId}')" />`;
          }
          else
          {
            svg += `<rect x="${col * squareSize}" y="${row * squareSize}" width="${squareSize}" height="${squareSize}" ` +
                   `fill="${squareColor}" data-square="${squareId}" onclick="handleClick('${squareId}')" />`;
          }

          col++;
        }
      }
    }
  }

  svg += '</svg>';
  return svg;
}

function handleClick(square)
{
  if (document.getElementById("board").disabled) return;

  document.getElementById("errmsg").innerText = "";

  if (!selectedSquare)
  {
    selectedSquare = square;
    document.getElementById('board').innerHTML = fenToSvg(fen);
    return;
  }

  const from = selectedSquare;
  const to = square;
  selectedSquare = null;

  if (from === to)
  {
    document.getElementById('board').innerHTML = fenToSvg(fen);
    return;
  }

  let checkMate = false;
  try
  {
    const [fromX, fromY] = getBoardSquare(from);
    const piece = getPieceAt(fromY, fromX);
    if (!piece || piece === ' ') throw new Error("No piece at selected square.");
    const color = piece === piece.toUpperCase() ? 'w' : 'b';
    if (color !== userTurn) throw new Error("It's not your turn.");


    // ─── Pawn‐promotion UI ─────────────────────────────────────────
    let promotionSuffix = '';
    // if a pawn is moving to the 1st or 8th rank …
    if (piece.toLowerCase() === 'p')
    {
      const [, toY] = getBoardSquare(to);
      const isLastRank = (color === 'w' && toY === 0) || (color === 'b' && toY === 7);
      if (isLastRank)
      {
        // ask the user which piece:
        let choice = window.prompt(
          "Promote pawn to (q = queen, r = rook, b = bishop, n = knight):",
          "q"
        );
        if (choice)
        {
          choice = choice.toLowerCase();
          if (!['q','r','b','n'].includes(choice)) choice = 'q';
          // updateFEN will uppercase for White, lowercase for Black
          promotionSuffix = '=' + choice;
        }
      }
    }
    // ──────────────────────────────────────────────────────────────

    // include promotionSuffix if any
    const move = `${from}-${to}${promotionSuffix}`;
    res = updateFEN(fen, move);
    fen = res.fen;

    if (userTurn === 'w')
    {
      mvs += "" + (counter+1) + ". " + res.san;
    }
    else
    {
      mvs += " " + res.san + "\n";
      counter++;
    }
    document.getElementById("moves").innerHTML = mvs.replaceAll("\n", "<br/>");

    userTurn = (userTurn === 'w') ? 'b' : 'w';

    if (move.slice(-1) === "#") checkMate = true;
  }
  catch (e)
  {
    console.log("Invalid move:", e.message);
    document.getElementById("errmsg").innerText = "Invalid move: " + e.message;
    return;
  }

  document.getElementById('board').innerHTML = fenToSvg(fen);
  document.getElementById("FEN").innerText = fen;

  if (!checkMate) setTimeout(doMove);
}

function getBoardSquare(squareStr)
{
  const file = squareStr.charCodeAt(0) - 97;
  const rank = 8 - parseInt(squareStr[1]);
  return [file, rank];
}

function getPieceAt(rank, file)
{
  const boardRows = fen.split(' ')[0].split('/');
  let expanded = boardRows.map(row =>
  {
    let out = [];
    for (let ch of row)
    {
      if (isNaN(ch)) out.push(ch);
      else for (let i = 0; i < parseInt(ch); i++) out.push(' ');
    }
    return out;
  });
  return expanded[rank][file];
}

let repetition = new Map();   // cleared by resetBoard()

/******************************************************************
 *  FULL “updateFEN” MODULE    legality + SAN + end-of-game tests
 ******************************************************************/

/*‒‒‒ utilities ‒‒‒ ------------------------------------------------*/
function sqToXY(s){return [s.charCodeAt(0)-97, 8-Number(s[1])];}
function xyToSq(x,y){return String.fromCharCode(97+x)+(8-y);}

function decodeBoard(str)
{
  return str.split('/').map(r =>
  {
    const row = [];
    for (const ch of r)
      if (isNaN(ch)) row.push(ch);
      else for(let i = 0; i < ch; i++) row.push(' ');
    return row;
  });
}

function encodeBoard(mat)
{
  return mat.map(r =>
  {
    let out = '', run = 0;
    for (const s of r)
    {
      if(s === ' ') run++;
      else
      {
        if (run)
        {
          out += run;
          run = 0;
        }
        out += s;
      }
    }
    if (run) out += run;
    return out;
  }).join('/');
}
const clone = m=>m.map(r=>r.slice());

/* is square (x,y) attacked by ‘attacker’ side ? */
function attacked(mat,x,y,attacker)
{
  const isWhite = ch => ch !== ' ' && ch === ch.toUpperCase();
  const isBlack = ch => ch !== ' ' && ch === ch.toLowerCase();
  const enemy   = attacker === 'w' ? isWhite : isBlack;   // ← correct
  const dir8 = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  const knight = [[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]];
  /* pawns */
  const dy = attacker==='w' ? 1 : -1;
  for (const dx of [-1,1])
  {
    const nx = x + dx, ny = y + dy;
    if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8)
    {
      const p = mat[ny][nx];
      if (enemy(p) && p.toLowerCase() === 'p') return true;
    }
  }
  /* knight */
  for(const [dx,dy2] of knight)
  {
    const nx = x + dx, ny = y + dy2;
    if (nx < 0 || nx > 7 || ny < 0 || ny > 7) continue;
    const p = mat[ny][nx];
    if (enemy(p) && p.toLowerCase() === 'n') return true;
  }
  /* sliders + king */
  for (let i = 0; i < 8; i++)
  {
    const [dx, dy2] = dir8[i];
    for (let n = 1;; n++)
    {
      const nx = x + dx * n, ny = y + dy2 * n;
      if (nx < 0 || nx > 7 || ny < 0 || ny > 7) break;
      const p = mat[ny][nx];
      if (p === ' ') continue;
      if (enemy(p))
      {
        const pc = p.toLowerCase();
        if (( i < 4 && (pc === 'r' || pc === 'q')) ||
            (i >= 4 && (pc === 'b' || pc === 'q')) ||
            (n === 1 && pc === 'k')) return true;
      }
      break;
    }
  }
  return false;
}

/* piece-shape check (ignores king-in-check) */
function legalShape(mat, fromX, fromY, toX, toY, fenParts)
{
  const piece = mat[fromY][fromX];
  const dest = mat[toY][toX];

  /* NEW: do not allow capture of own piece --------------------- */
  const sameColour = dest !== ' ' &&
                     ((piece === piece.toUpperCase()) ===
                      (dest  === dest .toUpperCase()));
  if (sameColour) return false;
  /* ------------------------------------------------------------ */

  const color = piece === piece.toUpperCase() ? 'w' : 'b';
  const dx = toX - fromX, dy = toY - fromY;
  const abs = Math.abs;
  const empty = (x,y) => mat[y][x] === ' ';
  const clear = (sx,sy) =>
  {
    for (let n = 1;; n++)
    {
      const x = fromX + sx * n, y = fromY + sy * n;
      if (x === toX && y === toY) return true;
      if (!empty(x,y)) return false;
    }
  };
  /* castling tested later */
  switch (piece.toLowerCase())
  {
    case 'p':
    {
      const dir = color === 'w' ? -1 : 1;
      /* forward */
      if (dx === 0)
      {
        if (dy === dir && empty(toX,toY)) return true;
        if (dy === 2 * dir && fromY === (color === 'w' ? 6 : 1) &&
            empty(toX, toY) && empty(fromX, fromY + dir)) return true;
      }
      /* capture */
      if(abs(dx)===1&&dy===dir){
        if(dest!==' ' && ((color==='w')!== (dest===dest.toUpperCase()))) return true;
        if(xyToSq(toX,toY)===fenParts[3]) return true;          // e.p.
      }
      return false;
    }
    case 'n': return dx * dx + dy * dy === 5;
    case 'b': return abs(dx) === abs(dy) && clear(Math.sign(dx), Math.sign(dy));
    case 'r': return (dx === 0 || dy === 0) && clear(Math.sign(dx), Math.sign(dy));
    case 'q': return ((dx === 0 || dy === 0) || abs(dx) === abs(dy))
                         && clear(Math.sign(dx), Math.sign(dy));
    case 'k':
      if (Math.max(abs(dx), abs(dy)) === 1) return true;         // step
      if (fromX === 4 && dy === 0 && (dx === 2 || dx === -2))
      { // castle
        const rights = color === 'w' ? (dx === 2 ? 'K' : 'Q') : (dx === 2 ? 'k' : 'q');
        if (!fenParts[2].includes(rights)) return false;
        const step = dx > 0 ? 1 : -1;
        for (let x = fromX + step; x !== toX + step; x += step)
          if (!empty(x, fromY)) return false;
        return true;
      }
      return false;
  }
}

/* after-move KING safety (used also for mate/stalemate search) */
function leaveKingSafe(mat, color, castling, enpass)
{
  let kx = -1,ky = -1;
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++)
  {
    const p = mat[y][x];
    if (p !== ' ' && p.toLowerCase() === 'k' && ((color === 'w') === (p === 'K')))
    {
      kx = x;
      ky = y;
    }
  }
  return !attacked(mat, kx, ky, color === 'w' ? 'b' : 'w');
}

/* any legal move for ‘side’?  => for checkmate/stalemate */
function hasLegal(mat, side, castling, enpass)
{
  for (let y =0; y < 8; y++)
    for (let x = 0; x < 8; x++)
  {
    const p = mat[y][x];
    if (p === ' ') continue;
    if( (side === 'w') !== (p === p.toUpperCase())) continue;
    for (let ty = 0; ty < 8; ty++)
      for (let tx = 0; tx < 8; tx++)
    {
      if (x === tx && y === ty) continue;
      if (!legalShape(mat, x, y, tx, ty, [null, side, castling, enpass])) continue;
      const m2=clone(mat);
      /* effect */
      m2[ty][tx] = m2[y][x];
      m2[y][x] = ' ';
      /* en passant capture */
      if (p.toLowerCase() === 'p' && xyToSq(tx,ty) === enpass&&m2[ty][tx] === ' ')
      {
        const capY = side === 'w' ? ty + 1 : ty - 1;
        m2[capY][tx]=' ';
      }
      /* rook shift on castling */
      if (p.toLowerCase() === 'k' && Math.abs(tx - x) === 2)
      {
        const rfx = tx === 6 ? 7 : 0;
        const rtx = tx === 6 ? 5 : 3;
        m2[ty][rtx] = m2[ty][rfx];
        m2[ty][rfx] = ' ';
      }
      if (leaveKingSafe(m2, side, castling, enpass)) return true;
    }
  }
  return false;
}

// canonicaliseMove.js
function canonicaliseMove(raw)
{
  if (typeof raw !== 'string') throw new TypeError('move must be a string');

  const m = raw
    .trim()
    .replace(/\s+/g, '')        // strip spaces
    .match(/^(?:[KQRBNP])?([a-h][1-8])(?:x|:|-)?([a-h][1-8])(?:=?([QRBN]))?[+#]?$/i);

  if (!m) throw new Error('unrecognised move: ' + raw);

  const from  = m[1].toLowerCase();
  const to    = m[2].toLowerCase();
  const promo = m[3] ? m[3].toUpperCase() : '';

  return promo ? `${from}-${to}=${promo}` : `${from}-${to}`;
}

/*………………………………………  MAIN  ……………………………………………………………*/
function updateFEN(oldFen, moveStr)
{
  /*──────────────── parse and board clone ───────────────*/
  const fp = oldFen.split(' ');
  let [board,turn,castle,enpass,half,full]=fp;
  const mat    = decodeBoard(board);

  moveStr = canonicaliseMove(moveStr);

  /* promotion suffix? */
  let promo = null;
  const pr = moveStr.match(/=([QRNBqrbn])/);
  if (pr)
  {
    promo = pr[1];
    moveStr = moveStr.replace(/=.*/,'');
  }

  const [from, to] = moveStr.toLowerCase().replace(/\s*/g,'').split(/[x-]/);
  if (!from || !to) throw Error("bad move syntax");
  const [fx,fy] = sqToXY(from), [tx,ty] = sqToXY(to);
  const piece = mat[fy][fx];
  if (piece === ' ') throw Error("empty from");
  const mover = piece === piece.toUpperCase() ? 'w' : 'b';
  if (mover !== turn) throw Error("not "+mover+"'s turn");

  /*──────────────── shape legality ──────────────────────*/
  if (!legalShape(mat, fx, fy, tx, ty, fp)) throw Error("illegal move");

  /*──────────────── make tentative move ─────────────────*/
  const mat2 = clone(mat);
  mat2[ty][tx] = promo? (mover==='w'?promo.toUpperCase():promo.toLowerCase())
                      : piece;
  mat2[fy][fx] = ' ';
  /* en passant capture */
  const isPawn = piece.toLowerCase()==='p';
  const isEP   = isPawn && (xyToSq(tx,ty)===enpass) && mat[ty][tx]===' ';
  if (isEP)
  {
    const cy = mover === 'w' ? ty + 1 : ty - 1;
    mat2[cy][tx] = ' ';
  }
  /* rook move on castling */
  const isCastle = piece.toLowerCase() === 'k' && Math.abs(tx - fx) === 2;
  if (isCastle)
  {
    const rfx = tx === 6 ? 7 : 0, rtx = tx === 6 ? 5 : 3;
    mat2[ty][rtx] = mat2[ty][rfx]; mat2[ty][rfx] = ' ';
  }

  if (!leaveKingSafe(mat2, mover, castle, enpass))
    throw Error("king would be in check");

  /*──────────────── determine SAN core ──────────────────*/
  let san;
  const destPiece = isEP ? 'p' : mat[ty][tx];
  if (isCastle) san = tx === 6 ? 'O-O' : 'O-O-O';
  else
  {
/*
    const cap  = destPiece !== ' ';
    const pl   = piece.toLowerCase() === 'p';
    const name = pl? '' : piece.toUpperCase();
    if(pl)
    {
      san = cap ? from[0] + 'x' + to : to;
    }
    else
    {
      san = name + (cap ? 'x' : '') + to;
    }
    if (promo) san += '=' + promo.toUpperCase();
*/
    const cap  = destPiece !== ' ';
    const pl   = piece.toLowerCase() === 'p';
    const name = pl ? '' : piece.toUpperCase();
    let disambig = '';

    if (!pl) {
      // Find all matching pieces that can also reach the destination
      let ambiguous = [];
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          if (x === fx && y === fy) continue;
          const p = mat[y][x];
          if (p === piece) {
            if (legalShape(mat, x, y, tx, ty, fp)) {
              const m2 = clone(mat);
              m2[ty][tx] = m2[y][x];
              m2[y][x] = ' ';
              if (leaveKingSafe(m2, mover, castle, enpass)) {
                ambiguous.push([x, y]);
              }
            }
          }
        }
      }

      if (ambiguous.length > 0) {
        const sameFile = ambiguous.some(([x, _]) => x === fx);
        const sameRank = ambiguous.some(([_, y]) => y === fy);

        disambig = sameFile && sameRank ? from : (
                     sameFile ? from[1] :
                     sameRank ? from[0] : from[0]
                   );
      }
    }

    if (pl) {
      san = cap ? from[0] + 'x' + to : to;
    } else {
      san = name + disambig + (cap ? 'x' : '') + to;
    }

    if (promo) san += '=' + promo.toUpperCase();
  }

  /*──────────────── update clocks / rights ──────────────*/
  /* castling rights lost? */
  if (piece === 'K') castle = castle.replace(/[KQ]/g,'');
  if (piece === 'k') castle = castle.replace(/[kq]/g,'');
  if (piece === 'R' && from === 'a1') castle = castle.replace('Q','');
  if (piece === 'R' && from === 'h1') castle = castle.replace('K','');
  if (piece === 'r' && from === 'a8') castle = castle.replace('q','');
  if (piece === 'r' && from === 'h8') castle = castle.replace('k','');
  if (castle === '') castle='-';

  /* new en-passant square */
  if (isPawn && Math.abs(ty - fy) === 2)
    enpass = xyToSq(fx, (fy + ty) / 2);
  else  enpass = '-';

  /* half-move clock */
  half = (isPawn || destPiece !== ' ') ? 0 : Number(half) + 1;
  if (mover === 'b') full = Number(full) + 1;

  /* next side */
  turn = mover === 'w' ? 'b' : 'w';

  const newFen =
  [
    encodeBoard(mat2), turn, castle, enpass, half, full
  ].join(' ');

  /*──────────────── repetition map (for 3-fold) ─────────*/
  /* key excludes clocks */
  const key = encodeBoard(mat2) + ' ' + turn + ' ' + castle + ' ' + enpass;
  if (!repetition) repetition = new Map();
  repetition.set(key, (repetition.get(key) || 0) + 1);

  /*──────────────── check / mate / draw? ────────────────*/
  const inCheck = (() =>
  {          // opponent under fire?
    let kx = -1,ky = -1;
    for (let y = 0; y < 8; y++)
      for (let x = 0; x<8; x++)
    {
      const p=mat2[y][x];
      if (p !== ' ' && p.toLowerCase() === 'k' && ((turn === 'w') === (p === 'K')))
      {
        kx=x;
        ky=y;
      }
    }
    return attacked(mat2, kx, ky, mover);
  })();

  const oppHas = hasLegal(mat2, turn, castle, enpass);
  let state = 'ok';
  if (inCheck && !oppHas) { state = 'mate'; san += '#'; }
  else if (inCheck) { state = 'check'; san += '+'; }
  else if (!oppHas) { state = 'draw'; }                             // stalemate
  else if (half>=100) { state = 'draw'; }                           // 50-move
  else if (repetition.get(key)>=3) { state = 'draw'; }              // 3-fold

console.log(san);

  return {fen:newFen, san, state};
}


function rs()
{
  fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  mvs = "";
  repetition.clear();
  document.getElementById('board').innerHTML=fenToSvg(fen);
}

let counter = 0;
let white = true;

function resetBoard()
{
  rs();
  document.getElementById("FEN").innerText = fen;
  document.getElementById("moves").innerText = mvs;
  counter = 0;
  white = true;
  userTurn = 'w';
}

window.addEventListener('load', resetBoard);

data = "";

function doPause()
{
  document.body.style.cursor = 'wait';
  document.getElementById("moveBtn").disabled = true;
  document.getElementById("resetBtn").disabled = true;
  document.getElementById('board').disabled = true;
}

function unPause()
{
  document.body.style.cursor = '';
  document.getElementById("moveBtn").disabled = false;
  document.getElementById("resetBtn").disabled = false;
  document.getElementById('board').disabled = false;
}

function doMove(errMoves = [])
{
  /* still to come */
  const lastMoves = mvs === '' ? [] : mvs.replace(/\n$/,"").split("\n").slice(-2);

  const state = JSON.stringify({ "fen": fen, "moves": lastMoves, "turn": userTurn, "err": errMoves });

  console.log(state);

  doPause();

  let request = new XMLHttpRequest();
  request.open('POST', 'move.php');
  request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  request.onreadystatechange = function ()
  {
    if (request.readyState == 4)
    {
      console.log(`The request is completed: ${request.response}`);
      data = JSON.parse(request.response);

      if ( !(str => { try { JSON.parse(str); } catch (e) { return false; } return true; })(data.res) )
      {
        console.log("Invalid model response: " + data.res);
        document.getElementById("errmsg").innerText = "Invalid response (use Next move to retry): " +data.res;
        unPause();
        return;
      }

      // output[1] for o3, output[0] for base gpt4.1 model
      const outputs = JSON.parse(data.res).output;
      //const txt = JSON.parse(JSON.parse(data).res).output[1].content[0].text;
      const txt = outputs[outputs.length - 1].content[0].text;
      const move = txt.split("\n").pop();
      const span = document.createElement("span");
      span.innerText += txt + "\n";
      document.getElementById('commentary').innerHTML += `<h4>Move ${(counter+1)}</h4>`;
      document.getElementById('commentary').appendChild(span);
      document.getElementById('commentary').innerHTML += "<hr/>";
      document.getElementById('commentary').scrollTop = document.getElementById('commentary').scrollHeight;
     
      try
      { 
        if (move !== "resign")
        {
          const res = updateFEN(fen, move);

          fen = res.fen;

          if (userTurn === 'w')
          {
            mvs += "" + (counter+1) + ". " + res.san;
          }
          else
          {
            mvs += " " + res.san + "\n";
            counter++;
          }
          document.getElementById("moves").innerHTML = mvs.replaceAll("\n", "<br/>");
        }

        userTurn = (userTurn === 'w') ? 'b' : 'w';
        document.getElementById('board').innerHTML = fenToSvg(fen);
        document.getElementById("FEN").innerText = fen;
        document.getElementById("errmsg").innerText = "";
        unPause();
      }
      catch (e)
      {
        console.log("Bad move:", e.message);
        errMoves.push(move);
        if (errMoves.length < 3) setTimeout(doMove(errMoves));
        else
        {
          document.getElementById("errmsg").innerText = "";
          unPause();
        }
      }
    }
  }
  try
  {
    request.send("state=" + encodeURIComponent(state));
  }
  catch (err)
  {
    console.log(`An error has occurred: ${err}`);
    document.getElementById("errmsg").innerText = `An error has occurred: ${err}`;
    unPause();
  }
}
