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
	var nodeAttrs = null;
	var edgeAttrs = null;
	var graph = null;

	var _this = this;

	this.init = function() {
		nodes = new Vector();
		edges = new Vector();
		nodeAttrs = new AttrTable();
		edgeAttrs = new AttrTable();
		graph = {
			nodes : [],
			links: []
		};
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

	this.readFile = function(file, onReadCompleted) {
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
			var attrName = [];
			var idx = 0;
			// 获取属性名
			for (var attr in graph.nodes[0]) {
				attrName[idx++] = attr;
			}
			nodeAttrs.setAttrName(attrName);
			// nodeAttrs.printAttrName();
			// console.log(nodeAttrs.getAttrIndexByName("group"));

			// 输出属性名称
			// for (var i = 0; i < attrName.length; i++) {
			// 	console.log(attrName[i] + " ");
			// }
			// 按顺序添加每个点属性
			for (var i = 0; i < nodes_num; i++) {
				var node = graph.nodes[i];
				var data = [];
				var k = 0;
				for (var key in node) {
					data[k++] = node[key];
				}
				nodeAttrs.addRow(data);
			}
			// 打印所有点属性
			// nodeAttrs.printRowData();

			// 测试取某个点属性
			// var tt = nodeAttrs.getRow(1);
			// for (var i = 0; i < tt.length; i++) {
			// 	console.log(tt[i]);
			// }

			// 测试取某个点的某个属性
			// console.log(nodeAttrs.getSingleAttr(1, 0));

			// 测试取某一列数据
			// var colData = nodeAttrs.getColData("group");
			// console.log("test: " + colData);
			

			
			// 添加边的属性		后期任务

			onReadCompleted();
		});
		
	};

	this.getColData = function(attr) {
		var colData = nodeAttrs.getColData(attr);
		return colData;
	}
}