const express = require('express');
const basicAuth = require('express-basic-auth')
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config()
const url = require('url');
const { execFile } = require("child_process");
const cp = require('child_process');
var dblite = require('dblite')
const fs = require('fs')
var expressStaticGzip = require("express-static-gzip");
const compression = require('compression');
var showdown  = require('showdown');

const app = express()
app.use(bodyParser.json());
app.use(compression());


var db = dblite(process.env.DB_LOCATION)

// this is not secure, and I know it. It's fine for now, as the app isn't exposed to the internet.
var staticUserAuth = basicAuth({
    users: {
        [process.env.BASIC_AUTH_USER]: process.env.BASIC_AUTH_PASS
    },
    challenge: true
})




///////////// ROUTES ///////////////////

app.get('/', function(req, res) {
    res.redirect(301, '/overview');
})

app.get('/overview', function(req, res) {
    app.use("/", expressStaticGzip(path.join(__dirname, 'build')));
    res.set({
        "Access-Control-Allow-Origin": "*",
    });
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
})

app.get('/export-data', function(req, res) {
    app.use("/", expressStaticGzip(path.join(__dirname, 'build')));
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
})

app.get('/start-new-experiment', function(req, res) {
    app.use("/", expressStaticGzip(path.join(__dirname, 'build')));
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
})

app.get('/config', function(req, res) {
    app.use("/", expressStaticGzip(path.join(__dirname, 'build')));
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
})

app.get('/pioreactors', function(req, res) {
    app.use("/", expressStaticGzip(path.join(__dirname, 'build')));
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
})

app.get('/updates', function(req, res) {
  app.use("/", expressStaticGzip(path.join(__dirname, 'build')));
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
})




//////////////// PIOREACTOR CONTROL ////////////////////

app.post('/stop_all', function (req, res) {
  const jobs = ["add_media", "add_alt_media", "remove_waste", 'dosing_control', 'stirring', 'od_reading', 'growth_rate_calculating', 'led_control']
  execFile("pios", ["kill"].concat(jobs).concat(["-y"]), (error, stdout, stderr) => {
    if (error) {
        console.log(error)
    }
    if (stderr) {
        console.log(stderr)
    }
    console.log(`stdout: ${stdout}`);
  })
  res.sendStatus(200)
});


app.post('/stop/:job/:unit', function (req, res) {

  job = req.params.job
  unit = req.params.unit

  execFile("pios", ["kill", job, "-y", "--units", req.params.unit], (error, stdout, stderr) => {
    if (error) {
        console.log(error)
    }
    if (stderr) {
        console.log(stderr)
    }
    console.log(`stdout: ${stdout}`);
  })
  res.sendStatus(200)
});

app.post("/run/:job/:unit", function(req, res) {
    unit = req.params.unit
    job = req.params.job

    if (!["stirring", "od_reading", "growth_rate_calculating", "led_control", "dosing_control", "tempature_control", "add_media", "remove_waste", "add_alt_media", "led_intensity"].includes(job)){
      // this solves a security problem: one could put any command as job, ex: "stirring && rm -rf /"
      res.sendStatus(400)
      return
    }

    // TODO: is this a security risk?
    options = Object.entries(req.body).map(k_v => [`--${k_v[0].replace(/_/g, "-")} ${k_v[1]}`])

    execFile("pios", ["run", job, "-y", "--units", unit].concat(options), (error, stdout, stderr) => {
        if (error) {
            console.log(error)
            res.sendStatus(500);
            return;
        }
        if (stderr) {
            console.log(error)
            res.sendStatus(500);
            return;
        }
        console.log(`stdout: ${stdout}`);
        res.sendStatus(200)
    });
})




/////////// DATA FOR CARDS ON OVERVIEW ///////////////


app.get('/recent_logs/:experiment', function (req, res) {
  const experiment = req.params.experiment
  const queryObject = url.parse(req.url, true).query; // assume that all query params are optional args for the job
  const minLevel = queryObject['min_level'] || "INFO"

  if (minLevel == "DEBUG"){
    levelString = '(level == "ERROR" or level == "WARN" or level == "INFO" or level == "DEBUG")'
  }
  else if (minLevel == "INFO") {
    levelString = '(level == "ERROR" or level == "INFO" or level == "WARN")'
  }
  else if (minLevel == "WARN") {
    levelString = '(level == "ERROR" or level == "WARN")'
  }
  else if (minLevel == "ERROR") {
    levelString = '(level == "ERROR")'
  }
  else{
    levelString = '(level == "ERROR" or level == "INFO")'
  }

  db.query(
    `SELECT timestamp, level=="ERROR" as is_error, level=="WARNING" as is_warning, pioreactor_unit, ("[" || task || "]" || " " || message) as message FROM logs where ${levelString} and experiment=:experiment and source="app" ORDER BY timestamp DESC LIMIT 50;`,
    {experiment: experiment, levelString: levelString},
    {timestamp: String, is_error: Boolean, is_warning: Boolean, pioreactor_unit: String, message: String},
    function (err, rows) {
      if (err){
        console.log(err)
        res.sendStatus(500)
      } else {
        res.send(rows)
      }
    })
})


app.get('/time_series/growth_rates/:experiment', function (req, res) {
  const experiment = req.params.experiment
  const queryObject = url.parse(req.url, true).query; // assume that all query params are optional args for the job
  const filterModN = queryObject['filter_mod_N'] || 100

  db.query(
    "SELECT json_object('series', json_group_array(unit), 'data', json_group_array(data)) FROM (SELECT pioreactor_unit as unit, json_group_array(json_object('x', timestamp, 'y', round(rate, 5))) as data FROM growth_rates WHERE experiment=:experiment AND ROWID % :filterModN = 0 GROUP BY 1);",
    {experiment: experiment, filterModN: filterModN},
    {results: String},
    function (err, rows) {
      if (err){
        console.log(err)
        res.sendStatus(500)
      } else {
        res.send(rows[0]['results'])
      }
    })
})


app.get('/time_series/od_readings_filtered/:experiment', function (req, res) {
  const experiment = req.params.experiment
  const queryObject = url.parse(req.url, true).query; // assume that all query params are optional args for the job
  const filterModN = queryObject['filter_mod_N'] || 100
  const lookback = queryObject['lookback'] || 4

  db.query(
    "SELECT json_object('series', json_group_array(unit), 'data', json_group_array(data)) FROM (SELECT pioreactor_unit || '-' || channel as unit, json_group_array(json_object('x', timestamp, 'y', round(normalized_od_reading, 7))) as data FROM od_readings_filtered WHERE experiment=:experiment AND ROWID % :filterModN in (0, 1) and timestamp > strftime('%Y-%m-%dT%H:%M:%S', datetime('now', :lookback)) GROUP BY 1);",
    {experiment: experiment, filterModN: filterModN, lookback: `-${lookback} hours`},
    {results: String},
    function (err, rows) {
      if (err){
        console.log(err)
        res.sendStatus(500)
      } else {
        res.send(rows[0]['results'])
      }
    })
})


app.get('/time_series/od_readings_raw/:experiment', function (req, res) {
  const experiment = req.params.experiment
  const queryObject = url.parse(req.url, true).query; // assume that all query params are optional args for the job
  const filterModN = queryObject['filter_mod_N'] || 100
  const lookback = queryObject['lookback'] || 4

  db.query(
    "SELECT json_object('series', json_group_array(unit), 'data', json_group_array(data)) FROM (SELECT pioreactor_unit || '-' || channel as unit, json_group_array(json_object('x', timestamp, 'y', round(od_reading_v, 7))) as data FROM od_readings_raw WHERE experiment=:experiment AND ROWID % :filterModN in (0, 1) and timestamp > strftime('%Y-%m-%dT%H:%M:%S', datetime('now', :lookback)) GROUP BY 1);",
    {experiment: experiment, filterModN: filterModN, lookback: `-${lookback} hours`},
    {results: String},
    function (err, rows) {
      if (err){
        console.log(err)
        res.sendStatus(500)
      } else {
        res.send(rows[0]['results'])
      }
    })
})

app.get('/time_series/alt_media_fraction/:experiment', function (req, res) {
  const experiment = req.params.experiment
  const queryObject = url.parse(req.url, true).query; // assume that all query params are optional args for the job
  const filterModN = queryObject['filter_mod_N'] || 100

  db.query(
    "SELECT json_object('series', json_group_array(unit), 'data', json_group_array(data)) FROM (SELECT pioreactor_unit as unit, json_group_array(json_object('x', timestamp, 'y', round(alt_media_fraction, 7))) as data FROM alt_media_fraction WHERE experiment=:experiment AND ROWID % :filterModN == 0 GROUP BY 1);",
    {experiment: experiment, filterModN: filterModN},
    {results: String},
    function (err, rows) {
      if (err){
        console.log(err)
        res.sendStatus(500)
      } else {
        res.send(rows[0]['results'])
      }
    })
})


app.get("/recent_media_rates/:experiment", function (req, res) {
  const experiment = req.params.experiment
  const hours = 6

  function fetch(){
    db.query(`SELECT pioreactor_unit, SUM(CASE WHEN event="add_media" THEN volume_change_ml ELSE 0 END) / :hours AS mediaRate, SUM(CASE WHEN event="add_alt_media" THEN volume_change_ml ELSE 0 END) / :hours AS altMediaRate FROM dosing_events where datetime(timestamp) >= datetime('now', '-:hours Hour') and event in ('add_alt_media', 'add_media') and experiment=:experiment and source_of_event LIKE 'dosing_automation%' GROUP BY pioreactor_unit;`,
      {experiment: experiment, hours: hours},
      {pioreactor_unit: String, mediaRate: Number, altMediaRate: Number},
      function(err, rows) {
        if (err){
          console.log(err)
          return setTimeout(fetch, 250)
        }
        var jsonResult = {}
        var aggregate = {altMediaRate: 0, mediaRate: 0}
        for (const row of rows){
          jsonResult[row.pioreactor_unit] = {altMediaRate: row.altMediaRate, mediaRate: row.mediaRate}
          aggregate.mediaRate = aggregate.mediaRate + row.mediaRate
          aggregate.altMediaRate = aggregate.altMediaRate + row.altMediaRate
        }
        jsonResult["all"] = aggregate
        res.json(jsonResult)
    })
  }
  fetch()
})







////////////// MISC ///////////////////


app.post("/update_app", function (req, res) {
    var child = cp.fork('./child_tasks/update_app');
    child.on('message', function(result) {
      if (result) {
          res.sendStatus(200)
      }
      else{
        res.sendStatus(500)
      }
    });
    child.send(1);
})

app.get('/get_app_version', function(req, res) {
  execFile("pio", ["version"], (error, stdout, stderr) => {
      if (error) {
          console.log(error)
      }
      if (stderr) {
          console.log(stderr)
      }
      res.send(stdout)
  })
})


app.get('/get_changelog', function(req, res) {
  converter = new showdown.Converter()
  execFile("/bin/cat", ["CHANGELOG.md"], {cwd: process.env.PIOREACTOR_SOURCE_CODE}, (error, stdout, stderr) => {
      if (error) {
          console.log(error)
      }
      if (stderr) {
          console.log(stderr)
      }
      res.send(converter.makeHtml(stdout))
  })
})

app.post('/export_datasets', function(req, res) {
    var child = cp.fork('./child_tasks/db_export');

    child.on('message', function(m) {
      if (m) {
          res.json({filename: m})
      }
      else{
        console.log(m)
        res.sendStatus(500)
      }
    });
    child.send(req.body);
})


app.get('/get_experiments', function (req, res) {
  db.query(
    'SELECT * FROM experiments ORDER BY timestamp DESC;',
    ["experiment", "timestamp", "description"],
    function (err, rows) {
      if (err){
        console.log(err)
        res.sendStatus(500)
      } else {
        res.send(rows)
     }
    })
})

app.get('/get_latest_experiment', function (req, res) {
  function fetch() {
    db.query(
      'SELECT *, round( (strftime("%s","now") - strftime("%s", timestamp))/60/60, 0) as delta_hours FROM experiments ORDER BY timestamp DESC LIMIT 1;',
      {experiment: String, timestamp: String, description: String, delta_hours: Number},
      function (err, rows) {
        if (err) {
          console.log(err)
          return setTimeout(fetch, 500)
        }
        res.send(rows[0])
    })
  }
  fetch()
})


app.post("/create_experiment", function (req, res) {
    // I was hitting this bug https://github.com/WebReflection/dblite/issues/23 in the previous code that tried
    // to rawdog an insert. I now manually check... sigh.
    db.query("SELECT experiment FROM experiments WHERE experiment=:experiment", {experiment: req.body.experiment}, function(err, rows){
        if (rows.length > 0){
          res.sendStatus(422)
          return
        }
        else{
          var insert = 'INSERT INTO experiments (timestamp, experiment, description) VALUES (?,?,?)'
          db.query(insert, [req.body.timestamp, req.body.experiment, req.body.description], function(err, rows){
            if (err){
              // TODO: maybe here we should fire event for updating MQTT
              console.log(err)
              res.sendStatus(500)
            } else {
              res.sendStatus(200)
            }
            return
          })
      }
  })
})

app.post("/update_experiment_desc", function (req, res) {
    var update = 'UPDATE experiments SET description = (?) WHERE experiment=(?)'
    db.query(update, [req.body.description, req.body.experiment], function(err, _){
        if (err){
          console.log(err)
          res.sendStatus(500)
        } else {
          res.sendStatus(200)
        }
    })
})

app.post("/add_new_pioreactor", function (req, res) {
    const newName = req.body.newPioreactorName
    var child = cp.fork('./child_tasks/add_new_pioreactor');
    child.on('message', function(msg) {
      if (msg == 0) {
        res.sendStatus(200)
      }
      else{
        res.status(500).json(msg)
      }
    });
    child.send(newName);
})






/////////// CONFIG CONTROL ////////////////

app.get("/get_config/:filename", function(req, res) {
  // get a specific config.ini files in the .pioreactor folder
  var configPath = path.join(process.env.CONFIG_INI_FOLDER, req.params.filename);
  res.send(fs.readFileSync(configPath))
})

app.get("/get_configs", function(req, res) {
  // get a list of all config.ini files in the .pioreactor folder
  var configPath = process.env.CONFIG_INI_FOLDER;
  fs.readdir(configPath, (err, files) => {
    files = files.filter(fn => fn.endsWith('.ini')).filter(fn => fn !== "unit_config.ini");
    res.json(files)
  });
})


app.post("/delete_config", function(req, res) {
  // TODO: make this http DELETE
  const configPath = path.join(process.env.CONFIG_INI_FOLDER, req.body.filename);

  execFile("rm", [configPath], (error, stdout, stderr) => {
      if (error) {
          console.log(error)
      }
      if (stderr) {
          console.log(stderr)
      }
      console.log(`stdout: ${stdout}`);
  })
  res.sendStatus(200)
});


app.post("/save_new_config", function(req, res) {
  // if the config file is unit specific, we only need to run sync-config on that unit.
  const regex = /config_?(.*)?\.ini/
  const filename = req.body.filename
  if (filename.match(regex)[1]){
    var units = filename.match(regex)[1]
  }
  else{
    var units = "$broadcast"
  }

  var configPath = path.join(process.env.CONFIG_INI_FOLDER, req.body.filename);
  fs.writeFile(configPath, req.body.code, function (err) {
    if (err) {
      res.sendStatus(500)
    }
    else {
      execFile("pios", ["sync-configs", "--units", units], (error, stdout, stderr) => {
          if (error) {
              console.log(error)
              res.sendStatus(500);
          }
          else if (stderr) {
              console.log(stderr)
              res.sendStatus(500);
          }
          else{
            console.log(`stdout: ${stdout}`);
            res.sendStatus(200)
          }
      });
    }
  })
})




///////////  START SERVER ////////////////

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
});
