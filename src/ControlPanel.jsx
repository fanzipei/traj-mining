import React from 'react';
import './App.css';
import { makeStyles } from '@material-ui/core/styles';
import { Slider, Button } from '@material-ui/core';
import { DrawLineStringMode, DrawPointMode } from 'nebula.gl';

const useStyles = makeStyles({
  root: {
    width: 800,
  },
});

export default function ControlPanel(props) {
  const { pause, resume, time, min_time, max_time, setTime, setMode } = props;
  const classes = useStyles();
  return (
    <div id='top-left-container'>
      <div id='title-box'>Control Panel</div>
      <div id='divinfo' className={classes.root}>
        <Slider
          value={time}
          onChangeCommitted={(e, v) => setTime(v) || resume()}
          onChange={(e, v) => setTime(v) || pause()}
          min={min_time}
          max={max_time}
          width={800}
        />
        <Button
          variant='contained'
          color='primary'
          onClick={() => setMode(() => DrawLineStringMode)}>
          Draw a Trajectory
        </Button>
        <Button
          variant='contained'
          color='primary'
          onClick={() => setMode(() => DrawPointMode)}>
          Draw a Point
        </Button>
      </div>
    </div>
  );
}
