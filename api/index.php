<?php
  require 'Slim/Slim.php';
  require  "connect.inc.php";
  require  "config.php";

  \Slim\Slim::registerAutoloader();

  $app = new \Slim\Slim(array(
    'debug' => true,
    "MODE" => "development",
    "TEMPLATES.PATH" => "./templates"
  ));

  $app->post("/addFeedback", function () use($app, $pdo, $db) {
    $app->response()->header("Content-Type", "text/html");
    $app->response()->header("charset", "UTF-8");

    $passed = false;
    $errorMsg = "";

    // Check the format of mail
    $mailPattern = '/^\w+([-+.]\w+)*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/';
    if (preg_match($mailPattern, $_POST["mail"])){
      $passed = true;
    } else {
      $passed = false;
      $errorMsg = "Mail address should match the format.";
      echo json_encode(array("result" => "Fail", "errorMsg" => $errorMsg), JSON_NUMERIC_CHECK);
      exit;
    }

    if ($passed) {
      // Check if the record already exist
      // $db->exec("SET character set utf8");
      
      $pdo->query("set names utf8");
      $result = $db->tinning_feedback->insert($_POST);
      if ($result) {
        echo json_encode(array("result" => "Success"), JSON_NUMERIC_CHECK);
      } else {
        echo json_encode(array("result" => "Fail", "errorMsg" => "Issue happened through the Database, try it later."), JSON_NUMERIC_CHECK);
      }
    }
  });

  $app->post("/postUsageData", function () use($app, $pdo, $db) {
    $app->response()->header("Content-Type", "text/html");
    $app->response()->header("charset", "UTF-8");

    $pdo->query("set names utf8");
    // Check if the record already exist
    $result = $db->tinning_usage->insert($_POST);
    if ($result) {
      echo json_encode(array("result" => "Success"), JSON_NUMERIC_CHECK);
    } else {
      echo json_encode(array("result" => "Fail", "errorMsg" => "Issue happened through the Database, try it later."), JSON_NUMERIC_CHECK);
    }
  });
  
 $app->run();
?>