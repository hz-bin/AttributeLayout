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

var clusterCenters = [];
var clusterMembership = [];

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

		initPos = [];
		initVel = [];
		pos = [];
		vel = [];

		var random = new Random;
		// initialization of inputs
		for (var i = 0; i < numBodies; i++) {
			var index = 4 * i;
			// First 3 values are position in x,y and z direction
			for (var j = 0; j < 2; j++) {
				initPos[index + j] = random.getRandom(0.01, 20);
			}
			initPos[index + 2] = 0.0;

			// 质量
			initPos[index + 3] = 1.0;
		}

		for (var i = 0; i < 4 * numBodies; i++) {
			// 速率
			initVel[i] = 0;
			clusterMembership[i] = 0;
		}
		for (var i = 0; i < 16 * numBodies; i++) {
			clusterCenters[i] = 0;
		}

		pos = initPos;
		vel = initVel;

		// setup edges
		var addedEdges = [];
		for (var i = 0; i < numBodies; i++) {
			addedEdges[i] = new Vector();
		}
		numEdges = 0; 
		// 这里要用set
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
					nAttr2 = nodeAttrArray[t];
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
					edgeData[eI] = t;
					j++;
				}
			} else {
				edgeInd[i * 4] = -1;
			}
		}
		setupCL();
	});
}

var bufSize;
var bufIn1;
var bufIn2;
var bufOut;
var vectorLength = 30;
var globalWS;
var localWS;

function setupCL() {
	try {
		if (window.webcl == undefined) {
			alert("Unfortunately your system does not support WebCL. " +
				"Make sure that you have both the OpenCL driver " +
				"and the WebCL browser extension installed.");
			return false;
		}
		u = new CLUnit();

		u.createProgram("clProgramVectorAdd");
		u.createKernel("ckVectorAdd");
		// Create command queue using the first available device
		u.createCommandQueue();

		u.createBuffer(BufferNames.NODE_ATTR_DATA, WebCL.MEM_READ_ONLY, nodeAttrArray.length * 4);
		u.writeData(BufferNames.NODE_ATTR_DATA, nodeAttrArray);
		u.flush();

		u.createBuffer(BufferNames.CURRENT_POS, WebCL.MEM_READ_WRITE, numBodies * 16);	// sizeof(cl_float4) = 16
		u.writeData(BufferNames.CURRENT_POS, pos);

		u.createBuffer(BufferNames.NEW_POS, WebCL.MEM_READ_WRITE, numBodies * 16);
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

		u.createBuffer(BufferNames.CLUSTER_CENTERS, WebCL.MEM_WRITE_ONLY, numBodies * 16);
		u.writeData(BufferNames.CLUSTER_CENTERS, clusterCenters);

		u.createBuffer(BufferNames.CLUSTER_MEMBERS, WebCL.MEM_WRITE_ONLY, numBodies * 4);
		u.writeData(BufferNames.CLUSTER_MEMBERS, clusterMembership);
		u.finish();

		
		/**
		 * setup patch data    980行
		 */



		// console.log(nodeAttrArray);
		// var d = u.getBufferData(BufferNames.CURRENT_POS)
		// console.log(d);

		// u.createBuffer(BufferNames.BUFIN1, WebCL.MEM_READ_ONLY, bufSize);
		// u.writeData(BufferNames.BUFIN1, UIvector1);

		// u.createBuffer(BufferNames.BUFIN2, WebCL.MEM_READ_ONLY, bufSize);
		// u.writeData(BufferNames.BUFIN2, UIvector2);

		// u.createBuffer(BufferNames.BUFOUT, WebCL.MEM_WRITE_ONLY, bufSize);

		// var currArg = 0;
		// u.setArg(currArg++, u.getBuffer(BufferNames.BUFIN1));
		// u.setArg(currArg++, u.getBuffer(BufferNames.BUFIN2));
		// u.setArg(currArg++, u.getBuffer(BufferNames.BUFOUT));
		// u.setArg(currArg++, new Uint32Array([vectorLength]));

		// // Init ND-range
		// localWS = [8];
		// globalWS = [Math.ceil(vectorLength / localWS) * localWS];


		// // Execute (enqueue) kernel
		// u.enqueueNDRangeKernel(globalWS, localWS);

		// // Read the result buffer from OpenCL device
		// // var outBuffer = u.enqueueReadBuffer(bufOut, bufSize, vectorLength);
		// var outBuffer = u.getBufferData(BufferNames.BUFOUT, vectorLength)
		// u.finish();

		// console.log(outBuffer);
		

		// UIvector1 = null;
		// UIvector2 = null;
		// outBuffer = null;
	} catch (e) {
		console.log(e.message);
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
		// Generate input vectors
		// var vectorLength = 30;
		// var UIvector1 = new Float32Array(vectorLength);
		// var UIvector2 = new Float32Array(vectorLength);
		// for (var i = 0; i < vectorLength; i = i + 1) {
		// 	UIvector1[i] = Math.floor(Math.random() * 100) + 0.1; //Random number 0..99
		// 	UIvector2[i] = Math.floor(Math.random() * 100) + 0.1; //Random number 0..99
		// }

		// u.writeData(BufferNames.BUFIN1, UIvector1);
		// u.writeData(BufferNames.BUFIN2, UIvector2);

		// u.enqueueNDRangeKernel(globalWS, localWS);
		// var outBuffer = u.getBufferData(BufferNames.BUFOUT, vectorLength)
	
		// u.finish();

		// console.log(outBuffer);


		// UIvector1 = null;
		// UIvector2 = null;
		// outBuffer = null;
		ttt++;
	}, 1);
}

function stop() {
	clearInterval(timer);
	console.log(ttt);
}

function start() {
	loop();
}

(function() {
	
	setup();

	loop();

})();