function Node() {
	var id = 0;
	return {
		init : function(_id) {
			id = _id;
		},
		getID : function() {
			return id;
		}
	}
}

function Edge() {
	var source = 0;
	var target = 0;
	var id = 0;
	return {
		init : function(s, t, _id) {
			source = s;
			target = t;
			id = _id;
		},
		getSource : function() {
			return source;
		},
		getTarget : function() {
			return target;
		}
	}
}

function Graph() {
	var nodes = null;
	var edges = null;
	return {
		init : function() {
			nodes = new Vector();
			edges = new Vector();
		},

		getNode : function(id) {
			return nodes.get(id);
		},

		getEdge : function(id) {
			return edges.get(id);
		},

		getNodeCount : function() {
			return nodes.size();
		},

		getEdgeCount : function() {
			return edges.size();
		},

		addNode : function(id) {
			n = new Node();
			n.init(id);
			nodes.push_back(n);
		},

		addEdge : function(s, t) {
			e = new Edge();
			e.init(s, t);
			e.id = edges.size();
			edges.push_back(e);
		}
	}
}

function AttrVal() {
	var data;
	return {
		init : function() {
			data = new Vector();
		},
		setData : function(i, v) {
			data.setData(i, v);
		},
		getSize : function() {
			return data.size();
		}
	}
}

function Attr() {
	var attr;
	return {
		init : function() {
			attr = new AttrVal();
		},
		init : function(v) {
			attr = v;
		},
		getValue : function() {
			return attr;
		}
	}
}

function AttrTable() {
	
}