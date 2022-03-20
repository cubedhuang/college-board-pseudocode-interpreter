// @ts-check

import { Lang } from "./Lang.js";

Lang.init();

if (typeof globalThis !== "undefined") globalThis.Lang = Lang;
