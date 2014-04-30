var graph;

function setupNBody() {
	graph = new Graph();
	graph.init();
	graph.readFile("data/graph.json");
	
}

function setupCL() {

}

function setupCLKernels() {

}

function setup() {
	setupNBody();
	setupCL();
}

(function() {
	console.log("aaa");
	setup();			// 1

	setupCLKernels();	// 2

})();