var dateformat = require('dateformat');

Date.prototype.toAsanaString = function() {
	return dateformat(this);
};
