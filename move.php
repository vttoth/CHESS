<?php
ini_set('max_execution_time', 1200);

include("syspars.php");

$state = json_decode($_POST['state']);

$fen = $state->fen;
$mvs = $state->moves;
$usr = $state->turn;
$err = $state->err;

$query = "We are playing chess. It is your turn.\n\n";
$query .= "You are playing " . ($usr == 'w' ? 'white' : 'black') . ".\n\n";
$query .= "The current board, in FEN notation: " . $fen . "\n\n";
if (count($mvs) == 0) $query .= "This is the first move.\n\n";
else
{
  $query .= "Recent moves are:\n\n";
  for ($i = 0; $i < count($mvs); $i++)
  {
    $query .= $mvs[$i] . "\n\n";
  }
}
$query .= "Please analyze the board and respond with your move. ";
if ($err && count($err) > 0)
{
  $query .= ($err == 1) ? "The move " : "The moves ";
  for ($i = 0; $i < count($err); $i++)
  {
    if ($i > 0) $query .= ", ";
    $query .= $err[$i];
  }
  $query .= (($err == 1) ? " is" : " are") . " not legal. ";
}
$query .= "Conclude your answer with your move on the last line, presented in long algebraic notation, e.g.,\n\na1-a2\n";

//$response = "I have analyzed the board.\n\nMy next move is\n\ne2-e4";
//
//$res = array(
//  'qry' => $query,
//  'res' => $response
//);

$request = array(
  'model' => $model,
  'input' => $query
);

$curl = curl_init($endpoint);
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POST, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($request));
curl_setopt($curl, CURLOPT_HTTPHEADER, $header);

$response = curl_exec($curl);
$httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
curl_close($curl);

if ($httpCode == 200)
{
  $res = array(
    'qry' => $query,
    'res' => $response
  );
}
else
{
  $res = array(
    'qry' => $query,
    'res' => "ERROR: " . $httpCode
  );
}

echo json_encode($res);

?>
