const state = {
  scene: 1,
  season: "2015/16",
  club: null,
  stat: "Position"
};

let leagueData = {};
let clubData = {};
let aggregatedData = [];

const margin = { top: 60, right: 60, bottom: 80, left: 120 };
const svgWidth = 1000;
const svgHeight = 600;
const width = svgWidth - margin.left - margin.right;
const height = svgHeight - margin.top - margin.bottom;

const neutralColors = d3.schemeSet3;

// club colors
const clubColors = {
  "Arsenal": "#EF0107",
  "Aston Villa": "#95BFE5",
  "Bournemouth": "#DA020E",
  "Brentford": "#FFD700",
  "Brighton & Hove Albion": "#0057B8",
  "Burnley": "#6C1D45",
  "Cardiff City": "#0070F3",
  "Chelsea": "#034694",
  "Crystal Palace": "#1B458F",
  "Everton": "#003399",
  "Fulham": "#000000",
  "Huddersfield Town": "#0E63AD",
  "Hull City": "#F5A623",
  "Leeds United": "#FFCD00",
  "Leicester City": "#003090",
  "Liverpool": "#C8102E",
  "Manchester City": "#6CABDD",
  "Manchester United": "#DA020E",
  "Middlesbrough": "#DC143C",
  "Newcastle United": "#241F20",
  "Norwich City": "#FFF200",
  "Nottingham Forest": "#DD0000",
  "Sheffield United": "#EE2737",
  "Southampton": "#D71920",
  "Stoke City": "#E03A3E",
  "Sunderland": "#EB172B",
  "Swansea City": "#000000",
  "Tottenham Hotspur": "#132257",
  "Watford": "#FBEE23",
  "West Bromwich Albion": "#122F67",
  "West Ham United": "#7A263A",
  "Wolverhampton Wanderers": "#FDB462"
};

const annoStyle = {
  connector: { stroke: "#666", strokeWidth: 1 },
  title: { fontSize: "12px", fontWeight: "bold" },
  label: { fontSize: "10px", padding: 5, wrap: 100 }
};

// fun facts for anotations
const funFacts = {
  overview: [
    {
      season: "2015/16",
      fact: "Leicester City's miracle season at 5000:1 odds with just £36.8m spend"
    },
    {
      season: "2017/18", 
      fact: "Record £1.46bn total league spending - Manchester City's centurions"
    },
    {
      season: "2022/23",
      fact: "Spending doubled to £2.0bn - Chelsea leads with £180m despite 12th place"
    }
  ],
  seasons: {
    "2015/16": {
      champion: "Leicester City won at 5000:1 odds, spending just £36.8m",
      topSpender: "Manchester City topped spending with £196.32m"
    },
    "2016/17": {
      champion: "Chelsea won 30/38 games under Conte's 3-4-3",
      topSpender: "Manchester City led spending with £208.0m"
    },
    "2017/18": {
      champion: "Manchester City hit 100 points, first ever",
      topSpender: "Manchester City also led spending with £316.3m"
    },
    "2018/19": {
      champion: "Manchester City won the domestic treble",
      topSpender: "Chelsea topped spending with £222m"
    },
    "2019/20": {
      champion: "Liverpool ended 30-year wait, clinching 7 games early",
      topSpender: "Manchester United led spending with £160m"
    },
    "2020/21": {
      champion: "Manchester City set record of 12 away wins",
      topSpender: "Manchester United topped spending with £138m"
    },
    "2021/22": {
      champion: "Manchester City won 4 trophies including PL",
      topSpender: "Newcastle United led spending with £245m"
    },
    "2022/23": {
      champion: "Manchester City completed continental treble",
      topSpender: "Chelsea topped spending with £617.29m, largest ever to date"
    }
  }
};

async function loadData() {
  try {
    const seasons = ["2015/16", "2016/17", "2017/18", "2018/19", "2019/20", "2020/21", "2021/22", "2022/23"];
    const fileMap = {
      "2015/16": "epl201516_leaguetable_enriched_normalized.csv",
      "2016/17": "epl201617_leaguetable_enriched_normalized.csv", 
      "2017/18": "epl201718_leaguetable_enriched_normalized.csv",
      "2018/19": "epl201819_leaguetable_enriched_normalized.csv",
      "2019/20": "epl201920_leaguetable_enriched_normalized.csv",
      "2020/21": "epl202021_leaguetable_enriched_normalized.csv",
      "2021/22": "epl202122_leaguetable_enriched_normalized.csv",
      "2022/23": "epl202223_leaguetable_enriched_normalized.csv"
    };

    // load league tables
    for (const season of seasons) {
      const filename = fileMap[season];
      const data = await d3.csv(`Data/epl_leaguetables/${filename}`);
      leagueData[season] = data.map(d => ({
        ...d,
        Position: +d.Position,
        Wins: +d.Wins,
        Draws: +d.Draws,
        Losses: +d.Losses,
        Points: +d.Points,
        GoalsScored: +d.GoalsScored,
        GoalsConceded: +d.GoalsConceded,
        GoalDiff: +d.GoalDiff,
        Clean_Sheet: +d.Clean_Sheet,
        Passes: +d.Passes.replace(/,/g, ''),
        PassesPerMatch: +d.PassesPerMatch,
        PassAccuracy: +d["PassAccuracy%"].replace('%', ''),
        Crosses: +d.Crosses,
        CrossAccuracy: +d["CrossAccuracy%"].replace('%', ''),
        TotalExpenditure: +d["Total Expenditure (Millions £)"]
      }));
    }

    // aggreate data for Scene 1
    aggregatedData = seasons.map(season => {
      const seasonData = leagueData[season];
      const totalSpending = d3.sum(seasonData, d => d.TotalExpenditure);
      const champion = seasonData.find(d => d.Position === 1);
      const topSpender = seasonData.reduce((max, d) => d.TotalExpenditure > max.TotalExpenditure ? d : max);
      
      return {
        season,
        totalSpending,
        champion: champion.Club,
        championSpend: champion.TotalExpenditure,
        topSpender: topSpender.Club,
        topSpenderAmount: topSpender.TotalExpenditure
      };
    });

    console.log("Data loaded successfully:", { leagueData, aggregatedData });
    
    render();
    
  } catch (error) {
    console.error("Error loading data:", error);
  }
}

function render() {
  d3.select("#main-svg").selectAll("*").remove();
  d3.select("#controls-panel").html("");
  d3.select("#club-header").remove();
  d3.selectAll(".tooltip").remove();
  
  switch (state.scene) {
    case 1:
      renderScene1();
      break;
    case 2:
      renderScene2();
      break;
    case 3:
      renderScene3();
      break;
  }
  updateNavigationHints();
}

// scene 1: overview
function renderScene1() {
  const svg = d3.select("#main-svg");
  const g = svg.append("g")
    .attr("transform", `translate(${60},${margin.top})`);

  const xScale = d3.scaleBand()
    .domain(aggregatedData.map(d => d.season))
    .range([0, svgWidth - 120])
    .padding(0.1);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(aggregatedData, d => d.totalSpending)])
    .range([height, 0]);

  const colorScale = d3.scaleOrdinal(neutralColors);

  // grid lines
  g.selectAll(".grid-line")
    .data(yScale.ticks(6))
    .enter().append("line")
    .attr("class", "grid-line")
    .attr("x1", 0)
    .attr("x2", svgWidth - 120)
    .attr("y1", d => yScale(d))
    .attr("y2", d => yScale(d));

  // axes
  g.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale));

  g.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(yScale).tickFormat(d => `£${d/1000}B`));

  // labels
  g.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - 45)
    .attr("x", 0 - (height / 2))
    .style("text-anchor", "middle")
    .text("Total League Spending");

  g.append("text")
    .attr("class", "axis-label")
    .attr("transform", `translate(${(svgWidth - 120) / 2}, ${height + margin.bottom - 20})`)
    .style("text-anchor", "middle")
    .text("Season");

  let tooltip = d3.select(".tooltip");
  if (tooltip.empty()) {
    tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);
  }

  // bars
  g.selectAll(".bar")
    .data(aggregatedData)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", d => xScale(d.season))
    .attr("width", xScale.bandwidth())
    .attr("y", d => yScale(d.totalSpending))
    .attr("height", d => height - yScale(d.totalSpending))
    .attr("fill", (d, i) => colorScale(i))
    .on("mouseover", function(event, d) {
      d3.select(this).style("opacity", 0.8);
      tooltip.transition().duration(200).style("opacity", .9);
      tooltip.html(`
        <strong>${d.season}</strong><br/>
        Total Spending: £${(d.totalSpending/1000).toFixed(2)}B<br/>
        <hr style="margin: 8px 0; border: 1px solid #555;"/>
        Champion: ${d.champion} (£${d.championSpend}M)<br/>
        Top Spender: ${d.topSpender} (£${d.topSpenderAmount}M)
      `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function(d) {
      d3.select(this).style("opacity", 1);
      tooltip.transition().duration(500).style("opacity", 0);
    })
    .on("click", function(event, d) {
      state.season = d.season;
      state.scene = 2;
      render();
    });

  // bar lables
  g.selectAll(".bar-label")
    .data(aggregatedData)
    .enter().append("text")
    .attr("class", "bar-label")
    .attr("x", d => xScale(d.season) + xScale.bandwidth() / 2)
    .attr("y", d => yScale(d.totalSpending) - 5)
    .text(d => `£${(d.totalSpending/1000).toFixed(1)}B`);

  addScene1Annotations(g, xScale, yScale);
}

function addScene1Annotations(g, xScale, yScale) {
  const annotations = [
    {
      note: {
        label: "Signing Mesut Özil accounted for nearly 60% of Arsenal’s entire spend that season",
        title: "Arsenal’s Big Bet",
        wrap: 120
      },
      x: xScale("2015/16") + xScale.bandwidth() / 2,
      y: yScale(aggregatedData.find(d => d.season === "2015/16").totalSpending),
      dy: -120,
      dx: 50
    },
    {
      note: {
        label: "The “Big 6” clubs account for ~70% of the net spend across all 8 seasons",
        title: "Net Spend Leaders",
        wrap: 120
      },
      x: xScale("2017/18") + xScale.bandwidth() / 2,
      y: yScale(aggregatedData.find(d => d.season === "2017/18").totalSpending),
      dy: -60,
      dx: -50
    },
    {
      note: {
        label: "Manchester City topped spending in 6 of 8 seasons",
        title: "Spending Dominance",
        wrap: 120
      },
      x: xScale("2022/23") + xScale.bandwidth() / 2,
      y: yScale(aggregatedData.find(d => d.season === "2022/23").totalSpending),
      dy: 40,
      dx: -140
    }
  ];

  const makeAnnotations = d3.annotation()
    .type(d3.annotationLabel)
    .annotations(annotations);

  g.append("g")
    .attr("class", "annotation")
    .call(makeAnnotations);
}

// scene 2: season detail
function renderScene2() {
  const seasonData = leagueData[state.season].sort((a, b) => a.Position - b.Position);
  
  const svg = d3.select("#main-svg");
  const scene2Margin = { top: 80, right: 60, bottom: 80, left: 200 };
  const scene2Width = svgWidth - scene2Margin.left - scene2Margin.right;
  const scene2Height = svgHeight - scene2Margin.top - scene2Margin.bottom;
  
  const g = svg.append("g")
    .attr("transform", `translate(${scene2Margin.left},${scene2Margin.top})`);

  // Add title for the scene
  svg.append("text")
    .attr("x", svgWidth / 2)
    .attr("y", 40)
    .attr("text-anchor", "middle")
    .style("font-size", "24px")
    .style("font-weight", "bold")
    .text(`${state.season} Season: Club Transfer Spending`);

  // relegated teams
  svg.append("text")
    .attr("x", svgWidth / 2)
    .attr("y", 65)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("fill", "#e74c3c")
    .text("Note: Red Text Indicates Relegated Teams");

  const yScale = d3.scaleBand()
    .domain(seasonData.map(d => d.Club))
    .range([0, scene2Height])
    .padding(0.1);

  const xScale = d3.scaleLinear()
    .domain([0, d3.max(seasonData, d => d.TotalExpenditure)])
    .range([0, scene2Width]);

  g.selectAll(".grid-line")
    .data(xScale.ticks(6))
    .enter().append("line")
    .attr("class", "grid-line")
    .attr("x1", d => xScale(d))
    .attr("x2", d => xScale(d))
    .attr("y1", 0)
    .attr("y2", scene2Height);

  g.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${scene2Height})`)
    .call(d3.axisBottom(xScale).tickFormat(d => `£${d}M`));

  g.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(yScale))
    .selectAll("text")
    .style("fill", d => {
      const clubData = seasonData.find(club => club.Club === d);
      return clubData && clubData.Position >= 18 ? "#e74c3c" : "#000";
    })
    .style("cursor", "pointer")
    .on("click", function(event, d) {
      const clubData = seasonData.find(club => club.Club === d);
      if (clubData) {
        state.club = clubData.Club;
        state.scene = 3;
        render();
      }
    })
    .on("mouseover", function(event, d) {
      d3.select(this).style("text-decoration", "underline");
    })
    .on("mouseout", function(event, d) {
      d3.select(this).style("text-decoration", "none");
    });

  // Add position numbers on the right
  g.append("g")
    .attr("class", "position-axis")
    .attr("transform", `translate(${scene2Width + 15}, 0)`)
    .selectAll("text")
    .data(seasonData)
    .enter().append("text")
    .attr("x", 0)
    .attr("y", d => yScale(d.Club) + yScale.bandwidth() / 2)
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle")
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .style("fill", d => d.Position >= 18 ? "#e74c3c" : "#666")
    .text(d => d.Position);

  g.append("text")
    .attr("class", "axis-label")
    .attr("transform", `translate(${scene2Width / 2}, ${scene2Height + scene2Margin.bottom - 20})`)
    .style("text-anchor", "middle")
    .text("Transfer Expenditure (£ Millions)");

  g.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - scene2Margin.left + 50)
    .attr("x", 0 - (scene2Height / 2))
    .style("text-anchor", "middle")
    .text("Club (by League Position)");

  let tooltip = d3.select(".tooltip");
  if (tooltip.empty()) {
    tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);
  }

  g.selectAll(".bar")
    .data(seasonData)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", 0)
    .attr("y", d => yScale(d.Club))
    .attr("width", d => xScale(d.TotalExpenditure))
    .attr("height", yScale.bandwidth())
    .attr("fill", d => clubColors[d.Club] || "#69b3a2")
    .on("mouseover", function(event, d) {
      d3.select(this).style("opacity", 0.8);
      tooltip.transition().duration(200).style("opacity", .9);
      tooltip.html(`
        <strong>${d.Club}</strong><br/>
        Position: ${d.Position}<br/>
        Spending: £${d.TotalExpenditure}M<br/>
        <hr style="margin: 8px 0; border: 1px solid #555;"/>
        Record: ${d.Wins}W - ${d.Draws}D - ${d.Losses}L<br/>
        Points: ${d.Points}
      `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function(d) {
      d3.select(this).style("opacity", 1);
      tooltip.transition().duration(500).style("opacity", 0);
    })
    .on("click", function(event, d) {
      state.club = d.Club;
      state.scene = 3;
      render();
    });

  addBackButton(2);
  addScene2Annotations(g, xScale, yScale, seasonData, scene2Width, scene2Height);
}

function addScene2Annotations(g, xScale, yScale, seasonData, chartWidth, chartHeight) {
  const seasonFacts = funFacts.seasons[state.season];
  const champion = seasonData.find(d => d.Position === 1);
  const topSpender = seasonData.reduce((max, d) => d.TotalExpenditure > max.TotalExpenditure ? d : max);

  let annotations = [];

  // Season-specific annotation positioning
  switch (state.season) {
    case "2015/16":
      annotations = [
        {
          note: { label: seasonFacts.champion, title: "Champion", wrap: 150 },
          x: xScale(champion.TotalExpenditure),
          y: yScale(champion.Club) + yScale.bandwidth() / 2,
          dy: 0, dx: 200
        },
        {
          note: { label: seasonFacts.topSpender, title: "Top Spender", wrap: 150 },
          x: xScale(topSpender.TotalExpenditure),
          y: yScale(topSpender.Club) + yScale.bandwidth() / 2,
          dy: -30, dx: -60
        }
      ];
      break;
    
    case "2016/17":
      annotations = [
        {
          note: { label: seasonFacts.champion, title: "Champion", wrap: 150 },
          x: xScale(champion.TotalExpenditure),
          y: yScale(champion.Club) + yScale.bandwidth() / 2,
          dy: -1, dx: 120
        },
        {
          note: { label: seasonFacts.topSpender, title: "Top Spender", wrap: 150 },
          x: xScale(topSpender.TotalExpenditure),
          y: yScale(topSpender.Club) + yScale.bandwidth() / 2,
          dy: 100, dx: -80
        }
      ];
      break;
      
    case "2017/18":
      annotations = [
        {
          note: { label: seasonFacts.champion, title: "Champion", wrap: 150 },
          x: xScale(champion.TotalExpenditure),
          y: yScale(champion.Club) + yScale.bandwidth() / 2,
          dy: 10, dx: -110
        },
        {
          note: { label: seasonFacts.topSpender, title: "Top Spender", wrap: 150 },
          x: xScale(topSpender.TotalExpenditure),
          y: yScale(topSpender.Club) + yScale.bandwidth() / 2,
          dy: 90, dx: -55
        }
      ];
      break;
      
    case "2018/19":
      const tottenhamData = seasonData.find(d => d.Club === "Tottenham Hotspur");
      annotations = [
        {
          note: { label: seasonFacts.champion, title: "Champion", wrap: 150 },
          x: xScale(champion.TotalExpenditure),
          y: yScale(champion.Club) + yScale.bandwidth() / 2,
          dy: 60, dx: 170
        },
        {
          note: { label: seasonFacts.topSpender, title: "Top Spender", wrap: 150 },
          x: xScale(topSpender.TotalExpenditure),
          y: yScale(topSpender.Club) + yScale.bandwidth() / 2,
          dy: 70, dx: -80
        },
        {
          note: { label: "Spent £0 on transfers this season - click club name for analysis", title: "Zero Spending", wrap: 120 },
          x: xScale(tottenhamData.TotalExpenditure),
          y: yScale(tottenhamData.Club) + yScale.bandwidth() / 2,
          dy: 0, dx: 250
        }
      ];
      break;
      
    case "2019/20":
      annotations = [
        {
          note: { label: seasonFacts.champion, title: "Champion", wrap: 150 },
          x: xScale(champion.TotalExpenditure),
          y: yScale(champion.Club) + yScale.bandwidth() / 2,
          dy: -30, dx: -60
        },
        {
          note: { label: seasonFacts.topSpender, title: "Top Spender", wrap: 150 },
          x: xScale(topSpender.TotalExpenditure),
          y: yScale(topSpender.Club) + yScale.bandwidth() / 2,
          dy: -30, dx: -50
        }
      ];
      break;
      
    case "2020/21":
      annotations = [
        {
          note: { label: seasonFacts.champion, title: "Champion", wrap: 150 },
          x: xScale(champion.TotalExpenditure),
          y: yScale(champion.Club) + yScale.bandwidth() / 2,
          dy: 0, dx: 100
        },
        {
          note: { label: seasonFacts.topSpender, title: "Top Spender", wrap: 150 },
          x: xScale(topSpender.TotalExpenditure),
          y: yScale(topSpender.Club) + yScale.bandwidth() / 2,
          dy: 70, dx: -80
        }
      ];
      break;
      
    case "2021/22":
      annotations = [
        {
          note: { label: seasonFacts.champion, title: "Champion", wrap: 150 },
          x: xScale(champion.TotalExpenditure),
          y: yScale(champion.Club) + yScale.bandwidth() / 2,
          dy: 20, dx: 30
        },
        {
          note: { label: seasonFacts.topSpender, title: "Top Spender", wrap: 150 },
          x: xScale(topSpender.TotalExpenditure),
          y: yScale(topSpender.Club) + yScale.bandwidth() / 2,
          dy: -30, dx: -70
        }
      ];
      break;
      
    case "2022/23":
      annotations = [
        {
          note: { label: seasonFacts.champion, title: "Champion", wrap: 150 },
          x: xScale(champion.TotalExpenditure),
          y: yScale(champion.Club) + yScale.bandwidth() / 2,
          dy: 10, dx: 250
        },
        {
          note: { label: seasonFacts.topSpender, title: "Top Spender", wrap: 150 },
          x: xScale(topSpender.TotalExpenditure),
          y: yScale(topSpender.Club) + yScale.bandwidth() / 2,
          dy: -30, dx: -80
        }
      ];
      break;
      
    default:
      annotations = [
        {
          note: { label: seasonFacts.champion, title: "Champion", wrap: 150 },
          x: xScale(champion.TotalExpenditure),
          y: yScale(champion.Club) + yScale.bandwidth() / 2,
          dy: 30, dx: 50
        },
        {
          note: { label: seasonFacts.topSpender, title: "Top Spender", wrap: 150 },
          x: xScale(topSpender.TotalExpenditure),
          y: yScale(topSpender.Club) + yScale.bandwidth() / 2,
          dy: -30, dx: -50
        }
      ];
  }

  const makeAnnotations = d3.annotation().type(d3.annotationLabel).annotations(annotations);
  g.append("g").attr("class", "annotation").call(makeAnnotations);
}

// scene 3: club trajectery
function renderScene3() {
  const clubLogoName = state.club.replace(/\s+/g, '_').replace('&', '&') + '.png';
  d3.select("#visualization-container")
    .insert("div", "#main-svg")
    .attr("id", "club-header")
    .style("text-align", "center")
    .style("margin-bottom", "20px")
    .html(`
      <div style="display: flex; align-items: center; justify-content: center; gap: 15px;">
        <img src="Data/club_and_EPL_logos/${clubLogoName}" alt="${state.club} Logo" style="height: 40px;" onerror="this.style.display='none'">
        <h2 style="color: #333; margin: 0; font-size: 1.5rem;">
          ${state.club} - Multi-Season Analysis
        </h2>
      </div>
      <p style="color: #666; margin: 5px 0 0 0;">
        Comparing transfer spending with ${state.stat} from ${state.season}
      </p>
      <div style="margin-top: 15px; display: flex; justify-content: center; gap: 30px; font-size: 14px;">
        <div style="display: flex; align-items: center; gap: 5px;">
          <div style="width: 20px; height: 3px; background-color: #e74c3c;"></div>
          <span>Transfer Spending</span>
        </div>
        <div style="display: flex; align-items: center; gap: 5px;">
          <div style="width: 20px; height: 3px; background-color: #3498db; background-image: repeating-linear-gradient(90deg, transparent, transparent 2px, #fff 2px, #fff 4px);"></div>
          <span>${state.stat}</span>
        </div>
      </div>
    `);

  loadClubTrajectoryData().then(clubStats => {
    if (clubStats.length === 0) return;

    const svg = d3.select("#main-svg");
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const seasons = ["2015/16", "2016/17", "2017/18", "2018/19", "2019/20", "2020/21", "2021/22", "2022/23"];
    const validData = clubStats;
    const spendingData = clubStats;

    // create scales
    const xScale = d3.scalePoint().domain(seasons).range([0, width]);
    const yScaleLeft = d3.scaleLinear().domain([0, d3.max(spendingData, d => d.TotalExpenditure)]).range([height, 0]);
    
    // For Position, invert the scale so position 1 is at the top
    const rightDomain = d3.extent(validData, d => d[state.stat]);
    const yScaleRight = d3.scaleLinear()
      .domain(state.stat === "Position" ? [rightDomain[1], rightDomain[0]] : rightDomain)
      .range([height, 0]);

    g.selectAll(".grid-line").data(yScaleLeft.ticks(6)).enter().append("line")
      .attr("class", "grid-line")
      .attr("x1", 0).attr("x2", width)
      .attr("y1", d => yScaleLeft(d)).attr("y2", d => yScaleLeft(d));

    g.append("g").attr("class", "axis").attr("transform", `translate(0,${height})`).call(d3.axisBottom(xScale));
    g.append("g").attr("class", "axis").call(d3.axisLeft(yScaleLeft).tickFormat(d => `£${d}M`));
    g.append("g").attr("class", "axis").attr("transform", `translate(${width},0)`).call(d3.axisRight(yScaleRight));

    g.append("text").attr("class", "axis-label").attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left + 20).attr("x", 0 - (height / 2))
      .style("text-anchor", "middle").text("Transfer Expenditure (£M)");

    g.append("text").attr("class", "axis-label").attr("transform", "rotate(-90)")
      .attr("y", width + margin.right - 10).attr("x", 0 - (height / 2))
      .style("text-anchor", "middle").text(state.stat);

    let tooltip = d3.select(".tooltip");
    if (tooltip.empty()) {
      tooltip = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);
    }

    const expenditureLine = d3.line().x(d => xScale(d.Season)).y(d => yScaleLeft(d.TotalExpenditure)).curve(d3.curveLinear);
    const statLine = d3.line().x(d => xScale(d.Season)).y(d => yScaleRight(d[state.stat])).curve(d3.curveLinear);

    const expenditureSegments = createLineSegments(spendingData, 'TotalExpenditure');
    const statSegments = createLineSegments(validData, state.stat);

    expenditureSegments.forEach(segment => {
      g.append("path").datum(segment).attr("class", "line expenditure-line").attr("d", expenditureLine);
    });

    statSegments.forEach(segment => {
      g.append("path").datum(segment).attr("class", "line stat-line").attr("d", statLine);
    });

    // points with tooltips
    g.selectAll(".expenditure-point").data(spendingData).enter().append("circle")
      .attr("class", "line-point")
      .attr("cx", d => xScale(d.Season)).attr("cy", d => yScaleLeft(d.TotalExpenditure))
      .attr("r", 4).attr("stroke", "#e74c3c").attr("fill", "white")
      .classed("selected-point", d => d.Season === state.season)
      .on("mouseover", function(event, d) {
        tooltip.transition().duration(200).style("opacity", .9);
        tooltip.html(`<strong>${d.Season}</strong><br/>${state.club}<br/><hr style="margin: 8px 0; border: 1px solid #555;"/>Transfer Spending: £${d.TotalExpenditure}M<br/>${state.stat}: ${d[state.stat]}`)
          .style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() { tooltip.transition().duration(500).style("opacity", 0); });

    g.selectAll(".stat-point").data(validData).enter().append("circle")
      .attr("class", "line-point")
      .attr("cx", d => xScale(d.Season)).attr("cy", d => yScaleRight(d[state.stat]))
      .attr("r", 4).attr("stroke", "#3498db").attr("fill", "white")
      .classed("selected-point", d => d.Season === state.season)
      .on("mouseover", function(event, d) {
        tooltip.transition().duration(200).style("opacity", .9);
        tooltip.html(`<strong>${d.Season}</strong><br/>${state.club}<br/><hr style="margin: 8px 0; border: 1px solid #555;"/>Transfer Spending: £${d.TotalExpenditure}M<br/>${state.stat}: ${d[state.stat]}`)
          .style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() { tooltip.transition().duration(500).style("opacity", 0); });

    addScene3Controls();
    addBackButton(3);
  });
}

// helper function for discontinous line segments
function createLineSegments(data, field) {
  const segments = [];
  let currentSegment = [];
  const seasons = ["2015/16", "2016/17", "2017/18", "2018/19", "2019/20", "2020/21", "2021/22", "2022/23"];
  
  for (let i = 0; i < seasons.length; i++) {
    const seasonData = data.find(d => d.Season === seasons[i]);
    if (seasonData) {
      currentSegment.push(seasonData);
    } else {
      if (currentSegment.length > 1) {
        segments.push([...currentSegment]);
      }
      currentSegment = [];
    }
  }
  if (currentSegment.length > 1) {
    segments.push(currentSegment);
  }
  return segments;
}

async function loadClubTrajectoryData() {
  try {
    const filename = state.club.replace(/\s+/g, '_').replace('&', '&') + '_stats_15_16_to_22_23.csv';
    const data = await d3.csv(`Data/club_stats_15_16_to_22_23/${filename}`);
    
    return data.filter(d => d.Season && d.Position && +d.Position > 0).map(d => ({
      Season: d.Season,
      Position: +d.Position,
      Wins: +d.Wins,
      Draws: +d.Draws,
      Losses: +d.Losses,
      Points: +d.Points,
      GoalsScored: +d.GoalsScored,
      GoalsConceded: +d.GoalsConceded,
      GoalDiff: +d.GoalDiff,
      Clean_Sheet: +d.Clean_Sheet,
      PassAccuracy: +d["PassAccuracy%"].replace('%', ''),
      Crosses: +d.Crosses,
      TotalExpenditure: +d["Total Expenditure (Millions £)"]
    }));
  } catch (error) {
    console.error("Error loading club data:", error);
    return [];
  }
}

function addScene3Controls() {
  const controlsPanel = d3.select("#controls-panel");
  
  controlsPanel.append("div")
    .attr("class", "control-group")
    .html(`
      <label class="control-label">Select Statistic:</label>
      <select id="stat-dropdown">
        <option value="Position">League Position</option>
        <option value="Wins">Wins</option>
        <option value="Draws">Draws</option>
        <option value="Points">Points</option>
        <option value="GoalsScored">Goals Scored</option>
        <option value="GoalDiff">Goal Difference</option>
        <option value="PassAccuracy">Pass Accuracy %</option>
        <option value="Crosses">Crosses</option>
        <option value="Clean_Sheet">Clean Sheets</option>
      </select>
    `);

  d3.select("#stat-dropdown")
    .property("value", state.stat)
    .on("change", function() {
      state.stat = this.value;
      render();
    });
}

function addBackButton(currentScene) {
  const controlsPanel = d3.select("#controls-panel");
  
  const backButton = controlsPanel.append("button")
    .attr("class", "back-button")
    .text(currentScene === 2 ? "← Back to Overview" : `← Back to ${state.season}`)
    .on("click", function() {
      if (currentScene === 2) {
        state.scene = 1;
      } else if (currentScene === 3) {
        state.scene = 2;
      }
      render();
    });
}

function updateNavigationHints() {
  const hints = d3.select("#navigation-hints p");
  
  switch (state.scene) {
    case 1:
      hints.text("Hover for champion & top-spender • Click to see season details");
      break;
    case 2:
      hints.text("Hover for spend & W-D-L • Click for club trajectory");
      break;
    case 3:
      hints.text("Use dropdown to change stat • Red dot marks selected season");
      break;
  }
}

document.addEventListener('DOMContentLoaded', function() {
  loadData();
});
