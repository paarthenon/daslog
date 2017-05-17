"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index"), das = index_1;
index_1.default.warn('warn message'); // >warn message
index_1.default.add('Category').info('category 1'); // >Category | category 1
das.updateDefaultLogger(das.logger().add('new default'));
index_1.default.warn('new message?'); // >new default | new message?
