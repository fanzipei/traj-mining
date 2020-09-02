import React, { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import StaticMap from 'react-map-gl';
import axios from 'axios';
import { TripsLayer } from '@deck.gl/geo-layers';
import {
  EditableGeoJsonLayer,
  ViewMode,
  ModifyMode,
  DrawLineStringMode,
  DrawPointMode,
} from 'nebula.gl';
import ControlPanel from './ControlPanel';
import randomColor from 'random-color';

const MAPBOX_ACCESS_TOKEN =
  'pk.eyJ1IjoiZmFuemlwZWkwNzI1IiwiYSI6ImNqb2s3cjg5dDA1dnYzcW01ejNjbjV6dGcifQ.Gygtel_iW4EBBy2OfLUy8w';

const TRIPS_URL = 'http://127.0.0.1:9999/randomsample';
const QUERY_POINT_URL = 'http://127.0.0.1:9999/querypoint';
const QUERY_TRAJ_URL = 'http://127.0.0.1:9999/querytraj';

const INITIAL_VIEW_STATE = {
  latitude: 35.5,
  longitude: 139.5,
  zoom: 8,
};

const MAP_STYLE = 'mapbox://styles/mapbox/dark-v9';

const DEFAULT_THEME = {
  trailColor0: [253, 128, 93],
  trailColor1: [23, 184, 190],
  trailColor2: [43, 204, 80],
};

const LOOP_LENGTH = 86400;
const DEFAULT_SPEED = 10;

export default function DisplayMap() {
  const [time, setTime] = useState(0);
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const [mode, setMode] = useState(() => ViewMode);
  const [traj, setTraj] = useState({});
  const [animation] = useState({});
  const [featCollection, setFeatCollection] = useState({
    type: 'FeatureCollection',
    features: [],
  });
  const [id, setId] = useState(0);

  const [selectedFeatureIndexes, setSelectedFeatureIndexes] = useState([]);

  const resume = () => {
    setSpeed(DEFAULT_SPEED);
  };

  const pause = () => {
    setSpeed(0);
  };

  const onHoverDraw = (info) => {
    if (mode === ModifyMode || mode === ViewMode) {
      if (
        mode !== DrawLineStringMode &&
        info !== undefined &&
        info.object !== undefined &&
        (info.object.geometry.type !== 'Point' ||
          info.object.properties.featureIndex === undefined)
      ) {
        setSelectedFeatureIndexes([info.index]);
        setMode(() => ModifyMode);
      }
    }
  };

  const animate = () => {
    setTime((t) => (t + speed) % LOOP_LENGTH);
    animation.id = window.requestAnimationFrame(animate);
  };

  useEffect(() => {
    animation.id = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animation.id);
  }, [animation, speed]);

  useEffect(() => {
    axios
      .get(TRIPS_URL, { params: { n: 500 } })
      .then((sample_traj) => setTraj(sample_traj.data));
  }, []);

  const queryPoint = (feat) => {
    axios.get(QUERY_POINT_URL, {
      params: {
        lon: feat.geometry.coordinates[0],
        lat: feat.geometry.coordinates[1],
        id: feat.properties.id,
      },
    });
  };

  const queryTraj = (feat) => {
    axios.get(QUERY_TRAJ_URL, {
      params: {
        lon: feat.geometry.coordinates[0],
        lat: feat.geometry.coordinates[1],
        id: feat.properties.id,
      },
    });
  };

  return (
    <div>
      <ControlPanel
        time={time}
        setTime={setTime}
        setMode={setMode}
        min_time={0}
        max_time={LOOP_LENGTH}
        pause={pause}
        resume={resume}
      />
      <DeckGL
        onHover={onHoverDraw}
        pickingRadius={30}
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}>
        <EditableGeoJsonLayer
          id='geojson-layer'
          data={featCollection}
          mode={mode}
          opacity={0.5}
          getLineColor={(d) => d.properties['color']}
          getLineWidth={6}
          selectedFeatureIndexes={selectedFeatureIndexes}
          onEdit={({ updatedData, editType }) => {
            setFeatCollection(updatedData);
            console.log(editType);
            if (editType === 'addFeature') {
              const rgb = randomColor(0.8, 0.99).rgbArray();
              const lastIndex = updatedData.features.length - 1;
              const feat = updatedData.features[lastIndex];
              feat.properties = {
                ...feat.properties,
                color: rgb,
                id: id,
              };
              setId(id + 1);
              setMode(() => ViewMode);

              if (mode === DrawPointMode) {
                queryPoint(feat);
              } else if (mode === DrawLineStringMode) {
                queryTraj(feat);
              }
            } else if (editType === 'finishMovePosition') {
              if (selectedFeatureIndexes.length > 0) {
                const feat = updatedData.features[selectedFeatureIndexes[0]];
                if (feat.geometry.type === 'Point') {
                  queryPoint(feat);
                } else if (feat.geometry.type === 'LineString') {
                  queryTraj(feat);
                }
              }
            }
          }}
        />
        <StaticMap
          mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN}
          mapStyle={MAP_STYLE}
          reuseMap
          preventStyleDiffing={true}
        />
        <TripsLayer
          id='trips'
          data={traj}
          getPath={(d) => d.path}
          getTimestamps={(d) => d.timestamps}
          getColor={(d) => DEFAULT_THEME.trailColor0}
          opacity={0.3}
          widthMinPixels={5}
          rounded={true}
          trailLength={1200}
          currentTime={time}
          pickable={false}
          highlightColor={DEFAULT_THEME.trailColor1}
          autoHighlight={true}
        />
      </DeckGL>
    </div>
  );
}
