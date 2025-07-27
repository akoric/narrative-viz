const svg = d3.select("svg");

function drawScene1() {
  svg.selectAll("*").remove();
  svg.append("circle")
    .attr("cx", 200)
    .attr("cy", 250)
    .attr("r", 40)
    .attr("fill", "steelblue");
}

function drawScene2() {
  svg.selectAll("*").remove();
  svg.append("rect")
    .attr("x", 100)
    .attr("y", 150)
    .attr("width", 200)
    .attr("height", 100)
    .attr("fill", "orange");
}

let currentScene = 1;

d3.select("#nextBtn").on("click", () => {
  currentScene = currentScene === 1 ? 2 : 1;
  if (currentScene === 1) drawScene1();
  else drawScene2();
});

drawScene1(); // Start with scene 1