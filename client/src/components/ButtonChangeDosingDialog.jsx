import React, { useState, useEffect } from "react";

import { Client, Message } from "paho-mqtt";

import { makeStyles } from "@material-ui/styles";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import TextField from "@material-ui/core/TextField";
import Checkbox from "@material-ui/core/Checkbox";
import InputAdornment from "@material-ui/core/InputAdornment";
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormLabel from '@material-ui/core/FormLabel';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Select from '@material-ui/core/Select';
import PioreactorIcon from "./PioreactorIcon"


const useStyles = makeStyles((theme) => ({
  textFieldCompact: {
    marginTop: theme.spacing(3),
    marginRight: theme.spacing(2),
    marginBottom: theme.spacing(0),
    width: "30ch",
  },
  formControl: {
    marginTop: theme.spacing(2)
  },
  unitTitle: {
    fontSize: 17,
    color: "rgba(0, 0, 0, 0.87)",
  },
  unitTitleDialog :{
    fontSize: 20,
    color: "rgba(0, 0, 0, 0.87)",
  },
  suptitle: {
    fontSize: "13px",
    color: "rgba(0, 0, 0, 0.60)",
  },
}));

function SilentForm(props){
  const classes = useStyles();
  const defaults = {duration: 60}

  useEffect(() => {
    props.updateParent(defaults)
  }, [])


  const onSettingsChange = (e) => {
    props.updateParent({[e.target.id]: e.target.value})
  }

  return (
      <TextField
        size="small"
        id="duration"
        label="Duration between events"
        defaultValue={defaults.duration}
        InputProps={{
          endAdornment: <InputAdornment position="end">min</InputAdornment>,
        }}
        variant="outlined"
        onChange={onSettingsChange}
        className={classes.textFieldCompact}
      />
)}

function PIDTurbidostatForm(props){
  const classes = useStyles();
  const defaults = {duration: 30, volume: 0.75, target_od: 1.5, skip_first_run: false}

  useEffect(() => {
    props.updateParent(defaults)
  }, [])


  const onSettingsChange = (e) => {
    props.updateParent({[e.target.id]: e.target.value})
  }

  return (
      <div>
        <TextField
          size="small"
          id="duration"
          defaultValue={defaults.duration}
          InputProps={{
            endAdornment: <InputAdornment position="end">min</InputAdornment>,
          }}
          variant="outlined"
          onChange={onSettingsChange}
          className={classes.textFieldCompact}
          label="Duration between events"
        />
        <TextField
          size="small"
          id="volume"
          label="Max volume"
          defaultValue={defaults.volume}
          InputProps={{
            endAdornment: <InputAdornment position="end">mL</InputAdornment>,
          }}
          variant="outlined"
          onChange={onSettingsChange}
          className={classes.textFieldCompact}
        />
        <TextField
          size="small"
          id="target_od"
          label="Target OD"
          defaultValue={defaults.target_od}
          InputProps={{
            endAdornment: <InputAdornment position="end">AU</InputAdornment>,
          }}
          variant="outlined"
          onChange={onSettingsChange}
          className={classes.textFieldCompact}
        />
    </div>
)}

function PIDMorbidostatForm(props){
  const classes = useStyles();
  const defaults = {duration: 60, target_growth_rate: 0.1, target_od: 1.5}

  useEffect(() => {
    props.updateParent(defaults)
  }, [])

  const onSettingsChange = (e) => {
    props.updateParent({[e.target.id]: e.target.value})
  }

  return (
      <div>
        <TextField
          size="small"
          id="duration"
          label="Duration between events"
          defaultValue={defaults.duration}
          InputProps={{
            endAdornment: <InputAdornment position="end">min</InputAdornment>,
          }}
          variant="outlined"
          onChange={onSettingsChange}
          className={classes.textFieldCompact}
        />
        <TextField
          size="small"
          id="target_od"
          label="Target OD"
          defaultValue={defaults.target_od}
          InputProps={{
            endAdornment: <InputAdornment position="end">AU</InputAdornment>,
          }}
          variant="outlined"
          onChange={onSettingsChange}
          className={classes.textFieldCompact}
        />
        <TextField
          size="small"
          id="target_growth_rate"
          label="Target growth rate"
          defaultValue={defaults.target_growth_rate}
          InputProps={{
            endAdornment: <InputAdornment position="end">h⁻¹</InputAdornment>,
          }}
          variant="outlined"
          onChange={onSettingsChange}
          className={classes.textFieldCompact}
        />
    </div>
)}


function ChemostatForm(props){
  const classes = useStyles();
  const defaults = {duration: 20, volume: 0.5}

  useEffect(() => {
    props.updateParent(defaults)
  }, [])

  const onSettingsChange = (e) => {
    props.updateParent({[e.target.id]: e.target.value})
  }

  return (
      <div>
        <TextField
          size="small"
          id="duration"
          label="Duration between events"
          defaultValue={defaults.duration}
          InputProps={{
            endAdornment: <InputAdornment position="end">min</InputAdornment>,
          }}
          variant="outlined"
          onChange={onSettingsChange}
          className={classes.textFieldCompact}
        />
        <TextField
          size="small"
          id="volume"
          label="Volume"
          defaultValue={defaults.volume}
          InputProps={{
            endAdornment: <InputAdornment position="end">mL</InputAdornment>,
          }}
          variant="outlined"
          onChange={onSettingsChange}
          className={classes.textFieldCompact}
        />
    </div>
)}


function ContinuousCycleForm(props){
  const classes = useStyles();
  const defaults = {duration: 0.17, volume: 0.25, skip_first_run: true}

  useEffect(() => {
    props.updateParent(defaults)
  }, [])

  const onSettingsChange = (e) => {
    props.updateParent({[e.target.id]: e.target.value})
  }

  return (
      <div>
        <TextField
          size="small"
          id="duration"
          label="Duration between events"
          defaultValue={defaults.duration}
          InputProps={{
            endAdornment: <InputAdornment position="end">min</InputAdornment>,
          }}
          variant="outlined"
          onChange={onSettingsChange}
          className={classes.textFieldCompact}
        />
        <TextField
          size="small"
          id="volume"
          label="Volume"
          defaultValue={defaults.volume}
          InputProps={{
            endAdornment: <InputAdornment position="end">mL</InputAdornment>,
          }}
          variant="outlined"
          onChange={onSettingsChange}
          className={classes.textFieldCompact}
        />
    </div>
)}




function ButtonChangeDosingDialog(props) {
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  const [algoSettings, setAlgoSettings] = useState({dosing_automation: "silent", skip_first_run: false})
  const [isClicked, setIsClicked] = useState(false)
  const [client, setClient] = useState(null)

  const algos = [
    {name: "Silent", key: "silent"},
    {name: "Chemostat", key: "chemostat"},
    {name: "PID Morbidostat",  key: "pid_morbidostat"},
    {name: "PID Turbidostat",  key: "pid_turbidostat"},
    {name: "Continuous Cycle",  key: "continuous_cycle"},
  ]

  useEffect(() => {
    // MQTT - client ids should be unique
    if (!props.config['network.topology']){
      return
    }

    var client
    if (props.config.remote && props.config.remote.ws_url) {
      client = new Client(
        `ws://${props.config.remote.ws_url}/`,
        "webui_ButtonChangeDosingDialog" + Math.random()
      )}
    else {
      client = new Client(
        `${props.config['network.topology']['leader_address']}`, 9001,
        "webui_ButtonChangeDosingDialog" + Math.random()
      );
    }

    client.connect({timeout: 180});
    setClient(client)
  },[props.config])

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleAlgoSelectionChange = (e) => {
    setAlgoSettings({dosing_automation: e.target.value, skip_first_run: algoSettings.skip_first_run})
  }

  const handleSkipFirstRunChange = (e) => {
    setAlgoSettings({...algoSettings, skip_first_run: e.target.checked})
  }

  const updateFromChild = (setting) => {
    setAlgoSettings(prevState => ({...prevState, ...setting}))
  }

  const switchToForm = () => {
    switch(algoSettings.dosing_automation) {
      case "silent":
        return <SilentForm updateParent={updateFromChild}/>
      case "pid_turbidostat":
        return <PIDTurbidostatForm updateParent={updateFromChild}/>
      case "pid_morbidostat":
        return <PIDMorbidostatForm updateParent={updateFromChild}/>
      case "chemostat":
        return <ChemostatForm updateParent={updateFromChild}/>
      case "continuous_cycle":
        return <ContinuousCycleForm updateParent={updateFromChild}/>
      default:
        return <div></div>
    }
  }

  const onSubmit = (event) => {
    event.preventDefault()
    setIsClicked(true)
    var message = new Message(JSON.stringify(algoSettings));
    message.destinationName = [
      "pioreactor",
      props.unit,
      props.experiment,
      "dosing_control",
      "dosing_automation",
      "set",
    ].join("/");
    message.qos = 2;
    try{
      client.publish(message);
    }
    catch (e){
      console.log(e)
    }
    setOpen(false);
  }
  return (
    <div>
    <Button
      style={{marginTop: "10px"}}
      size="small"
      color="primary"
      disabled={!props.currentDosingautomation}
      onClick={handleClickOpen}
    >
      Change dosing automation
    </Button>
    <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title" PaperProps={{style: {height: "100%"}}}>
      <DialogTitle>
        <Typography className={classes.suptitle}>
          <PioreactorIcon style={{verticalAlign: "middle", fontSize: "1.2em"}}/> {props.title || ((props.config['ui.rename'] && props.config['ui.rename'][props.unit]) ? `${props.config['ui.rename'][props.unit]} (${props.unit})` : `${props.unit}`)}
        </Typography>
        <Typography className={classes.unitTitleDialog}>
          Dosing automation
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" component="p" gutterBottom>
          Dosing automations control when and how much media to add to the Pioreactor. The settings below can be changed later. Learn more about <a target="_blank" rel="noopener noreferrer" href="https://pioreactor.com/pages/Dosing-automations">dosing automations</a>.
        </Typography>

        <form>
          <FormControl component="fieldset" className={classes.formControl}>
            <FormLabel component="legend">Automation</FormLabel>
            <Select
              native
              value={algoSettings.mode}
              onChange={handleAlgoSelectionChange}
              style={{maxWidth: "200px"}}
            >
              {algos.map((v) => <option id={v.key} value={v.key} key={"change-io" + v.key}>{v.name}</option>)}
            </Select>
            {switchToForm()}
            <FormControlLabel
              control={<Checkbox checked={algoSettings.skip_first_run}
                                  color="primary"
                                  onChange={handleSkipFirstRunChange}
                                  size="small"/>
                      }
              label="Skip first run"
            />
            <Button
              type="submit"
              variant="contained"
              color={isClicked ? "default" : "primary" }
              onClick={onSubmit}
              style={{width: "120px", marginTop: "20px"}}
            >
              Submit
            </Button>
          </FormControl>
        </form>


      </DialogContent>
    </Dialog>
    </div>
)}


export default ButtonChangeDosingDialog;
