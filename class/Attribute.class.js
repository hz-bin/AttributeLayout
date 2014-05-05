function AttrTable() {
	var rowdata = new Vector();
	var coldata = new Map();
	attrNames = [];

	var _this = this;

	this.init = function() {
		rowdata = new Vector();
		coldata = new Map();
		attrNames = [];
	};


	// 属性名
	this.setAttrName = function(_attrName) {
		attrNames = _attrName;
	};
	this.printAttrName = function() {
		for (var i = 0; i < attrNames.length; i++) {
			console.log(attrNames[i]);
		}
	};
	// 得到第i个属性名
	this.getAttrName = function(i) {
		return attrNames[i];
	};
	// 根据属性名得到是第几个属性
	this.getAttrIndexByName = function(name) {
		for (var i = 0; i < attrNames.length; i++) {
			if (attrNames[i] == name) {
				return i;
			}
		}
		return -1;
	}


	this.addRow = function(data) {
		rowdata.push_back(data);
	};
	this.printRowData = function() {
		rowdata.print();
		// for (var i = 0; i < rowdata.size(); i++) {
		// 	var d = rowdata.get(i);
		// 	for (var j = 0; j < d.length; j++) {
		// 		console.log(d[j]);
		// 	}
		// }
	};
	// 返回第i个点属性数据
	this.getRow = function(i) {
		return rowdata.get(i);
	};
	// 取第i个点的第j个属性
	this.getSingleAttr = function(i, j) {
		var d = _this.getRow(i);
		return d[j];
	};


	// 根据属性名取某一列值
	this.getColData = function(attr) {
		var data = [];
		var k = 0;
		var index = _this.getAttrIndexByName(attr);
		if (index == -1) {
			console.log("attrName: " + attr + " not found");
		}
		for (var i = 0; i < rowdata.size(); i++) {
			var d = rowdata.get(i);
			data[k++] = d[index];
		}
		return data;
	}
}