
describe("AsanaClientRetry", function() {
	describe("#dispatch", function() {
		var sandbox, client, retryingClient, remainingFailures;

		function dispatch() {
			if (remainingFailures-- > 0) {
				return Promise.reject("some reason");
			} else {
				return Promise.resolve({});
			}
		}

		beforeEach(function() {
			sandbox = sinon.sandbox.create();

			client = { dispatcher: { dispatch: dispatch } };
			retryingClient = aei.AsanaClientRetry.clone();
			retryingClient.setClient(client);

			sinon.spy(client.dispatcher, "dispatch");
			sandbox.stub(Promise, "delay", function() { return Promise.resolve(); });
		});

		afterEach(function() {
			sandbox.restore();
		});

		it("should only call dispatch once if there are no failures", function() {
			remainingFailures = 0;
			aei.Future.withPromise(retryingClient.dispatch({})).wait();
			expect(client.dispatcher.dispatch).to.have.callCount(1);
		});

		it("should call dispatch twice if there is one failure", function() {
			remainingFailures = 1;
			aei.Future.withPromise(retryingClient.dispatch({})).wait();
			expect(client.dispatcher.dispatch).to.have.callCount(2);
			expect(Promise.delay.getCall(0).args[0]).to.equal(500);
		});

		it("should backoff exponentially", function() {
			remainingFailures = 3;
			aei.Future.withPromise(retryingClient.dispatch({})).wait();
			expect(client.dispatcher.dispatch).to.have.callCount(4);
			expect(Promise.delay.getCall(0).args[0]).to.equal(500);
			expect(Promise.delay.getCall(1).args[0]).to.equal(1000);
			expect(Promise.delay.getCall(2).args[0]).to.equal(2000);
		});

		// TODO: this doesn't work
		// it("should fail after maxRetries", function() {
		// 	remainingFailures = 10;
		// 	return retryingClient.dispatch({}).should.be.rejected
		// });
	});
});
