"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoIt = exports.DeviceStatus = void 0;
var DeviceStatus;
(function (DeviceStatus) {
    DeviceStatus[DeviceStatus["UNREGULATED"] = 0] = "UNREGULATED";
    DeviceStatus[DeviceStatus["SUPERVISED"] = 1] = "SUPERVISED";
    DeviceStatus[DeviceStatus["DEREGULATED"] = 2] = "DEREGULATED";
    DeviceStatus[DeviceStatus["LOST_LOCKED"] = 3] = "LOST_LOCKED";
    DeviceStatus[DeviceStatus["RENT_LOCKED"] = 4] = "RENT_LOCKED";
})(DeviceStatus || (exports.DeviceStatus = DeviceStatus = {}));
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
