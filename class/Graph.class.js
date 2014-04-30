function Node() {
	var id = 0;

	this.init = function(_id) {
		id = _id;
	};

	this.getID = function() {
		return id;
	};
}

function Edge() {
	var source = 0;
	var target = 0;
	var id = 0;

	this.init = function(s, t, _id) {
		source = s;
		target = t;
		id = _id;
	};

	this.getSource = function() {
		return source;
	};

	this.getTarget = function() {
		return target;
	};
}

function Graph() {
	var nodes = null;
	var edges = null;
	var attrs = null;
	var eAttrs = null;
	var graph = null;

	var _this = this;

	this.init = function() {
		nodes = new Vector();
		edges = new Vector();
		attrs = new AttrTable();
		eAttrs = new AttrTable();
		graph = {
			nodes : [],
			links: []
		}		
	};

	this.getNode = function(id) {
		return nodes.get(id);
	};

	this.getEdge = function(id) {
		return edges.get(id);
	};

	this.getNodeCount = function() {
		return nodes.size();
	};

	this.getEdgeCount = function() {
		return edges.size();
	};

	this.addNode = function(id) {
		n = new Node();
		n.init(id);
		nodes.push_back(n);
	};

	this.addEdge = function(s, t) {
		e = new Edge();
		e.init(s, t);
		e.id = edges.size();
		edges.push_back(e);
	};

	this.print = function() {
		// 打印点
		for (var i = 0; i < nodes.size(); i++) {
			console.log(nodes.get(i).getID());
		}
		// 打印边
		for (var i = 0; i < edges.size(); i++) {
			console.log(edges.get(i).getSource() + ", "
			 + edges.get(i).getTarget());
		}
	}

	this.readFile = function(file) {
		$.getJSON(file, function(data) {
			graph.nodes = data.nodes;
			graph.links = data.links;
			var nodes_num = graph.nodes.length;
			var edges_num = graph.links.length;
			// alert(nodes_num);
			// alert(edges_num);
			// 添加点
			for (var i = 0; i < nodes_num; i++) {
				_this.addNode(i);
			}
			// 添加边
			for (var i = 0; i < edges_num; i++) {
				var e = graph.links[i];
				var s, t, idx = 0;
				for (var key in e) {
					if (idx == 0) {
						s = e[key];
					} else if (idx == 1) {
						t = e[key];
					} else {
						break;
					}
					idx++;
				}
				_this.addEdge(s, t);
			}
			// _this.print();	// 打印点和边的信息

			// 添加点的属性

			// 添加边的属性

		});
	};
}