<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');
$file = __DIR__ . DIRECTORY_SEPARATOR . 'messages.json';
if (!file_exists($file)) { file_put_contents($file, json_encode([])); }
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $raw = file_get_contents($file);
  echo $raw ?: '[]';
  exit;
}
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $input = file_get_contents('php://input');
  $data = json_decode($input, true);
  if (!is_array($data)) { http_response_code(400); echo json_encode(['error'=>'invalid']); exit; }
  $list = json_decode(file_get_contents($file), true);
  if (!is_array($list)) { $list = []; }
  $data['ts'] = isset($data['ts']) ? $data['ts'] : round(microtime(true)*1000);
  $list[] = $data;
  file_put_contents($file, json_encode($list));
  echo json_encode(['ok'=>true]);
  exit;
}
http_response_code(405);
echo json_encode(['error'=>'method']);
