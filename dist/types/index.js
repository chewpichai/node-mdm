"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoIt = exports.DEVICE_STATUS = void 0;
exports.DEVICE_STATUS = {
    UNREGULATED: 0,
    SUPERVISED: 1,
    DEREGULATED: 2,
    LOST_LOCKED: 3,
    RENT_LOCKED: 4,
};
var DoIt;
(function (DoIt) {
    DoIt[DoIt["notExecuted"] = 0] = "notExecuted";
    DoIt[DoIt["executed"] = 1] = "executed";
    DoIt[DoIt["success"] = 2] = "success";
    DoIt[DoIt["failed"] = 3] = "failed";
    DoIt[DoIt["CheckOut"] = 4] = "CheckOut";
    DoIt[DoIt["notSent"] = 5] = "notSent";
    DoIt[DoIt["notFullyExecuted"] = 6] = "notFullyExecuted";
    DoIt[DoIt["abandoned"] = 7] = "abandoned";
})(DoIt || (exports.DoIt = DoIt = {}));
