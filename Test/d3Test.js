// d3 data
var vis;
var random = new Random();
var WINDOW_WIDTH = 400;
var WINDOW_HEIGHT = 400;
var padding = 20;
var xScale;
var yScale;
var nodes = [];	// 顶点坐标
/*
	example
	var nodes = [{x: 30, y: 50},
              {x: 50, y: 80},
              {x: 90, y: 120}]
*/
var links = [];	// 边
/*
	example
    var links = [{
        source: nodes[0],
        target: nodes[1]
    }, {
        source: nodes[2],
        target: nodes[1]
    }];
*/
var node;

function initD3() {
	nodes = [];
	for (var i = 0; i < 3; i++) {
    	var o = new Object();
    	o.x = random.getRandom(50, 1000)
        o.x = 0;
    	o.y = random.getRandom(50, 1000);
        o.y = 0;
    	nodes.push(o);
    }

    links = [];
    for (var i = 1; i < 3; i++) {
    	var o = new Object();
    	o.source = nodes[0];
    	o.target = nodes[i];
		links.push(o);
    }

	xScale = d3.scale.linear()
		.domain([0, d3.max(nodes, function(d) { return d.x; })])
		.range([padding, WINDOW_WIDTH - padding * 2]);

	yScale = d3.scale.linear()
		.domain([0, d3.max(nodes, function(d) { return d.y; })])
		.range([WINDOW_HEIGHT - padding, padding]);

	vis = d3.select("#graph").append("svg");
	vis.attr("width", WINDOW_WIDTH).attr("height", WINDOW_HEIGHT);
    vis.select("#graph");

    vis.selectAll("circle")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("cx", function (d) {
            return xScale(d.x);
        })
        .attr("cy", function (d) {
            return yScale(d.y);
        })
        .attr("r", 10);



    vis.selectAll("line")
        .data(links)
        .enter()
        .append("line")
        .attr("x1", function (d) {
            return xScale(d.source.x);
        })
        .attr("y1", function (d) {
            return yScale(d.source.y);
        })
        .attr("x2", function (d) {
            return xScale(d.target.x);
        })
        .attr("y2", function (d) {
            return yScale(d.target.y);
        })
        .style("stroke", "rgb(6,120,155)");

}


function redraw(nodes, links) {
	console.log(nodes);
	xScale = d3.scale.linear()
		.domain([0, d3.max(nodes, function(d) { return d.x; })])
		.range([padding, WINDOW_WIDTH - padding * 2]);

	yScale = d3.scale.linear()
		.domain([0, d3.max(nodes, function(d) { return d.y; })])
		.range([WINDOW_HEIGHT - padding, padding]);

	vis.selectAll("circle")
        .data(nodes)
        .transition()
        .duration(1000)
        .attr("cx", function (d) {
            return xScale(d.x);
        })
        .attr("cy", function (d) {
            return yScale(d.y);
        })
        .attr("r", 10);

	
    vis.selectAll("line")
        .data(links)
        .transition()
        .duration(1000)
        .attr("x1", function (d) {
            return xScale(d.source.x);
        })
        .attr("y1", function (d) {
            return yScale(d.source.y);
        })
        .attr("x2", function (d) {
            return xScale(d.target.x);
        })
        .attr("y2", function (d) {
            return yScale(d.target.y);
        })
        .style("stroke", "rgb(6,120,155)");
}

function loop() {
	timer = setInterval(function() {
		nodes = [];
		for (var i = 0; i < 3; i++) {
	    	var o = new Object();
	    	o.x = random.getRandom(1000, 2000)
	    	o.y = random.getRandom(1000, 2000);
	    	nodes.push(o);
	    }
	    links = [];
	    for (var i = 1; i < 3; i++) {
	    	var o = new Object();
	    	o.source = nodes[0];
	    	o.target = nodes[i];
			links.push(o);
	    }



	    redraw(nodes, links);
	    // console.log(nodes);
	}, 1000);
}

function stop() {
	clearInterval(timer);
	// console.log(ttt);
}

function start() {
	loop();
}


(function () {
	initD3();
	// loop();
})();