(function() {
	var graph = new Graph();
	graph.init();
	
	for (var i = 1; i < 5; i++) {
		graph.addEdge(0, i);
	}

	for (var i = 0; i < 10; i++) {
		graph.addNode(i);
	}
	var n1 = graph.getNode(8);
	var id = n1.getID();
	//alert(id);

	var e1 = graph.getEdge(3);
	alert(e1.getSource() + " " + e1.getTarget());

})();