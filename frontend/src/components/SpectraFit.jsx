import * as React from "react";
import { VictoryAxis, VictoryChart, VictoryLine, VictoryScatter, VictoryTooltip, VictoryTheme } from "victory";

function SpectraFit( props ) {
  var fitLine = null;
  var lowerBound = null;
  var upperBound = null;
  var measurements = [];
  if ( props.data != null ) {
    const spectralFit = props.data.spectralFit;
    fitLine = [];
    for (var i = 0; i < spectralFit.fit.frequencies.length; i++) {
      fitLine.push( {x: spectralFit.fit.frequencies[i],
                     y: spectralFit.fit.values[i]}); 
    }
    lowerBound = [];
    for (var i = 0; i < spectralFit['bruneLowerBound-2'].frequencies.length; i++) {
      lowerBound.push( {x: spectralFit['bruneLowerBound-2'].frequencies[i],
                        y: spectralFit['bruneLowerBound-2'].values[i]} );
    }
    upperBound = [];
    for (var i = 0; i < spectralFit['bruneUpperBound-2'].frequencies.length; i++) {
      upperBound.push( {x: spectralFit['bruneUpperBound-2'].frequencies[i],
                        y: spectralFit['bruneUpperBound-2'].values[i]} );
    }
    const stationMeasurements = props.data.stationMeasurements;
    for (var i = 0; i < stationMeasurements.length; i++) {
      var points = [];
      for (var j = 0; j < stationMeasurements[i].measurements.length; j++) {
        const residual  = stationMeasurements[i].measurements[j].residual.toFixed(3);
        points.push({x: stationMeasurements[i].measurements[j].centerFrequency,
                     y: stationMeasurements[i].measurements[j].value,
                     label: `${stationMeasurements[i].station}: ${residual}`,
                     size: 3});
      }
      var measurement = {id: stationMeasurements[i].station,
                         points: points.slice()};
      measurements.push(measurement);
    }
  }
  return (
    <React.Fragment>
      <VictoryChart
       responsive={true}
       theme={VictoryTheme.grayscale}
       scale={{x: "log", y: "linear"}}
       padding={25}
      >
        <VictoryAxis
         label="Frequency (Hz)"
         style={{
           grid: {stroke: "grey"},
           tickLabels: {fontSize: 6, padding: 1},
           ticks: {stroke: "grey", size: 5},
           axisLabel: {fontSize: 10, padding: 14},
         }}
        />
        <VictoryAxis
         dependentAxis
         label="log10 dyne-cm"
         style={{
           grid: {stroke: "grey"},
           tickLabels: {fontSize: 6, padding: 1}, 
           ticks: {stroke: "grey", size: 5}, 
           axisLabel: {fontSize: 8, padding: 20},
         }}
        />
        <VictoryLine
         style={{
           data: { stroke: "black" },
           parent: { border: "1px solid #ccc"}
         }}
         interpolation={"linear"}
         data={fitLine}
        />
        <VictoryLine
         style={{
           data: { stroke: "gray" },
           parent: { border: "1px solid #ccc"}
         }}
         interpolation={"linear"}
         data={lowerBound}
        />
        <VictoryLine
         style={{
           data: { stroke: "gray" },
           parent: { border: "1px solid #ccc"}
         }}
         interpolation={"linear"}
         data={upperBound}
        />
        {measurements.map( (measurement) => (
             <VictoryScatter
              labelComponent={<VictoryTooltip style={{fontSize: '8px'}}/>}
              size={3}
              key={measurement.id}
              data={measurement.points}
             />
         ))
        }
      </VictoryChart>
    </React.Fragment>
  );
}

export default SpectraFit;
