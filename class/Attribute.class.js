// 某个点或某条边的所有属性值
function AttrVal() {
	var data;
	return {
		init : function() {
			data = new Vector();
		},
		setData : function(i, v) {
			data.setData(i, v);
		},
		addVal : function() {
			data.push_back(0);
		},
		getSize : function() {
			return data.length;
		}
	}
}

// 某一列的属性值，某个属性名下所有点或所有边的属性值
function Attr() {
	var attr;
	return {
		init : function() {
			attr = new Vector();	// AttrVal *attr;
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
	var data;
	this.init = function() {
		data = new Map();		// std::map<std::string, Attr> data;
	};
	this.addRow = function() {

	};
}