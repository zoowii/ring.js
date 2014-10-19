function Promise(generator, context) {
    if (context === undefined) {
        context = this;
    }
    this.isExecuting = false;
    this.isExecuted = false;
    this.data = null;
    this.failed = false;
    this.generator = generator;
    this.context = context;
    this.callbacks = [];
}

Promise.prototype.then = function (fulFill) {
    if (!fulFill) {
        return;
    }
    var reject = function () {
    };
    this.callbacks.push([fulFill, reject]);
};
Promise.prototype.fail = function (reject) {
    if (!reject) {
        return;
    }
    var fulFill = function () {
    };
    this.callbacks.push([fulFill, reject]);
};

Promise.prototype.get = function (fulFill, reject) {
    fulFill = fulFill || function () {
    };
    reject = reject || function () {
    };
    if (this.isExecuted) {
        fulFill(this.data);
        return;
    }
    this.callbacks.push([fulFill, reject]);
    if (this.isExecuting) {
        return;
    }
    this.isExecuting = true;
    var _this = this;
    this.generator.call(this.context, function (res) {
        _this.isExecuted = true;
        _this.isExecuting = false;
        _this.data = res;
        while (_this.callbacks.length > 0) {
            var cb = _this.callbacks.shift();
            var _fulFill = cb[0];
            _fulFill.call(_this.context, _this.data);
        }
    }, function (err) {
        _this.failed = true;
        _this.isExecuted = true;
        _this.isExecuting = false;
        _this.data = err;
        while (_this.callbacks.length > 0) {
            var cb = _this.callbacks.shift();
            var _reject = cb[1];
            _reject.call(_this.context, err);
        }
    });
};
exports.Promise = Promise;