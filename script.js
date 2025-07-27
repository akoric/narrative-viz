const svg = d3.select("svg");

function drawScene1() {
  svg.selectAll("*").remove();

  svg.append("circle")
    .attr("cx", 200)
    .attr("cy", 250)
    .attr("r", 40)
    .attr("fill", "steelblue");

  // Add d3-annotation callout
  const annotations = [
    {
      note: {
        label: "This is a key circle",
        title: "Scene 1"
      },
      x: 200,
      y: 250,
      dx: 50,
      dy: -40
    }
  ];

  const makeAnnotations = d3.annotation().annotations(annotations);
  svg.append("g").call(makeAnnotations);
}

function drawScene2() {
  svg.selectAll("*").remove();

  svg.append("rect")
    .attr("x", 100)
    .attr("y", 150)
    .attr("width", 200)
    .attr("height", 100)
    .attr("fill", "orange");

  // Test dummy TopoJSON usage
  const dummyTopoJSON = {
    type: "Topology",
    objects: {
      dummy: {
        type: "GeometryCollection",
        geometries: [
          { type: "Point", coordinates: [0, 0] }
        ]
      }
    },
    arcs: []
  };

  const geojson = topojson.feature(dummyTopoJSON, dummyTopoJSON.objects.dummy);
  console.log("Converted GeoJSON from TopoJSON:", geojson);
}

let currentScene = 1;

d3.select("#nextBtn").on("click", () => {
  currentScene = currentScene === 1 ? 2 : 1;
  if (currentScene === 1) drawScene1();
  else drawScene2();
});

drawScene1();