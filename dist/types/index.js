"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoIt = exports.OEM_BRANDS = exports.DeviceStatus = void 0;
var DeviceStatus;
(function (DeviceStatus) {
    DeviceStatus["unknown"] = "unknown";
    DeviceStatus["activating"] = "activating";
    DeviceStatus["active"] = "active";
    DeviceStatus["completing"] = "completing";
    DeviceStatus["completed"] = "completed";
    DeviceStatus["lock"] = "lock";
    DeviceStatus["locked"] = "locked";
    DeviceStatus["unlocking"] = "unlocking";
    DeviceStatus["unauthorized"] = "unauthorized";
    DeviceStatus["rent"] = "rent";
})(DeviceStatus || (exports.DeviceStatus = DeviceStatus = {}));
exports.OEM_BRANDS = [
    "infinix",
    "iqoo",
    "oppo",
    "realme",
    "tecno",
    "vivo",
    "xiaomi",
];
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
