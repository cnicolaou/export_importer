var aei = require("./");

var AsanaClientRetry = module.exports = aei.AsanaClientWrapper.extend().setType("AsanaClientRetry").newSlots({
	delay: 500,
	backoff: 2,
	retries: 5
}).setSlots({
	dispatch: function(params) {
		var self = this;
		var attempts = 0;
		function nextTry() {
			return self._dispatch(params).then(null, function(error) {
				if (attempts > self.retries()) {
					throw new Error("API request failed after " + attempts + " attempts. Last error: " + error);
				} else {
					var delay = self.delay() * Math.pow(self.backoff(), attempts);
					console.log("Delaying before retry:", delay, self.backoff(), attempts);
					attempts += 1
					return Promise.delay(delay).then(nextTry);
				}
			});
		}
		return nextTry();
	}
});
