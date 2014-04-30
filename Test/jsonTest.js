$(document).ready(function() {
	var graph = { 
	    nodes : [], 
	    links: []
	} 

	function initGraphData() {
	    var dataroot = "../data/graph.json";
	    $.getJSON(dataroot, function (data) {
	        graph.nodes = data.nodes;
	        graph.links = data.links;

	        //alert(graph.nodes.length);	// 点的个数
	        //alert(graph.links.length);	// 边的个数
	        var attrName = [];
	        var idx = 0;
	        for (var attr in graph.nodes[0]) {
	        	//alert(attr);	// 点的属性
	        	attrName[idx] = attr;
	        	idx++;
	        }

	        // for (var attr in graph.links[0]) {
	        // 	alert(attr);	// 边的属性
	        // }

	        for (var i = 0; i < graph.nodes.length; i++) {
	        	var n = graph.nodes[i];
	        	for (var key in n) {
	        		console.log(key + ": " + n[key]);
	        	}
	        }
		});
	}

	initGraphData();
	//alert(1);
	//alert(graph.province.length);
});