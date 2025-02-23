import React from "react";
import moment from "moment";
import { Client, Message } from "paho-mqtt";

import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import FormGroup from '@material-ui/core/FormGroup';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/Card';
import {Typography} from '@material-ui/core';
import Button from "@material-ui/core/Button";
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import TextField from '@material-ui/core/TextField';

import Header from "./components/Header"
import CleaningScript from "./components/CleaningScript"
import StartSensors from "./components/StartSensors"
import StartCalculations from "./components/StartCalculations"
import clearChartCommand from "./components/clearChartCommand"


const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: "15px"
  },
  cardContent: {
    padding: "10px"
  },
  button: {
    marginRight: theme.spacing(1),
  },
  instructions: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(4),
    marginLeft: "auto",
    marginRight: "auto",
    width: "60%"
  },
  textField:{
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1)
  },
  formControl: {
    margin: theme.spacing(3),
  },
  halfTextField: {
    width: "95%"
  },
}));




function ExperimentSummaryForm(props) {
  const classes = useStyles();
  const [formError, setFormError] = React.useState(false);
  const [helperText, setHelperText] = React.useState("");
  const [expName, setExpName] = React.useState("");
  const [timestamp, setTimestamp] = React.useState(moment.utc());
  const [description, setDescription] = React.useState("");


  function publishExpNameToMQTT(){

    function onConnect() {
      var message = new Message(expName);
      message.destinationName = "pioreactor/latest_experiment"
      message.qos = 1;
      message.retained = true;
      client.publish(message);
    }

    var client
    if (props.config.remote && props.config.remote.ws_url) {
      client = new Client(
        `ws://${props.config.remote.ws_url}/`,
        "webui_publishExpNameToMQTT" + Math.random()
      )}
    else {
      client = new Client(
        `${props.config['network.topology']['leader_address']}`, 9001,
        "webui_publishExpNameToMQTT" + Math.random()
      );
    }
    client.connect({ onSuccess: onConnect, timeout: 180});

  }

  function killExistingJobs(){
     fetch('/stop_all', {method: "POST"})
  }

  function onSubmit(e) {
    e.preventDefault();
    if (expName === ""){
      setFormError(true)
      setHelperText("Can't be blank")
      return
    }
    fetch('create_experiment',{
        method: "POST",
        body: JSON.stringify({experiment : expName.trim(), timestamp: timestamp.toISOString(), description: description}),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }).then(res => {
        if (res.status === 200){
          publishExpNameToMQTT()
          setHelperText("")
          setFormError(false);
          killExistingJobs()
          clearChartCommand(props)
          props.handleNext()
        }
        else{
          setFormError(true);
          setHelperText("Experiment name already used.")
        }
      }
     )
  }

  const onExpNameChange = (e) => {
    setExpName(e.target.value)
  }
  const onDescChange = (e) => {
    setDescription(e.target.value)
  }
  const onTimestampChange = (e) => {
    setTimestamp(e.target.value)
  }


  return (
    <div className={classes.root}>
        <FormGroup>
        <Grid container spacing={1}>
          <Grid item xs={12} md={6}>
            <TextField
              error={formError}
              id="expName"
              label="Experiment name"
              required className={`${classes.halfTextField} ${classes.textField}`}
              onChange={onExpNameChange}
              helperText={helperText}
              />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              id="datetime"
              label="Start time"
              type="datetime-local"
              defaultValue={timestamp.local().format("YYYY-MM-DDTHH:mm:ss")}
              className={`${classes.halfTextField} ${classes.textField}`}
              onChange={onTimestampChange}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          <Grid item xs={12} md={12}>
            <TextField
              label="Description"
              rowsMax={4}
              placeholder={"Add a description: what microbe are you using? What is the media composition? This description can always be changed later."}
              multiline
              className={classes.textField}
              onChange={onDescChange}
              fullWidth={true}
            />
          </Grid>
          <Grid item xs={12} md={10}/>
          <Grid item xs={12} md={2}>
            <Button variant="contained" color="primary" onClick={onSubmit}> Create </Button>
          </Grid>
        </Grid>
        </FormGroup>
    </div>
  )
}





function StartNewExperimentContainer(props) {
  const classes = useStyles();
  const [activeStep, setActiveStep] = React.useState(0);
  const [skipped, setSkipped] = React.useState(new Set());

  const getStepContent = (index) => {
    return steps[index].content
  }
  const isStepOptional = (index) => {
    return steps[index].optional
  };

  const isStepSkipped = (step) => {
    return skipped.has(step);
  };

  const handleNext = () => {
    if (activeStep === steps.length - 1){
      window.location.href = "/overview";
    } else {

      let newSkipped = skipped;
      if (isStepSkipped(activeStep)) {
        newSkipped = new Set(newSkipped.values());
        newSkipped.delete(activeStep);
      }

      setActiveStep((prevActiveStep) => prevActiveStep + 1);
      setSkipped(newSkipped);
      window.scrollTo({top: 0})
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSkip = () => {
    if (!isStepOptional(activeStep)) {
      throw new Error("You can't skip a step that isn't optional.");
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped((prevSkipped) => {
      const newSkipped = new Set(prevSkipped.values());
      newSkipped.add(activeStep);
      return newSkipped;
    });
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  const steps = [
    {title: 'Experiment summary', content: <ExperimentSummaryForm config={props.config} handleNext={handleNext}/>, optional: true},
    {title: 'Cleaning and preparation', content: <CleaningScript config={props.config}/>, optional: true},
    {title: 'Start sensors', content: <StartSensors config={props.config}/>, optional: true},
    {title: 'Start calculations', content: <StartCalculations config={props.config}/>, optional: false},
  ];

  return (
    <Card className={classes.root}>
      <CardContent className={classes.cardContent}>
        <Typography variant="h5" component="h1">
          Start a new experiment
        </Typography>
        <Stepper activeStep={activeStep}>
          {steps.map((step, index) => {
            const stepProps = {};
            const labelProps = {};
            if (step.optional) {
              labelProps.optional = <Typography variant="caption">Optional</Typography>;
            }
            if (isStepSkipped(index)) {
              stepProps.completed = false;
            }
            return (
              <Step key={step.title} {...stepProps}>
                <StepLabel {...labelProps}>{step.title}</StepLabel>
              </Step>
            );
          })}
        </Stepper>
        <div>
          {activeStep === steps.length ? (
            <div>
              <Typography className={classes.instructions}>
                All steps completed - you&apos;re finished
              </Typography>
              <Button onClick={handleReset} className={classes.button}>
                Reset
              </Button>
            </div>
          ) : (
            <div>
              <Typography className={classes.instructions}>{getStepContent(activeStep)}</Typography>
              <div>
                <Button disabled={activeStep === 0} onClick={handleBack} className={classes.button}>
                  Back
                </Button>
                {isStepOptional(activeStep) && (
                  <Button
                    variant="contained"
                    onClick={handleSkip}
                    className={classes.button}
                  >
                    Skip
                  </Button>
                )}

                <Button
                  variant="contained"
                  onClick={handleNext}
                  className={classes.button}
                >
                  {activeStep === steps.length - 1 ? 'Go to overview' : 'Next'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}



function StartNewExperiment(props) {
    React.useEffect(() => {
      document.title = props.title;
    }, [props.title])
    return (
        <Grid container spacing={2} >
          <Grid item xs={12}><Header /></Grid>

          <Grid item xs={1}/>
          <Grid item xs={10}>
            <div><StartNewExperimentContainer config={props.config}/></div>
          </Grid>
          <Grid item xs={1}/>
        </Grid>
    )
}

export default StartNewExperiment;

