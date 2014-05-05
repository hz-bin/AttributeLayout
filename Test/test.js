(function() {
	var graph = new Graph();
	graph.init();
	graph.readFile("../data/graph.json", function() {
		console.log(graph.getColData("group"));
	});
})();