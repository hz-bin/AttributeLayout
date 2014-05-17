// d3 data
var vis;
var WINDOW_WIDTH = 800;
var WINDOW_HEIGHT = 600;
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


var u;
var graph;
var numEdges;
var numParticles;
var initPos = [];
var initVel = [];

var vel = [];
var pos = [];	// output position

var numBodies;	// No. of particles

var nodeAttrArray = [];
var attrVecLength = 1;		// 属性长度，几个属性，目前是单属性

var edgeInd = [];	// maps node indices into edgeData array.
// edgeInd[nodeID] ==> edgeID
// edgeData[edgeID] = first neighbor of nodeID
// edgeData[edgeID + 1] = second neighbor of nodeID
// edgeData[edgeID + 2] = third neighbor of nodeID
// ...
// edgeInd[nodeID] = -1 ==> no edges adjacent to this node
var edgeData = [];	//neighbor indices. Indexed into by edgeInd
var edgeForceData = []; //spring coefficient and length for each edge

// var useClusters = 0;
// var clusterCenters = [];
// var clusterMembership = [];
// var numClusters = 0;

var delT = 1.0;
var espSqr = 500;
var noEdgeForces = 0;	// 1 表示不考虑边的力，0表示考虑边的力
var useInvDist = 0;
var useUserFunctions = 0;
// var useDefaultForces = 0;

var groupSize = 32;
var dragCoe = 0.01;

var globalWS;
var localWS;

var oldPosArgIndex;
var oldVelArgIndex;
var newPosArgIndex;
var newVelArgIndex;

//CL data
var exchange = 1;
var totalThreads = 0;
// var totalComputeUnits = 0;


var drawEdges = 1;


var BufferNames = {
	CURRENT_POS : 0,
    CURRENT_POS_SUB : 1,
    CURRENT_VEL : 2,
    CURRENT_VEL_SUB : 3,
    NEW_POS : 4,
    NEW_POS_SUB : 5,
    NEW_VEL : 6,
    NEW_VEL_SUB : 7,
    EDGE_IND : 8,
    EDGE_DATA : 9,
    EDGE_FORCE_DATA : 10,
    NODE_ATTR_DATA : 11,
    CLUSTER_CENTERS : 12,
    CLUSTER_MEMBERS : 13,
    GRAV_PATCH_BUF : 14,
    SPRINGC_PATCH_BUF : 15,
    SPRINGL_PATCH_BUF : 16
};

var WIDTH = 800;
var HEIGHT = 600;

function setupNBody() {
	graph = new Graph();
	graph.init();
	graph.readFile("data/graph.json", function() {
		// 存储需要的数据
		numParticles = graph.getNodeCount();
		numBodies = numParticles;
		console.log("numBodies = " + numBodies);
		nodeAttrArray = graph.getColData("group");
		MathUtils.normalize(nodeAttrArray);
		console.log("nodeAttrArray: " + nodeAttrArray)

		initPos = [];
		initVel = [];
		pos = [];
		vel = [];

		nodes.length = 0;
		// initialization of inputs
		for (var i = 0; i < numBodies; i++) {
			var index = 4 * i;
			// First 3 values are position in x,y and z direction
			initPos[index] = MathUtils.random(20, WIDTH - 20);
			initPos[index + 1] = MathUtils.random(20, HEIGHT - 20);
			initPos[index + 2] = 0.0;
			// 质量
			initPos[index + 3] = 1.0;

			// D3 需要的数据
			var o = new Object();
			o.x = initPos[index];
			o.y = initPos[index + 1];
			nodes.push(o);
		}

		for (var i = 0; i < 4 * numBodies; i++) {
			// 速率
			initVel[i] = 0;
			// clusterMembership[i] = 0;
		}
		// for (var i = 0; i < 16 * numBodies; i++) {
		// 	clusterCenters[i] = 0;
		// }

		pos = initPos;
		vel = initVel;
		console.log("初始位置： " + initPos);
		console.log("初始速率： " + initVel);

		// setup edges
		var addedEdges = [];
		for (var i = 0; i < numBodies; i++) {
			addedEdges[i] = new Vector();
		}
		numEdges = 0; 
		// 这里要用set
		links.length = 0;
		for (var i = 0; i < graph.getEdgeCount(); i++) {
			var e = graph.getEdge(i);
			var s = e.getSource();
			var t = e.getTarget();
			if (addedEdges[s].contains(t)) {
				console.log("重复的边：(" + s + ", " + t + ")");
			} else {
				addedEdges[s].push_back(t);
				addedEdges[t].push_back(s);
				numEdges += 1;

				// D3 需要的数据
				var o = new Object();
				o.source = nodes[s];
				o.target = nodes[t];
				links.push(o);
			}
		}
		console.log("numEdges = " + numEdges);

		for (var i = 0; i < 4 * numBodies; i++) {
			edgeInd[i] = 0;
		}
		for (var i = 0; i < 2 * numEdges; i++) {
			edgeData[i] = 0;
		}
		for (var i = 0; i < 2 * 4 * numEdges; i++) {
			edgeForceData[i] = 0;
		}

		for (var i = 0, j = 0; i < numBodies; i++) {
			if (addedEdges[i].size() > 0) {
				edgeInd[i * 4] = j;
				edgeInd[i * 4 + 1] = addedEdges[i].size();

				var nAttr1 = nodeAttrArray[i], nAttr2;
				for (var k = 0; k < addedEdges[i].size(); k++) {
					var eI = j;
					var efI = j * 4;
					nAttr2 = nodeAttrArray[k];
					// float sprCoe = springCoePatch->interpolate(nAttr1, nAttr2, minSprCoef, maxSprCoef);
					var sprCoe = 0.0001;
					if (1) {	// useDefaultForces
						edgeForceData[efI] = 0.0001;
					} else {
						edgeForceData[efI] = sprCoe;
					}

					var sprLen = 50;
					if (1) {	// useDefaultForces
						edgeForceData[efI + 1] = 50;
					} else {
						edgeForceData[efI + 1] = 50;
					}
					edgeData[eI] = k;
					j++;
				}
			} else {
				edgeInd[i * 4] = -1;
			}
		}

		initD3(nodes, links);

		setupCL(loop);

	});
}

function setupCL(loopFun) {
	try {
		if (window.webcl == undefined) {
			alert("Unfortunately your system does not support WebCL. " +
				"Make sure that you have both the OpenCL driver " +
				"and the WebCL browser extension installed.");
			return false;
		}
		u = new CLUnit();

		u.createProgram("nbody_rk4");
		u.createKernel("nbody_sim_2D_rk4");
		// Create command queue using the first available device
		u.createCommandQueue();

		u.createBuffer(BufferNames.NODE_ATTR_DATA, WebCL.MEM_READ_ONLY, nodeAttrArray.length * 4);
		u.writeData(BufferNames.NODE_ATTR_DATA, nodeAttrArray);
		u.flush();

		u.createBuffer(BufferNames.CURRENT_POS, WebCL.MEM_READ_WRITE, numBodies * 16);	// sizeof(cl_float4) = 16
		u.writeData(BufferNames.CURRENT_POS, pos);

		u.createBuffer(BufferNames.NEW_POS, WebCL.MEM_READ_WRITE, numBodies * 16);
		u.writeData(BufferNames.NEW_POS, pos);
		u.flush();

		u.createBuffer(BufferNames.EDGE_IND, WebCL.MEM_READ_ONLY, numBodies * 16);
		u.writeData(BufferNames.EDGE_IND, edgeInd);
		u.flush();
		
		if (0 == numEdges) {
			u.createBuffer(BufferNames.EDGE_DATA, WebCL.MEM_READ_ONLY, 4);
		} else {
			u.createBuffer(BufferNames.EDGE_DATA, WebCL.MEM_READ_ONLY, 2 * numEdges * 4);
			u.writeData(BufferNames.EDGE_DATA, edgeData);
			u.flush();
		}

		if (0 == numEdges) {
			u.createBuffer(BufferNames.EDGE_FORCE_DATA, WebCL.MEM_READ_ONLY, 4);
		} else {
			u.createBuffer(BufferNames.EDGE_FORCE_DATA, WebCL.MEM_READ_ONLY, 2 * 4 * numEdges * 4);
			u.writeData(BufferNames.EDGE_FORCE_DATA, edgeForceData);
			u.flush();
		}

		u.createBuffer(BufferNames.CURRENT_VEL, WebCL.MEM_READ_WRITE, numBodies * 16);
		u.writeData(BufferNames.CURRENT_VEL, vel);
		u.flush();


		u.createBuffer(BufferNames.NEW_VEL, WebCL.MEM_READ_WRITE, numBodies * 16);
		u.writeData(BufferNames.NEW_VEL, vel);

		// u.createBuffer(BufferNames.CLUSTER_CENTERS, WebCL.MEM_WRITE_ONLY, numBodies * 16);
		// u.writeData(BufferNames.CLUSTER_CENTERS, clusterCenters);

		// u.createBuffer(BufferNames.CLUSTER_MEMBERS, WebCL.MEM_WRITE_ONLY, numBodies * 4);
		// u.writeData(BufferNames.CLUSTER_MEMBERS, clusterMembership);
		u.finish();
		
		/**
		 * setup patch data
		 */
		// gravity
		var patchTotalSize = 8;
		var gravPatchData = [2, 2, -0.001, -1000, 0.5, 0.5, 0.5, 0.5];
		u.createBuffer(BufferNames.GRAV_PATCH_BUF, WebCL.MEM_WRITE_ONLY, patchTotalSize * 4);
		u.writeData(BufferNames.GRAV_PATCH_BUF, gravPatchData);
		u.flush();

		// spring coefficient
		// patchTotalSize = 8;
		var springCPatchData = [2, 2, 0.000001, 0.001, 0.5, 0.5, 0.5, 0.5];
		u.createBuffer(BufferNames.SPRINGC_PATCH_BUF, WebCL.MEM_WRITE_ONLY, patchTotalSize * 4);
		u.writeData(BufferNames.SPRINGC_PATCH_BUF, springCPatchData);
		u.flush();

		// spring length
		// patchTotalSize = 8;
		var springLPatchData = [2, 2, 0.1, 30, 0.5, 0.5, 0.5, 0.5];
		u.createBuffer(BufferNames.SPRINGL_PATCH_BUF, WebCL.MEM_WRITE_ONLY, patchTotalSize * 4);
		u.writeData(BufferNames.SPRINGL_PATCH_BUF, springLPatchData);
		u.flush();
		u.finish();

		/**
		 * 设置参数
		 */
		var currArg = 0;
		oldPosArgIndex = currArg;
		u.setArg(currArg++, u.getBuffer(BufferNames.CURRENT_POS));	// 0
		oldVelArgIndex = currArg;
		u.setArg(currArg++, u.getBuffer(BufferNames.CURRENT_VEL));
		u.setArg(currArg++, new Uint32Array([numBodies]));
		// u.setArg(currArg++, new Uint32Array([useClusters]));	// 3
		// u.setArg(currArg++, u.getBuffer(BufferNames.CLUSTER_CENTERS));
		// u.setArg(currArg++, u.getBuffer(BufferNames.CLUSTER_MEMBERS));
		// u.setArg(currArg++, new Uint32Array([numClusters]));	// 6
		totalThreads = Math.ceil(numBodies / 32) * 32;
		console.log("totalThreads: " + totalThreads);
		u.setArg(currArg++, new Uint32Array([totalThreads]));
		var offset = 0;
		u.setArg(currArg++, new Uint32Array([offset]));
		u.setArg(currArg++, new Float32Array([delT]));		// 9
		u.setArg(currArg++, new Float32Array([espSqr]));
		u.setArg(currArg++, new Uint32Array([noEdgeForces]));
		u.setArg(currArg++, new Uint32Array([useInvDist]));		// 12
		u.setArg(currArg++, new Uint32Array([useUserFunctions]));
		// u.setArg(currArg++, new Uint32Array([1]));
		// u.setArg(currArg++, new Uint32Array([1]));	// 15
		newPosArgIndex = currArg;
		u.setArg(currArg++, u.getBuffer(BufferNames.NEW_POS));
		newVelArgIndex = currArg;
		u.setArg(currArg++, u.getBuffer(BufferNames.NEW_VEL));
		u.setArg(currArg++, u.getBuffer(BufferNames.EDGE_IND));		// 18
		u.setArg(currArg++, u.getBuffer(BufferNames.EDGE_DATA));
		u.setArg(currArg++, u.getBuffer(BufferNames.EDGE_FORCE_DATA));
		u.setArg(currArg++, u.getBuffer(BufferNames.NODE_ATTR_DATA));	// 21
		u.setArg(currArg++, new Uint32Array([attrVecLength]));
		u.setArg(currArg++, new Float32Array([dragCoe]));
		// u.setArg(currArg++, new Uint32Array([useDefaultForces]));	// 24
		u.setArg(currArg++, u.getBuffer(BufferNames.GRAV_PATCH_BUF));
		u.setArg(currArg++, u.getBuffer(BufferNames.SPRINGC_PATCH_BUF));
		u.setArg(currArg++, u.getBuffer(BufferNames.SPRINGL_PATCH_BUF));	// 27

		localWS = [32];
		globalWS = [Math.ceil(numBodies / localWS) * localWS];
		// u.enqueueNDRangeKernel(globalWS, localWS);

		// console.log("success");

		// var out = u.getBufferData(BufferNames.NEW_POS);
		// u.finish();
		// console.log(out);

	} catch (e) {
		console.log(e.message);
	}
	// loopFun();
}

function redraw(_nodes, _links) {
	// console.log(_nodes);
	// xScale = d3.scale.linear()
	// 	.domain([0, d3.max(_nodes, function(d) { return d.x; })])
	// 	.range([padding, WINDOW_WIDTH - padding * 2]);

	// yScale = d3.scale.linear()
	// 	.domain([0, d3.max(_nodes, function(d) { return d.y; })])
	// 	.range([padding, WINDOW_HEIGHT - padding * 2]);

	vis.selectAll("circle")
        .data(_nodes)
        .transition()
        .duration(1)
        .attr("cx", function (d) {
            // return xScale(d.x);
            return d.x;
        })
        .attr("cy", function (d) {
            // return yScale(d.y);
            return d.y;
        })
        .attr("r", 2);
    if (drawEdges) {
    	vis.selectAll("line")
	        .data(_links)
	        .transition()
	        .duration(1)
	        .attr("x1", function (d) {
	            // return xScale(d.source.x);
	            return d.source.x;
	        })
	        .attr("y1", function (d) {
	            // return yScale(d.source.y);
	            return d.source.y;
	        })
	        .attr("x2", function (d) {
	            // return xScale(d.target.x);
	            return d.target.x;
	        })
	        .attr("y2", function (d) {
	            // return yScale(d.target.y);
	            return d.target.y;
	        })
	        .style("stroke", "rgb(6,120,155)");
    }
    
}

function initD3(_nodes, _links) {
	// xScale = d3.scale.linear()
	// 	.domain([0, d3.max(_nodes, function(d) { return d.x; })])
	// 	.range([padding, WINDOW_WIDTH - padding * 2]);

	// yScale = d3.scale.linear()
	// 	.domain([0, d3.max(_nodes, function(d) { return d.y; })])
	// 	.range([padding, WINDOW_HEIGHT - padding * 2]);

	vis = d3.select("#graph").append("svg");
	vis.attr("width", WINDOW_WIDTH).attr("height", WINDOW_HEIGHT);
    vis.select("#graph");

    vis.selectAll("circle")
        .data(_nodes)
        .enter()
        .append("circle")
        .attr("cx", function (d) {
            // return xScale(d.x);
            return d.x;
        })
        .attr("cy", function (d) {
            // return yScale(d.y);
            return d.y;
        })
        .attr("r", 2);

    if (drawEdges) {
    	vis.selectAll("line")
	        .data(_links)
	        .enter()
	        .append("line")
	        .attr("x1", function (d) {
	            // return xScale(d.source.x);
	            return d.source.x;
	        })
	        .attr("y1", function (d) {
	            // return yScale(d.source.y);
	            return d.source.y;
	        })
	        .attr("x2", function (d) {
	            // return xScale(d.target.x);
	            return d.target.x;
	        })
	        .attr("y2", function (d) {
	            // return yScale(d.target.y);
	            return d.target.y;
	        })
	        .style("stroke", "rgb(6,120,155)");
    }
    
}

function setup() {
	setupNBody();
}

function getData() {
	console.log("group: " + graph.getColData("group"));
	console.log("pos: " + pos);
}

var timer;
var ttt = 0;
function loop() {
	timer = setInterval(function() {
		try {
			// update patch data
			// ........
			// u.runKernel("nbody_sim_2D_rk4");

			// console.log("loop function");

			u.enqueueNDRangeKernel(globalWS, localWS);

			// console.log("loop function2");
			// var curPosName = (exchange) ? BufferNames.CURRENT_POS : BufferNames.NEW_POS;
			var out = u.getBufferData(BufferNames.NEW_POS);
			u.finish();
			// console.log(out);

			// out = u.getBufferData(BufferNames.NEW_VEL);
			// console.log(out);

			// if (exchange == 0) {
			// 	exchange = 1;
			// } else if (exchange == 1) {
			// 	exchange = 0;
			// }

			// if (exchange) {
				// u.setArg(newPosArgIndex, u.getBuffer(BufferNames.CURRENT_POS));
				// u.setArg(newVelArgIndex, u.getBuffer(BufferNames.CURRENT_VEL));
				u.setArg(oldPosArgIndex, u.getBuffer(BufferNames.NEW_POS));
				u.setArg(oldVelArgIndex, u.getBuffer(BufferNames.NEW_VEL));
			// } else {
			// 	u.setArg(newPosArgIndex, u.getBuffer(BufferNames.NEW_POS));
			// 	u.setArg(newVelArgIndex, u.getBuffer(BufferNames.NEW_VEL));
			// 	u.setArg(oldPosArgIndex, u.getBuffer(BufferNames.CURRENT_POS));
			// 	u.setArg(oldVelArgIndex, u.getBuffer(BufferNames.CURRENT_VEL));
			// }

			nodes.length = 0;
			var posx = [];
			var posy = [];
			for (var i = 0; i < numBodies; i++) {
				var index = i * 4;
				posx[i] = out[index];
				posy[i] = out[index + 1];
			}
			MathUtils.range(posx, 20, WINDOW_WIDTH - 20);
			MathUtils.range(posy, 20, WINDOW_HEIGHT - 20);

			for (var i = 0; i < numBodies; i++) {
				var o = new Object();
				o.x = posx[i];
				o.y = posy[i];
				nodes.push(o);
			}


			links.length = 0;
			var edges = [];
			for (var i = 0; i < numBodies; i++) {
				edges[i] = new Vector();
			}

			for (var i = 0; i < numEdges; i++) {
				var e = graph.getEdge(i);
				var s = e.getSource();
				var t = e.getTarget();
				if (edges[s].contains(t)) {
					console.log("重复的边：(" + s + ", " + t + ")");
				} else {
					edges[s].push_back(t);
					edges[t].push_back(s);
					// D3 需要的数据
					var o = new Object();
					o.source = nodes[s];
					o.target = nodes[t];
					links.push(o);
				}
			}
			//if (ttt % 1 == 0)
				redraw(nodes, links);

			ttt++;
		} catch (e) {
			console.log(e.message);
			clearInterval(timer);
		}
	}, 1);
}

function stop() {
	clearInterval(timer);
	console.log(ttt);
}

function start() {
	loop();
}

function showEdge() {
	drawEdges = 1;
	console.log("drawEdges: " + drawEdges);
}

function noEdge() {
	drawEdges = 0;
	console.log("drawEdges: " + drawEdges);
}

(function() {
	
	setup();

})();