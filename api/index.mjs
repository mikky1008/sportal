var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};

// node_modules/zod/v3/external.js
var external_exports = {};
__export(external_exports, {
  BRAND: () => BRAND,
  DIRTY: () => DIRTY,
  EMPTY_PATH: () => EMPTY_PATH,
  INVALID: () => INVALID,
  NEVER: () => NEVER,
  OK: () => OK,
  ParseStatus: () => ParseStatus,
  Schema: () => ZodType,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBigInt: () => ZodBigInt,
  ZodBoolean: () => ZodBoolean,
  ZodBranded: () => ZodBranded,
  ZodCatch: () => ZodCatch,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodEffects: () => ZodEffects,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNever: () => ZodNever,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodParsedType: () => ZodParsedType,
  ZodPipeline: () => ZodPipeline,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSchema: () => ZodType,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodSymbol: () => ZodSymbol,
  ZodTransformer: () => ZodEffects,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  addIssueToContext: () => addIssueToContext,
  any: () => anyType,
  array: () => arrayType,
  bigint: () => bigIntType,
  boolean: () => booleanType,
  coerce: () => coerce,
  custom: () => custom,
  date: () => dateType,
  datetimeRegex: () => datetimeRegex,
  defaultErrorMap: () => en_default,
  discriminatedUnion: () => discriminatedUnionType,
  effect: () => effectsType,
  enum: () => enumType,
  function: () => functionType,
  getErrorMap: () => getErrorMap,
  getParsedType: () => getParsedType,
  instanceof: () => instanceOfType,
  intersection: () => intersectionType,
  isAborted: () => isAborted,
  isAsync: () => isAsync,
  isDirty: () => isDirty,
  isValid: () => isValid,
  late: () => late,
  lazy: () => lazyType,
  literal: () => literalType,
  makeIssue: () => makeIssue,
  map: () => mapType,
  nan: () => nanType,
  nativeEnum: () => nativeEnumType,
  never: () => neverType,
  null: () => nullType,
  nullable: () => nullableType,
  number: () => numberType,
  object: () => objectType,
  objectUtil: () => objectUtil,
  oboolean: () => oboolean,
  onumber: () => onumber,
  optional: () => optionalType,
  ostring: () => ostring,
  pipeline: () => pipelineType,
  preprocess: () => preprocessType,
  promise: () => promiseType,
  quotelessJson: () => quotelessJson,
  record: () => recordType,
  set: () => setType,
  setErrorMap: () => setErrorMap,
  strictObject: () => strictObjectType,
  string: () => stringType,
  symbol: () => symbolType,
  transformer: () => effectsType,
  tuple: () => tupleType,
  undefined: () => undefinedType,
  union: () => unionType,
  unknown: () => unknownType,
  util: () => util,
  void: () => voidType
});

// node_modules/zod/v3/helpers/util.js
var util;
(function(util3) {
  util3.assertEqual = (_) => {
  };
  function assertIs(_arg) {
  }
  util3.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  util3.assertNever = assertNever;
  util3.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util3.getValidEnumValues = (obj) => {
    const validKeys = util3.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util3.objectValues(filtered);
  };
  util3.objectValues = (obj) => {
    return util3.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util3.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key2 in object) {
      if (Object.prototype.hasOwnProperty.call(object, key2)) {
        keys.push(key2);
      }
    }
    return keys;
  };
  util3.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util3.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util3.joinValues = joinValues;
  util3.jsonStringifyReplacer = (_, value2) => {
    if (typeof value2 === "bigint") {
      return value2.toString();
    }
    return value2;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};

// node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = (obj) => {
  const json2 = JSON.stringify(obj, null, 2);
  return json2.replace(/"([^"]+)":/g, "$1:");
};
var ZodError = class _ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error2) => {
      for (const issue of error2.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value2) {
    if (!(value2 instanceof _ZodError)) {
      throw new Error(`Not a ZodError: ${value2}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
ZodError.create = (issues) => {
  const error2 = new ZodError(issues);
  return error2;
};

// node_modules/zod/v3/locales/en.js
var errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
var en_default = errorMap;

// node_modules/zod/v3/errors.js
var overrideErrorMap = en_default;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}

// node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = (params) => {
  const { data, path, errorMaps, issueData } = params;
  const fullPath = [...path, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === en_default ? void 0 : en_default
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
var ParseStatus = class _ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key2 = await pair.key;
      const value2 = await pair.value;
      syncPairs.push({
        key: key2,
        value: value2
      });
    }
    return _ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key: key2, value: value2 } = pair;
      if (key2.status === "aborted")
        return INVALID;
      if (value2.status === "aborted")
        return INVALID;
      if (key2.status === "dirty")
        status.dirty();
      if (value2.status === "dirty")
        status.dirty();
      if (key2.value !== "__proto__" && (typeof value2.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key2.value] = value2.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value2) => ({ status: "dirty", value: value2 });
var OK = (value2) => ({ status: "valid", value: value2 });
var isAborted = (x) => x.status === "aborted";
var isDirty = (x) => x.status === "dirty";
var isValid = (x) => x.status === "valid";
var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

// node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
  constructor(parent, value2, path, key2) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value2;
    this._path = path;
    this._key = key2;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
};
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error2 = new ZodError(ctx.common.issues);
        this._error = error2;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
var ZodType = class {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
var ZodString = class _ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value2, options) {
    return this._addCheck({
      kind: "includes",
      value: value2,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value2, message) {
    return this._addCheck({
      kind: "startsWith",
      value: value2,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value2, message) {
    return this._addCheck({
      kind: "endsWith",
      value: value2,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max2 = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max2 === null || ch.value < max2)
          max2 = ch.value;
      }
    }
    return max2;
  }
};
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
var ZodNumber = class _ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value2, message) {
    return this.setLimit("min", value2, true, errorUtil.toString(message));
  }
  gt(value2, message) {
    return this.setLimit("min", value2, false, errorUtil.toString(message));
  }
  lte(value2, message) {
    return this.setLimit("max", value2, true, errorUtil.toString(message));
  }
  lt(value2, message) {
    return this.setLimit("max", value2, false, errorUtil.toString(message));
  }
  setLimit(kind, value2, inclusive, message) {
    return new _ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value: value2,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value2, message) {
    return this._addCheck({
      kind: "multipleOf",
      value: value2,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max2 = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max2 === null || ch.value < max2)
          max2 = ch.value;
      }
    }
    return max2;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max2 = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max2 === null || ch.value < max2)
          max2 = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max2);
  }
};
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodBigInt = class _ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value2, message) {
    return this.setLimit("min", value2, true, errorUtil.toString(message));
  }
  gt(value2, message) {
    return this.setLimit("min", value2, false, errorUtil.toString(message));
  }
  lte(value2, message) {
    return this.setLimit("max", value2, true, errorUtil.toString(message));
  }
  lt(value2, message) {
    return this.setLimit("max", value2, false, errorUtil.toString(message));
  }
  setLimit(kind, value2, inclusive, message) {
    return new _ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value: value2,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value2, message) {
    return this._addCheck({
      kind: "multipleOf",
      value: value2,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max2 = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max2 === null || ch.value < max2)
          max2 = ch.value;
      }
    }
    return max2;
  }
};
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
var ZodBoolean = class extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodDate = class _ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max2 = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max2 === null || ch.value < max2)
          max2 = ch.value;
      }
    }
    return max2 != null ? new Date(max2) : null;
  }
};
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
var ZodSymbol = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
var ZodUndefined = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
var ZodNull = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
var ZodAny = class extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
var ZodUnknown = class extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
var ZodNever = class extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
var ZodVoid = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
var ZodArray = class _ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new _ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new _ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new _ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key2 in schema.shape) {
      const fieldSchema = schema.shape[key2];
      newShape[key2] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
var ZodObject = class _ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key2 in ctx.data) {
        if (!shapeKeys.includes(key2)) {
          extraKeys.push(key2);
        }
      }
    }
    const pairs = [];
    for (const key2 of shapeKeys) {
      const keyValidator = shape[key2];
      const value2 = ctx.data[key2];
      pairs.push({
        key: { status: "valid", value: key2 },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value2, ctx.path, key2)),
        alwaysSet: key2 in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key2 of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key2 },
            value: { status: "valid", value: ctx.data[key2] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {
      } else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key2 of extraKeys) {
        const value2 = ctx.data[key2];
        pairs.push({
          key: { status: "valid", value: key2 },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value2, ctx.path, key2)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key2 in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key2 = await pair.key;
          const value2 = await pair.value;
          syncPairs.push({
            key: key2,
            value: value2,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: (issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new _ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new _ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key2, schema) {
    return this.augment({ [key2]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new _ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key2 of util.objectKeys(mask)) {
      if (mask[key2] && this.shape[key2]) {
        shape[key2] = this.shape[key2];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key2 of util.objectKeys(this.shape)) {
      if (!mask[key2]) {
        shape[key2] = this.shape[key2];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key2 of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key2];
      if (mask && !mask[key2]) {
        newShape[key2] = fieldSchema;
      } else {
        newShape[key2] = fieldSchema.optional();
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key2 of util.objectKeys(this.shape)) {
      if (mask && !mask[key2]) {
        newShape[key2] = this.shape[key2];
      } else {
        const fieldSchema = this.shape[key2];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key2] = newField;
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
var ZodUnion = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
ZodUnion.create = (types2, params) => {
  return new ZodUnion({
    options: types2,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = (type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [void 0];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [void 0, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
};
var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value2 of discriminatorValues) {
        if (optionsMap.has(value2)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value2)}`);
        }
        optionsMap.set(value2, type);
      }
    }
    return new _ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key2) => bKeys.indexOf(key2) !== -1);
    const newObj = { ...a, ...b };
    for (const key2 of sharedKeys) {
      const sharedValue = mergeValues(a[key2], b[key2]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key2] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
var ZodIntersection = class extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
var ZodTuple = class _ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new _ZodTuple({
      ...this._def,
      rest
    });
  }
};
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
var ZodRecord = class _ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key2 in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key2, ctx.path, key2)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key2], ctx.path, key2)),
        alwaysSet: key2 in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new _ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new _ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
var ZodMap = class extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key2, value2], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key2, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value2, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key2 = await pair.key;
          const value2 = await pair.value;
          if (key2.status === "aborted" || value2.status === "aborted") {
            return INVALID;
          }
          if (key2.status === "dirty" || value2.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key2.value, value2.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key2 = pair.key;
        const value2 = pair.value;
        if (key2.status === "aborted" || value2.status === "aborted") {
          return INVALID;
        }
        if (key2.status === "dirty" || value2.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key2.value, value2.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
var ZodSet = class _ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new _ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new _ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
var ZodFunction = class _ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error2) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error2
        }
      });
    }
    function makeReturnsIssue(returns, error2) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error2
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error2 = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error2.addIssue(makeArgsIssue(args, e));
          throw error2;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error2.addIssue(makeReturnsIssue(result, e));
          throw error2;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new _ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new _ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new _ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
};
var ZodLazy = class extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
var ZodLiteral = class extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
ZodLiteral.create = (value2, params) => {
  return new ZodLiteral({
    value: value2,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values2, params) {
  return new ZodEnum({
    values: values2,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
var ZodEnum = class _ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values2, newDef = this._def) {
    return _ZodEnum.create(values2, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values2, newDef = this._def) {
    return _ZodEnum.create(this.options.filter((opt) => !values2.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
};
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
ZodNativeEnum.create = (values2, params) => {
  return new ZodNativeEnum({
    values: values2,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
var ZodPromise = class extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
var ZodEffects = class extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
};
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
var ZodOptional = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
var ZodNullable = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
var ZodDefault = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
var ZodCatch = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
};
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
var ZodNaN = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = /* @__PURE__ */ Symbol("zod_brand");
var ZodBranded = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
var ZodPipeline = class _ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new _ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
};
var ZodReadonly = class extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p2 = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p22 = typeof p2 === "string" ? { message: p2 } : p2;
  return p22;
}
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params);
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = () => stringType().optional();
var onumber = () => numberType().optional();
var oboolean = () => booleanType().optional();
var coerce = {
  string: ((arg) => ZodString.create({ ...arg, coerce: true })),
  number: ((arg) => ZodNumber.create({ ...arg, coerce: true })),
  boolean: ((arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  })),
  bigint: ((arg) => ZodBigInt.create({ ...arg, coerce: true })),
  date: ((arg) => ZodDate.create({ ...arg, coerce: true }))
};
var NEVER = INVALID;

// server/registration.ts
var SPORT_NAMES = ["Basketball", "Volleyball", "Track & Field", "Football"];
var POSITION_TITLES = [
  "Head coach",
  "Assistant coach",
  "Athletic director",
  "Recruiter / Scout",
  "Trainer / Coordinator"
];
var name = (label) => external_exports.string().trim().min(1, `Enter your ${label}.`).max(40, `${label[0].toUpperCase()}${label.slice(1)} is too long.`);
var common = {
  firstName: name("first name"),
  lastName: name("last name"),
  email: external_exports.string().trim().min(1, "Enter your email.").max(254, "Email is too long."),
  password: external_exports.string().min(1, "Choose a password.").max(128, "Password is too long."),
  confirmPassword: external_exports.string().min(1, "Confirm your password.").max(128)
};
var registerSchema = external_exports.discriminatedUnion(
  "accountType",
  [
    external_exports.object({ accountType: external_exports.literal("student_athlete"), ...common }),
    external_exports.object({
      accountType: external_exports.literal("coach"),
      ...common,
      organization: external_exports.string().trim().min(1, "Enter your university or organization.").max(100, "Name is too long."),
      position: external_exports.enum(POSITION_TITLES, { errorMap: () => ({ message: "Choose your coaching position." }) }),
      sport: external_exports.enum(SPORT_NAMES, { errorMap: () => ({ message: "Choose your sport specialization." }) })
    }),
    external_exports.object({
      accountType: external_exports.literal("university_representative"),
      ...common,
      university: external_exports.string().trim().min(1, "Enter your university name.").max(100, "Name is too long."),
      designation: external_exports.string().trim().min(1, "Enter your position or designation.").max(80, "Designation is too long.")
    })
  ],
  { errorMap: () => ({ message: "Choose a valid account type." }) }
).superRefine((v, ctx) => {
  if (v.password && v.confirmPassword && v.password !== v.confirmPassword)
    ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords don't match." });
});
var REGISTER_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "password",
  "confirmPassword",
  "organization",
  "position",
  "sport",
  "university",
  "designation"
];
function parseRegistration(input) {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key2 = issue.path[0];
      if (typeof key2 === "string" && REGISTER_FIELDS.includes(key2) && !fieldErrors[key2])
        fieldErrors[key2] = issue.message;
    }
    const typeIssue = parsed.error.issues.find((i) => i.path[0] === "accountType");
    return {
      ok: false,
      message: typeIssue ? "Choose a valid account type." : "Please fix the highlighted fields.",
      fieldErrors
    };
  }
  const d2 = parsed.data;
  const details = d2.accountType === "coach" ? { kind: "coach", organization: d2.organization, coachingPosition: d2.position, sportSpecialization: d2.sport } : d2.accountType === "university_representative" ? { kind: "university_representative", universityName: d2.university, designation: d2.designation } : { kind: "student_athlete" };
  return { ok: true, data: d2, details };
}

// server/auth.server.ts
import { createHash, randomBytes as randomBytes2, randomUUID } from "node:crypto";

// node_modules/postgres/src/index.js
import os from "os";
import fs2 from "fs";

// node_modules/postgres/src/errors.js
var PostgresError = class extends Error {
  constructor(x) {
    super(typeof x === "string" ? x : x && x.message);
    this.name = this.constructor.name;
    x && typeof x === "object" && Object.assign(this, x);
  }
  toJSON() {
    return { ...this, message: this.message };
  }
};
var Errors = {
  connection,
  postgres,
  generic,
  notSupported
};
function connection(code, options, host, port) {
  const address = options.path || host, error2 = Object.assign(
    new Error("write " + code + " " + (options.path || host + ":" + port)),
    { code, errno: code, address },
    options.path ? {} : { port }
  );
  Error.captureStackTrace(error2, connection);
  return error2;
}
function postgres(x) {
  const error2 = new PostgresError(x);
  Error.captureStackTrace(error2, postgres);
  return error2;
}
function generic(code, message) {
  const error2 = Object.assign(new Error(code + ": " + message), { code });
  Error.captureStackTrace(error2, generic);
  return error2;
}
function notSupported(x) {
  const error2 = Object.assign(new Error(x + " (B) is not supported"), { code: "MESSAGE_NOT_SUPPORTED", name: x });
  Error.captureStackTrace(error2, notSupported);
  return error2;
}
var places = locations();
var ours = (line) => places.some((here) => line.includes(here) && !line.slice(line.indexOf(here) + here.length).split(":")[0].includes("/"));
function locations() {
  try {
    const url = new URL(".", import.meta.url);
    return url.protocol === "file:" ? [url.href, decodeURIComponent(url.pathname)] : [url.href];
  } catch (error2) {
    return [];
  }
}
function withOrigin(error2, origin) {
  origin && Object.defineProperty(error2, "stack", {
    value: [error2.stack.split("\n")[0], ...origin.split("\n").slice(1).filter((x) => !ours(x))].join("\n"),
    writable: true,
    configurable: true,
    enumerable: false
  });
  return error2;
}
function queryError(error2, q, debug) {
  if (!error2 || typeof error2 !== "object")
    error2 = new Error(error2);
  if (!q || "query" in error2)
    return error2;
  const built = q.built;
  Object.defineProperties(error2, {
    query: { value: built ? built.text : q.strings[0], enumerable: !!debug, configurable: true, writable: true },
    parameters: { value: built ? built.values : [], enumerable: !!debug, configurable: true, writable: true },
    args: { value: q.args, enumerable: !!debug, configurable: true, writable: true },
    types: { value: built ? built.oids : [], enumerable: !!debug, configurable: true, writable: true }
  });
  return withOrigin(error2, q.origin);
}

// node_modules/postgres/src/types.js
var number = (x) => +x;
var bool = (x) => x === "t";
var json = (x) => JSON.parse(x);
var string = (x) => x instanceof Date ? serializeDate(x) : Array.isArray(x) ? serializeArray(x, string) : literal(x) ? JSON.stringify(x) : "" + x;
var literal = (x) => x !== null && typeof x === "object" && (Object.getPrototypeOf(x) === Object.prototype || Object.getPrototypeOf(x) === null);
var arrays = {
  16: 1e3,
  17: 1001,
  18: 1002,
  19: 1003,
  20: 1016,
  21: 1005,
  22: 1006,
  23: 1007,
  24: 1008,
  25: 1009,
  26: 1028,
  27: 1010,
  28: 1011,
  29: 1012,
  30: 1013,
  114: 199,
  142: 143,
  600: 1017,
  601: 1018,
  602: 1019,
  603: 1020,
  604: 1027,
  628: 629,
  650: 651,
  700: 1021,
  701: 1022,
  718: 719,
  774: 775,
  790: 791,
  829: 1040,
  869: 1041,
  1033: 1034,
  1042: 1014,
  1043: 1015,
  1082: 1182,
  1083: 1183,
  1114: 1115,
  1184: 1185,
  1186: 1187,
  1266: 1270,
  1560: 1561,
  1562: 1563,
  1700: 1231,
  1790: 2201,
  2202: 2207,
  2203: 2208,
  2204: 2209,
  2205: 2210,
  2206: 2211,
  2249: 2287,
  2275: 1263,
  2950: 2951,
  2970: 2949,
  3220: 3221,
  3614: 3643,
  3615: 3645,
  3734: 3735,
  3769: 3770,
  3802: 3807,
  3904: 3905,
  3906: 3907,
  3908: 3909,
  3910: 3911,
  3912: 3913,
  3926: 3927,
  4072: 4073,
  4089: 4090,
  4096: 4097,
  5038: 5039,
  5069: 271
};
var types = {
  string: { to: 25, from: null, serialize: string },
  number: { to: 0, from: [21, 23, 26, 700, 701], serialize: string, parse: number },
  json: { to: 114, from: [114, 3802], serialize: (x) => JSON.stringify(x), parse: json },
  boolean: { to: 16, from: [16], serialize: (x) => x === true ? "t" : "f", parse: bool },
  date: { to: 1184, from: [1082, 1114, 1184], serialize: serializeDate, parse: null },
  bytea: { to: 17, from: [17], serialize: (x) => "\\x" + Buffer.from(x).toString("hex"), parse: (x) => Buffer.from(x.slice(2), "hex") }
};
var dates = { 1082: parseDate, 1114: parseTimestamp, 1184: parseTimestamptz };
function integer(x, i, end) {
  const negative = x[i] === 45;
  let n = 0;
  for (negative && i++; i < end; i++)
    n = n * 10 + x[i] - 48;
  return negative ? -n : n;
}
function boolean(x, i) {
  return x[i] === 116;
}
var shaped = (is, serialize) => (x) => is(x) ? serialize(x) : string(x);
var shapedTypes = {
  ...types,
  boolean: { ...types.boolean, serialize: shaped((x) => typeof x === "boolean", types.boolean.serialize) },
  date: { ...types.date, serialize: shaped((x) => x instanceof Date, types.date.serialize) },
  bytea: { ...types.bytea, serialize: shaped((x) => x instanceof Uint8Array, types.bytea.serialize) }
};
function Types(options = {}) {
  const parsers = {}, serializers = {}, elements = {}, undefinedValue = options.transform && options.transform.undefined;
  Object.entries(arrays).forEach(([oid, array]) => elements[array] = [+oid, +oid === 603 ? ";" : ","]);
  register(options.infer === false ? shapedTypes : types);
  Object.assign(parsers, dates);
  options.infer === false && (parsers[1114] = parseDate);
  const custom2 = Object.values(options.types || {}), named = custom2.filter((x) => [x.to].concat(x.from || []).some((y) => typeof y === "string")), oids = {};
  register(custom2.filter((x) => !named.includes(x)));
  const bases = {};
  return { parser, decoder, serializer, load, infer, resolve: resolve2, named: named.length > 0, parsers, serializers };
  function resolve2(type) {
    return typeof type === "string" ? oids[type] || 0 : type;
  }
  function decoder(oid, parse3) {
    return parse3 === number && (oid === 21 || oid === 23 || oid === 26) ? integer : parse3 === bool && oid === 16 ? boolean : null;
  }
  function register(xs) {
    Object.values(xs).forEach((x) => {
      const from = [].concat(x.from || []);
      x.parse && from.forEach((oid) => parsers[oid] = x.parse);
      if (x.serialize) {
        serializers[x.to] = x.serialize;
        from.forEach((oid) => serializers[oid] = x.serialize);
      }
    });
  }
  function parser(oid) {
    if (oid in parsers)
      return parsers[oid];
    if (oid in bases)
      return parsers[oid] = parser(bases[oid]);
    if (oid in elements) {
      const [element, delimiter] = elements[oid], parse3 = parser(element);
      return parsers[oid] = (x) => parseArray(x, parse3 === identity ? null : parse3, delimiter);
    }
    return identity;
  }
  function serializer(oid) {
    if (oid in serializers)
      return serializers[oid];
    if (oid in bases)
      return serializers[oid] = serializer(bases[oid]);
    if (oid in elements) {
      const [element, delimiter] = elements[oid], serialize = serializer(element);
      return serializers[oid] = (xs) => Array.isArray(xs) ? serializeArray(xs, serialize, delimiter, undefinedValue) : serialize(xs);
    }
    return string;
  }
  function load(run2) {
    return Promise.all([fetched(run2), named.length && names(run2)]);
  }
  async function names(run2) {
    const wanted = [...new Set(named.flatMap((x) => [x.to].concat(x.from || [])).filter((x) => typeof x === "string"))], list = wanted.map((x) => "'" + x.split(".").pop().replace(/'/g, "''") + "'").join(","), rows = await run2(
      "select t.oid::int, t.typarray::int as array, t.typdelim as delimiter, t.typname as name, n.nspname as schema, pg_catalog.pg_type_is_visible(t.oid) as visible from pg_catalog.pg_type t join pg_catalog.pg_namespace n on n.oid = t.typnamespace where t.typname in (" + list + ")"
    ), missing = [];
    wanted.forEach((x) => {
      const [schema, name2] = x.includes(".") ? x.split(".") : [null, x], row = rows.find((r) => r.name === name2 && (schema ? r.schema === schema : r.visible));
      row ? (oids[x] = row.oid, row.array && !(row.array in elements) && (elements[row.array] = [row.oid, row.delimiter])) : missing.push(x);
    });
    if (missing.length) {
      throw Errors.generic("TYPE_NOT_FOUND", missing.length > 1 ? "The types " + missing.join(", ") + " do not exist" : "The type " + missing[0] + " does not exist");
    }
    register(named.map((x) => ({ ...x, to: resolve2(x.to), from: [].concat(x.from || []).map(resolve2) })));
  }
  function fetched(run2) {
    return run2(
      "select oid::int, typelem::int as element, typdelim as delimiter, typbasetype::int as base, typtype as kind from pg_catalog.pg_type where typtype = 'd' or (typcategory = 'A' and oid >= 16384)"
    ).then((rows) => rows.forEach(({ oid, element, delimiter, base, kind }) => {
      if (oid in parsers || oid in serializers)
        return;
      kind === "d" ? bases[oid] = base : element && !(oid in elements) && (elements[oid] = [element, delimiter]);
    }));
  }
}
var identity = (x) => x;
identity.identity = true;
var Parameter = class {
  constructor(value2, type) {
    this.value = value2;
    this.type = type;
  }
};
function infer(x) {
  return x instanceof Parameter ? x.type : x instanceof Date ? 1184 : x instanceof Uint8Array ? 17 : x === true || x === false ? 16 : typeof x === "bigint" ? 20 : Array.isArray(x) ? arrays[infer(x[0])] || 0 : 0;
}
function parseArray(x, parse3, delimiter = ",") {
  let i = x[0] === "[" ? x.indexOf("=") + 1 : 0;
  return level();
  function level() {
    const xs = [];
    i++;
    while (i < x.length && x[i] !== "}") {
      if (x[i] === "{") {
        xs.push(level());
      } else if (x[i] === '"') {
        let s = "";
        for (i++; x[i] !== '"'; i++)
          s += x[i] === "\\" ? x[++i] : x[i];
        i++;
        xs.push(parse3 ? parse3(s) : s);
      } else {
        const start2 = i;
        while (x[i] !== delimiter && x[i] !== "}")
          i++;
        const s = x.slice(start2, i);
        xs.push(s === "NULL" ? null : parse3 ? parse3(s) : s);
      }
      x[i] === delimiter && i++;
    }
    i++;
    return xs;
  }
}
function serializeArray(xs, serialize = string, delimiter = ",", undefinedValue) {
  return "{" + xs.map((x) => {
    const typed = x instanceof Parameter;
    typed && (x = x.value);
    x === void 0 && (x = undefinedValue);
    if (x === void 0)
      throw Errors.generic("UNDEFINED_VALUE", "Undefined values are not allowed");
    return Array.isArray(x) && !typed ? serializeArray(x, serialize, delimiter, undefinedValue) : x === null ? "NULL" : '"' + ("" + serialize(x)).replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
  }).join(delimiter) + "}";
}
function serializeDate(x) {
  return x === Infinity ? "infinity" : x === -Infinity ? "-infinity" : (x instanceof Date ? x : new Date(x)).toISOString();
}
var timestamp = /^(\d{4,})-(\d\d)-(\d\d)(?: (\d\d):(\d\d):(\d\d)(?:\.(\d+))?)?(?:([+-])(\d\d)(?::(\d\d))?(?::(\d\d))?)?( BC)?$/;
function parts(x) {
  const m = x.match(timestamp);
  if (!m)
    return null;
  const year = m[12] ? 1 - m[1] : +m[1], ms = m[7] ? +(m[7] + "00").slice(0, 3) : 0, offset = m[8] ? (m[8] === "-" ? -1 : 1) * ((m[9] * 60 + +(m[10] || 0)) * 60 + +(m[11] || 0)) * 1e3 : 0;
  return { year, month: m[2] - 1, day: +m[3], hour: +(m[4] || 0), minute: +(m[5] || 0), second: +(m[6] || 0), ms, offset };
}
function infinite(x) {
  return x === "infinity" ? Infinity : x === "-infinity" ? -Infinity : null;
}
function utc(x) {
  const date = new Date(Date.UTC(2e3, x.month, x.day, x.hour, x.minute, x.second, x.ms));
  date.setUTCFullYear(x.year);
  return date;
}
function plain(x) {
  const n = x.length;
  return x.charCodeAt(0) !== 48 && x.charCodeAt(n - 1) !== 67 && !(x.charCodeAt(n - 3) === 58 && x.charCodeAt(n - 6) === 58) && x.charCodeAt(0) !== 45 && x.charCodeAt(0) !== 105;
}
function parseTimestamptz(x) {
  if (plain(x))
    return new Date(x);
  const p2 = infinite(x) || parts(x);
  if (!p2)
    return new Date(x);
  if (typeof p2 === "number")
    return p2;
  const date = utc(p2);
  date.setTime(date.getTime() - p2.offset);
  return date;
}
function parseDate(x) {
  const p2 = infinite(x) || parts(x);
  return !p2 ? new Date(x) : typeof p2 === "number" ? p2 : utc(p2);
}
function parseTimestamp(x) {
  const p2 = infinite(x) || parts(x);
  if (!p2 || typeof p2 === "number")
    return p2 || new Date(x);
  const date = new Date(2e3, p2.month, p2.day, p2.hour, p2.minute, p2.second, p2.ms);
  date.setFullYear(p2.year);
  return date;
}
var toCamel = (x) => {
  let str2 = x[0];
  for (let i = 1; i < x.length; i++)
    str2 += x[i] === "_" ? x[++i].toUpperCase() : x[i];
  return str2;
};
var toPascal = (x) => {
  let str2 = x[0].toUpperCase();
  for (let i = 1; i < x.length; i++)
    str2 += x[i] === "_" ? x[++i].toUpperCase() : x[i];
  return str2;
};
var toKebab = (x) => x.replace(/_/g, "-");
var fromCamel = (x) => x.replace(/([A-Z])/g, "_$1").toLowerCase();
var fromPascal = (x) => (x.slice(0, 1) + x.slice(1).replace(/([A-Z])/g, "_$1")).toLowerCase();
var fromKebab = (x) => x.replace(/-/g, "_");
function createJsonTransform(fn) {
  return function jsonTransform(x, column2) {
    return typeof x === "object" && x !== null && (column2.type === 114 || column2.type === 3802) ? Array.isArray(x) ? x.map((x2) => jsonTransform(x2, column2)) : Object.entries(x).reduce((acc, [k, v]) => Object.assign(acc, { [fn(k)]: jsonTransform(v, column2) }), {}) : x;
  };
}
toCamel.column = { from: toCamel };
toCamel.value = { from: createJsonTransform(toCamel) };
fromCamel.column = { to: fromCamel };
var camel = { ...toCamel };
camel.column.to = fromCamel;
toPascal.column = { from: toPascal };
toPascal.value = { from: createJsonTransform(toPascal) };
fromPascal.column = { to: fromPascal };
var pascal = { ...toPascal };
pascal.column.to = fromPascal;
toKebab.column = { from: toKebab };
toKebab.value = { from: createJsonTransform(toKebab) };
fromKebab.column = { to: fromKebab };
var kebab = { ...toKebab };
kebab.column.to = fromKebab;

// node_modules/postgres/src/build.js
var isQuery = /* @__PURE__ */ Symbol("query");
var NotTagged = class {
  then() {
    notTagged();
  }
  catch() {
    notTagged();
  }
  finally() {
    notTagged();
  }
};
var Identifier = class extends NotTagged {
  constructor(value2) {
    super();
    this.value = escapeIdentifier(value2);
  }
};
var Join = class {
  constructor(separator, items) {
    this.separator = separator;
    this.items = items;
  }
};
var joinStrings = Object.assign(["", ""], { raw: ["", ""] });
var Builder = class extends NotTagged {
  constructor(first, rest) {
    super();
    this.first = first;
    this.rest = rest;
  }
};
function build(query2, options) {
  const values2 = [], oids = [], o = { transform: options.transform, infer: options.infer !== false, resolve: options.resolve, values: values2, oids, dynamic: !query2.tagged };
  const text3 = query2.tagged ? stringify(query2, o) : (query2.args.forEach((x) => value(x, o)), "" + query2.strings[0]);
  if (values2.length >= 65534)
    throw Errors.generic("MAX_PARAMETERS_EXCEEDED", "Max number of parameters (65534) exceeded");
  const types2 = oids.join();
  return { strings: query2.strings, dynamic: o.dynamic, types: types2, text: text3, values: values2, oids };
}
function stringify(q, o) {
  let string2 = q.strings[0];
  for (let i = 1; i < q.strings.length; i++)
    string2 += part(string2, q.args[i - 1], o, q.strings[i]) + q.strings[i];
  return string2;
}
function part(before, x, o, after2 = "") {
  if (x instanceof Builder || x instanceof Identifier || isFragment(x) || Array.isArray(x) && isFragment(x[0]))
    o.dynamic = true;
  return isFragment(x) && x.strings === joinStrings ? joined(x.args[0], o, before, after2) : x instanceof Join ? joined(x, o, "", "") : x instanceof Builder ? helper(before, x, o) : isFragment(x) ? fragment(x, o) : x instanceof Identifier ? x.value : Array.isArray(x) && isFragment(x[0]) ? x.reduce((acc, x2) => acc + " " + fragment(x2, o), "") : value(x, o);
}
function joined(join, o, before, after2) {
  let text3 = "";
  join.items.forEach((item, i) => {
    i > 0 && (text3 = spaced(text3, fragment(join.separator, o)));
    text3 = spaced(text3, part("", item, o));
  });
  before && text3 && !/\s$/.test(before) && !/^\s/.test(text3) && (text3 = " " + text3);
  after2 && text3 && !/^\s/.test(after2) && !/\s$/.test(text3) && (text3 = text3 + " ");
  return text3;
}
function spaced(a, b) {
  return a && b && !/\s$/.test(a) && !/^\s/.test(b) ? a + " " + b : a + b;
}
function isFragment(x) {
  return !!x && x[isQuery] === true;
}
function fragment(q, o) {
  return q.tagged ? stringify(q, o) : q.strings[0];
}
function value(x, o) {
  let v = x instanceof Parameter ? x.value : x;
  if (v === void 0) {
    v = o.transform.undefined;
    if (v === void 0)
      throw Errors.generic("UNDEFINED_VALUE", "Undefined values are not allowed");
    x instanceof Parameter || (x = v);
  }
  o.values.push(v);
  o.oids.push(x instanceof Parameter ? o.resolve(x.type) : o.infer ? infer(x) : 0);
  return "$" + o.values.length;
}
var builders = {
  values,
  in: (...xs) => {
    const x = values(...xs);
    return x === "()" ? "(null)" : x;
  },
  select,
  update,
  insert,
  call
};
function call(first, rest, o) {
  if (first === null || typeof first !== "object" || Array.isArray(first) || isFragment(first))
    return select(first, rest, o);
  return columns(first, rest).map(
    (x) => escapeIdentifier(column(x, o)) + " => " + part("values", first[x], o)
  ).join(",");
}
var clauses = { in: "in", values: "values", select: "select", returning: "select", set: "update", distinct: "select" };
var stops = /* @__PURE__ */ new Set([
  "from",
  "where",
  "on",
  "to",
  "join",
  "group",
  "order",
  "by",
  "having",
  "limit",
  "offset",
  "union",
  "intersect",
  "except",
  "using",
  "and",
  "or",
  "when",
  "then",
  "else",
  "with",
  "table",
  "grant",
  "revoke",
  "delete",
  "update",
  "case",
  "not",
  "like",
  "ilike",
  "between",
  "is",
  "exists",
  "conflict",
  "do",
  "nothing",
  "window",
  "over",
  "partition",
  "filter",
  "lateral",
  "cross",
  "inner",
  "left",
  "right",
  "full",
  "outer",
  "natural",
  "into"
]);
function helper(before, x, o) {
  const kind = context(before);
  return kind ? builders[kind](x.first, x.rest, o) : identifiers(typeof x.first === "string" ? [x.first].concat(x.rest) : x.first, o);
}
function context(sql) {
  const words = [];
  let i = sql.length - 1, depth = 0;
  while (i >= 0) {
    const c2 = sql[i];
    if (c2 === ")") {
      depth++;
      i--;
    } else if (c2 === "(") {
      if (depth === 0) {
        const word = previous(sql, i - 1);
        if (words.length === 0)
          return word === "in" || word === "values" ? word : word && !clauses[word] && !stops.has(word) ? "call" : "select";
        return "select";
      }
      depth--;
      i--;
    } else if (c2 === "'" || c2 === '"') {
      const end = i;
      i--;
      while (i >= 0 && !(sql[i] === c2 && sql[i - 1] !== c2))
        sql[i] === c2 ? i -= 2 : i--;
      i--;
      if (sql[i] === ".")
        i--;
      else
        depth === 0 && c2 === '"' && words.push(sql.slice(i + 1, end + 1));
    } else if (/[a-z_0-9$]/i.test(c2)) {
      const end = i + 1;
      while (i >= 0 && /[a-z_0-9$.]/i.test(sql[i]))
        i--;
      const word = depth === 0 && sql.slice(i + 1, end).toLowerCase();
      if (word && clauses[word])
        return clauses[word];
      if (word === "into")
        return insert_into(words, sql, i) ? "insert" : null;
      if (word && stops.has(word))
        return null;
      word && words.push(word);
    } else {
      i--;
    }
  }
  return null;
}
function previous(sql, i) {
  while (i >= 0 && /\s/.test(sql[i]))
    i--;
  if (sql[i] === '"')
    return '"';
  const end = i + 1;
  while (i >= 0 && /[a-z_0-9$.]/i.test(sql[i]))
    i--;
  return sql.slice(i + 1, end).toLowerCase();
}
function insert_into(words, sql, i) {
  const target = words.length === 1 || words.length === 3 && words[1] === "as";
  return target && previous(sql, i) === "insert";
}
function valuesBuilder(first, columns2, o) {
  return first.map(
    (row) => "(" + columns2.map((x) => part("values", row[x], o)).join(",") + ")"
  ).join(",");
}
function values(first, rest, o) {
  const rows = Array.isArray(first) && first.length > 0 && first[0] !== null && typeof first[0] === "object" && !isFragment(first[0]), picked = columns(rows ? first[0] : first, rest);
  return valuesBuilder(rows ? first : [first], picked, o);
}
function update(first, rest, o) {
  const picked = columns(first, rest);
  picked.length || empty("update");
  return picked.map(
    (x) => escapeIdentifier(column(x, o)) + "=" + part("values", first[x], o)
  );
}
function insert(first, rest, o) {
  if (Array.isArray(first) && first.every((x) => typeof x === "string"))
    return "(" + escapeIdentifiers(first.concat(rest.flat()), o) + ")";
  const picked = columns(Array.isArray(first) ? first[0] || {} : first, rest);
  picked.length || empty("insert");
  return "(" + escapeIdentifiers(picked, o) + ")values" + valuesBuilder(Array.isArray(first) ? first : [first], picked, o);
}
function columns(first, rest) {
  return rest.length ? rest.flat() : Object.keys(first);
}
function empty(x) {
  throw Errors.generic("NO_COLUMNS", "The " + x + " helper got no columns");
}
function identifiers(first, o) {
  return Array.isArray(first) ? first.map((x) => member(x, o)).join(",") : member(first, o);
}
function member(x, o) {
  return isFragment(x) ? fragment(x, o) : x instanceof Identifier ? x.value : escapeIdentifier(column(x, o));
}
function select(first, rest, o) {
  typeof first === "string" && (first = [first].concat(rest));
  if (Array.isArray(first))
    return identifiers(first, o);
  return columns(first, rest).map((x) => {
    const v = first[x];
    return (isFragment(v) ? fragment(v, o) : v instanceof Identifier ? v.value : value(v, o)) + " as " + escapeIdentifier(column(x, o));
  }).join(",");
}
function column(x, o) {
  return o.transform.column.to ? o.transform.column.to(x) : x;
}
function escapeIdentifiers(xs, o) {
  return xs.map((x) => escapeIdentifier(column(x, o))).join(",");
}
function escapeIdentifier(x) {
  return '"' + x.replace(/"/g, '""').replace(/\./g, '"."') + '"';
}
function notTagged() {
  throw Errors.generic("NOT_TAGGED_CALL", "Query not called as a tagged template literal");
}

// node_modules/postgres/src/query.js
import util2 from "util";

// node_modules/postgres/src/diagnostics.js
import dc from "diagnostics_channel";
var channels = {
  query: tracing("postgres:query"),
  connect: tracing("postgres:connect"),
  transaction: tracing("postgres:transaction"),
  pool: plain2("postgres:pool"),
  notice: plain2("postgres:notice")
};
var done = /* @__PURE__ */ Symbol("done");
var now = () => performance.now();
var userName = (options) => typeof options.user === "function" ? null : options.user;
function active(t) {
  return !!t && (t.hasSubscribers !== void 0 ? t.hasSubscribers : t.start.hasSubscribers || t.end.hasSubscribers || t.asyncStart.hasSubscribers || t.asyncEnd.hasSubscribers || t.error.hasSubscribers);
}
function listened(channel) {
  return !!channel && channel.hasSubscribers;
}
function start(t, context3, fn) {
  return typeof t.start.runStores === "function" ? t.start.runStores(context3, run2) : (t.start.publish(context3), run2());
  function run2() {
    try {
      return fn();
    } finally {
      t.end.publish(context3);
    }
  }
}
function finish(t, context3, error2, result) {
  if (context3[done])
    return;
  context3[done] = true;
  if (error2) {
    context3.error = error2;
    t.error.publish(context3);
  } else {
    context3.result = result;
  }
  t.asyncStart.publish(context3);
  t.asyncEnd.publish(context3);
}
function tracing(name2) {
  try {
    return typeof dc.tracingChannel === "function" ? dc.tracingChannel(name2) : null;
  } catch (error2) {
    return null;
  }
}
function plain2(name2) {
  try {
    return dc.channel(name2);
  } catch (error2) {
    return null;
  }
}

// node_modules/postgres/src/result.js
var Result = class extends Array {
  #count = null;
  #state = null;
  #command = null;
  #columns = null;
  #statement = null;
  get count() {
    return this.#count;
  }
  set count(x) {
    this.#count = x;
  }
  get state() {
    return this.#state;
  }
  set state(x) {
    this.#state = x;
  }
  get command() {
    return this.#command;
  }
  set command(x) {
    this.#command = x;
  }
  get columns() {
    return this.#columns;
  }
  set columns(x) {
    this.#columns = x;
  }
  get statement() {
    const x = this.#statement;
    return x && x.kind ? this.#statement = statement(x) : x;
  }
  set statement(x) {
    this.#statement = x;
  }
  static get [Symbol.species]() {
    return Array;
  }
};
function statement(item) {
  const x = item.statement;
  return {
    name: x ? x.name : "",
    string: x ? x.text : item.text || "",
    types: item.params || item.entry && item.entry.oids || x && x.oids || [],
    columns: item.columns || []
  };
}

// node_modules/postgres/src/query.js
var origins = /* @__PURE__ */ new WeakMap();
var CLOSE = {};
var Query = class _Query extends Promise {
  constructor(strings, args, handler, options = {}) {
    let resolve2, reject;
    super((a, b) => {
      resolve2 = a;
      reject = b;
    });
    this.fulfil = resolve2;
    this.fail = reject;
    this[isQuery] = true;
    this.tagged = Array.isArray(strings.raw);
    this.strings = strings;
    this.args = args;
    this.handler = handler;
    this.options = options;
    this.state = null;
    this.source = null;
    this.active = false;
    this.executed = false;
    this.settled = false;
    this.built = null;
    this.trace = null;
    this.aborts = null;
    this.originError = handler.debug ? new Error() : null;
    this.tagged && !handler.debug && !origins.has(strings) && origins.set(strings, located());
  }
  static get [Symbol.species]() {
    return Promise;
  }
  join(items) {
    const kept = [...items].filter((x) => x !== false && x !== null && x !== void 0), joined2 = new _Query(joinStrings, [new Join(this, kept)], this.handler);
    Object.defineProperty(joined2, "length", { value: kept.length });
    return joined2;
  }
  resolve(x) {
    this.aborts && this.aborts();
    this.active = false;
    this.settled = true;
    this.trace && traced(this, null, x);
    this.fulfil(x);
  }
  reject(x) {
    this.aborts && this.aborts();
    this.active = false;
    this.settled = true;
    this.trace && traced(this, x);
    this.fail(x);
  }
  get origin() {
    return this.originError ? this.originError.stack : this.tagged && origins.get(this.strings) || "";
  }
  get statement() {
    return this.source && statement(this.source);
  }
  build() {
    return this.built || (this.built = build(this, this.handler.options));
  }
  get text() {
    return this.build().text;
  }
  get parameters() {
    return this.build().values;
  }
  [util2.inspect.custom](depth, options, inspect) {
    if (!this.handler.debug)
      return "Query {}";
    let x;
    try {
      x = this.build();
    } catch (error2) {
      return "Query { " + error2.message + " }";
    }
    return "Query " + inspect({ text: x.text, parameters: x.values }, options);
  }
  cancel() {
    return this.handler.cancel ? this.handler.cancel(this) : Promise.resolve();
  }
  signal(signal) {
    if (!signal || this.settled)
      return this;
    if (signal.aborted)
      return this.cancel(), this;
    const abort = () => this.cancel();
    signal.addEventListener("abort", abort, { once: true });
    this.aborts = () => (this.aborts = null, signal.removeEventListener("abort", abort));
    return this;
  }
  simple() {
    this.options.simple = true;
    this.options.prepare = false;
    return this;
  }
  async readable() {
    this.simple();
    this.streaming = true;
    return this;
  }
  async writable() {
    this.simple();
    this.streaming = true;
    return this;
  }
  cursor(rows = 1, fn) {
    this.options.simple = false;
    if (typeof rows === "function") {
      fn = rows;
      rows = 1;
    }
    this.cursorRows = rows;
    if (typeof fn === "function")
      return this.cursorFn = fn, this;
    let prev;
    return {
      [Symbol.asyncIterator]: () => ({
        next: () => {
          if (this.executed && !this.active)
            return { done: true };
          prev && prev();
          const promise = new Promise((resolve2, reject) => {
            this.cursorFn = (value2) => {
              resolve2({ value: value2, done: false });
              return new Promise((r) => prev = r);
            };
            this.resolve = (x) => (this.active = false, this.settled = true, this.trace && traced(this, null, x), resolve2({ done: true }));
            this.reject = (x) => (this.active = false, this.settled = true, this.trace && traced(this, x), reject(x));
          });
          this.execute();
          return promise;
        },
        return() {
          prev && prev(CLOSE);
          return { done: true };
        }
      })
    };
  }
  describe() {
    this.options.simple = false;
    this.onlyDescribe = this.options.prepare = true;
    return this;
  }
  stream() {
    throw new Error(".stream has been renamed to .forEach");
  }
  forEach(fn) {
    this.forEachFn = fn;
    this.handle();
    return this;
  }
  raw() {
    this.isRaw = true;
    return this;
  }
  values() {
    this.isRaw = "values";
    return this;
  }
  handle() {
    if (this.executed)
      return;
    this.executed = true;
    queueMicrotask(() => this.run());
  }
  run() {
    active(channels.query) ? start(channels.query, this.trace = context2(this), () => this.handler(this)) : this.handler(this);
  }
  execute() {
    this.handle();
    return this;
  }
  then(fulfilled, rejected) {
    this.handle();
    return super.then(fulfilled, rejected);
  }
  catch(rejected) {
    this.handle();
    return super.catch(rejected);
  }
  finally(fn) {
    this.handle();
    return super.finally(fn);
  }
};
function context2(q) {
  const options = q.handler.options || {};
  let text3 = null;
  if (q.strings.length) {
    try {
      text3 = q.text;
    } catch (error2) {
      text3 = null;
    }
  }
  return {
    query: text3,
    parameters: void 0,
    database: options.database,
    user: userName(options),
    host: null,
    port: null,
    connection: null,
    statement: null,
    command: null,
    count: null,
    queued: now(),
    sent: null,
    firstByte: null,
    complete: null
  };
}
function traced(q, error2, result) {
  const x = q.trace;
  q.trace = null;
  x.complete = now();
  if (result && typeof result === "object" && "command" in result) {
    x.command = result.command;
    x.count = result.count;
  }
  finish(channels.query, x, error2, result);
}
function located() {
  const limit3 = Error.stackTraceLimit;
  Error.stackTraceLimit = 8;
  try {
    return trim(String(new Error().stack));
  } catch (error2) {
    return "";
  } finally {
    Error.stackTraceLimit = limit3;
  }
}
function trim(stack) {
  const lines = stack.split("\n"), i = lines.findIndex((x, i2) => i2 > 0 && !ours(x));
  return i === -1 ? stack : lines.slice(0, i + 1).join("\n");
}

// node_modules/postgres/src/startup.js
import crypto from "crypto";
import fs from "fs";

// node_modules/postgres/src/protocol.js
function Writer(size = 16384) {
  let b = Buffer.allocUnsafe(size), i = 0, at = 0;
  const w = {
    get length() {
      return i;
    },
    type(x) {
      fit(5);
      at = i;
      b[i] = x;
      i += 5;
      return w;
    },
    untyped() {
      fit(4);
      at = i;
      i += 4;
      return w;
    },
    end() {
      b.writeInt32BE(i - at - 1, at + 1);
      return w;
    },
    endUntyped() {
      b.writeInt32BE(i - at, at);
      return w;
    },
    str(x) {
      fit(x.length * 3 + 1);
      i += b.write(x, i);
      b[i++] = 0;
      return w;
    },
    bytes(x) {
      if (typeof x === "string") {
        fit(x.length * 3);
        i += b.write(x, i);
      } else {
        fit(x.length);
        b.set(x, i);
        i += x.length;
      }
      return w;
    },
    value(x) {
      if (x === null || x === void 0)
        return w.i32(-1);
      const n = i;
      i += 4;
      w.bytes(x);
      b.writeInt32BE(i - n - 4, n);
      return w;
    },
    u8(x) {
      fit(1);
      b[i++] = x;
      return w;
    },
    i16(x) {
      fit(2);
      b.writeInt16BE(x, i);
      i += 2;
      return w;
    },
    u16(x) {
      fit(2);
      b.writeUInt16BE(x, i);
      i += 2;
      return w;
    },
    i32(x) {
      fit(4);
      b.writeInt32BE(x, i);
      i += 4;
      return w;
    },
    truncate(n) {
      i = n;
      return w;
    },
    take() {
      const out = i < 4096 ? Buffer.from(b.subarray(0, i)) : b.subarray(0, i);
      i >= 4096 && (b = Buffer.allocUnsafe(size));
      i = at = 0;
      return out;
    }
  };
  return w;
  function fit(n) {
    if (b.length - i >= n)
      return;
    const prev = b;
    b = Buffer.allocUnsafe(Math.max(size, prev.length * 2, i + n));
    prev.copy(b, 0, 0, i);
  }
}
var own = Writer(1024);
var S = 83;
var H = 72;
var X = 88;
var c = 99;
var Q = 81;
var p = 112;
var d = 100;
var f = 102;
var D = 68;
var C = 67;
var E = 69;
var P = 80;
var B = 66;
var sync = (w) => w.type(S).end();
var flush = (w) => w.type(H).end();
var terminate = (w) => w.type(X).end();
var copyDone = (w) => w.type(c).end();
var sslRequest = (w) => w.untyped().i32(80877103).endUntyped();
var query = (w, text3) => w.type(Q).str(text3).end();
var password = (w, x) => w.type(p).str(x).end();
var saslResponse = (w, x) => w.type(p).bytes(x).end();
var copyData = (w, x) => w.type(d).bytes(x).end();
var copyFail = (w, x) => w.type(f).str(x).end();
var describe = (w, kind, name2) => w.type(D).u8(kind.charCodeAt(0)).str(name2).end();
var close = (w, kind, name2) => w.type(C).u8(kind.charCodeAt(0)).str(name2).end();
var execute = (w, portal, rows = 0) => w.type(E).str(portal).i32(rows).end();
var cancel = (w, pid, secret) => w.untyped().i32(80877102).i32(pid).i32(secret).endUntyped();
var Sync = one(sync);
var Flush = one(flush);
var Terminate = one(terminate);
var CopyDone = one(copyDone);
var SSLRequest = one(sslRequest);
var Query2 = one(query);
var Password = one(password);
var SASLResponse = one(saslResponse);
var CopyData = one(copyData);
var CopyFail = one(copyFail);
var Describe = one(describe);
var Close = one(close);
var Execute = one(execute);
var Cancel = one(cancel);
var Startup = one(startup);
var SASL = one(sasl);
var Parse = one(parse);
var Bind = one(bind);
var Run = one(run);
function one(fn) {
  return (...xs) => {
    try {
      fn(own, ...xs);
    } catch (error2) {
      own.truncate(0);
      throw error2;
    }
    return own.take();
  };
}
function startup(w, parameters) {
  w.untyped().i32(196608);
  for (const k in parameters)
    parameters[k] && w.str(unbroken(k, k)).str(unbroken(k, "" + parameters[k]));
  return w.u8(0).endUntyped();
}
function unbroken(k, x) {
  if (x.indexOf("\0") !== -1)
    throw Object.assign(new Error("The connection parameter " + k + " contains a NUL character"), { code: "NUL_CHARACTER" });
  return x;
}
function sasl(w, mechanism, initial) {
  return w.type(p).str(mechanism).i32(Buffer.byteLength(initial)).bytes(initial).end();
}
function parse(w, name2, text3, oids = []) {
  w.type(P).str(name2).str(text3).u16(oids.length);
  for (let j = 0; j < oids.length; j++)
    w.i32(oids[j] | 0);
  return w.end();
}
function bind(w, portal, name2, values2 = [], formats = [], resultFormats = []) {
  w.type(B).str(portal).str(name2).i16(formats.length);
  for (let j = 0; j < formats.length; j++)
    w.i16(formats[j]);
  w.u16(values2.length);
  for (let j = 0; j < values2.length; j++)
    w.value(values2[j]);
  w.i16(resultFormats.length);
  for (let j = 0; j < resultFormats.length; j++)
    w.i16(resultFormats[j]);
  return w.end();
}
function run(w, portal, name2, values2, rows, flushing) {
  bind(w, portal, name2, values2);
  execute(w, portal, rows);
  return flushing ? flush(w) : sync(w);
}
var largest = 1073741824;
function Frames(onframe, shared = false, onerror = null) {
  const chunks = [], owned = /* @__PURE__ */ new WeakSet();
  let data = null, owning = false, at = 0, part2 = null, filled = 0, paused = false, running = false, broken = false;
  return {
    push(x) {
      if (broken)
        return;
      chunks.push(shared && (paused || owning) ? own3(x) : x);
      run2();
    },
    get paused() {
      return paused;
    },
    owns(x) {
      return !shared || owned.has(x);
    },
    own(x) {
      owning = x;
      x && settle();
    },
    pause() {
      paused = true;
      settle();
    },
    resume() {
      paused = false;
      run2();
    }
  };
  function own3(x) {
    const copy = Buffer.from(x);
    owned.add(copy);
    return copy;
  }
  function settle() {
    if (!shared)
      return;
    data && at < data.length && !owned.has(data) && (data = own3(data.subarray(at)), at = 0);
    for (let i = 0; i < chunks.length; i++)
      owned.has(chunks[i]) || (chunks[i] = own3(chunks[i]));
  }
  function run2() {
    if (running)
      return;
    running = true;
    try {
      while (true) {
        if (broken || paused || !(data && at < data.length || next()))
          break;
        part2 ? fill() : frame();
      }
    } finally {
      running = false;
    }
  }
  function invalid(length) {
    if (length >= 4 && length <= largest)
      return false;
    broken = true;
    chunks.length = 0;
    data = part2 = null;
    at = filled = 0;
    const error2 = Object.assign(new Error("The server sent a message with an invalid length (" + length + ")"), { code: "PROTOCOL_ERROR" });
    onerror && onerror(error2);
    return true;
  }
  function next() {
    data = chunks.shift() || null;
    at = 0;
    return data !== null;
  }
  function frame() {
    const left = data.length - at;
    if (left < 5)
      return start2(5);
    const length = data.readInt32BE(at + 1);
    if (invalid(length))
      return;
    const end = at + 1 + length;
    if (end > data.length)
      return start2(end - at);
    const begin = at;
    at = end;
    onframe(data[begin], data, begin, end);
  }
  function start2(length) {
    part2 = Buffer.allocUnsafe(length);
    shared && owned.add(part2);
    filled = data.copy(part2, 0, at);
    at = data.length;
  }
  function fill() {
    const n = data.copy(part2, filled, at, at + part2.length - filled);
    filled += n;
    at += n;
    if (filled < part2.length)
      return;
    if (part2.length === 5) {
      const head = part2, length = head.readInt32BE(1);
      if (invalid(length))
        return;
      part2 = Buffer.allocUnsafe(1 + length);
      shared && owned.add(part2);
      filled = head.copy(part2);
      return filled === part2.length && done2();
    }
    done2();
  }
  function done2() {
    const x = part2;
    part2 = null;
    onframe(x[0], x, 0, x.length);
  }
}
var errorFields = {
  83: "severity_local",
  86: "severity",
  67: "code",
  77: "message",
  68: "detail",
  72: "hint",
  80: "position",
  112: "internal_position",
  113: "internal_query",
  87: "where",
  115: "schema_name",
  116: "table_name",
  99: "column_name",
  100: "data_type_name",
  110: "constraint_name",
  70: "file",
  76: "line",
  82: "routine"
};
function error(x, start2, end) {
  const fields = {};
  for (let i = start2 + 5; i < end - 1; ) {
    const zero = x.indexOf(0, i + 1);
    fields[errorFields[x[i]] || String.fromCharCode(x[i])] = x.toString("utf8", i + 1, zero);
    i = zero + 1;
  }
  return fields;
}
var text = typeof Buffer.prototype.utf8Slice === "function" ? (x, start2, end) => x.utf8Slice(start2, end) : (x, start2, end) => x.toString("utf8", start2, end);
var u32 = (x, i) => (x[i] << 24 | x[i + 1] << 16 | x[i + 2] << 8 | x[i + 3]) >>> 0;
var u16 = (x, i) => x[i] << 8 | x[i + 1];
var field = (name2, table, number2, type) => ({ name: name2, table, number: number2, type });
function rowDescription(x, start2, end, make = field) {
  const columns2 = new Array(x[start2 + 5] << 8 | x[start2 + 6]);
  for (let i = start2 + 7, j = 0; j < columns2.length; j++) {
    let zero = i;
    while (x[zero] !== 0)
      zero++;
    columns2[j] = make(text(x, i, zero), u32(x, zero + 1), u16(x, zero + 5), u32(x, zero + 7));
    i = zero + 19;
  }
  return columns2;
}
function parameterDescription(x, start2) {
  const oids = new Array(x.readUInt16BE(start2 + 5));
  for (let j = 0; j < oids.length; j++)
    oids[j] = x.readUInt32BE(start2 + 7 + j * 4);
  return oids;
}
function commandComplete(x, start2, end) {
  const first = start2 + 5;
  let e = end - 1, count = null;
  while (true) {
    let s = e - 1;
    while (s >= first && x[s] >= 48 && x[s] <= 57)
      s--;
    if (s === e - 1 || s < first || x[s] !== 32)
      break;
    count === null && (count = +text(x, s + 1, e));
    e = s;
  }
  return { command: text(x, first, e), count };
}
function readyForQuery(x, start2) {
  return String.fromCharCode(x[start2 + 5]);
}
function notification(x, start2) {
  const zero = x.indexOf(0, start2 + 9);
  return {
    pid: x.readInt32BE(start2 + 5),
    channel: x.toString("utf8", start2 + 9, zero),
    payload: x.toString("utf8", zero + 1, x.indexOf(0, zero + 1))
  };
}
function parameterStatus(x, start2) {
  const zero = x.indexOf(0, start2 + 5);
  return [x.toString("utf8", start2 + 5, zero), x.toString("utf8", zero + 1, x.indexOf(0, zero + 1))];
}
function backendKeyData(x, start2) {
  return { pid: x.readInt32BE(start2 + 5), secret: x.readInt32BE(start2 + 9) };
}

// node_modules/postgres/src/socket.js
import net from "net";
import tls from "tls";
var noop = () => {
};
var agent = globalThis.navigator && globalThis.navigator.userAgent || "";
var workers = agent.startsWith("Cloudflare-Workers");
var onreadSafe = !agent || agent.startsWith("Node.js") || agent.startsWith("Bun") || agent.startsWith("Deno");
async function Socket(options, host, port, track = noop) {
  const raw = options.socket ? await options.socket(options, host, port) : await connect(options, host, port, track);
  return wrap(raw, host);
}
function secureOptions(ssl) {
  return ssl === "require" || ssl === "allow" || ssl === "prefer" ? workers ? {} : { rejectUnauthorized: false } : typeof ssl === "object" ? ssl : {};
}
var secured = (options) => !!options.ssl && options.ssl !== "disable";
var direct = (options) => secured(options) && options.sslnegotiation === "direct";
function connect(options, host, port, track) {
  return new Promise((resolve2, reject) => {
    const tlsNow = direct(options), plain3 = !secured(options), reads = (plain3 || tlsNow) && onreadSafe && options.onread !== false && {
      buffer: Buffer.allocUnsafe(65536),
      callback: (n, b) => socket.ondata(b.subarray(0, n))
    }, target = options.path ? { path: options.path } : { port, host }, socket = tlsNow ? tls.connect({
      ...target,
      servername: net.isIP(host || "") || options.path ? void 0 : host,
      ...secureOptions(options.ssl),
      ALPNProtocols: ["postgresql"],
      ...reads ? { onread: reads } : {}
    }) : net.connect({ ...target, ...reads ? { onread: reads } : {} });
    track(socket);
    socket.shared = !!reads;
    socket.secure = tlsNow;
    socket.ondata = noop;
    socket.once("error", reject);
    socket.once(tlsNow ? "secureConnect" : "connect", () => {
      socket.off("error", reject);
      socket.setNoDelay(true);
      resolve2(socket);
    });
  });
}
function wrap(socket, host) {
  let closed = false, failure = null;
  socket.shared && (socket.ondata = data);
  const x = {
    ondata: noop,
    ondrain: noop,
    onclose: noop,
    get raw() {
      return socket;
    },
    get closed() {
      return closed;
    },
    get shared() {
      return !!socket.shared;
    },
    get negotiated() {
      return !!socket.secure || !!socket.negotiated;
    },
    certificate() {
      const x2 = typeof socket.getPeerCertificate === "function" && socket.getPeerCertificate();
      return x2 && x2.raw || null;
    },
    write: (data2) => !closed && socket.write(data2),
    upgrade,
    pause: () => socket.pause(),
    resume: () => socket.resume(),
    ref: () => socket.ref && socket.ref(),
    unref: () => socket.unref && socket.unref(),
    end(data2) {
      closed || (data2 ? socket.end(data2) : socket.end());
    },
    destroy(error3) {
      error3 && !failure && (failure = error3);
      socket.destroy();
    },
    keepAlive(seconds) {
      seconds && socket.setKeepAlive && socket.setKeepAlive(true, 1e3 * seconds);
    }
  };
  listen();
  return x;
  function listen() {
    socket.on("data", data);
    socket.on("drain", drain);
    socket.on("error", error2);
    socket.on("close", close2);
  }
  function unlisten() {
    socket.off("data", data);
    socket.off("drain", drain);
    socket.off("error", error2);
    socket.off("close", close2);
  }
  function data(buffer) {
    x.ondata(buffer);
  }
  function drain() {
    x.ondrain();
  }
  function error2(err) {
    failure || (failure = err);
    socket.destroy();
    close2();
  }
  function close2() {
    if (closed)
      return;
    closed = true;
    x.onclose(failure);
  }
  function upgrade(options = {}) {
    return new Promise((resolve2, reject) => {
      unlisten();
      const secure = tls.connect({
        socket,
        servername: net.isIP(host || "") ? void 0 : host,
        ...options
      });
      const fail4 = (err) => {
        secure.off("secureConnect", ready);
        reject(err);
      };
      function ready() {
        secure.off("error", fail4);
        socket = secure;
        listen();
        resolve2(x);
      }
      secure.once("secureConnect", ready);
      secure.once("error", fail4);
    });
  }
}

// node_modules/postgres/src/startup.js
var noop2 = () => {
};
var R = 82;
var S2 = 83;
var K = 75;
var E2 = 69;
var N = 78;
var D2 = 68;
var Z = 90;
async function open(options, signal = { aborted: false, sockets: /* @__PURE__ */ new Set() }, first = 0) {
  const hosts2 = options.path ? [null] : options.host, wanted = options.target_session_attrs, passes = wanted === "prefer-standby" ? ["standby", "any"] : [wanted || "any"];
  let last;
  for (const want of passes) {
    for (let n = 0; n < hosts2.length; n++) {
      const i = (first + n) % hosts2.length, host = hosts2[i], port = options.port[i] || options.port[0], [failed, error2, ready] = await traced2(options, host, port, signal).then((x) => [false, null, x], (x) => [true, x]);
      if (!failed && fits(want, ready.attributes))
        return ready.index = i, ready;
      failed || ready.socket.end(Terminate());
      last = failed ? error2 : Errors.connection("CONNECTION_DESTROYED", options, host, port);
      if (signal.aborted)
        throw last;
    }
  }
  throw last;
}
function traced2(options, host, port, signal) {
  if (!active(channels.connect))
    return attempt(options, host, port, signal);
  const context3 = {
    host: options.path ? null : host,
    port: options.path ? null : port,
    path: options.path || null,
    database: options.database,
    user: userName(options),
    ssl: secured(options),
    sslnegotiation: options.sslnegotiation || "postgres"
  };
  let promise;
  start(channels.connect, context3, () => promise = attempt(options, host, port, signal));
  return promise.then((ready) => {
    finish(channels.connect, context3, null, {
      pid: ready.backend.pid,
      status: ready.status,
      readOnly: ready.attributes.readOnly,
      standby: ready.attributes.standby
    });
    return ready;
  }, (error2) => {
    finish(channels.connect, context3, error2);
    throw error2;
  });
}
function fits(want, { readOnly, standby }) {
  return want === "any" || want === "read-write" && !readOnly || want === "read-only" && readOnly || want === "primary" && !standby || want === "standby" && standby;
}
function attempt(options, host, port, signal) {
  const { setTimeout: setTimeout2, clearTimeout: clearTimeout2 } = options.timers, fail4 = (code) => Errors.connection(code, options, host, port);
  return new Promise((resolve2, reject) => {
    const timer = options.connect_timeout && setTimeout2(() => done2(true, fail4("CONNECT_TIMEOUT")), options.connect_timeout * 1e3);
    let socket = null, raw = null, settled = false;
    session().then((x) => done2(false, null, x), (e) => done2(true, e));
    function done2(failed, error2, ready) {
      if (settled)
        return;
      settled = true;
      timer && clearTimeout2(timer);
      socket && signal.sockets.delete(socket);
      signal.aborted && !failed && (failed = true, error2 = fail4("CONNECTION_DESTROYED"));
      if (failed) {
        socket ? socket.destroy() : raw && raw.destroy();
        return reject(error2);
      }
      ready.socket.onclose = () => {
      };
      resolve2(ready);
    }
    async function session() {
      socket = await Socket(options, host, port, (x) => raw = x);
      if (settled || signal.aborted)
        return socket.destroy(), done2(true, fail4("CONNECTION_DESTROYED"));
      signal.sockets.add(socket);
      socket.onclose = (error2) => done2(true, signal.aborted ? fail4("CONNECTION_DESTROYED") : error2 && error2.code ? error2 : fail4("CONNECTION_CLOSED"));
      socket.keepAlive(options.keep_alive);
      await negotiate(socket, options);
      const user = typeof options.user === "function" ? await options.user() : options.user;
      return startup2(user, options.database || user);
    }
    function startup2(user, database) {
      return new Promise((resolve3, reject2) => {
        const stored = () => pgpass(options.passfile, options.path ? "localhost" : host, port, database, user) || "", auth = Auth({ user, pass: options.pass || stored, binding: options.channel_binding, socket }), parameters = {}, backend = { pid: null, secret: null }, frames = Frames(frame, false, (error2) => (reject2(error2), socket.destroy())), rows = [];
        let probing = false, status = null, authing = Promise.resolve();
        socket.ondata = (x) => frames.push(x);
        socket.write(Startup({ user, database, client_encoding: "UTF8", ...options.connection }));
        function frame(type, x, start2, end) {
          try {
            type === R ? authenticate2(Buffer.from(x.subarray(start2, end))) : type === S2 ? (([k, v]) => parameters[k] = v)(parameterStatus(x, start2)) : type === K ? Object.assign(backend, backendKeyData(x, start2)) : type === E2 ? reject2(Errors.postgres(error(x, start2, end))) : type === N ? notice(error(x, start2, end)) : type === D2 ? rows.push(x.toString("utf8", start2 + 11, start2 + 11 + x.readInt32BE(start2 + 7))) : type === Z && settled2(readyForQuery(x, start2), Buffer.from(x.subarray(end)));
          } catch (error2) {
            reject2(error2);
          }
        }
        function notice(x) {
          try {
            options.onnotice ? options.onnotice(x) : options.onnotice === false || console.log(x);
          } catch (error2) {
            noop2(error2);
          }
        }
        function authenticate2(x) {
          authing = authing.then(() => auth(x)).then((reply) => reply && socket.write(reply));
          authing.catch((error2) => (reject2(error2), socket.destroy()));
        }
        function settled2(x, rest) {
          authing.then(() => ready(x, rest), () => {
          });
        }
        function ready(x, rest) {
          if (!auth.authenticated)
            return reject2(Errors.generic("AUTHENTICATION_INCOMPLETE", "The server was ready before it accepted the authentication"));
          status = x;
          const known = "in_hot_standby" in parameters && "default_transaction_read_only" in parameters;
          if (options.target_session_attrs && !known && !probing) {
            probing = true;
            return socket.write(Query2("show transaction_read_only; select pg_catalog.pg_is_in_recovery()"));
          }
          frames.pause();
          socket.ondata = () => {
          };
          socket.pause();
          resolve3({
            socket,
            rest,
            backend,
            parameters,
            status,
            attributes: {
              readOnly: (known ? parameters.default_transaction_read_only : rows[0]) === "on",
              standby: known ? parameters.in_hot_standby === "on" : rows[1] === "t"
            },
            host,
            port,
            cancel: () => cancel2(options, host, port, backend)
          });
        }
      });
    }
  });
}
async function negotiate(socket, options) {
  if (!secured(options) || socket.negotiated)
    return;
  const ssl = options.ssl, tls2 = secureOptions(ssl);
  if (options.sslnegotiation === "direct")
    return socket.upgrade({ ...tls2, ALPNProtocols: ["postgresql"] });
  const answer = new Promise((r) => socket.ondata = (x) => r(x[0]));
  socket.write(SSLRequest());
  if (await answer === S2)
    return socket.upgrade(tls2);
  if (ssl !== "prefer" && ssl !== "allow")
    throw Errors.generic("SSL_NOT_SUPPORTED", "The server does not support SSL connections");
}
async function cancel2(options, host, port, { pid, secret }) {
  const socket = await Socket(options, host, port);
  try {
    await negotiate(socket, options);
  } catch (error2) {
    socket.destroy();
    throw error2;
  }
  return new Promise((resolve2) => {
    socket.onclose = () => resolve2();
    socket.end(Cancel(pid, secret));
  });
}
var salted = /* @__PURE__ */ new Map();
function Auth({ user, pass, binding: binding2 = "prefer", socket }) {
  let nonce, signature2, verified = true, bound = false, header = "n,,";
  respond.authenticated = false;
  return respond;
  async function respond(x) {
    const type = x.readInt32BE(5);
    if ((type === 3 || type === 5) && binding2 === "require")
      throw unbound("the server asked for " + (type === 3 ? "a cleartext" : "an MD5") + " password");
    return type === 0 ? ok() : type === 3 ? Password(await password2()) : type === 5 ? Password("md5" + md5(Buffer.concat([Buffer.from(md5(await password2() + user)), x.subarray(9, 13)]))) : type === 10 ? start2(x) : type === 11 ? proceed(x, await password2()) : type === 12 ? finish2(x) : unsupported(type);
  }
  function start2(x) {
    const offered = x.toString("utf8", 9).split("\0"), certificate = binding2 !== "disable" && socket && socket.certificate && socket.certificate(), hash = certificate && endpoint(certificate), plus = !!hash && offered.includes("SCRAM-SHA-256-PLUS");
    if (binding2 === "require" && !plus)
      throw unbound(offered.includes("SCRAM-SHA-256-PLUS") ? "the server certificate could not be hashed for it" : "the server did not offer it");
    if (!plus && !offered.includes("SCRAM-SHA-256"))
      throw Errors.generic("SASL_MECHANISM_NOT_SUPPORTED", "The server offered no supported SASL mechanism");
    header = plus ? "p=tls-server-end-point,," : hash ? "y,," : "n,,";
    bound = plus ? hash : false;
    nonce = crypto.randomBytes(18).toString("base64");
    verified = false;
    return SASL(plus ? "SCRAM-SHA-256-PLUS" : "SCRAM-SHA-256", header + "n=*,r=" + nonce);
  }
  function proceed(x, pass2) {
    const res = x.toString("utf8", 9).split(",").reduce((acc, x2) => (acc[x2[0]] = x2.slice(2), acc), {}), key2 = sha256(pass2 + "\0" + res.s + "\0" + res.i).toString("base64");
    if (!res.r.startsWith(nonce))
      throw Errors.generic("SASL_NONCE_MISMATCH", "The server nonce does not start with the client nonce");
    if (!salted.has(key2)) {
      salted.size >= 64 && salted.delete(salted.keys().next().value);
      salted.set(key2, crypto.pbkdf2Sync(pass2, Buffer.from(res.s, "base64"), +res.i, 32, "sha256"));
    }
    const saltedPassword = salted.get(key2), clientKey = hmac(saltedPassword, "Client Key"), channel = (bound ? Buffer.concat([Buffer.from(header), bound]) : Buffer.from(header)).toString("base64"), auth = "n=*,r=" + nonce + ",r=" + res.r + ",s=" + res.s + ",i=" + res.i + ",c=" + channel + ",r=" + res.r;
    signature2 = hmac(hmac(saltedPassword, "Server Key"), auth).toString("base64");
    return SASLResponse("c=" + channel + ",r=" + res.r + ",p=" + xor(clientKey, hmac(sha256(clientKey), auth)).toString("base64"));
  }
  function finish2(x) {
    if (!signature2 || x.toString("utf8", 9).split("\0", 1)[0].slice(2) !== signature2)
      throw Errors.generic("SASL_SIGNATURE_MISMATCH", "The server did not return the correct signature");
    verified = true;
    return null;
  }
  function ok() {
    if (!verified)
      throw Errors.generic("SASL_SIGNATURE_MISMATCH", "The server ended SCRAM authentication without proving it knows the password");
    if (binding2 === "require" && !bound)
      throw unbound("the server authenticated without it");
    respond.authenticated = true;
    return null;
  }
  function unsupported(type) {
    throw Errors.generic("AUTH_TYPE_NOT_IMPLEMENTED", "Authentication type " + type + " is not supported");
  }
  function password2() {
    return Promise.resolve(typeof pass === "function" ? pass() : pass);
  }
}
function unbound(reason) {
  return Errors.generic("CHANNEL_BINDING_REQUIRED", "channel_binding is require, but " + reason);
}
var signatures = {
  "2a864886f70d010104": "sha256",
  "2a864886f70d010105": "sha256",
  "2a864886f70d01010e": "sha224",
  "2a864886f70d01010b": "sha256",
  "2a864886f70d01010c": "sha384",
  "2a864886f70d01010d": "sha512",
  "2a8648ce3d0401": "sha256",
  "2a8648ce3d040301": "sha224",
  "2a8648ce3d040302": "sha256",
  "2a8648ce3d040303": "sha384",
  "2a8648ce3d040304": "sha512",
  "2a8648ce380403": "sha256",
  "608648016503040302": "sha256"
};
var digests = {
  "2b0e03021a": "sha256",
  "608648016503040201": "sha256",
  "608648016503040202": "sha384",
  "608648016503040203": "sha512",
  "608648016503040204": "sha224"
};
function endpoint(certificate) {
  try {
    const x = Buffer.from(certificate), algorithm = signature(x);
    return algorithm ? crypto.createHash(algorithm).update(x).digest() : null;
  } catch (_) {
    return null;
  }
}
function signature(x) {
  const certificate = der(x, 0), tbs = der(x, certificate.body), algorithm = der(x, tbs.end), oid = der(x, algorithm.body), name2 = x[oid.start] === 6 && x.toString("hex", oid.body, oid.end);
  if (name2 !== "2a864886f70d01010a")
    return signatures[name2];
  if (oid.end >= algorithm.end)
    return "sha256";
  const params = der(x, oid.end), first = params.body < params.end && der(x, params.body);
  if (!first || x[first.start] !== 160)
    return "sha256";
  const hash = der(x, der(x, first.body).body);
  return digests[x.toString("hex", hash.body, hash.end)];
}
function der(x, start2) {
  let length = x[start2 + 1], body = start2 + 2;
  if (length & 128) {
    const n = length & 127;
    length = 0;
    for (let i = 0; i < n; i++)
      length = length * 256 + x[body + i];
    body += n;
  }
  if (body + length > x.length)
    throw new Error("Truncated certificate");
  return { start: start2, body, end: body + length };
}
function md5(x) {
  return crypto.createHash("md5").update(x).digest("hex");
}
function hmac(key2, x) {
  return crypto.createHmac("sha256", key2).update(x).digest();
}
function sha256(x) {
  return crypto.createHash("sha256").update(x).digest();
}
function xor(a, b) {
  const x = Buffer.allocUnsafe(a.length);
  for (let i = 0; i < a.length; i++)
    x[i] = a[i] ^ b[i];
  return x;
}
function pgpass(file, host, port, database, user) {
  if (!file)
    return null;
  let text3;
  try {
    const stat = fs.statSync(file);
    if (!stat.isFile() || process.platform !== "win32" && stat.mode & 63)
      return null;
    text3 = fs.readFileSync(file, "utf8");
  } catch (_) {
    return null;
  }
  const wanted = [host, String(port), database, user];
  for (const line of text3.split(/\r?\n/)) {
    const fields = line && line[0] !== "#" ? split(line) : [];
    if (fields.length === 5 && wanted.every((x, i) => fields[i] === "*" || fields[i] === x))
      return fields[4];
  }
  return null;
}
function split(line) {
  const fields = [];
  let field2 = "";
  for (let i = 0; i < line.length; i++) {
    const c2 = line[i];
    if (c2 === "\\" && i + 1 < line.length)
      field2 += line[++i];
    else if (c2 === ":" && fields.length < 4)
      fields.push(field2), field2 = "";
    else
      field2 += c2;
  }
  fields.push(field2);
  return fields;
}

// node_modules/postgres/src/connection.js
import Stream from "stream";
var slow = 100;
var notable = 5;
var text2 = text;
var noop3 = () => {
};
var ending = /^\s*(commit|end|abort|rollback(?!\s+to\b)|prepare\s+transaction)\b/i;
var limit = 1e3;
var refused = "postgres.js: query could not be built";
var skip = /* @__PURE__ */ Symbol("skip");
var unknown = 100;
var states = /* @__PURE__ */ new WeakMap();
var after = 16;
var ids = 1;
var compiles = true;
function Connection(ready, options, events) {
  const { socket } = ready, timers = options.timers, defer = timers.nextTick || process.nextTick, { transform } = options, sent = [], pending = [], running = /* @__PURE__ */ new Set(), open2 = /* @__PURE__ */ new Set(), prepared = /* @__PURE__ */ new Map(), out = Writer(), frames = Frames(frame, socket.shared, (error2) => (connection2.fatal = error2, socket.destroy()));
  let blocker = null, rolling = false, fence = null, drained = null, status = ready.status, flushing = false, closed = null, closing = null, portals = 0, traced3 = 0, epoch2 = 0, headSince = 0, notables = 0;
  const connection2 = {
    id: ids++,
    host: ready.host,
    port: ready.port,
    backend: ready.backend,
    parameters: ready.parameters,
    prepared,
    lease: null,
    get status() {
      return status;
    },
    get inflight() {
      return sent.length + pending.length;
    },
    get exclusive() {
      return !!blocker && exclusive(blocker);
    },
    get copying() {
      return !!blocker && blocker.streaming && blocker.open;
    },
    get closed() {
      return closed;
    },
    get closing() {
      return !!closing;
    },
    send: send2,
    simple,
    describe: describe2,
    local,
    cancel: cancel3,
    close: close2,
    destroy,
    ref: () => socket.ref(),
    unref: () => socket.unref(),
    backlog,
    heavy,
    get notable() {
      return notables > 0;
    }
  };
  socket.ondata = (x) => frames.push(x);
  socket.ondrain = ondrain;
  socket.onclose = onclose;
  ready.rest && ready.rest.length && frames.push(ready.rest);
  socket.resume();
  return connection2;
  function ondrain() {
    const x = drained;
    drained = null;
    x && x();
  }
  function schedule(now6) {
    if (now6 || out.length >= 65536)
      return flush2();
    flushing || (flushing = true, defer(flush2));
    return true;
  }
  function flush2() {
    flushing = false;
    if (closed)
      return out.take(), true;
    return out.length ? socket.write(out.take()) : true;
  }
  function holds(x) {
    return x.describing || !!x.error && !x.done || x.flushing && !x.synced || x.streaming && x.open || x.alone && !x.done;
  }
  function exclusive(x) {
    return x.flushing || x.streaming || x.alone;
  }
  function refresh() {
    blocker && !holds(blocker) && (blocker = null);
    release();
  }
  function queue(x) {
    if (closed)
      return settleError(x, closed);
    if (blocker && blocker.streaming && blocker.open)
      return settleError(x, Errors.generic("COPY_IN_PROGRESS", "You cannot execute queries during copy"));
    x.query && (x.query.state = connection2.backend);
    if (fence)
      pending.splice(pending.indexOf(fence), 0, x);
    else if (x.ends && open2.size)
      pending.push(fence = x);
    else if (blocker || pending.length)
      pending.push(x);
    else
      return write(x), schedule();
    release();
  }
  function release() {
    while (!blocker && pending.length && pending[0] !== fence)
      write(pending.shift());
    schedule();
  }
  function write(x) {
    if (x.kind === "local" && sent.length === 0)
      return queueMicrotask(() => settle(x));
    const mark = out.length;
    let result;
    try {
      result = x.write(x);
    } catch (error2) {
      x.own = error2;
      result = skip;
    }
    if (result === skip) {
      out.truncate(mark);
      x.fresh = null;
      x.parses = [];
      x.portal = "";
      x.describing = x.synced = x.flushing = x.open = false;
      if (!x.own || x.kind === "step" || !connection2.lease) {
        x.kind = "local";
        x.cost >= notable && notables--;
        x.cost = void 0;
        return sent.length === 0 ? queueMicrotask(() => settle(x)) : sent.push(x);
      }
      x.kind = "simple";
      x.text = refused;
      x.results = [];
      x.entry = null;
      sync2(x, true);
    }
    x.fresh && register(x.fresh);
    x.portal && x.kind === "query" && open2.add(x);
    x.query && (x.query.active = sent.length === 0);
    x.ends && epoch2++;
    x.epoch = epoch2;
    options.scheduler && sent.length === 0 && (headSince = timers.now());
    sent.push(x);
    holds(x) && (blocker = x);
    x.trace && wrote(x);
  }
  function sync2(x, refuse) {
    if (x.synced)
      return;
    x.synced = true;
    refuse ? query(out, refused) : sync(out);
    schedule();
  }
  function register(entry) {
    const current = prepared.get(entry.name);
    current && prepared.delete(entry.name);
    prepared.set(entry.name, entry);
    entry.owner.entry = entry;
    entry.owner.fresh = null;
    if (prepared.size <= limit)
      return;
    for (const [name2, x] of prepared) {
      if (x.state !== "parsing") {
        prepared.delete(name2);
        close(out, "S", name2);
        return;
      }
    }
  }
  function drop(entry) {
    prepared.get(entry.name) === entry && prepared.delete(entry.name);
  }
  function send2(query2) {
    const { statement: statement2 } = query2.wire, x = Exchange("query", query2, connection2.lease, extended);
    x.statement = statement2;
    x.ends = statement2.ends === void 0 ? statement2.ends = ending.test(statement2.text) : statement2.ends;
    options.scheduler && cost(x);
    queue(x);
  }
  function cost(x) {
    const { query: query2 } = x;
    query2.cost && !query2.cursorFn && !query2.streaming && (x.cost = query2.cost.est === void 0 ? unknown : query2.cost.est);
    x.cost >= notable && notables++;
  }
  function timed(x) {
    const t = timers.now();
    if (x.cost !== void 0) {
      x.cost >= notable && notables--;
      const sample = t - headSince, c2 = x.query.cost;
      c2.est = c2.est === void 0 || sample > c2.est ? sample : c2.est + (sample - c2.est) * 0.1;
      events.ontimed && events.ontimed(sample, t);
    }
    headSince = t;
  }
  function backlog(t) {
    let w = 0;
    for (let i = 0; i < sent.length; i++) {
      const e = sent[i].cost || 0;
      if (i === 0) {
        const elapsed = t - headSince;
        w += elapsed < e ? e - elapsed : elapsed;
      } else {
        w += e;
      }
    }
    for (let i = 0; i < pending.length; i++)
      w += pending[i].cost || 0;
    return w;
  }
  function heavy() {
    for (let i = 0; i < sent.length; i++) {
      if (sent[i].cost >= slow)
        return true;
    }
    for (let i = 0; i < pending.length; i++) {
      if (pending[i].cost >= slow)
        return true;
    }
    return false;
  }
  function extended(x) {
    const { query: query2 } = x, { built } = query2.wire, statement2 = x.statement, name2 = statement2.name, current = name2 ? prepared.get(name2) : null;
    if (query2.cursorFn) {
      x.rows = query2.cursorRows;
      x.portal = transaction2() ? "c" + portals++ : "";
      x.flushing = !x.portal;
    }
    x.streaming = x.open = !!query2.streaming;
    if (current && current.state === "parsing" && current.oids === null)
      throw Errors.generic("STATEMENT_PENDING", "A statement was used before its description arrived");
    if (current && current !== x.previous && usable(current, statement2)) {
      x.entry = current;
      x.columns = current.columns;
      x.values = serialize(current.oids, built, current);
      return run2(x, name2);
    }
    if (x.retried) {
      x.verify = true;
      parse(out, "", statement2.text, built.oids);
      describe(out, "S", "");
      flush(out);
      x.describing = true;
      return;
    }
    const typed = !inferred(built);
    name2 && (x.fresh = Entry(name2, x, typed ? built.oids : null));
    current && close(out, "S", name2);
    parse3(x, name2, statement2.text, built.oids);
    describe(out, "S", name2);
    if (!typed) {
      flush(out);
      x.describing = true;
      return;
    }
    x.learn = true;
    x.values = serialize(built.oids, built, x.fresh || {});
    run2(x, name2);
  }
  function parse3(x, name2, text3, oids) {
    parse(out, name2, text3, oids);
    x.parses.push(name2);
  }
  function run2(x, name2) {
    const mark = out.length;
    try {
      run(out, x.portal, name2, x.values, x.rows, x.flushing);
    } catch (error2) {
      out.truncate(mark);
      throw error2;
    }
    x.flushing || (x.synced = true);
    debug(x.statement.text, x.values, x.entry ? x.entry.oids : x.params || x.query.wire.built.oids);
  }
  function usable(entry, statement2) {
    return entry.oids !== null && (entry.state === "parsing" || entry.state === "ready" && entry.version === statement2.version);
  }
  function learned(entry, statement2) {
    const shape = entry.oids.join() + ":" + entry.columns.map((x) => x.type).join();
    if (statement2.shape !== shape) {
      statement2.shape === void 0 || statement2.version++;
      statement2.shape = shape;
    }
    entry.version = statement2.version;
  }
  function inferred(built) {
    for (let i = 0; i < built.oids.length; i++) {
      if (!built.oids[i])
        return true;
    }
    return false;
  }
  function serialize(oids, built, cache) {
    const serializers = cache.serializers || (cache.serializers = oids.map(events.serializer)), values2 = built.values, out2 = new Array(values2.length);
    for (let i = 0; i < values2.length; i++) {
      out2[i] = values2[i] === null ? null : serializers[i](values2[i]);
      out2[i] === null || out2[i] === void 0 || typeof out2[i] === "string" || out2[i] instanceof Uint8Array || Buffer.byteLength(out2[i]);
    }
    return out2;
  }
  function transaction2() {
    return !!connection2.lease && connection2.lease.kind === "transaction";
  }
  function described(x) {
    x.describing = false;
    const { built } = x.query.wire, name2 = x.statement.name, params = x.params || [], columns2 = x.columns || [];
    try {
      if (x.verify) {
        const previous2 = x.previous;
        if (previous2 && same(previous2, params, columns2)) {
          if (x.original) {
            x.own = x.original;
            return sync2(x);
          }
        } else if (previous2) {
          stale(previous2);
          x.statement.version++;
        }
        x.values = serialize(params, built, {});
        return run2(x, "");
      }
      const entry = x.entry;
      entry && (entry.oids = params, entry.columns = columns2, learned(entry, x.statement));
      x.values = serialize(params, built, entry || {});
      run2(x, name2);
    } catch (error2) {
      x.own = error2;
      sync2(x, !!connection2.lease);
    }
  }
  function same(entry, params, columns2) {
    const a = entry.oids || [], b = entry.columns;
    return !!b && a.length === params.length && params.every((x, i) => x === a[i]) && b.length === columns2.length && columns2.every((x, i) => x.type === b[i].type);
  }
  function describe2(statement2, oids) {
    return new Promise((resolve2, reject) => {
      const x = Exchange("describe", null, connection2.lease, (x2) => {
        parse(out, "", statement2.text, oids);
        describe(out, "S", "");
        sync2(x2);
      });
      x.resolve = resolve2;
      x.reject = reject;
      queue(x);
    });
  }
  function simple(query2, sql) {
    const x = Exchange("simple", query2, connection2.lease, (x2) => {
      debug(sql, [], []);
      query(out, sql);
      x2.synced = true;
    });
    x.text = sql;
    x.results = [];
    x.ends = ending.test(sql);
    x.streaming = x.open = !!query2.streaming;
    options.scheduler && cost(x);
    queue(x);
  }
  function local(query2, error2) {
    queue(Exchange("query", query2, connection2.lease, () => {
      throw error2;
    }));
  }
  function cancel3(query2) {
    if (running.has(query2) || sent[0] && sent[0].query === query2 && sent[0].awaiting)
      return query2.aborted = Errors.generic("57014", "canceling statement due to user request"), Promise.resolve();
    const i = pending.findIndex((x2) => x2.query === query2);
    if (i !== -1) {
      const [x2] = pending.splice(i, 1);
      x2 === fence && (fence = null);
      x2.cost >= notable && notables--;
      settleError(x2, Errors.generic("57014", "canceling statement due to user request"));
      release();
      return Promise.resolve();
    }
    const x = sent.find((x2) => x2.query === query2);
    if (!x)
      return Promise.resolve();
    return x === sent[0] && query2.active ? ready.cancel() : new Promise((resolve2, reject) => x.cancel = { resolve: resolve2, reject });
  }
  function close2() {
    closing || (closing = new Promise((r) => {
      connection2.onended = r;
      idle() && terminate2();
    }));
    return closing;
  }
  function idle() {
    return sent.length === 0 && pending.length === 0;
  }
  function terminate2() {
    if (closed)
      return connection2.onended && connection2.onended();
    flush2();
    socket.end(Terminate());
  }
  function destroy(error2) {
    closing || (closing = Promise.resolve());
    socket.destroy(error2);
  }
  function onclose(error2) {
    if (closed)
      return;
    out.take();
    blocker = null;
    fence = null;
    notables = 0;
    closed = Errors.connection(closing ? "CONNECTION_DESTROYED" : "CONNECTION_CLOSED", options, ready.host, ready.port);
    closed.cause = connection2.fatal || error2 || void 0;
    const head = sent[0];
    sent.splice(0).forEach((x) => {
      x.stream && x.stream.destroy(closed);
      x.own ? settle(x) : x === head && x.error && x.error.severity === "FATAL" ? settleError(x, x.error) : settleError(x, closed);
    });
    pending.splice(0).forEach((x) => x.own ? settle(x) : settleError(x, closed));
    running.forEach((query2) => query2.settled || query2.reject(decorate(query2, closed)));
    running.clear();
    open2.clear();
    connection2.onended && connection2.onended();
    events.onclose(connection2, closed);
  }
  function decorate(query2, error2) {
    return queryError(error2, query2, options.debug);
  }
  function settleError(x, error2) {
    x.kind === "describe" ? x.reject(error2) : x.query && !x.query.settled && x.query.reject(decorate(x.query, error2));
  }
  function debug(text3, values2, oids) {
    typeof options.debug === "function" && options.debug(connection2.id, text3, values2, oids);
  }
  function wrote(x) {
    const trace = x.trace;
    traced3++;
    trace.query = x.text || x.statement.text;
    trace.statement = x.statement ? x.statement.name : "";
    trace.parameters = options.debug ? x.query.parameters : void 0;
    trace.connection = connection2.id;
    trace.host = connection2.host;
    trace.port = connection2.port;
    trace.sent = now();
  }
  function first() {
    const x = sent[0];
    x && x.trace && x.trace.firstByte === null && (x.trace.firstByte = now());
  }
  function frame(type, x, start2, end) {
    traced3 && first();
    try {
      type === 68 ? DataRow(x, start2) : type === 100 ? CopyData2(x, start2, end) : type === 90 ? ReadyForQuery(x, start2) : type === 67 ? CommandComplete(x, start2, end) : type === 50 ? BindComplete() : type === 49 ? ParseComplete() : type === 51 ? null : type === 116 ? ParameterDescription(x, start2) : type === 84 ? RowDescription(x, start2) : type === 110 ? NoData() : type === 69 ? ErrorResponse(x, start2, end) : type === 115 ? PortalSuspended() : type === 73 ? EmptyQueryResponse() : type === 65 ? NotificationResponse(x, start2) : type === 78 ? NoticeResponse(x, start2, end) : type === 83 ? ParameterStatus(x, start2) : type === 71 ? CopyInResponse() : type === 72 ? CopyOutResponse() : type === 87 ? CopyBothResponse() : type === 99 ? CopyDone2() : type === 86 ? unsupported("FunctionCallResponse") : type === 118 ? unsupported("NegotiateProtocolVersion") : null;
    } catch (error2) {
      const x2 = sent[0];
      x2 ? fail4(x2, error2) : destroy(error2);
    }
    blocker && !holds(blocker) && (blocker = null, release());
    out.length && schedule();
  }
  function fail4(x, error2) {
    x.error = x.error || error2;
    x.describing = false;
    x.open = false;
    sync2(x);
  }
  function unsupported(x) {
    sent[0] && fail4(sent[0], Errors.notSupported(x));
  }
  function ParseComplete() {
    const x = sent[0], name2 = x.parses.shift();
    name2 && x.entry && x.entry.name === name2 && x.entry.owner === x && x.entry.state === "parsing" && (x.entry.state = "ready");
  }
  function BindComplete() {
    const x = sent[0];
    x.bound = true;
    if (!x.columns && x.entry) {
      x.columns = x.entry.columns;
      x.result.columns = x.columns;
    }
  }
  function ParameterDescription(x, start2) {
    sent[0].params = parameterDescription(x, start2);
  }
  function RowDescription(x, start2) {
    received(sent[0], rowDescription(x, start2, 0, column2));
  }
  function NoData() {
    received(sent[0], []);
  }
  function received(x, columns2) {
    if (x.kind === "simple" && x.result.command !== null) {
      x.results.push(x.result);
      x.result = new Result();
    }
    x.columns = columns2;
    x.result.columns = columns2;
    if (x.learn) {
      x.learn = false;
      x.entry && x.entry.owner === x && (x.entry.columns = columns2, learned(x.entry, x.statement));
    }
    x.describing && described(x);
  }
  function column2(name2, table, number2, type) {
    const parser = events.parser(type);
    return {
      name: transform.column.from ? transform.column.from(name2) : name2,
      parser: parser.identity ? null : parser,
      decode: events.decoder(type, parser),
      table,
      number: number2,
      type
    };
  }
  function DataRow(x, start2) {
    const item = sent[0], { query: query2, columns: columns2 } = item, raw = query2.isRaw, from = raw !== true ? transform.value.from : null, shape = item.shaped === columns2 ? item.reader : (item.shaped = columns2, item.reader = Rows(columns2)), fast = raw !== true && read(shape, !!raw, text2, from), n = columns2.length, result = item.result;
    let row;
    if (fast) {
      row = fast(x, start2 + 7);
    } else {
      row = raw ? new Array(n) : {};
      let i = start2 + 7;
      for (let j = 0; j < n; j++) {
        const length = x[i] << 24 | x[i + 1] << 16 | x[i + 2] << 8 | x[i + 3], column3 = columns2[j];
        i += 4;
        let value2 = null;
        if (length !== -1) {
          value2 = raw === true ? Buffer.from(x.subarray(i, i + length)) : column3.decode ? column3.decode(x, i, i + length) : column3.parser ? column3.parser(text2(x, i, i + length)) : text2(x, i, i + length);
          i += length;
        }
        from && (value2 = from(value2, column3));
        raw ? row[j] = value2 : column3.name === "__proto__" ? own2(row, column3.name, value2) : row[column3.name] = value2;
      }
    }
    const out2 = transform.row.from ? transform.row.from(row) : row;
    query2.forEachFn ? query2.forEachFn(out2, result) : result[result.length] = out2;
  }
  function CommandComplete(x, start2, end) {
    const item = sent[0], { command, count } = commandComplete(x, start2, end), result = item.result;
    result.command = command;
    result.count = count;
    result.state = connection2.backend;
    result.statement = item;
    item.query && (item.query.source = item);
    result.columns = result.columns || item.columns;
    item.final && (item.stream && Object.assign(item.stream, { count, command }), item.final(), item.final = null);
    if (item.kind === "simple") {
      item.results.push(item.result);
      item.result = new Result();
      return;
    }
    if (item.rows) {
      item.finished = true;
      item.flushing && sync2(item);
      result.count && (item.last = new Promise((r) => r(item.query.cursorFn(result)))).catch(noop3);
    }
  }
  function unsafe(item) {
    const error2 = () => Errors.generic("UNSAFE_TRANSACTION", "Only use sql.begin, sql.reserved or max: 1");
    rolling = true;
    item.own = error2();
    sent.forEach((x) => x.kind !== "local" && (x.own = error2()));
    pending.unshift(Exchange("internal", null, null, (x) => (query(out, "rollback"), x.synced = true)));
  }
  function EmptyQueryResponse() {
    const item = sent[0];
    item.kind === "simple" && (item.results.push(item.result), item.result = new Result());
  }
  async function PortalSuspended() {
    const item = sent[0];
    if (!item.flushing)
      return item.suspended = true;
    try {
      item.awaiting = true;
      const next = await item.query.cursorFn(item.result);
      item.awaiting = false;
      item.result = new Result();
      if (closed || item.synced || sent[0] !== item)
        return;
      if (item.query.aborted)
        throw item.query.aborted;
      next === CLOSE ? (close(out, "P", ""), sync2(item)) : (execute(out, "", item.rows), flush(out), schedule());
    } catch (error2) {
      item.awaiting = false;
      if (closed || item.synced || sent[0] !== item)
        return;
      fail4(item, error2);
    }
    refresh();
  }
  function ErrorResponse(x, start2, end) {
    const item = sent[0], error2 = Errors.postgres(error(x, start2, end));
    if (!item)
      return connection2.fatal = error2;
    item.stream && item.stream.destroy(error2);
    item.final && (item.final(error2), item.final = null);
    fail4(item, error2);
  }
  function ReadyForQuery(x, start2) {
    status = readyForQuery(x, start2);
    frames.own(false);
    const item = sent.shift();
    options.scheduler && timed(item);
    item.done = true;
    item.open = false;
    item.trace && traced3--;
    item.kind === "internal" && (rolling = false);
    status !== "I" && !rolling && !item.lease && !connection2.lease && options.max !== 1 && unsafe(item);
    blocker === item && (blocker = null);
    settle(item);
    while (sent.length && sent[0].kind === "local")
      settle(sent.shift());
    release();
    const next = sent[0];
    if (next && next.query) {
      next.query.active = true;
      next.cancel && ready.cancel().then(next.cancel.resolve, next.cancel.reject);
    }
    closing && idle() && terminate2();
    events.onready(connection2);
  }
  function settle(x) {
    if (x.kind === "internal")
      return;
    if (x.kind === "describe") {
      return x.error ? x.reject(x.error) : x.resolve({ params: x.params || [], columns: x.columns });
    }
    const { query: query2 } = x, cursor = x.origin || (x.portal ? x : null);
    cursor && (x.own || x.error || !x.suspended) && unfence(cursor);
    if (x.own)
      return query2.reject(decorate(query2, x.own));
    if (x.error)
      return failed(x);
    if (x.suspended)
      return suspended(x);
    x.last ? x.last.then(() => query2.settled || finish2(x), (error2) => query2.settled || query2.reject(decorate(query2, error2))) : query2.settled || finish2(x);
  }
  function unfence(cursor) {
    if (!open2.delete(cursor) || open2.size || !fence)
      return;
    fence = null;
    release();
  }
  function failed(x) {
    const entry = x.kind === "query" ? x.entry : null;
    const parsing = x.fresh || entry && entry.owner === x && entry.state === "parsing";
    if (x.error.code === "42P05" && x.kind === "query" && x.statement.name && parsing) {
      entry && drop(entry);
      x.statement.name += "_";
      return retryable(x) ? again(x, null) : settleError(x, x.error);
    }
    if (!entry)
      return settleError(x, x.error);
    if (entry.owner === x && entry.state === "parsing")
      return drop(entry), settleError(x, x.error);
    if (x.error.code === "26000") {
      drop(entry);
      return retryable(x) ? again(x, null) : settleError(x, x.error);
    }
    if (x.bound)
      return settleError(x, x.error);
    if (retryable(x))
      return again(x, x.error);
    stale(entry);
    settleError(x, x.error);
  }
  function stale(entry) {
    prepared.get(entry.name) === entry && (entry.state = "stale");
  }
  function retryable(x) {
    return !x.retried && !x.cancel && !x.query.cancelled && !x.query.cursorFn && !x.streaming && x.lease === connection2.lease && status === "I" && !closing && (sent.length === 0 || !x.lease && options.max !== 1);
  }
  function again(x, original) {
    const retry = Exchange("query", x.query, x.lease, extended);
    retry.statement = x.statement;
    retry.ends = x.ends;
    retry.retried = true;
    retry.original = original;
    retry.previous = x.entry;
    retry.trace = x.trace;
    retry.cost = x.cost;
    if (sent.length)
      return queue(retry);
    pending.unshift(retry);
    release();
  }
  function suspended(x) {
    const cursor = x.origin || x, { query: query2 } = x;
    running.add(query2);
    new Promise((r) => r(query2.cursorFn(x.result))).then((next) => {
      running.delete(query2);
      if (query2.settled)
        return unfence(cursor);
      queue(step(cursor, next === CLOSE || !!query2.aborted, query2.aborted || null));
    }, (error2) => {
      running.delete(query2);
      if (query2.settled)
        return unfence(cursor);
      queue(step(cursor, true, error2));
    });
  }
  function step(cursor, end, failure) {
    const x = Exchange("step", cursor.query, cursor.lease, stepped);
    x.origin = cursor;
    x.statement = cursor.statement;
    x.entry = cursor.entry;
    x.columns = cursor.columns;
    x.portal = cursor.portal;
    x.rows = cursor.rows;
    x.end = end;
    x.failure = failure;
    return x;
  }
  function stepped(x) {
    const cursor = x.origin;
    if (connection2.lease !== cursor.lease || cursor.epoch !== epoch2) {
      if (x.failure)
        throw x.failure;
      if (!x.end)
        throw outlived();
      return skip;
    }
    x.own = x.failure;
    x.end ? close(out, "P", x.portal) : execute(out, x.portal, x.rows);
    sync2(x);
  }
  function outlived() {
    return Errors.generic("UNSAFE_TRANSACTION", "The cursor outlived its transaction");
  }
  function finish2(x) {
    const { query: query2 } = x;
    if (x.kind === "simple") {
      x.result.command !== null && x.results.push(x.result);
      const results = x.results;
      return query2.resolve(results.length > 1 ? results : results[0] || x.result);
    }
    query2.resolve(x.result);
  }
  function NotificationResponse(x, start2) {
    const { pid, channel, payload } = notification(x, start2);
    events.onnotify && guard(events.onnotify, channel, payload, pid);
  }
  function guard(fn, ...xs) {
    try {
      fn(...xs);
    } catch (error2) {
      noop3(error2);
    }
  }
  function NoticeResponse(x, start2, end) {
    const notice = error(x, start2, end);
    listened(channels.notice) && channels.notice.publish({
      notice,
      connection: connection2.id,
      host: connection2.host,
      port: connection2.port,
      database: options.database
    });
    options.onnotice ? guard(options.onnotice, notice) : options.onnotice === false || console.log(notice);
  }
  function ParameterStatus(x, start2) {
    const [k, v] = parameterStatus(x, start2);
    connection2.parameters[k] = v;
    events.onparameter && guard(events.onparameter, k, v);
  }
  function writeData(chunk, callback) {
    copyData(out, chunk);
    flush2() ? callback() : drained = callback;
  }
  function writable(item) {
    return {
      autoDestroy: true,
      write(chunk, encoding, callback) {
        writeData(chunk, callback);
      },
      destroy(error2, callback) {
        callback(error2);
        item.stream = null;
        if (!item.copied && !closed && !item.error) {
          copyFail(out, (error2 || "The COPY stream was destroyed") + "");
          item.copied = true;
          item.open = false;
          schedule(true);
          refresh();
        }
      },
      final(callback) {
        copyDone(out);
        item.copied = true;
        item.open = false;
        item.final = callback;
        schedule(true);
        refresh();
      }
    };
  }
  function CopyInResponse() {
    const item = sent[0];
    item.stream = new Stream.Writable(writable(item));
    item.query.resolve(item.stream);
  }
  function readable(item) {
    return () => {
      item.wanted = true;
      if (!frames.paused)
        return;
      frames.resume();
      frames.paused || socket.resume();
    };
  }
  function CopyOutResponse() {
    const item = sent[0];
    item.stream = new Stream.Readable({ read: readable(item) });
    item.open = false;
    frames.own(true);
    item.query.resolve(item.stream);
  }
  function CopyBothResponse() {
    const item = sent[0];
    item.stream = new Stream.Duplex({ ...writable(item), read: readable(item) });
    frames.own(true);
    item.query.resolve(item.stream);
  }
  function CopyData2(x, start2, end) {
    const item = sent[0];
    if (!item.stream)
      return;
    item.wanted = false;
    if (!item.stream.push(frames.owns(x) ? x.subarray(start2 + 5, end) : Buffer.from(x.subarray(start2 + 5, end))) && !item.wanted) {
      frames.pause();
      socket.pause();
    }
  }
  function CopyDone2() {
    frames.own(false);
    const item = sent[0];
    item.stream && item.stream.push(null);
    item.stream = null;
  }
}
function key(name2) {
  const x = JSON.stringify(String(name2));
  return name2 === "__proto__" ? "[" + x + "]" : x;
}
function own2(row, name2, value2) {
  Object.defineProperty(row, name2, { value: value2, writable: true, enumerable: true, configurable: true });
}
function Exchange(kind, query2, lease, write) {
  return {
    kind,
    query: query2,
    lease,
    write,
    trace: query2 && query2.trace || null,
    statement: null,
    text: "",
    entry: null,
    fresh: null,
    previous: null,
    parses: [],
    values: null,
    params: null,
    columns: null,
    shaped: null,
    reader: null,
    result: new Result(),
    results: null,
    origin: null,
    portal: "",
    rows: 0,
    end: false,
    failure: null,
    flushing: false,
    streaming: false,
    open: false,
    alone: !!(query2 && query2.alone),
    describing: false,
    learn: false,
    verify: false,
    synced: false,
    bound: false,
    suspended: false,
    finished: false,
    done: false,
    ends: false,
    epoch: 0,
    retried: false,
    original: null,
    error: null,
    own: null,
    cancel: null,
    stream: null,
    copied: false,
    wanted: false,
    final: null,
    resolve: null,
    reject: null,
    cost: void 0
  };
}
function Entry(name2, owner, oids) {
  return { name: name2, owner, oids, columns: null, serializers: null, state: "parsing", version: -1 };
}
function Rows(columns2) {
  let state = states.get(columns2);
  if (state === void 0) {
    state = {
      columns: columns2,
      seen: 0,
      object: null,
      array: null,
      compilable: compiles && columns2.length <= 512 && !columns2.some((x) => String(x.name) === "__proto__")
    };
    states.set(columns2, state);
  }
  return state;
}
function read(state, array, text3, from) {
  const key2 = array ? "array" : "object";
  if (state[key2] !== null)
    return state[key2];
  if (!state.compilable || ++state.seen < after)
    return null;
  try {
    return state[key2] = compile(state.columns, array, text3, from);
  } catch (_) {
    compiles = state.compilable = false;
    return null;
  }
}
function compile(columns2, array, text3, from) {
  const locals = [], body = ["let l = 0"], at = "x, i, i + l";
  columns2.forEach((c2, j) => {
    c2.decode ? locals.push("d" + j + " = c[" + j + "].decode") : c2.parser && locals.push("p" + j + " = c[" + j + "].parser");
    const value2 = c2.decode ? "d" + j + "(" + at + ")" : c2.parser ? "p" + j + "(text(" + at + "))" : "text(" + at + ")";
    body.push(
      "l = (x[i] << 24) | (x[i + 1] << 16) | (x[i + 2] << 8) | x[i + 3]",
      "i += 4",
      "let v" + j + " = null",
      "l !== -1 && (v" + j + " = " + value2 + ", i += l)",
      from ? "v" + j + " = from(v" + j + ", c[" + j + "])" : ""
    );
  });
  body.push(
    array ? "return [" + columns2.map((c2, j) => "v" + j).join(",") + "]" : "return {" + columns2.map((c2, j) => key(c2.name) + ":v" + j).join(",") + "}"
  );
  return new Function(
    "c",
    "text",
    "from",
    (locals.length ? "const " + locals.join(", ") + "\n" : "") + "return function row(x, i) {\n" + body.filter(Boolean).join("\n") + "\n}"
  )(columns2, text3, from);
}

// node_modules/postgres/src/pool.js
var begins = /\bbegin\b/i;
var starts = /\bstart\b/gi;
var transaction = /^transaction\b/i;
function Pool(options, types2) {
  const { setTimeout: setTimeout2, clearTimeout: clearTimeout2, now: now6 } = options.timers, statements = Statements(options.scheduler), connections = /* @__PURE__ */ new Set(), waiting = Queue(), events = {
    parser: types2.parser,
    decoder: types2.decoder,
    serializer: types2.serializer,
    onready,
    onclose,
    onnotify: options.onnotify,
    onparameter,
    ontimed
  }, work = { fast: 0, slow: 0, at: 0 };
  const signal = { aborted: false, sockets: /* @__PURE__ */ new Set() }, replacing = [];
  let opening = 0, ending2 = null, used = false, endTimer = null, retries = 0, failingSince = null, nextAttempt = 0, retryTimer = null, typesLoaded = options.fetch_types === false, typesError = null, typesFailed = 0, failure = null, typesLoading = false;
  const pool = {
    query: query2,
    lease,
    cancel: cancel3,
    end,
    close: close2,
    get stats() {
      return {
        connections: connections.size,
        opening,
        idle: [...connections].filter((x) => x.inflight === 0 && !x.lease).length,
        leased: [...connections].filter((x) => x.lease).length,
        waiting: waiting.length
      };
    }
  };
  return pool;
  function query2(q, lease2) {
    if (ending2 && !lease2)
      return q.reject(queryError(Errors.connection("CONNECTION_ENDED", options, options.host[0], options.port[0]), q, options.debug));
    let built;
    try {
      built = q.build();
    } catch (error2) {
      return unbuilt(q, error2, lease2);
    }
    const free = !lease2 && options.max !== 1;
    if (q.options.simple && !built.values.length) {
      const known = (free || options.scheduler) && statements.known(built.text);
      q.alone = free && alone(known);
      options.scheduler && (q.cost = known);
      return place({ q, simple: built.text, exclusive: !!q.streaming || q.alone }, lease2);
    }
    if (q.onlyDescribe)
      return describeOnly(q, built, lease2);
    const statement2 = statements.get(built, options.prepare && q.options.prepare !== false);
    q.alone = free && alone(statement2.live ? statement2 : statements.known(built.text));
    q.wire = { statement: statement2, built };
    options.scheduler && (q.cost = statement2.cost);
    place({ q, statement: statement2, exclusive: !!q.cursorFn || !!q.streaming || q.alone }, lease2);
  }
  function describeOnly(q, built, lease2) {
    const statement2 = { name: "", text: built.text, oids: built.oids, columns: null }, run3 = (c2) => (q.connection = c2, c2.describe(statement2, built.oids).then(
      ({ params, columns: columns2 }) => q.resolve({ string: built.text, types: params, name: "", columns: columns2 }),
      (error2) => q.reject(queryError(error2, q, options.debug))
    ), q.onwrite && q.onwrite());
    lease2 ? run3(lease2.connection) : place({ run: run3, q, reject: (error2) => q.reject(queryError(error2, q, options.debug)) });
  }
  function unbuilt(q, error2, lease2) {
    error2 = queryError(error2, q, options.debug);
    if (!lease2 || lease2.released || lease2.connection.closed)
      return q.reject(error2);
    q.connection = lease2.connection;
    lease2.connection.local(q, error2);
    q.onwrite && q.onwrite();
  }
  function place(job, lease2) {
    used = true;
    const missing = !lease2 && retype();
    if (missing)
      return reject(job, missing);
    if (job.q && job.q.cancelled)
      return job.q.reject(queryError(Errors.generic("57014", "canceling statement due to user request"), job.q, options.debug));
    if (lease2) {
      return lease2.connection.closed ? job.q.reject(queryError(lease2.connection.closed, job.q, options.debug)) : lease2.released ? job.q.reject(queryError(ended(lease2), job.q, options.debug)) : run2(lease2.connection, job);
    }
    if (signal.aborted)
      return reject(job, Errors.connection("CONNECTION_DESTROYED", options, options.host[0], options.port[0]));
    if (failingFast())
      return reject(job, copy(failure.error));
    const c2 = waiting.length === 0 && pick(job);
    if (c2)
      return run2(c2, job);
    waiting.push(wait(job));
    drain();
  }
  function wait(job) {
    if (!options.queue_timeout)
      return job;
    job.timer = setTimeout2(() => {
      job.timer = null;
      waiting.remove((x) => x === job) && reject(job, Errors.generic(
        "QUEUE_TIMEOUT",
        "Waited more than " + options.queue_timeout + " seconds for a connection"
      ));
    }, options.queue_timeout * 1e3);
    typeof job.timer.unref === "function" && job.timer.unref();
    return job;
  }
  function started2(job) {
    job.timer && (clearTimeout2(job.timer), job.timer = null);
  }
  function run2(c2, job) {
    started2(job);
    hold(c2);
    if (job.run)
      return job.run(c2);
    job.q.connection = c2;
    job.simple !== void 0 ? c2.simple(job.q, job.simple) : c2.send(job.q);
    job.q.onwrite && job.q.onwrite();
  }
  function drain() {
    while (waiting.length) {
      const job = waiting.peek(), c2 = pick(job);
      if (!c2 && !copying(job))
        break;
      waiting.shift();
      !c2 ? reject(job, Errors.generic("COPY_IN_PROGRESS", "You cannot execute queries during copy")) : job.lease ? grant(c2, job) : run2(c2, job);
    }
    waiting.length && listened(channels.pool) && event("wait", null, { waiting: waiting.length });
    grow();
  }
  function plain3(job) {
    return !!job.q && !job.lease && !job.exclusive && !job.run;
  }
  function copying(job) {
    if (!job.q || connections.size + opening < options.max || connections.size === 0)
      return false;
    for (const c2 of connections) {
      if (!c2.copying)
        return false;
    }
    return true;
  }
  function usable(c2) {
    return !c2.closed && !c2.closing && !c2.lease && !c2.releasing && !c2.retiring && !c2.exclusive && !c2.loading;
  }
  function pick(job) {
    const statement2 = job.statement, any = !statement2 || !statement2.name;
    let best = null;
    for (const c2 of connections) {
      const free = usable(c2);
      if (free && c2.inflight === 0) {
        if (any || c2.prepared.has(statement2.name))
          return c2;
        best = best && best.inflight === 0 ? best : c2;
      } else if (free && !job.lease && !job.exclusive && c2.inflight < options.max_pipeline && (!best || c2.inflight < best.inflight)) {
        best = c2;
      }
    }
    if (best && best.inflight === 0)
      return best;
    if (connections.size + opening < options.max && !failingSince)
      return null;
    best && options.scheduler && job.q && needed(job) && (best = scheduled(job) || best);
    return best && opening && best.inflight >= Math.ceil(waiting.length / (opening + 1)) ? null : best;
  }
  function needed(job) {
    if (!job.q.cost || job.q.cost.est === void 0 || job.q.cost.est >= notable)
      return true;
    for (const c2 of connections) {
      if (c2.notable)
        return true;
    }
    return false;
  }
  function scheduled(job) {
    const t = now6(), e = job.q.cost ? job.q.cost.est : void 0;
    if (e === void 0 || e < slow)
      return soonest(t, Infinity, false);
    let heavy = 0;
    for (const c2 of connections)
      c2.inflight && c2.heavy() && heavy++;
    decay(t);
    const reserve = Math.max(1, Math.min(Math.ceil(work.fast / 2e3 * 1.5) + 1, connections.size - Math.ceil(work.slow / 2e3)));
    return heavy < connections.size - reserve ? soonest(t, Infinity, false) : soonest(t, 2 * e, true) || soonest(t, Infinity, false);
  }
  function soonest(t, most, heavy) {
    let best = null, value2 = Infinity, ties = 0;
    for (const c2 of connections) {
      const v = usable(c2) && c2.inflight < options.max_pipeline && (!heavy || c2.heavy()) ? c2.backlog(t) : Infinity;
      if (v <= most && v < value2)
        best = c2, value2 = v, ties = 1;
      else if (v <= most && v === value2 && v !== Infinity && Math.random() * ++ties < 1)
        best = c2;
    }
    return best;
  }
  function ontimed(sample, t) {
    decay(t);
    sample < slow ? work.fast += sample : work.slow += sample;
  }
  function decay(t) {
    const d2 = Math.exp((work.at - t) / 2e3);
    work.fast *= d2;
    work.slow *= d2;
    work.at = t;
  }
  function grow() {
    if (ending2 && waiting.length === 0)
      return;
    if (failingSince !== null) {
      if (opening || !waiting.length || retryTimer)
        return;
      const wait2 = nextAttempt - now6();
      return wait2 > 0 ? retryTimer = setTimeout2(() => (retryTimer = null, grow()), wait2) : connect2();
    }
    let loading = 0;
    for (const c2 of connections)
      c2.loading && loading++;
    const wanted = Math.max(
      Math.min(waiting.length - opening - loading, options.max - connections.size - opening),
      used && !ending2 ? Math.min(options.min, options.max) - connections.size - opening : 0
    );
    for (let i = 0; i < wanted; i++)
      connect2();
  }
  function connect2() {
    opening++;
    retryTimer && (clearTimeout2(retryTimer), retryTimer = null);
    (options.open || open)(options, signal, replacing.length ? replacing.shift() : 0).then(opened, failed);
  }
  function copy(error2) {
    if (!error2 || typeof error2 !== "object")
      return error2;
    const x = Object.create(Object.getPrototypeOf(error2), Object.getOwnPropertyDescriptors(error2));
    Object.defineProperty(x, "stack", { value: error2.stack, writable: true, configurable: true });
    ["query", "parameters", "args", "types"].forEach((k) => delete x[k]);
    return x;
  }
  function failingFast() {
    return !!failure && retries > 1 && opening === 0 && now6() < nextAttempt && stuck();
  }
  function stuck() {
    for (const c2 of connections) {
      if (!c2.lease)
        return false;
    }
    return true;
  }
  function opened(ready) {
    opening--;
    retries = 0;
    failingSince = null;
    failure = null;
    if (signal.aborted || ending2 && waiting.length === 0) {
      ready.socket.destroy();
      return finishing();
    }
    Object.entries(ready.parameters).forEach(([k, v]) => onparameter(k, v));
    const c2 = Connection(ready, options, events);
    c2.index = ready.index || 0;
    connections.add(c2);
    lifetime(c2);
    listened(channels.pool) && event("open", c2);
    typesLoaded || typesLoading ? c2.loading = !typesLoaded : loadTypes(c2);
    drain();
  }
  function retype() {
    if (!typesError)
      return null;
    if (now6() - typesFailed < 1e3)
      return copy(typesError);
    typesError = null;
    connections.forEach((x) => x.loading = true);
    [...connections].some((x) => !x.closed && (loadTypes(x), true));
    return null;
  }
  function loadTypes(c2) {
    hold(c2);
    typesLoading = true;
    c2.loading = true;
    types2.load((text3) => new Promise((resolve2, reject2) => {
      const q = new Query([text3], [], Object.assign(() => {
      }, { options }), { simple: true });
      q.executed = true;
      q.then(resolve2, reject2);
      c2.simple(q, text3);
    })).then(
      () => typesLoaded = true,
      (error2) => error2 instanceof PostgresError ? typesLoaded = true : error2 && error2.code === "TYPE_NOT_FOUND" && (typesError = error2, typesFailed = now6())
    ).then(() => {
      typesLoading = false;
      connections.forEach((x) => x.loading = !typesLoaded && !typesError);
      typesError ? waiting.take().forEach((job) => reject(job, copy(typesError))) : typesLoaded || [...connections].some((x) => !x.closed && (loadTypes(x), true));
      drain();
    });
  }
  function failed(error2) {
    opening--;
    if (signal.aborted)
      return finishing();
    failingSince === null && (failingSince = now6());
    retries++;
    nextAttempt = now6() + 1e3 * (typeof options.backoff === "function" ? options.backoff(retries) : options.backoff);
    const transient = !!error2 && (error2.code === "CONNECTION_CLOSED" || error2.code === "53300"), expired = now6() - failingSince >= options.connect_timeout * 1e3;
    failure = !transient || expired ? { error: error2 } : null;
    stuck() && opening === 0 && (failure || ending2) && waiting.take().forEach((job, i) => reject(job, i ? copy(error2) : error2));
    ending2 ? finishing() : grow();
  }
  function reject(job, error2) {
    started2(job);
    job.lease ? job.reject(error2) : job.q ? job.q.reject(queryError(error2, job.q, options.debug)) : job.reject(error2);
  }
  function lifetime(c2) {
    const life = typeof options.max_lifetime === "function" ? options.max_lifetime() : options.max_lifetime;
    life && (c2.lifeTimer = unref(setTimeout2(() => {
      c2.retiring = true;
      c2.inflight === 0 && !c2.lease && c2.close();
    }, life * 1e3)));
    idle(c2);
  }
  function event(name2, c2, extra) {
    channels.pool.publish({
      event: name2,
      connection: c2 ? c2.id : null,
      host: c2 ? c2.host : null,
      port: c2 ? c2.port : null,
      database: options.database,
      stats: pool.stats,
      ...extra
    });
  }
  function idle(c2) {
    listened(channels.pool) && event("idle", c2);
    if (c2.inflight || c2.lease)
      return;
    options.unref_sockets && !c2.loading && waiting.length === 0 && c2.unref();
    if (!options.idle_timeout)
      return;
    c2.idleSince = now6();
    c2.idleTimer || (c2.idleTimer = unref(setTimeout2(() => idled(c2), options.idle_timeout * 1e3)));
  }
  function hold(c2) {
    options.unref_sockets && c2.ref();
  }
  function unref(timer) {
    options.unref_sockets && timer && typeof timer.unref === "function" && timer.unref();
    return timer;
  }
  function idled(c2) {
    c2.idleTimer = null;
    if (c2.inflight || c2.lease || c2.closed)
      return;
    if (connections.size <= options.min)
      return;
    const left = options.idle_timeout * 1e3 - (now6() - c2.idleSince);
    left >= 1 ? c2.idleTimer = unref(setTimeout2(() => idled(c2), left)) : c2.close();
  }
  function onready(c2) {
    if (c2.releasing) {
      if (c2.inflight)
        return;
      c2.releasing = false;
      if (c2.status !== "I")
        return c2.close();
    }
    if (c2.inflight === 0 && !c2.lease && (c2.retiring || ending2 && waiting.length === 0))
      return c2.close();
    idle(c2);
    while (waiting.length > connections.size && usable(c2) && c2.inflight < options.max_pipeline && plain3(waiting.peek()))
      run2(c2, waiting.shift());
    waiting.length && !c2.lease && c2.inflight < options.max_pipeline && drain();
    ending2 && waiting.length === 0 && finishing();
  }
  function onclose(c2, error2) {
    connections.delete(c2);
    ending2 || replacing.push((c2.index + 1) % (options.path ? 1 : options.host.length));
    replacing.length > options.max && replacing.shift();
    c2.retired && c2.retired.forEach((r) => r());
    c2.idleTimer && clearTimeout2(c2.idleTimer);
    c2.lifeTimer && clearTimeout2(c2.lifeTimer);
    c2.lease && c2.lease.onclose && c2.lease.onclose(error2.code === "CONNECTION_DESTROYED" ? Errors.connection("CONNECTION_CLOSED", options, c2.host, c2.port) : error2);
    options.onclose && options.onclose(c2.id);
    listened(channels.pool) && event("close", c2, { error: error2 });
    connections.size === 0 && opening === 0 && statements.clear();
    drain();
    ending2 && finishing();
  }
  function onparameter(k, v) {
    options.parameters[k] !== v && (options.parameters[k] = v, options.onparameter && options.onparameter(k, v));
  }
  async function lease(kind) {
    used = true;
    await 1;
    if (ending2)
      throw Errors.connection("CONNECTION_ENDED", options, options.host[0], options.port[0]);
    if (failingFast())
      throw copy(failure.error);
    const missing = retype();
    if (missing)
      throw missing;
    return new Promise((resolve2, reject2) => {
      waiting.push(wait({ lease: true, kind, resolve: resolve2, reject: reject2, queued: listened(channels.pool) ? now6() : 0 }));
      drain();
    });
  }
  function grant(c2, job) {
    started2(job);
    hold(c2);
    c2.idleTimer && (clearTimeout2(c2.idleTimer), c2.idleTimer = null);
    let chain = Promise.resolve(), released = false, lost;
    const closed = new Promise((_, reject2) => lost = reject2);
    closed.catch(() => {
    });
    const x = {
      kind: job.kind,
      connection: c2,
      closed,
      get released() {
        return released;
      },
      send(q) {
        if (c2.closed)
          return q.reject(queryError(c2.closed, q, options.debug));
        if (released)
          return q.reject(queryError(ended(x), q, options.debug));
        chain = chain.then(() => new Promise((resolve2) => {
          q.onwrite = resolve2;
          q.then(resolve2, resolve2);
          query2(q, x);
        }));
      },
      release() {
        if (released)
          return;
        released = true;
        c2.lease === x && (c2.lease = null);
        listened(channels.pool) && event("release", c2, { kind: job.kind });
        if (c2.closed)
          return;
        if (c2.inflight)
          return c2.releasing = true;
        c2.status === "I" ? onready(c2) : c2.close();
      },
      onclose(error2) {
        lost(error2);
      }
    };
    c2.lease = x;
    listened(channels.pool) && event("lease", c2, { kind: job.kind, waited: job.queued ? now6() - job.queued : 0 });
    job.resolve(x);
  }
  function ended(lease2) {
    return Errors.generic("UNSAFE_TRANSACTION", "The " + lease2.kind + " has ended");
  }
  function cancel3(q) {
    if (waiting.remove((x) => x.q === q && (started2(x), true))) {
      q.reject(queryError(Errors.generic("57014", "canceling statement due to user request"), q, options.debug));
      return Promise.resolve();
    }
    if (q.connection)
      return q.connection.cancel(q);
    q.cancelled = true;
    return Promise.resolve();
  }
  function end({ timeout = null } = {}) {
    if (ending2)
      return ending2;
    ending2 = new Promise((resolve2) => {
      pool.ended = resolve2;
      timeout !== null && (endTimer = setTimeout2(destroy, timeout * 1e3));
      retryTimer && (clearTimeout2(retryTimer), retryTimer = null);
      Promise.resolve().then(finishing);
    });
    return ending2;
  }
  function finishing() {
    if (!pool.ended)
      return;
    if (waiting.length === 0)
      connections.forEach((c2) => c2.inflight === 0 && !c2.lease && c2.close());
    if (connections.size === 0 && opening === 0 && waiting.length) {
      const error2 = Errors.connection("CONNECTION_ENDED", options, options.host[0], options.port[0]);
      waiting.take().forEach((job) => reject(job, error2));
    }
    if (connections.size === 0 && (opening === 0 || signal.aborted) && waiting.length === 0) {
      endTimer && clearTimeout2(endTimer);
      retryTimer && clearTimeout2(retryTimer);
      const resolve2 = pool.ended;
      pool.ended = null;
      resolve2();
    }
  }
  function destroy() {
    endTimer = null;
    signal.aborted = true;
    signal.sockets.forEach((x) => x.destroy());
    const error2 = Errors.connection("CONNECTION_DESTROYED", options, options.host[0], options.port[0]);
    waiting.take().forEach((job) => reject(job, error2));
    connections.forEach((c2) => c2.destroy());
    connections.size === 0 && finishing();
  }
  function close2() {
    used = false;
    return Promise.all([...connections].map(
      (c2) => c2.lease ? new Promise((r) => (c2.retiring = true, (c2.retired || (c2.retired = [])).push(r))) : c2.close()
    ));
  }
}
function Queue() {
  let xs = [], head = 0;
  return {
    get length() {
      return xs.length - head;
    },
    push: (x) => xs.push(x),
    peek: () => xs[head],
    shift() {
      const x = xs[head];
      xs[head++] = void 0;
      head === xs.length ? (xs = [], head = 0) : head > 1024 && head * 2 > xs.length && (xs = xs.slice(head), head = 0);
      return x;
    },
    take() {
      const all = xs.slice(head);
      xs = [];
      head = 0;
      return all;
    },
    remove(fn) {
      for (let i = head; i < xs.length; i++) {
        if (fn(xs[i]))
          return xs.splice(i, 1), true;
      }
      return false;
    }
  };
}
var limit2 = 2e3;
function alone(x) {
  return x.alone === void 0 ? x.alone = opens(x.text) : x.alone;
}
function opens(text3) {
  if (begins.test(text3))
    return true;
  starts.lastIndex = 0;
  let match;
  while (match = starts.exec(text3)) {
    const from = match.index + 5;
    let i = from;
    while (true) {
      while (i < text3.length && /\s/.test(text3[i]))
        i++;
      if (text3[i] !== "/" || text3[i + 1] !== "*")
        break;
      const end = text3.indexOf("*/", i + 2);
      if (end === -1)
        return false;
      i = end + 2;
    }
    if (i > from && transaction.test(text3.slice(i, i + 12)))
      return true;
    starts.lastIndex = Math.max(starts.lastIndex, i);
  }
  return false;
}
function Statements(scheduler) {
  const prefix = Math.random().toString(36).slice(2, 10), map = /* @__PURE__ */ new Map(), templates = /* @__PURE__ */ new WeakMap();
  let counter = 1, clock = 0;
  const texts = /* @__PURE__ */ new Map();
  return { get, clear, known };
  function known(text3) {
    let x = texts.get(text3);
    if (x)
      return x;
    texts.set(text3, x = { text: text3, est: void 0, alone: void 0 });
    texts.size > limit2 && texts.delete(texts.keys().next().value);
    return x;
  }
  function get(built, prepare) {
    if (!prepare)
      return unnamed(built.text);
    const tagged = !built.dynamic && (templates.get(built.strings) || set(built.strings)), cached = tagged && tagged.get(built.types);
    if (cached && cached.live)
      return cached.used = clock++, cached;
    const key2 = built.types + "\0" + built.text;
    let statement2 = map.get(key2);
    statement2 ? statement2.used = clock++ : statement2 = add(key2, built.text);
    tagged && tagged.set(built.types, statement2);
    return statement2;
  }
  function unnamed(text3) {
    return {
      key: null,
      live: false,
      name: "",
      text: text3,
      ends: void 0,
      shape: void 0,
      version: 0,
      used: 0,
      cost: scheduler ? known(text3) : null
    };
  }
  function add(key2, text3) {
    const statement2 = {
      key: key2,
      live: true,
      name: prefix + counter++,
      text: text3,
      ends: void 0,
      shape: void 0,
      version: 0,
      used: clock++,
      cost: { est: void 0 },
      alone: void 0
    };
    map.set(key2, statement2);
    map.size > limit2 && evict();
    return statement2;
  }
  function evict() {
    let oldest = null;
    for (const x of map.values())
      (!oldest || x.used < oldest.used) && (oldest = x);
    oldest.live = false;
    map.delete(oldest.key);
  }
  function set(strings) {
    const x = /* @__PURE__ */ new Map();
    templates.set(strings, x);
    return x;
  }
  function clear() {
    map.forEach((x) => x.live = false);
    map.clear();
  }
}

// node_modules/postgres/src/subscribe.js
var noop4 = () => {
};
var statusInterval = 1e4;
var epoch = BigInt(Date.UTC(2e3, 0, 1)) * 1000n;
var lsnToString = (x) => (x >> 32n).toString(16).toUpperCase() + "/" + (x & 0xFFFFFFFFn).toString(16).toUpperCase();
function Subscribe(postgres2, options) {
  const subscribers = /* @__PURE__ */ new Map(), persistent = !!options.slot, slot = options.slot || "postgresjs_" + Math.random().toString(36).slice(2), state = {}, timers = options.timers;
  let connection2, current = null, ended = false, retries = 0;
  const sql = subscribe.sql = postgres2({
    ...options,
    transform: { column: {}, value: {}, row: {} },
    max: 1,
    idle_timeout: null,
    max_lifetime: null,
    connection: {
      ...options.connection,
      replication: "database"
    },
    onclose: () => {
      current && current.stop();
      current = null;
      state.pid = state.secret = void 0;
      ended || restart();
    },
    no_subscribe: true
  });
  const end = sql.end, close2 = sql.close;
  sql.end = async () => {
    ended = true;
    current && await current.finish();
    return end();
  };
  sql.close = async () => {
    current && await current.finish();
    return close2();
  };
  return subscribe;
  async function subscribe(event, fn, onsubscribe = noop4, onerror) {
    event = parseEvent(event);
    connection2 || (connection2 = init());
    const subscriber = { fn, onsubscribe, onerror };
    const fns = subscribers.has(event) ? subscribers.get(event).add(subscriber) : subscribers.set(event, /* @__PURE__ */ new Set([subscriber])).get(event);
    const unsubscribe = () => {
      fns.delete(subscriber);
      fns.size === 0 && subscribers.delete(event);
    };
    return connection2.then(() => {
      onsubscribe();
      return { unsubscribe, state, sql };
    }, (error2) => {
      unsubscribe();
      connection2 = null;
      throw error2;
    });
  }
  function restart() {
    const delay = Math.min(100 * 2 ** retries++, 1e4);
    connection2 = new Promise((r) => timers.setTimeout(r, retries === 1 ? 0 : delay)).then(() => ended || init()).then(
      (x) => {
        retries = 0;
        ended || subscribers.forEach((event) => event.forEach(({ onsubscribe }) => onsubscribe()));
        return x;
      },
      (error2) => {
        report(error2);
        ended || restart();
      }
    );
    connection2.catch(noop4);
  }
  async function init() {
    if (!options.publications)
      throw new Error("Missing publication names");
    await sql.unsafe(`CREATE_REPLICATION_SLOT ${slot}${persistent ? "" : " TEMPORARY"} LOGICAL pgoutput NOEXPORT_SNAPSHOT`).catch((error2) => {
      if (!persistent || error2.code !== "42710")
        throw error2;
    });
    const query2 = sql.unsafe(`START_REPLICATION SLOT ${slot} LOGICAL 0/0 (proto_version '1', publication_names '${options.publications}')`);
    query2.catch(noop4);
    const stream = await query2.writable();
    current = Stream3(stream);
    state.pid = query2.state && query2.state.pid;
    state.secret = query2.state && query2.state.secret;
    return current;
  }
  function Stream3(stream) {
    const relations = {};
    let acked = 0n, received = 0n, transaction2 = null, queue = null, failed = false, stopped = false, timer = timers.setTimeout(tick, statusInterval), soon = null;
    stream.on("data", data);
    stream.on("error", (error2) => failed || report(error2));
    stream.on("close", () => {
      const unexpected = !stopped;
      stop();
      unexpected && close2();
    });
    return { stop, finish: finish2 };
    function data(x) {
      if (x[0] === 119) {
        received = max(received, x.readBigUInt64BE(9));
        parse2(x.subarray(25), relations, sql.options.parsers, message, options.transform);
      } else if (x[0] === 107) {
        received = max(received, x.readBigUInt64BE(1));
        idle() && (acked = max(acked, received));
        x[17] && status();
      }
    }
    function message(kind, x, info) {
      if (kind === "begin")
        return transaction2 = { lsn: x.lsn, end: null, time: x.time, xid: x.xid };
      if (kind === "commit") {
        const done2 = transaction2;
        done2.end = x.end;
        transaction2 = null;
        return run2(() => commit(done2));
      }
      const at = transaction2 || {};
      info.lsn = at.lsn && lsnToString(at.lsn);
      info.time = at.time;
      info.xid = at.xid;
      run2(() => handle2(x, info));
    }
    function run2(fn) {
      if (failed || stopped)
        return;
      if (queue) {
        queue = queue.then(() => failed || stopped ? null : fn());
        return;
      }
      const result = fn();
      if (result && typeof result.then === "function") {
        queue = result;
        stream.pause();
        drain();
      }
    }
    function drain() {
      const at = queue;
      at.then(() => {
        if (queue !== at)
          return queue && drain();
        queue = null;
        stopped || failed || stream.resume();
      }, noop4);
    }
    function commit(done2) {
      acked = max(acked, done2.end);
      persistent && !soon && (soon = timers.setImmediate(() => (soon = null, status())));
    }
    function handle2(row, info) {
      const path = info.relation.schema + "." + info.relation.table, key2 = row && info.relation.keys.length ? "=" + info.relation.keys.map((x) => row[x.name]) : "", pending = [];
      call2(pending, "*", row, info);
      call2(pending, "*:" + path, row, info);
      key2 && call2(pending, "*:" + path + key2, row, info);
      call2(pending, info.command, row, info);
      call2(pending, info.command + ":" + path, row, info);
      key2 && call2(pending, info.command + ":" + path + key2, row, info);
      return pending.length ? Promise.all(pending) : null;
    }
    function call2(pending, event, row, info) {
      subscribers.has(event) && subscribers.get(event).forEach((subscriber) => {
        let result;
        try {
          result = subscriber.fn(row, info, event);
        } catch (error2) {
          return fail4(error2, subscriber);
        }
        result && typeof result.then === "function" && pending.push(result.catch((error2) => fail4(error2, subscriber)));
      });
    }
    function fail4(error2, subscriber) {
      report(error2, subscriber);
      if (!persistent || failed)
        return;
      failed = true;
      queue = null;
      stop();
      stream.destroy(new Error("A subscriber failed, so the transaction is delivered again"));
      close2();
    }
    function idle() {
      return !transaction2 && !queue;
    }
    function tick() {
      timer = null;
      if (stopped)
        return;
      status();
      timer = timers.setTimeout(tick, statusInterval);
    }
    function status() {
      if (stopped || stream.destroyed || !stream.writable)
        return;
      const x = Buffer.alloc(34);
      x[0] = 114;
      x.writeBigUInt64BE(acked, 1);
      x.writeBigUInt64BE(acked, 9);
      x.writeBigUInt64BE(acked, 17);
      x.writeBigInt64BE(BigInt(Date.now()) * 1000n - epoch, 25);
      stream.write(x);
    }
    async function finish2() {
      queue && await queue.catch(noop4);
      if (!failed) {
        idle() && (acked = max(acked, received));
        status();
      }
      stop();
      stream.destroyed || await new Promise((r) => (stream.once("close", r), stream.end()));
    }
    function stop() {
      if (stopped)
        return;
      stopped = true;
      timer && timers.clearTimeout(timer);
      soon && timers.clearImmediate(soon);
      timer = soon = null;
    }
  }
  function report(error2, subscriber) {
    const handlers = subscriber ? [subscriber.onerror] : [...subscribers.values()].flatMap((x) => [...x].map((x2) => x2.onerror));
    const listeners = handlers.filter(Boolean);
    listeners.length ? listeners.forEach((fn) => fn(error2)) : console.error("postgres.js: logical replication error", error2);
  }
}
function max(a, b) {
  return a > b ? a : b;
}
function Time(x) {
  return new Date(Date.UTC(2e3, 0, 1) + Number(x / 1000n));
}
function parse2(x, relations, parsers, message, transform) {
  const type = x[0];
  if (type === 82) {
    let i = 1;
    const r = relations[x.readUInt32BE(i)] = {
      schema: x.toString("utf8", i += 4, i = x.indexOf(0, i)) || "pg_catalog",
      table: x.toString("utf8", i + 1, i = x.indexOf(0, i + 1)),
      columns: Array(x.readUInt16BE(i += 2)),
      keys: []
    };
    i += 2;
    let columnIndex = 0, column2;
    while (i < x.length) {
      column2 = r.columns[columnIndex++] = {
        key: x[i++],
        name: transform.column.from ? transform.column.from(x.toString("utf8", i, i = x.indexOf(0, i))) : x.toString("utf8", i, i = x.indexOf(0, i)),
        type: x.readUInt32BE(i += 1),
        parser: parsers[x.readUInt32BE(i)],
        atttypmod: x.readUInt32BE(i += 4)
      };
      column2.key && r.keys.push(column2);
      i += 4;
    }
  } else if (type === 66) {
    message("begin", { lsn: x.readBigUInt64BE(1), time: Time(x.readBigInt64BE(9)), xid: x.readUInt32BE(17) });
  } else if (type === 67) {
    message("commit", { lsn: x.readBigUInt64BE(2), end: x.readBigUInt64BE(10) });
  } else if (type === 73) {
    const relation = relations[x.readUInt32BE(1)];
    message("change", tuples(x, relation.columns, 8, transform).row, { command: "insert", relation });
  } else if (type === 68) {
    let i = 1;
    const relation = relations[x.readUInt32BE(i)];
    i += 4;
    const key2 = x[i] === 75;
    message(
      "change",
      key2 || x[i] === 79 ? tuples(x, relation.columns, i += 3, transform).row : null,
      { command: "delete", relation, key: key2 }
    );
  } else if (type === 85) {
    let i = 1;
    const relation = relations[x.readUInt32BE(i)];
    i += 4;
    const key2 = x[i] === 75;
    const xs = key2 || x[i] === 79 ? tuples(x, relation.columns, i += 3, transform) : null;
    xs && (i = xs.i);
    const { row } = tuples(x, relation.columns, i + 3, transform);
    message("change", row, { command: "update", relation, key: key2, old: xs && xs.row });
  } else if (type === 84) {
    const count = x.readUInt32BE(1), flags = x[5];
    for (let i = 0; i < count; i++) {
      message("change", null, {
        command: "truncate",
        relation: relations[x.readUInt32BE(6 + i * 4)],
        cascade: (flags & 1) === 1,
        restartIdentity: (flags & 2) === 2
      });
    }
  }
}
function tuples(x, columns2, xi, transform) {
  let type, column2, value2;
  const row = {};
  for (let i = 0; i < columns2.length; i++) {
    type = x[xi++];
    column2 = columns2[i];
    value2 = type === 110 ? null : type === 117 ? void 0 : column2.parser(x.toString("utf8", xi + 4, xi += 4 + x.readUInt32BE(xi)));
    value2 = transform.value.from ? transform.value.from(value2, column2) : value2;
    column2.name === "__proto__" ? own2(row, column2.name, value2) : row[column2.name] = value2;
  }
  return { i: xi, row: transform.row.from ? transform.row.from(row) : row };
}
function parseEvent(x) {
  const [, command, path, key2] = x.match(/^(\*|insert|update|delete|truncate)?:?([^.]+?\.?[^=]+)?=?(.+)?/i);
  return (command || "*") + (path ? ":" + (path.indexOf(".") === -1 ? "public." + path : path) : "") + (key2 ? "=" + key2 : "");
}

// node_modules/postgres/src/large.js
import Stream2 from "stream";
function largeObject(sql, oid, mode = 131072 | 262144) {
  return new Promise(async (resolve2, reject) => {
    await sql.begin(async (sql2) => {
      let finish2;
      !oid && ([{ oid }] = await sql2`select lo_creat(-1) as oid`);
      const [{ fd }] = await sql2`select lo_open(${oid}, ${mode}) as fd`;
      const lo = {
        writable,
        readable,
        close: () => sql2`select lo_close(${fd})`.then(finish2),
        tell: () => sql2`select lo_tell64(${fd})`,
        read: (x) => sql2`select loread(${fd}, ${x}) as data`,
        write: (x) => sql2`select lowrite(${fd}, ${x})`,
        truncate: (x) => sql2`select lo_truncate64(${fd}, ${x})`,
        seek: (x, whence = 0) => sql2`select lo_lseek64(${fd}, ${x}, ${whence})`,
        size: () => sql2`
          select
            lo_lseek64(${fd}, location, 0) as position,
            seek.size
          from (
            select
              lo_lseek64($1, 0, 2) as size,
              tell.location
            from (select lo_tell64($1) as location) tell
          ) seek
        `
      };
      resolve2(lo);
      return new Promise(async (r) => finish2 = r);
      async function readable({
        highWaterMark = 2048 * 8,
        start: start2 = 0,
        end = Infinity
      } = {}) {
        let max2 = end - start2;
        start2 && await lo.seek(start2);
        return new Stream2.Readable({
          highWaterMark,
          async read(size) {
            const l = Math.min(size, max2);
            max2 -= l;
            const [{ data }] = await lo.read(l);
            data.length && this.push(data);
            if (data.length < l || max2 === 0)
              this.push(null);
          }
        });
      }
      async function writable({
        highWaterMark = 2048 * 8,
        start: start2 = 0
      } = {}) {
        start2 && await lo.seek(start2);
        return new Stream2.Writable({
          highWaterMark,
          write(chunk, encoding, callback) {
            lo.write(chunk).then(() => callback(), callback);
          }
        });
      }
    }).catch(reject);
  });
}

// node_modules/postgres/src/index.js
Object.assign(Postgres, {
  PostgresError,
  toPascal,
  pascal,
  toCamel,
  camel,
  toKebab,
  kebab,
  fromPascal,
  fromCamel,
  fromKebab,
  BigInt: {
    to: 20,
    from: [20],
    parse: (x) => BigInt(x),
    serialize: (x) => x.toString()
  }
});
var src_default = Postgres;
function Postgres(a, b) {
  const options = parseOptions(a, b), types2 = options.shared_types || Types(options), pool = Pool(options, types2), subscribe = options.no_subscribe || Subscribe(Postgres, { ...options, shared_types: types2 }), listener = Listen(options);
  if (types2.named && options.fetch_types === false)
    throw Errors.generic("TYPE_NOT_FOUND", "Custom types given by name need fetch_types to look them up");
  options.resolve = types2.resolve;
  options.parsers = view(types2.parsers, types2.parser);
  options.serializers = view(types2.serializers, types2.serializer);
  const sql = Sql(handler);
  Object.defineProperties(sql, {
    parameters: { get: () => options.parameters, enumerable: true },
    stats: { get: () => pool.stats, enumerable: true }
  });
  Object.assign(sql, {
    largeObject: largeObject.bind(null, sql),
    subscribe,
    CLOSE,
    END: CLOSE,
    PostgresError,
    options,
    reserve,
    listen: listener.listen,
    begin,
    close: close2,
    end
  });
  Symbol.asyncDispose && (sql[Symbol.asyncDispose] = () => end());
  return sql;
  function handler(q) {
    pool.query(q);
  }
  function Sql(handler2) {
    handler2.debug = options.debug;
    handler2.options = options;
    handler2.cancel = handler2.cancel || pool.cancel;
    const typed = (value2, type) => new Parameter(value2, type);
    Object.entries(options.types).forEach(([name2, type]) => typed[name2] = (x) => new Parameter(x, type.to));
    Object.assign(sql2, {
      types: typed,
      typed,
      unsafe,
      notify: notify2,
      array,
      json: json2,
      file
    });
    return sql2;
    function sql2(strings, ...args) {
      return strings && Array.isArray(strings.raw) ? new Query(strings, args, handler2) : typeof strings === "string" && !args.length ? new Identifier(options.transform.column.to ? options.transform.column.to(strings) : strings) : new Builder(strings, args);
    }
    function unsafe(string2, args = [], options2 = {}) {
      arguments.length === 2 && !Array.isArray(args) && (options2 = args, args = []);
      return new Query([string2], args, handler2, {
        prepare: false,
        ...options2,
        simple: "simple" in options2 ? options2.simple : args.length === 0
      });
    }
    async function notify2(channel, payload) {
      return await sql2`select pg_notify(${channel}, ${"" + payload})`;
    }
    function file(path, args = [], options2 = {}) {
      arguments.length === 2 && !Array.isArray(args) && (options2 = args, args = []);
      const fileHandler = (query2) => fs2.readFile(path, "utf8", (err, string2) => {
        if (err)
          return query2.reject(err);
        query2.strings = [string2];
        handler2(query2);
      });
      Object.assign(fileHandler, handler2);
      return new Query([], args, fileHandler, {
        ...options2,
        simple: "simple" in options2 ? options2.simple : args.length === 0
      });
    }
  }
  function json2(x) {
    return new Parameter(x, 3802);
  }
  function array() {
    throw Errors.generic("ARRAY_REMOVED", "sql.array() is removed in v4, pass the array as it is");
  }
  async function reserve() {
    const lease = await pool.lease("reserve"), reserved = Sql(Object.assign((q) => lease.send(q), { cancel: pool.cancel }));
    reserved.release = () => lease.release();
    Symbol.dispose && (reserved[Symbol.dispose] = reserved.release);
    Symbol.asyncDispose && (reserved[Symbol.asyncDispose] = async () => reserved.release());
    return reserved;
  }
  function begin(mode, fn) {
    !fn && (fn = mode, mode = "");
    if (!active(channels.transaction))
      return transaction2(mode, fn, null);
    const context3 = {
      mode,
      database: options.database,
      user: userName(options),
      connection: null,
      host: null,
      port: null,
      outcome: null
    };
    let promise;
    start(channels.transaction, context3, () => promise = transaction2(mode, fn, context3));
    return promise.then(
      (result) => (finish(channels.transaction, context3, null, result), result),
      (error2) => {
        finish(channels.transaction, context3, error2);
        throw error2;
      }
    );
  }
  async function transaction2(mode, fn, context3) {
    const lease = await pool.lease("transaction");
    let savepoints = 0, prepare = null;
    context3 && Object.assign(context3, {
      connection: lease.connection.id,
      host: lease.connection.host,
      port: lease.connection.port
    });
    try {
      await control(lease, "begin " + mode.replace(/[^a-z ]/ig, ""));
      const done2 = scope(fn);
      done2.catch(() => {
      });
      return await Promise.race([done2, lease.closed]);
    } finally {
      lease.release();
    }
    async function scope(fn2, name2, inside, above = () => false) {
      let uncaught, result, rolled = null, after2 = null;
      if (above())
        throw rolledBack();
      const stopped = () => !!rolled || above(), scoped = Sql(Object.assign((q) => {
        if (stopped())
          return q.reject(after2 || (after2 = rolledBack()));
        q.catch((e) => uncaught || (uncaught = e));
        lease.send(q);
      }, { cancel: pool.cancel }));
      scoped.savepoint = savepoint;
      scoped.begin = nested;
      scoped.rollback = () => rolled || (rolled = control(lease, name2 ? "rollback to " + identifier(name2) : "rollback").then(() => {
      }));
      scoped.prepare = (x) => {
        if (inside)
          throw Errors.generic("NESTED_TRANSACTION_MODE", "A nested transaction can not be prepared, only the outermost one");
        prepare = x.replace(/[^a-z0-9$\-_. ]/gi, "");
      };
      name2 && await control(lease, "savepoint " + identifier(name2));
      try {
        result = await new Promise((resolve2, reject) => {
          const x = fn2(scoped);
          Promise.resolve(Array.isArray(x) ? Promise.all(x) : x).then(resolve2, reject);
        });
        if (uncaught && !stopped())
          throw uncaught;
      } catch (error2) {
        context3 && !name2 && (context3.outcome = "rollback");
        stopped() ? rolled && await rolled.catch(() => {
        }) : lease.connection.closed || await control(lease, name2 ? "rollback to " + identifier(name2) : "rollback");
        throw error2 instanceof PostgresError && error2.code === "25P02" && uncaught || error2;
      }
      if (stopped()) {
        rolled && await rolled;
        context3 && !name2 && (context3.outcome = "rollback");
        if (after2)
          throw after2;
        return result;
      }
      if (!name2) {
        const done2 = await control(lease, prepare ? "prepare transaction '" + prepare.replace(/'/g, "''") + "'" : "commit");
        context3 && (context3.outcome = prepare ? "prepare" : done2.command === "COMMIT" ? "commit" : "rollback");
        if (!prepare && done2.command !== "COMMIT")
          throw Errors.generic("TRANSACTION_ROLLED_BACK", "The server rolled back the transaction instead of committing it");
      }
      return result;
      function savepoint(name3, fn3) {
        if (name3 && Array.isArray(name3.raw))
          return savepoint((sql2) => sql2.apply(sql2, arguments));
        arguments.length === 1 && (fn3 = name3, name3 = null);
        return scope(fn3, "s" + savepoints++ + (name3 ? "_" + name3 : ""), false, stopped);
      }
      async function nested(inner, fn3) {
        !fn3 && (fn3 = inner, inner = "");
        if (normal(inner) && normal(inner) !== normal(mode))
          throw Errors.generic("NESTED_TRANSACTION_MODE", "A nested transaction runs in a savepoint, which can not change the transaction mode");
        return scope(fn3, "s" + savepoints++, true, stopped);
      }
    }
  }
  function rolledBack() {
    return Errors.generic("TRANSACTION_ROLLED_BACK", "The query was not sent, the transaction was rolled back with sql.rollback()");
  }
  function normal(x) {
    return (x || "").toLowerCase().replace(/[^a-z ]/g, "").replace(/\s+/g, " ").trim();
  }
  function identifier(x) {
    return '"' + x.replace(/"/g, '""') + '"';
  }
  function control(lease, text3) {
    const q = new Query([text3], [], Object.assign((q2) => lease.send(q2), { options, cancel: pool.cancel }), { simple: true });
    return q.execute();
  }
  async function end(options2) {
    await Promise.all([
      listener.end(),
      subscribe.sql ? subscribe.sql.end({ timeout: 0 }) : null
    ]);
    return pool.end(options2);
  }
  function close2() {
    return pool.close();
  }
}
function Listen(options) {
  const channels2 = /* @__PURE__ */ new Map();
  let sql = null, closing = null;
  return {
    listen,
    end: () => closing || (sql ? closing = sql.end({ timeout: 0 }) : Promise.resolve())
  };
  function connection2() {
    return sql || (sql = Postgres({
      ...options,
      max: 1,
      idle_timeout: null,
      max_lifetime: null,
      fetch_types: false,
      no_subscribe: true,
      onclose() {
        if (closing)
          return;
        channels2.forEach((channel, name2) => {
          channel.result = start2(name2);
          channel.result.then((result) => {
            Object.assign(channel.state, result.state);
            channel.listeners.forEach((l) => l.onlisten && l.onlisten());
          }, () => {
          });
        });
      },
      onnotify(channel, payload) {
        channels2.has(channel) && [...channels2.get(channel).listeners].forEach((l) => l.fn(payload));
      }
    }));
  }
  function start2(name2) {
    const x = connection2();
    return x`listen ${x.unsafe('"' + name2.replace(/"/g, '""') + '"')}`;
  }
  async function listen(name2, fn, onlisten) {
    const listener = { fn, onlisten };
    if (!channels2.has(name2))
      channels2.set(name2, { listeners: /* @__PURE__ */ new Set(), result: start2(name2), state: {} });
    const channel = channels2.get(name2);
    channel.listeners.add(listener);
    let result;
    try {
      result = await channel.result;
    } catch (error2) {
      channel.listeners.delete(listener);
      channel.listeners.size || channels2.delete(name2);
      throw error2;
    }
    Object.assign(channel.state, result.state);
    listener.onlisten && listener.onlisten();
    return { state: channel.state, unlisten };
    async function unlisten() {
      if (!channel.listeners.delete(listener) || channel.listeners.size)
        return;
      channels2.get(name2) === channel && channels2.delete(name2);
      const x = sql;
      if (closing || !x)
        return;
      await x`unlisten ${x.unsafe('"' + name2.replace(/"/g, '""') + '"')}`.catch((e) => {
        if (!/^CONNECTION_/.test(e.code))
          throw e;
      });
      if (channels2.size === 0 && sql === x) {
        sql = null;
        await x.end();
      }
    }
  }
}
function parseOptions(a, b) {
  if (a && a.shared)
    return a;
  const env = process.env, o = (!a || typeof a === "string" ? b : a) || {}, url = parseUrl(a), query2 = [...url.url.searchParams].reduce((a2, [b2, c2]) => (a2[b2] = c2, a2), {}), targets = hosts(o, query2, url, env), port = o.port || query2.port || env.PGPORT || 5432, user = o.user || o.username || url.url.username || env.PGUSERNAME || env.PGUSER || osUsername();
  o.no_prepare && (o.prepare = false);
  query2.sslmode && (query2.ssl = query2.sslmode, delete query2.sslmode);
  "timeout" in o && (console.log("The timeout option is deprecated, use idle_timeout instead"), o.idle_timeout = o.timeout);
  query2.sslrootcert === "system" && (query2.ssl = "verify-full");
  const ints = ["idle_timeout", "connect_timeout", "max_lifetime", "max_pipeline", "backoff", "keep_alive", "min", "queue_timeout"];
  const defaults = {
    max: globalThis.Cloudflare ? 3 : 10,
    min: 0,
    ssl: false,
    sslnegotiation: null,
    channel_binding: "prefer",
    idle_timeout: null,
    connect_timeout: 30,
    queue_timeout: 0,
    max_lifetime,
    max_pipeline: 100,
    scheduler: true,
    backoff,
    keep_alive: 60,
    prepare: true,
    debug: false,
    fetch_types: true,
    infer: false,
    publications: "alltables",
    slot: null,
    target_session_attrs: null
  };
  const options = {
    host: targets.map((x) => x[0]),
    port: Array.isArray(port) ? port : targets.map((x) => o.port || query2.port ? +port : x[1] || +port),
    path: o.path || targets[0][0].indexOf("/") > -1 && targets[0][0] + "/.s.PGSQL." + (targets[0][1] || port),
    database: o.database || o.db || (url.url.pathname || "").slice(1) || env.PGDATABASE || (typeof user === "function" ? null : user),
    user,
    pass: o.pass || o.password || url.url.password || env.PGPASSWORD || "",
    ...Object.entries(defaults).reduce(
      (acc, [k, d2]) => {
        const value2 = k in o && o[k] !== void 0 ? o[k] : k in query2 ? query2[k] === "disable" || query2[k] === "false" ? false : query2[k] : env["PG" + k.toUpperCase()] || d2;
        acc[k] = typeof value2 === "string" && ints.includes(k) ? +value2 : value2;
        return acc;
      },
      {}
    ),
    connection: {
      application_name: env.PGAPPNAME || "postgres.js",
      ...o.connection,
      ...Object.entries(query2).reduce((acc, [k, v]) => (k in defaults || k === "host" || k === "port" || (acc[k] = v), acc), {})
    },
    types: o.types || {},
    target_session_attrs: tsa(o, url.url, env),
    channel_binding: binding(o, url.url, env),
    onnotice: o.onnotice,
    onnotify: o.onnotify,
    onclose: o.onclose,
    onparameter: o.onparameter,
    socket: o.socket,
    onread: o.onread !== false,
    open: o.open,
    no_subscribe: o.no_subscribe,
    unref_sockets: !!o.unref_sockets,
    passfile: passfile(env),
    shared_types: o.shared_types,
    transform: parseTransform(o.transform || { undefined: void 0 }),
    parameters: {},
    shared: { retries: 0 },
    timers: o.timers || {
      setTimeout,
      clearTimeout,
      setImmediate,
      clearImmediate,
      now: () => performance.now()
    }
  };
  options.infer = options.infer === true || options.infer === "true";
  options.max === 1 && (options.scheduler = false);
  return options;
}
function tsa(o, url, env) {
  const x = o.target_session_attrs || url.searchParams.get("target_session_attrs") || env.PGTARGETSESSIONATTRS;
  if (!x || ["read-write", "read-only", "primary", "standby", "prefer-standby"].includes(x))
    return x;
  throw new Error("target_session_attrs " + x + " is not supported");
}
function binding(o, url, env) {
  const x = o.channel_binding || url.searchParams.get("channel_binding") || env.PGCHANNELBINDING || "prefer";
  if (["disable", "prefer", "require"].includes(x))
    return x;
  throw new Error("channel_binding " + x + " is not supported");
}
function backoff(retries) {
  return (0.5 + Math.random() / 2) * Math.min(3 ** retries / 100, 20);
}
function max_lifetime() {
  return 60 * (30 + Math.random() * 30);
}
function parseTransform(x) {
  return {
    undefined: x.undefined,
    column: {
      from: typeof x.column === "function" ? x.column : x.column && x.column.from,
      to: x.column && x.column.to
    },
    value: {
      from: typeof x.value === "function" ? x.value : x.value && x.value.from,
      to: x.value && x.value.to
    },
    row: {
      from: typeof x.row === "function" ? x.row : x.row && x.row.from,
      to: x.row && x.row.to
    }
  };
}
function parseUrl(url) {
  if (!url || typeof url !== "string")
    return { url: { searchParams: /* @__PURE__ */ new Map() }, targets: [] };
  const rest = url.slice(url.indexOf("://") + 3), end = rest.search(/[/?]/), authority = end === -1 ? rest : rest.slice(0, end), at = authority.lastIndexOf("@"), userinfo = at === -1 ? "" : authority.slice(0, at), colon = userinfo.indexOf(":"), tail = new URL("postgres://x" + (end === -1 ? "" : rest.slice(end)));
  return {
    url: {
      username: decode(colon === -1 ? userinfo : userinfo.slice(0, colon)),
      password: colon === -1 ? "" : decode(userinfo.slice(colon + 1)),
      pathname: decode(tail.pathname),
      searchParams: tail.searchParams
    },
    targets: authority.slice(at + 1) ? split2(authority.slice(at + 1), decode) : []
  };
}
function decode(x) {
  try {
    return decodeURIComponent(x);
  } catch (_) {
    return x;
  }
}
function hosts(o, query2, url, env) {
  const given = o.hostname || o.host || query2.host;
  if (given)
    return Array.isArray(given) ? given.map((x) => [x, null]) : split2(given);
  if (url.targets.some(([x]) => x))
    return url.targets;
  return split2(env.PGHOST || "localhost").map(([x, p2], i) => [x, p2 || url.targets[i] && url.targets[i][1] || null]);
}
function split2(x, decoded = (x2) => x2) {
  return x.split(",").filter(Boolean).map((x2) => {
    const m = x2.match(/^\[([^\]]*)\](?::(\d*))?$/) || x2.match(/^([^:]*)(?::(\d*))?$/) || [x2, x2];
    return [decoded(m[1]), m[2] ? +m[2] : null];
  });
}
function passfile(env) {
  try {
    return env.PGPASSFILE || (process.platform === "win32" ? (env.APPDATA || "") + "\\postgresql\\pgpass.conf" : os.homedir() + "/.pgpass");
  } catch (_) {
    return null;
  }
}
function osUsername() {
  try {
    return os.userInfo().username;
  } catch (_) {
    return process.env.USERNAME || process.env.USER || process.env.LOGNAME;
  }
}
function view(known, get) {
  return new Proxy(known, {
    get: (x, oid) => typeof oid === "symbol" ? x[oid] : get(+oid)
  });
}

// server/db.server.ts
var MIGRATIONS = [
  {
    version: 1,
    name: "init",
    sql: `
      CREATE TABLE users (
        id                  TEXT PRIMARY KEY,
        email               TEXT NOT NULL,
        username            TEXT NOT NULL,
        password_hash       TEXT NOT NULL,
        display_name        TEXT NOT NULL,
        is_active           BOOLEAN NOT NULL DEFAULT TRUE,
        email_verified_at   TIMESTAMPTZ,
        password_changed_at TIMESTAMPTZ NOT NULL,
        last_login_at       TIMESTAMPTZ,
        created_at          TIMESTAMPTZ NOT NULL,
        updated_at          TIMESTAMPTZ NOT NULL,
        deleted_at          TIMESTAMPTZ
      );
      -- Email and username are case-insensitive.
      CREATE UNIQUE INDEX users_email_key ON users (lower(email));
      CREATE UNIQUE INDEX users_username_key ON users (lower(username));

      -- Profile details live apart from credentials so profile features never touch auth data.
      CREATE TABLE user_profiles (
        user_id    TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        first_name TEXT,
        last_name  TEXT,
        avatar_url TEXT,
        updated_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE roles (
        id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name        TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE permissions (
        id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name        TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE role_permissions (
        role_id       INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        PRIMARY KEY (role_id, permission_id)
      );

      -- Many-to-many so a user can hold several roles later without a redesign.
      CREATE TABLE user_roles (
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id    INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        granted_at TIMESTAMPTZ NOT NULL,
        PRIMARY KEY (user_id, role_id)
      );

      -- Only a SHA-256 hash of the session token is stored, so a leaked database cannot be
      -- replayed as live sessions.
      CREATE TABLE sessions (
        token_hash   TEXT PRIMARY KEY,
        user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at   TIMESTAMPTZ NOT NULL,
        last_seen_at TIMESTAMPTZ NOT NULL,
        expires_at   TIMESTAMPTZ NOT NULL,
        remember     BOOLEAN NOT NULL DEFAULT FALSE,
        ip           TEXT,
        user_agent   TEXT,
        revoked_at   TIMESTAMPTZ
      );
      CREATE INDEX idx_sessions_user ON sessions(user_id);
      CREATE INDEX idx_sessions_expires ON sessions(expires_at);

      -- Ready for the password-reset feature (token hash only, single use, short lived).
      CREATE TABLE password_reset_tokens (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at    TIMESTAMPTZ
      );

      -- Used for login rate limiting.
      CREATE TABLE login_attempts (
        id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        identifier TEXT NOT NULL,
        ip         TEXT,
        success    BOOLEAN NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      );
      CREATE INDEX idx_login_attempts_identifier ON login_attempts(identifier, created_at);
      CREATE INDEX idx_login_attempts_ip ON login_attempts(ip, created_at);

      -- Used for sign-up rate limiting (kept in the database because serverless instances share
      -- no memory).
      CREATE TABLE signup_attempts (
        id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        ip         TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      );
      CREATE INDEX idx_signup_attempts_ip ON signup_attempts(ip, created_at);

      -- Append-only trail of security-relevant events (login, logout, failures, user changes).
      CREATE TABLE audit_log (
        id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
        event      TEXT NOT NULL,
        identifier TEXT,
        ip         TEXT,
        user_agent TEXT,
        detail     TEXT,
        created_at TIMESTAMPTZ NOT NULL
      );
      CREATE INDEX idx_audit_user ON audit_log(user_id, created_at);
      CREATE INDEX idx_audit_event ON audit_log(event, created_at);

      -- Role-specific details entered on the Sign up form. Names live in user_profiles already.
      CREATE TABLE coach_profiles (
        user_id              TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        organization         TEXT NOT NULL,
        coaching_position    TEXT NOT NULL,
        sport_specialization TEXT NOT NULL,
        created_at           TIMESTAMPTZ NOT NULL,
        updated_at           TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE university_representative_profiles (
        user_id         TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        university_name TEXT NOT NULL,
        designation     TEXT NOT NULL,
        created_at      TIMESTAMPTZ NOT NULL,
        updated_at      TIMESTAMPTZ NOT NULL
      );

      -- Reference data (not user accounts): the roles the app knows about. People can register as
      -- student_athlete, coach or university_representative; admin is only given out by hand.
      INSERT INTO roles (name, description) VALUES
        ('student_athlete', 'Student-athlete: manages their own profile and practice sessions'),
        ('coach', 'Coach: reviews and verifies athlete sessions'),
        ('admin', 'Administrator: manages accounts and roles'),
        ('university_representative', 'University representative: represents a university''s athletics program');

      INSERT INTO permissions (name, description) VALUES
        ('sessions:verify', 'Mark a performance session as coach-verified'),
        ('users:read',      'View user accounts'),
        ('users:manage',    'Create, edit, activate and deactivate user accounts'),
        ('audit:read',      'View the login activity and audit log');

      -- A coach who signs up has NOT been approved yet, so the coach role alone does not grant
      -- 'sessions:verify'. Grant it to coaches when coach approval exists.
      INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name = 'admin';
    `
  },
  {
    version: 2,
    name: "coach_athlete_connections",
    sql: `
      -- One row per coach-athlete pair. A coach is a user with the 'coach' role and an athlete is a
      -- user with the 'student_athlete' role (there is no separate athlete table), so both sides
      -- reference users(id). Role checks are the API's job; the database guarantees the shape.
      -- The row is reused for the life of the relationship: declining, cancelling or disconnecting
      -- changes status, and a later re-request flips the same row back to 'pending'.
      CREATE TABLE coach_athlete_connections (
        id           TEXT PRIMARY KEY,
        coach_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        athlete_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        requested_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status       TEXT NOT NULL DEFAULT 'pending',
        requested_at TIMESTAMPTZ NOT NULL,
        responded_at TIMESTAMPTZ,
        created_at   TIMESTAMPTZ NOT NULL,
        updated_at   TIMESTAMPTZ NOT NULL,
        CONSTRAINT coach_athlete_connections_status_check
          CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'disconnected')),
        -- Nobody connects to themselves.
        CONSTRAINT coach_athlete_connections_distinct_users_check
          CHECK (coach_id <> athlete_id),
        -- Only one of the two people can have sent the request.
        CONSTRAINT coach_athlete_connections_requested_by_check
          CHECK (requested_by IN (coach_id, athlete_id)),
        -- A pending request has not been answered yet; an answer cannot predate the request.
        CONSTRAINT coach_athlete_connections_responded_check
          CHECK ((status <> 'pending' OR responded_at IS NULL)
             AND (responded_at IS NULL OR responded_at >= requested_at))
      );
      -- At most one record per coach-athlete pair, so a duplicate request (including a second
      -- pending or accepted one, from either side) is rejected by the database itself.
      CREATE UNIQUE INDEX coach_athlete_connections_pair_key
        ON coach_athlete_connections (coach_id, athlete_id);
      CREATE INDEX idx_coach_athlete_connections_coach   ON coach_athlete_connections (coach_id, status);
      CREATE INDEX idx_coach_athlete_connections_athlete ON coach_athlete_connections (athlete_id, status);
    `
  },
  {
    version: 3,
    name: "training_plans",
    sql: `
      -- A coach's training plan. DRAFT plans only need a title; a PUBLISHED plan must be complete
      -- (the CHECK below), so the database itself refuses a half-finished published plan.
      CREATE TABLE training_plans (
        id           TEXT PRIMARY KEY,
        coach_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title        TEXT NOT NULL,
        description  TEXT NOT NULL DEFAULT '',
        sport        TEXT NOT NULL DEFAULT '',
        skill_focus  TEXT NOT NULL DEFAULT '',
        start_date   DATE,
        end_date     DATE,
        status       TEXT NOT NULL DEFAULT 'DRAFT',
        published_at TIMESTAMPTZ,
        created_at   TIMESTAMPTZ NOT NULL,
        updated_at   TIMESTAMPTZ NOT NULL,
        CONSTRAINT training_plans_status_check CHECK (status IN ('DRAFT', 'PUBLISHED')),
        CONSTRAINT training_plans_title_check CHECK (length(btrim(title)) BETWEEN 1 AND 120),
        CONSTRAINT training_plans_description_check CHECK (length(description) <= 1000),
        CONSTRAINT training_plans_dates_check CHECK (start_date IS NULL OR end_date IS NULL OR end_date >= start_date),
        CONSTRAINT training_plans_published_check CHECK (
          status = 'DRAFT'
          OR (published_at IS NOT NULL AND sport <> '' AND skill_focus <> '' AND start_date IS NOT NULL AND end_date IS NOT NULL)
        )
      );
      CREATE INDEX idx_training_plans_coach ON training_plans (coach_id, status, updated_at DESC);

      -- The weekly schedule: one row per drill, kept in the order the coach arranged them.
      CREATE TABLE training_plan_schedule_items (
        id               TEXT PRIMARY KEY,
        plan_id          TEXT NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
        position         INTEGER NOT NULL,
        day_of_week      TEXT NOT NULL,
        drill_name       TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL,
        intensity        TEXT NOT NULL,
        CONSTRAINT training_plan_schedule_position_key UNIQUE (plan_id, position),
        CONSTRAINT training_plan_schedule_day_check
          CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
        CONSTRAINT training_plan_schedule_drill_check CHECK (length(btrim(drill_name)) BETWEEN 1 AND 120),
        CONSTRAINT training_plan_schedule_duration_check CHECK (duration_minutes BETWEEN 1 AND 600),
        CONSTRAINT training_plan_schedule_intensity_check CHECK (intensity IN ('Low', 'Medium', 'High'))
      );

      CREATE TABLE training_plan_goals (
        id          TEXT PRIMARY KEY,
        plan_id     TEXT NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
        position    INTEGER NOT NULL,
        description TEXT NOT NULL,
        CONSTRAINT training_plan_goals_position_key UNIQUE (plan_id, position),
        CONSTRAINT training_plan_goals_description_check CHECK (length(btrim(description)) BETWEEN 1 AND 200)
      );

      -- Which athletes a plan is assigned to. Whether the coach may assign them (an accepted
      -- coach_athlete_connections row) is enforced by the API when the plan is saved.
      CREATE TABLE training_plan_assignments (
        plan_id     TEXT NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
        athlete_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assigned_at TIMESTAMPTZ NOT NULL,
        PRIMARY KEY (plan_id, athlete_id)
      );
      CREATE INDEX idx_training_plan_assignments_athlete ON training_plan_assignments (athlete_id);
    `
  },
  {
    version: 4,
    name: "athlete_profiles_and_coach_dashboard",
    sql: `
      -- What a coach sees on My Athletes and in the athlete profile popup. One row per athlete;
      -- the athlete edits sport/position/school/bio. ranking, performance and consistency are
      -- NOT editable by the athlete (they are scores, set by the platform or an admin).
      CREATE TABLE athlete_profiles (
        user_id          TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        sport            TEXT NOT NULL DEFAULT '',
        playing_position TEXT NOT NULL DEFAULT '',
        school           TEXT NOT NULL DEFAULT '',
        bio              TEXT NOT NULL DEFAULT '',
        ranking          INTEGER,
        performance      NUMERIC(5,2),
        consistency      NUMERIC(5,2),
        created_at       TIMESTAMPTZ NOT NULL,
        updated_at       TIMESTAMPTZ NOT NULL,
        CONSTRAINT athlete_profiles_ranking_check     CHECK (ranking IS NULL OR ranking >= 1),
        CONSTRAINT athlete_profiles_performance_check CHECK (performance IS NULL OR performance BETWEEN 0 AND 100),
        CONSTRAINT athlete_profiles_consistency_check CHECK (consistency IS NULL OR consistency BETWEEN 0 AND 100),
        CONSTRAINT athlete_profiles_bio_check         CHECK (length(bio) <= 1000)
      );

      CREATE TABLE athlete_skills (
        id         TEXT PRIMARY KEY,
        athlete_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        position   INTEGER NOT NULL,
        name       TEXT NOT NULL,
        CONSTRAINT athlete_skills_position_key UNIQUE (athlete_id, position),
        CONSTRAINT athlete_skills_name_check CHECK (length(btrim(name)) BETWEEN 1 AND 60)
      );

      CREATE TABLE athlete_achievements (
        id         TEXT PRIMARY KEY,
        athlete_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        position   INTEGER NOT NULL,
        title      TEXT NOT NULL,
        year       TEXT NOT NULL DEFAULT '',
        CONSTRAINT athlete_achievements_position_key UNIQUE (athlete_id, position),
        CONSTRAINT athlete_achievements_title_check CHECK (length(btrim(title)) BETWEEN 1 AND 160)
      );

      -- Logged performance records. "skill" + "score" (0-100) are optional; when present they feed
      -- the coach's Team Performance Snapshot (average score per skill, and change vs the 30 days before).
      CREATE TABLE athlete_records (
        id          TEXT PRIMARY KEY,
        athlete_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        label       TEXT NOT NULL,
        value       TEXT NOT NULL,
        skill       TEXT,
        score       NUMERIC(5,2),
        recorded_on DATE NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL,
        CONSTRAINT athlete_records_label_check CHECK (length(btrim(label)) BETWEEN 1 AND 80),
        CONSTRAINT athlete_records_value_check CHECK (length(btrim(value)) BETWEEN 1 AND 40),
        CONSTRAINT athlete_records_score_check CHECK (score IS NULL OR score BETWEEN 0 AND 100)
      );
      CREATE INDEX idx_athlete_records_athlete ON athlete_records (athlete_id, recorded_on DESC);

      -- Recruitment: a coach's shortlist, inquiries to athletes, the messages between them, and
      -- athletes who applied to a coach's program. The dashboard reads these.
      CREATE TABLE coach_shortlist (
        coach_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        athlete_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL,
        PRIMARY KEY (coach_id, athlete_id),
        CONSTRAINT coach_shortlist_distinct_check CHECK (coach_id <> athlete_id)
      );

      CREATE TABLE recruitment_inquiries (
        id         TEXT PRIMARY KEY,
        coach_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        athlete_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status     TEXT NOT NULL DEFAULT 'awaiting',
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        CONSTRAINT recruitment_inquiries_status_check CHECK (status IN ('awaiting', 'replied', 'accepted', 'declined')),
        CONSTRAINT recruitment_inquiries_distinct_check CHECK (coach_id <> athlete_id)
      );
      CREATE INDEX idx_recruitment_inquiries_coach ON recruitment_inquiries (coach_id, status);

      CREATE TABLE coach_messages (
        id         TEXT PRIMARY KEY,
        coach_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        athlete_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        sender_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        body       TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        read_at    TIMESTAMPTZ,
        CONSTRAINT coach_messages_sender_check CHECK (sender_id IN (coach_id, athlete_id)),
        CONSTRAINT coach_messages_body_check CHECK (length(btrim(body)) BETWEEN 1 AND 2000)
      );
      CREATE INDEX idx_coach_messages_thread ON coach_messages (coach_id, athlete_id, created_at DESC);

      CREATE TABLE athlete_applications (
        id         TEXT PRIMARY KEY,
        coach_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        athlete_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status     TEXT NOT NULL DEFAULT 'new',
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        CONSTRAINT athlete_applications_status_check CHECK (status IN ('new', 'reviewed', 'dismissed')),
        CONSTRAINT athlete_applications_distinct_check CHECK (coach_id <> athlete_id),
        CONSTRAINT athlete_applications_pair_key UNIQUE (coach_id, athlete_id)
      );
    `
  },
  {
    version: 5,
    name: "coach_profile_and_verification",
    sql: `
      -- The rest of the coach profile form. organization, coaching_position and sport_specialization
      -- already exist from sign up; names live in user_profiles and the email in users.
      ALTER TABLE coach_profiles
        ADD COLUMN organization_type     TEXT NOT NULL DEFAULT '',
        ADD COLUMN organization_location TEXT NOT NULL DEFAULT '',
        ADD COLUMN program_name          TEXT NOT NULL DEFAULT '',
        ADD COLUMN competition_level     TEXT NOT NULL DEFAULT '',
        ADD COLUMN years_experience      TEXT NOT NULL DEFAULT '',
        ADD COLUMN background            TEXT NOT NULL DEFAULT '',
        ADD COLUMN certifications        TEXT NOT NULL DEFAULT '',
        ADD COLUMN official_email        TEXT NOT NULL DEFAULT '',
        ADD COLUMN credential_type       TEXT NOT NULL DEFAULT '',
        ADD COLUMN credential_reference  TEXT NOT NULL DEFAULT '';

      -- One row per coach who has asked to be verified. The coach sends the request; only a reviewer
      -- (permission coaches:review) can approve or reject it. The credential details are copied in
      -- when the request is sent, so the reviewer judges exactly what was submitted even if the
      -- coach edits their profile afterwards. A coach with NO row has not asked yet.
      CREATE TABLE coach_verifications (
        coach_id             TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        status               TEXT NOT NULL DEFAULT 'pending',
        organization         TEXT NOT NULL,
        official_email       TEXT NOT NULL,
        credential_type      TEXT NOT NULL,
        credential_reference TEXT NOT NULL,
        submitted_at         TIMESTAMPTZ NOT NULL,
        reviewed_at          TIMESTAMPTZ,
        reviewed_by          TEXT REFERENCES users(id) ON DELETE SET NULL,
        review_note          TEXT NOT NULL DEFAULT '',
        updated_at           TIMESTAMPTZ NOT NULL,
        CONSTRAINT coach_verifications_status_check CHECK (status IN ('pending', 'verified', 'rejected')),
        CONSTRAINT coach_verifications_reviewed_check CHECK ((status = 'pending') = (reviewed_at IS NULL)),
        CONSTRAINT coach_verifications_note_check CHECK (length(review_note) <= 500)
      );
      CREATE INDEX idx_coach_verifications_status ON coach_verifications (status, submitted_at);

      -- Approval grants this role; rejecting or revoking removes it. It carries 'sessions:verify',
      -- which is what the connections API already reads as "verified coach".
      INSERT INTO roles (name, description) VALUES ('verified_coach', 'Coach whose organization Sportal has verified');
      INSERT INTO permissions (name, description) VALUES ('coaches:review', 'Review, approve and reject coach verification requests');
      INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.id, p.id FROM roles r JOIN permissions p ON p.name = 'sessions:verify' WHERE r.name = 'verified_coach';
      INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.id, p.id FROM roles r JOIN permissions p ON p.name = 'coaches:review' WHERE r.name = 'admin';
    `
  },
  {
    version: 6,
    name: "athlete_profile_extras_and_sessions",
    sql: `
      -- The rest of what the Settings / Complete Profile forms hold. sport, playing_position, school and
      -- bio already exist; names live in user_profiles; achievements in athlete_achievements.
      -- municipality / province are set by the platform (Rankings location filters), not by the athlete.
      ALTER TABLE athlete_profiles
        ADD COLUMN year_level   TEXT NOT NULL DEFAULT '',
        ADD COLUMN height_cm    NUMERIC(5,1),
        ADD COLUMN weight_kg    NUMERIC(5,1),
        ADD COLUMN team_status  TEXT NOT NULL DEFAULT '',
        ADD COLUMN team_name    TEXT NOT NULL DEFAULT '',
        ADD COLUMN municipality TEXT NOT NULL DEFAULT '',
        ADD COLUMN province     TEXT NOT NULL DEFAULT '',
        ADD CONSTRAINT athlete_profiles_height_check CHECK (height_cm IS NULL OR height_cm BETWEEN 120 AND 230),
        ADD CONSTRAINT athlete_profiles_weight_check CHECK (weight_kg IS NULL OR weight_kg BETWEEN 30 AND 200),
        ADD CONSTRAINT athlete_profiles_team_status_check
          CHECK (team_status IN ('', 'Varsity', 'Junior Varsity', 'Reserve', 'Club / Community', 'Not on a team'));

      -- Scholarship interests and the profile showcase (photo + highlight video link).
      -- Photos are small resized images stored inline (the form caps them at ~400 KB); there is no
      -- moderation service yet, so 'approved' means "passed the format and size checks".
      CREATE TABLE athlete_extras (
        user_id      TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        universities TEXT[] NOT NULL DEFAULT '{}',
        coverage     TEXT NOT NULL DEFAULT '',
        course       TEXT NOT NULL DEFAULT '',
        photo_data   TEXT,
        photo_status TEXT,
        video_url    TEXT,
        video_status TEXT,
        updated_at   TIMESTAMPTZ NOT NULL,
        CONSTRAINT athlete_extras_coverage_check CHECK (coverage IN ('', 'Full tuition', 'Partial tuition', 'Stipend / allowance', 'Open to any')),
        CONSTRAINT athlete_extras_course_check CHECK (length(course) <= 80),
        CONSTRAINT athlete_extras_photo_check CHECK ((photo_data IS NULL) = (photo_status IS NULL) AND (photo_data IS NULL OR length(photo_data) <= 400000)),
        CONSTRAINT athlete_extras_video_check CHECK ((video_url IS NULL) = (video_status IS NULL) AND (video_url IS NULL OR length(video_url) <= 300)),
        CONSTRAINT athlete_extras_photo_status_check CHECK (photo_status IS NULL OR photo_status IN ('approved', 'pending', 'rejected')),
        CONSTRAINT athlete_extras_video_status_check CHECK (video_status IS NULL OR video_status IN ('approved', 'pending', 'rejected'))
      );

      -- Practice sessions. The server decides the status: a new session can be ai_assessed,
      -- self_reported or pending_review, never coach_verified. Only a verified coach who is connected
      -- to the athlete can move a session to coach_verified, and the row then names that coach.
      CREATE TABLE practice_sessions (
        id            TEXT PRIMARY KEY,
        athlete_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        skill         TEXT NOT NULL,
        result        NUMERIC(6,2) NOT NULL,
        consistency   NUMERIC(5,2),
        status        TEXT NOT NULL,
        simulated     BOOLEAN NOT NULL DEFAULT FALSE,
        session_date  DATE NOT NULL,
        verified_by   TEXT REFERENCES users(id) ON DELETE SET NULL,
        verified_at   TIMESTAMPTZ,
        created_at    TIMESTAMPTZ NOT NULL,
        CONSTRAINT practice_sessions_status_check CHECK (status IN ('ai_assessed', 'pending_review', 'self_reported', 'coach_verified')),
        CONSTRAINT practice_sessions_result_check CHECK (result >= 0 AND result <= 300),
        CONSTRAINT practice_sessions_consistency_check CHECK (consistency IS NULL OR consistency BETWEEN 0 AND 100),
        CONSTRAINT practice_sessions_verified_check CHECK ((status = 'coach_verified') = (verified_at IS NOT NULL))
      );
      CREATE INDEX idx_practice_sessions_athlete ON practice_sessions (athlete_id, session_date DESC, created_at DESC);
      CREATE INDEX idx_practice_sessions_status ON practice_sessions (status) WHERE status = 'pending_review';
    `
  },
  {
    version: 7,
    name: "scholarships_and_notifications",
    sql: `
      -- Scholarships posted by a university representative (or an admin). Replaces the hardcoded list.
      CREATE TABLE scholarships (
        id          TEXT PRIMARY KEY,
        posted_by   TEXT REFERENCES users(id) ON DELETE SET NULL,
        university  TEXT NOT NULL,
        name        TEXT NOT NULL,
        sport       TEXT NOT NULL,
        coverage    TEXT NOT NULL DEFAULT '',
        details     TEXT NOT NULL DEFAULT '',
        eligibility JSONB NOT NULL DEFAULT '[]'::jsonb,
        deadline    DATE NOT NULL,
        is_open     BOOLEAN NOT NULL DEFAULT TRUE,
        created_at  TIMESTAMPTZ NOT NULL,
        updated_at  TIMESTAMPTZ NOT NULL,
        CONSTRAINT scholarships_name_check CHECK (length(btrim(name)) BETWEEN 3 AND 120),
        CONSTRAINT scholarships_university_check CHECK (length(btrim(university)) BETWEEN 2 AND 120),
        CONSTRAINT scholarships_details_check CHECK (length(details) <= 2000)
      );
      CREATE INDEX idx_scholarships_open ON scholarships (is_open, deadline);
      CREATE INDEX idx_scholarships_sport ON scholarships (lower(sport));

      -- One application per athlete per scholarship. Withdrawing keeps the row so history survives.
      CREATE TABLE scholarship_applications (
        id             TEXT PRIMARY KEY,
        scholarship_id TEXT NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
        athlete_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status         TEXT NOT NULL DEFAULT 'submitted',
        created_at     TIMESTAMPTZ NOT NULL,
        updated_at     TIMESTAMPTZ NOT NULL,
        CONSTRAINT scholarship_applications_status_check CHECK (status IN ('submitted', 'under_review', 'accepted', 'rejected', 'withdrawn')),
        CONSTRAINT scholarship_applications_pair_key UNIQUE (scholarship_id, athlete_id)
      );
      CREATE INDEX idx_scholarship_applications_athlete ON scholarship_applications (athlete_id, created_at DESC);

      -- In-app notifications. Rows are created by the server when something happens, never by a client.
      CREATE TABLE notifications (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category   TEXT NOT NULL,
        title      TEXT NOT NULL,
        message    TEXT NOT NULL,
        link       TEXT,
        created_at TIMESTAMPTZ NOT NULL,
        read_at    TIMESTAMPTZ,
        CONSTRAINT notifications_category_check CHECK (category IN ('analysis', 'ranking', 'recruitment', 'scholarship', 'application', 'verification', 'connection', 'system'))
      );
      CREATE INDEX idx_notifications_user ON notifications (user_id, created_at DESC);
      CREATE INDEX idx_notifications_unread ON notifications (user_id) WHERE read_at IS NULL;
    `
  },
  {
    version: 8,
    name: "athlete_showcase_visibility",
    sql: `
      -- An athlete can hide themselves from public rankings (and, later, from the recruiting directory).
      -- New and existing athletes are visible by default, which is how rankings behaved before.
      ALTER TABLE athlete_profiles ADD COLUMN showcase_visible BOOLEAN NOT NULL DEFAULT TRUE;
    `
  },
  {
    version: 9,
    name: "recruiting_inquiries_notes_and_threads",
    sql: `
      -- An inquiry now carries what the coach wrote and which program they wrote for.
      ALTER TABLE recruitment_inquiries
        ADD COLUMN organization TEXT NOT NULL DEFAULT '',
        ADD COLUMN message      TEXT NOT NULL DEFAULT '',
        ADD COLUMN responded_at TIMESTAMPTZ,
        ADD CONSTRAINT recruitment_inquiries_message_check CHECK (length(message) <= 1000),
        ADD CONSTRAINT recruitment_inquiries_organization_check CHECK (length(organization) <= 120);

      -- A coach's private note on a shortlisted athlete (the watchlist).
      ALTER TABLE coach_shortlist
        ADD COLUMN note TEXT NOT NULL DEFAULT '',
        ADD CONSTRAINT coach_shortlist_note_check CHECK (length(note) <= 500);

      -- Messages belong to an inquiry, so each inquiry is its own conversation. Older messages
      -- (no inquiry) keep working on the coach dashboard.
      ALTER TABLE coach_messages ADD COLUMN inquiry_id TEXT REFERENCES recruitment_inquiries(id) ON DELETE CASCADE;
      CREATE INDEX idx_coach_messages_inquiry ON coach_messages (inquiry_id, created_at);
      CREATE INDEX idx_recruitment_inquiries_athlete ON recruitment_inquiries (athlete_id, updated_at DESC);
    `
  },
  {
    version: 10,
    name: "athlete_ranking_category",
    sql: `
      -- The ranking category an athlete competes in (the Rankings page filters on it). Chosen by the
      -- athlete; empty means not chosen.
      ALTER TABLE athlete_profiles
        ADD COLUMN category TEXT NOT NULL DEFAULT '',
        ADD CONSTRAINT athlete_profiles_category_check CHECK (category IN ('', 'Men''s Collegiate', 'Women''s Collegiate', 'Juniors'));
    `
  },
  {
    version: 11,
    name: "universities_and_coach_affiliation",
    sql: `
      -- A university as an entity: the details the My University page shows. Before this, a university
      -- existed only as free text typed into profiles. The name is matched without case or edge
      -- spaces (name_key), so "Ateneo " and "ateneo" are one university.
      CREATE TABLE universities (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL,
        name_key    TEXT NOT NULL UNIQUE,
        logo_url    TEXT NOT NULL DEFAULT '',
        location    TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        website     TEXT NOT NULL DEFAULT '',
        created_at  TIMESTAMPTZ NOT NULL,
        updated_at  TIMESTAMPTZ NOT NULL,
        CONSTRAINT universities_name_check CHECK (length(btrim(name)) BETWEEN 2 AND 120),
        CONSTRAINT universities_location_check CHECK (length(location) <= 200),
        CONSTRAINT universities_description_check CHECK (length(description) <= 2000),
        CONSTRAINT universities_logo_check CHECK (logo_url = '' OR (logo_url ~* '^https?://' AND length(logo_url) <= 500)),
        CONSTRAINT universities_website_check CHECK (website = '' OR (website ~* '^https?://' AND length(website) <= 300))
      );

      -- A coach's OFFICIAL university. It is set when a reviewer approves the coach's verification (using
      -- the organization the reviewer actually saw) and cleared if the approval is withdrawn, so it is
      -- never just something a coach typed. NULL = no university (or not approved).
      ALTER TABLE coach_profiles ADD COLUMN university_id TEXT REFERENCES universities(id) ON DELETE SET NULL;
      CREATE INDEX idx_coach_profiles_university ON coach_profiles (university_id) WHERE university_id IS NOT NULL;

      -- backfill start: coaches who were approved before this existed
      INSERT INTO universities (id, name, name_key, location, created_at, updated_at)
      SELECT md5(random()::text || clock_timestamp()::text || lower(btrim(v.organization))),
             MIN(btrim(v.organization)), lower(btrim(v.organization)),
             COALESCE(MAX(NULLIF(left(btrim(cp.organization_location), 200), '')), ''), now(), now()
      FROM coach_verifications v
      JOIN coach_profiles cp ON cp.user_id = v.coach_id
      WHERE v.status = 'verified' AND cp.organization_type IN ('University', 'College')
        AND length(btrim(v.organization)) BETWEEN 2 AND 120
      GROUP BY lower(btrim(v.organization))
      ON CONFLICT (name_key) DO NOTHING;

      UPDATE coach_profiles cp SET university_id = u.id
      FROM coach_verifications v JOIN universities u ON u.name_key = lower(btrim(v.organization))
      WHERE v.coach_id = cp.user_id AND v.status = 'verified' AND cp.organization_type IN ('University', 'College');
      -- backfill end
    `
  }
];
var MIGRATION_LOCK_ID = 727274001;
async function migrate(db) {
  await db.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(${MIGRATION_LOCK_ID})`;
    await tx.unsafe(`CREATE TABLE IF NOT EXISTS schema_migrations (
      version    INTEGER PRIMARY KEY,
      name       TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL
    )`);
    const rows = await tx`SELECT version FROM schema_migrations`;
    const applied = new Set(rows.map((r) => r.version));
    for (const m of MIGRATIONS) {
      if (applied.has(m.version)) continue;
      await tx.unsafe(m.sql);
      await tx`INSERT INTO schema_migrations (version, name, applied_at) VALUES (${m.version}, ${m.name}, ${/* @__PURE__ */ new Date()})`;
    }
  });
}
function connectionString() {
  const url = process.env["DATABASE_URL"] || process.env["POSTGRES_URL"];
  if (!url) {
    throw new Error("DATABASE_URL is not set. Add your Postgres connection string (see .env.example).");
  }
  return url;
}
async function openDatabase(url) {
  const db = src_default(url, {
    // Serverless: keep the pool tiny, since every warm instance holds its own connections.
    max: Number(process.env["DB_POOL_MAX"] ?? 3),
    idle_timeout: 20,
    connect_timeout: 10,
    // Required behind PgBouncer-style poolers (Neon's pooled URL, Supabase's pooler).
    prepare: false,
    // Postgres returns timestamptz as Date objects and bigint as strings; keep it that way.
    onnotice: () => {
    }
  });
  try {
    await migrate(db);
  } catch (err) {
    await db.end({ timeout: 1 }).catch(() => {
    });
    throw err;
  }
  return db;
}
var globalKey = /* @__PURE__ */ Symbol.for("sportal.db");
function getDb() {
  const g = globalThis;
  if (!g[globalKey]) {
    const p2 = openDatabase(connectionString());
    p2.catch(() => {
      if (g[globalKey] === p2) delete g[globalKey];
    });
    g[globalKey] = p2;
  }
  return g[globalKey];
}

// server/password.server.ts
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
var PARAMS = { N: 65536, r: 8, p: 2 };
var KEY_LEN = 32;
var SALT_LEN = 16;
var MAX_PASSWORD_LENGTH = 128;
function derive(password2, salt, N2, r, p2) {
  const opts = { N: N2, r, p: p2, maxmem: 256 * N2 * r };
  return new Promise((resolve2, reject) => {
    scrypt(
      password2.normalize("NFKC"),
      salt,
      KEY_LEN,
      opts,
      (err, key2) => err ? reject(err) : resolve2(key2)
    );
  });
}
async function hashPassword(password2) {
  const salt = randomBytes(SALT_LEN);
  const key2 = await derive(password2, salt, PARAMS.N, PARAMS.r, PARAMS.p);
  return `scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt.toString("base64")}$${key2.toString("base64")}`;
}
async function verifyPassword(password2, stored) {
  if (password2.length > MAX_PASSWORD_LENGTH) return false;
  const parts2 = stored.split("$");
  if (parts2.length !== 6 || parts2[0] !== "scrypt") return false;
  const [, nS, rS, pS, saltB64, hashB64] = parts2;
  const N2 = Number(nS);
  const r = Number(rS);
  const p2 = Number(pS);
  if (!Number.isInteger(N2) || !Number.isInteger(r) || !Number.isInteger(p2)) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = await derive(password2, Buffer.from(saltB64, "base64"), N2, r, p2);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
function needsRehash(stored) {
  const parts2 = stored.split("$");
  return !(parts2[0] === "scrypt" && Number(parts2[1]) === PARAMS.N && Number(parts2[2]) === PARAMS.r && Number(parts2[3]) === PARAMS.p);
}
var dummyHash;
async function burnPasswordCheck(password2) {
  dummyHash ??= hashPassword(randomBytes(16).toString("hex"));
  await verifyPassword(password2, await dummyHash);
}
var PASSWORD_RULES = { min: 10, max: MAX_PASSWORD_LENGTH };
function checkPasswordStrength(password2) {
  if (password2.length < PASSWORD_RULES.min)
    return `Password must be at least ${PASSWORD_RULES.min} characters.`;
  if (password2.length > PASSWORD_RULES.max)
    return `Password must be at most ${PASSWORD_RULES.max} characters.`;
  if (!/[a-zA-Z]/.test(password2) || !/[0-9]/.test(password2))
    return "Password must contain both letters and numbers.";
  return null;
}

// server/admin-config.server.ts
var ADMIN_PASSWORD_MIN = 12;
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
var USERNAME_RE = /^[a-zA-Z0-9_.-]{3,32}$/;
function readAdminConfig(env = process.env) {
  const email = env["ADMIN_EMAIL"]?.trim().toLowerCase() ?? "";
  const password2 = env["ADMIN_PASSWORD"] ?? "";
  if (!email && !password2) return { state: "not_configured" };
  if (!email) return { state: "invalid", problem: "ADMIN_EMAIL is not set." };
  if (!password2) return { state: "invalid", problem: "ADMIN_PASSWORD is not set." };
  if (email.length > 254 || !EMAIL_RE.test(email)) return { state: "invalid", problem: "ADMIN_EMAIL is not a valid email address." };
  if (password2.length < ADMIN_PASSWORD_MIN)
    return { state: "invalid", problem: `ADMIN_PASSWORD must be at least ${ADMIN_PASSWORD_MIN} characters.` };
  const weak = checkPasswordStrength(password2);
  if (weak) return { state: "invalid", problem: `ADMIN_PASSWORD: ${weak}` };
  const username = env["ADMIN_USERNAME"]?.trim() || "admin";
  if (!USERNAME_RE.test(username))
    return { state: "invalid", problem: "ADMIN_USERNAME must be 3-32 characters: letters, numbers, dot, dash or underscore." };
  const displayName = (env["ADMIN_DISPLAY_NAME"]?.trim() || "Sportal Administrator").slice(0, 80);
  return { state: "ready", config: { email, username, displayName, password: password2 } };
}
function isConfiguredAdminEmail(email, env = process.env) {
  const r = readAdminConfig(env);
  return r.state === "ready" && r.config.email === email.trim().toLowerCase();
}

// server/auth.server.ts
var SESSION_TTL_MS = 12 * 60 * 60 * 1e3;
var REMEMBER_TTL_MS = 30 * 24 * 60 * 60 * 1e3;
var ADMIN_SESSION_TTL_MS = 4 * 60 * 60 * 1e3;
var RATE_LIMIT = {
  windowMs: 15 * 60 * 1e3,
  maxFailuresPerIdentifier: 5,
  maxFailuresPerIp: 25
};
var SIGNUP_LIMIT = { windowMs: 60 * 60 * 1e3, max: 5 };
var now2 = () => /* @__PURE__ */ new Date();
var sha2562 = (s) => createHash("sha256").update(s).digest("hex");
function normalizeIdentifier(raw) {
  return raw.trim().toLowerCase().slice(0, 254);
}
async function audit(event, fields = {}, db) {
  const sql = db ?? await getDb();
  await sql`
    INSERT INTO audit_log (user_id, event, identifier, ip, user_agent, detail, created_at)
    VALUES (${fields.userId ?? null}, ${event}, ${fields.identifier ?? null}, ${fields.ip ?? null},
            ${fields.userAgent?.slice(0, 300) ?? null}, ${fields.detail ? JSON.stringify(fields.detail) : null}, ${now2()})`;
}
async function loadAccess(db, userId) {
  const roles = await db`
    SELECT r.name FROM user_roles ur JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = ${userId} ORDER BY r.name`;
  const perms = await db`
    SELECT DISTINCT p.name FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = ${userId} ORDER BY p.name`;
  return { roles: roles.map((r) => r.name), permissions: perms.map((p2) => p2.name) };
}
async function toPublicUser(db, row) {
  const [profile] = await db`
    SELECT first_name, last_name FROM user_profiles WHERE user_id = ${row.id}`;
  const firstName = profile?.first_name?.trim();
  const lastName = profile?.last_name?.trim();
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    displayName: row.display_name,
    ...firstName ? { firstName } : {},
    ...lastName ? { lastName } : {},
    ...await loadAccess(db, row.id)
  };
}
var EMAIL_RE2 = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
var USERNAME_RE2 = /^[a-zA-Z0-9_.-]{3,32}$/;
var UserInputError = class extends Error {
  /** which form field the message is about, when it is about one */
  field;
  constructor(message, field2) {
    super(message);
    this.field = field2;
  }
};
var ROLE_ALIASES = { athlete: "student_athlete" };
function uniqueViolation(err, indexName) {
  if (typeof err !== "object" || err === null) return false;
  const e = err;
  return e.code === "23505" && e.constraint_name === indexName;
}
async function createUser(input, dbArg) {
  const db = dbArg ?? await getDb();
  const email = input.email.trim().toLowerCase();
  const username = input.username.trim();
  if (email.length > 254 || !EMAIL_RE2.test(email)) throw new UserInputError("Enter a valid email address.");
  if (!USERNAME_RE2.test(username))
    throw new UserInputError("Username must be 3-32 characters: letters, numbers, dot, dash or underscore.");
  const pwError = checkPasswordStrength(input.password);
  if (pwError) throw new UserInputError(pwError, "password");
  const displayName = (input.displayName?.trim() || username).slice(0, 80);
  const roleNames = (input.roles?.length ? input.roles : ["student_athlete"]).map((r) => ROLE_ALIASES[r] ?? r);
  if (roleNames.includes("admin"))
    throw new UserInputError("The administrator account is configured through ADMIN_EMAIL and ADMIN_PASSWORD, not created here.");
  const roleIds = [];
  for (const name2 of roleNames) {
    const [row] = await db`SELECT id FROM roles WHERE name = ${name2}`;
    if (!row) throw new UserInputError(`Unknown role "${name2}".`);
    roleIds.push(row.id);
  }
  const [emailTaken] = await db`SELECT 1 AS x FROM users WHERE lower(email) = ${email}`;
  if (emailTaken) throw new UserInputError("An account with this email is already registered.", "email");
  const [nameTaken] = await db`SELECT 1 AS x FROM users WHERE lower(username) = ${username.toLowerCase()}`;
  if (nameTaken) throw new UserInputError("That username is already taken.", "username");
  const passwordHash = await hashPassword(input.password);
  const id = randomUUID();
  const ts = now2();
  try {
    await db.begin(async (tx) => {
      await tx`
        INSERT INTO users (id, email, username, password_hash, display_name, password_changed_at, created_at, updated_at)
        VALUES (${id}, ${email}, ${username}, ${passwordHash}, ${displayName}, ${ts}, ${ts}, ${ts})`;
      await tx`
        INSERT INTO user_profiles (user_id, first_name, last_name, updated_at)
        VALUES (${id}, ${input.firstName?.trim() || null}, ${input.lastName?.trim() || null}, ${ts})`;
      for (const roleId of roleIds) {
        await tx`INSERT INTO user_roles (user_id, role_id, granted_at) VALUES (${id}, ${roleId}, ${ts})`;
      }
      const d2 = input.details;
      if (d2?.kind === "coach") {
        await tx`
          INSERT INTO coach_profiles (user_id, organization, coaching_position, sport_specialization, created_at, updated_at)
          VALUES (${id}, ${d2.organization.trim()}, ${d2.coachingPosition.trim()}, ${d2.sportSpecialization.trim()}, ${ts}, ${ts})`;
      } else if (d2?.kind === "university_representative") {
        await tx`
          INSERT INTO university_representative_profiles (user_id, university_name, designation, created_at, updated_at)
          VALUES (${id}, ${d2.universityName.trim()}, ${d2.designation.trim()}, ${ts}, ${ts})`;
      }
    });
  } catch (err) {
    if (uniqueViolation(err, "users_email_key"))
      throw new UserInputError("An account with this email is already registered.", "email");
    if (uniqueViolation(err, "users_username_key"))
      throw new UserInputError("That username is already taken.", "username");
    throw err;
  }
  await audit("user.created", { userId: id, detail: { roles: roleNames } }, db);
  return toPublicUser(db, { id, email, username, display_name: displayName });
}
async function deriveUsername(email, dbArg) {
  const db = dbArg ?? await getDb();
  const clean3 = email.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "_").slice(0, 32);
  const base = clean3.length >= 3 ? clean3 : `${clean3}___`.slice(0, 3);
  const taken = async (u) => {
    const [row] = await db`SELECT 1 AS x FROM users WHERE lower(username) = ${u.toLowerCase()}`;
    return !!row;
  };
  if (!await taken(base)) return base;
  for (let i = 0; i < 20; i++) {
    const suffix = `-${randomBytes2(3).toString("hex")}`;
    const candidate = `${base.slice(0, 32 - suffix.length)}${suffix}`;
    if (!await taken(candidate)) return candidate;
  }
  throw new UserInputError("Could not create a username. Try a different email.", "email");
}
async function checkRateLimit(db, identifier, ip) {
  const since = new Date(Date.now() - RATE_LIMIT.windowMs);
  const [byId] = await db`
    SELECT COUNT(*)::int AS n, MIN(created_at) AS oldest FROM login_attempts
    WHERE identifier = ${identifier} AND success = FALSE AND created_at > ${since}`;
  const byIp = ip ? (await db`
          SELECT COUNT(*)::int AS n, MIN(created_at) AS oldest FROM login_attempts
          WHERE ip = ${ip} AND success = FALSE AND created_at > ${since}`)[0] : void 0;
  const hits = [
    byId && byId.n >= RATE_LIMIT.maxFailuresPerIdentifier ? byId.oldest : null,
    byIp && byIp.n >= RATE_LIMIT.maxFailuresPerIp ? byIp.oldest : null
  ].filter((x) => x !== null);
  if (hits.length === 0) return null;
  const unlockAt = Math.max(...hits.map((o) => o.getTime() + RATE_LIMIT.windowMs));
  return Math.max(1, Math.ceil((unlockAt - Date.now()) / 1e3));
}
async function recordAttempt(db, identifier, ip, success) {
  await db`INSERT INTO login_attempts (identifier, ip, success, created_at) VALUES (${identifier}, ${ip}, ${success}, ${now2()})`;
}
async function signupAllowed(ip, dbArg) {
  const db = dbArg ?? await getDb();
  const key2 = ip ?? "unknown";
  const max2 = ip ? SIGNUP_LIMIT.max : SIGNUP_LIMIT.max * 4;
  const since = new Date(Date.now() - SIGNUP_LIMIT.windowMs);
  const [row] = await db`
    SELECT COUNT(*)::int AS n FROM signup_attempts WHERE ip = ${key2} AND created_at > ${since}`;
  if ((row?.n ?? 0) >= max2) return false;
  await db`INSERT INTO signup_attempts (ip, created_at) VALUES (${key2}, ${now2()})`;
  return true;
}
async function housekeeping(db) {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1e3);
  await db`DELETE FROM login_attempts WHERE created_at < ${cutoff}`;
  await db`DELETE FROM signup_attempts WHERE created_at < ${cutoff}`;
  await db`DELETE FROM sessions WHERE expires_at < ${now2()} OR revoked_at IS NOT NULL`;
}
async function createSession(userId, remember, meta, dbArg, ttlMs) {
  const db = dbArg ?? await getDb();
  const token = randomBytes2(32).toString("base64url");
  const ts = now2();
  const expiresAt = new Date(Date.now() + (ttlMs ?? (remember ? REMEMBER_TTL_MS : SESSION_TTL_MS)));
  await db`
    INSERT INTO sessions (token_hash, user_id, created_at, last_seen_at, expires_at, remember, ip, user_agent)
    VALUES (${sha2562(token)}, ${userId}, ${ts}, ${ts}, ${expiresAt}, ${remember}, ${meta.ip}, ${meta.userAgent?.slice(0, 300) ?? null})`;
  return { token, expiresAt };
}
async function getUserBySessionToken(token, dbArg) {
  if (!token || token.length > 200) return null;
  const db = dbArg ?? await getDb();
  const [row] = await db`
    SELECT u.id, u.email, u.username, u.display_name, s.last_seen_at
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ${sha2562(token)} AND s.revoked_at IS NULL AND s.expires_at > ${now2()}
      AND u.is_active = TRUE AND u.deleted_at IS NULL`;
  if (!row) return null;
  if (Date.now() - row.last_seen_at.getTime() > 6e4) {
    await db`UPDATE sessions SET last_seen_at = ${now2()} WHERE token_hash = ${sha2562(token)}`;
  }
  return toPublicUser(db, row);
}
async function destroySession(token, meta, dbArg) {
  if (!token) return;
  const db = dbArg ?? await getDb();
  const [row] = await db`DELETE FROM sessions WHERE token_hash = ${sha2562(token)} RETURNING user_id`;
  if (row) await audit("logout", { userId: row.user_id, ...meta }, db);
}
async function authenticate(input, meta, dbArg) {
  const db = dbArg ?? await getDb();
  const scope = input.scope ?? "user";
  const identifier = normalizeIdentifier(input.identifier);
  const bucket = scope === "admin" ? `admin:${identifier}` : identifier;
  const failEvent = scope === "admin" ? "admin.login.failed" : "login.failed";
  await housekeeping(db);
  const retryAfterSec = await checkRateLimit(db, bucket, meta.ip);
  if (retryAfterSec !== null) {
    await audit(scope === "admin" ? "admin.login.blocked" : "login.blocked", { identifier, ...meta }, db);
    return { ok: false, code: "rate_limited", retryAfterSec };
  }
  const [user] = await db`
    SELECT id, email, username, display_name, password_hash, is_active FROM users
    WHERE (lower(email) = ${identifier} OR lower(username) = ${identifier}) AND deleted_at IS NULL`;
  if (!user) {
    await burnPasswordCheck(input.password);
    await recordAttempt(db, bucket, meta.ip, false);
    await audit(failEvent, { identifier, ...meta, detail: { reason: "unknown_account" } }, db);
    return { ok: false, code: "invalid_credentials" };
  }
  const passwordOk = await verifyPassword(input.password, user.password_hash);
  if (!passwordOk) {
    await recordAttempt(db, bucket, meta.ip, false);
    await audit(failEvent, { userId: user.id, identifier, ...meta, detail: { reason: "bad_password" } }, db);
    return { ok: false, code: "invalid_credentials" };
  }
  const access = await loadAccess(db, user.id);
  const isAdminAccount = access.roles.includes("admin");
  const wrongDoor = scope === "admin" ? !(isAdminAccount && isConfiguredAdminEmail(user.email)) : isAdminAccount;
  if (wrongDoor) {
    await recordAttempt(db, bucket, meta.ip, false);
    await audit(failEvent, { userId: user.id, identifier, ...meta, detail: { reason: scope === "admin" ? "not_the_administrator" : "administrator_on_user_login" } }, db);
    return { ok: false, code: "invalid_credentials" };
  }
  if (!user.is_active) {
    await audit(failEvent, { userId: user.id, identifier, ...meta, detail: { reason: "inactive" } }, db);
    return { ok: false, code: "inactive" };
  }
  if (needsRehash(user.password_hash)) {
    await db`UPDATE users SET password_hash = ${await hashPassword(input.password)}, updated_at = ${now2()} WHERE id = ${user.id}`;
  }
  const remember = scope === "admin" ? false : input.remember;
  await db`DELETE FROM login_attempts WHERE identifier = ${bucket} AND success = FALSE`;
  await recordAttempt(db, bucket, meta.ip, true);
  await db`UPDATE users SET last_login_at = ${now2()} WHERE id = ${user.id}`;
  const { token, expiresAt } = await createSession(user.id, remember, meta, db, scope === "admin" ? ADMIN_SESSION_TTL_MS : void 0);
  await audit(scope === "admin" ? "admin.login.success" : "login.success", { userId: user.id, identifier, ...meta, detail: { remember } }, db);
  return { ok: true, user: await toPublicUser(db, user), token, expiresAt, remember };
}

// server/connections.server.ts
import { randomUUID as randomUUID3 } from "node:crypto";

// server/notifications.server.ts
import { randomUUID as randomUUID2 } from "node:crypto";
var NOTIFICATION_CATEGORIES = [
  "analysis",
  "ranking",
  "recruitment",
  "scholarship",
  "application",
  "verification",
  "connection",
  "system"
];
var NOTIF_PAGE_DEFAULT = 30;
var NOTIF_PAGE_MAX = 100;
var NotificationError = class extends Error {
  httpStatus;
  code;
  constructor(httpStatus, code, message) {
    super(message);
    this.httpStatus = httpStatus;
    this.code = code;
  }
};
var toView = (r) => ({
  id: r.id,
  category: r.category,
  title: r.title,
  message: r.message,
  link: r.link,
  read: r.read_at !== null,
  createdAt: r.created_at.toISOString()
});
async function notify(userId, n, dbArg) {
  const db = dbArg ?? await getDb();
  await db`
    INSERT INTO notifications (id, user_id, category, title, message, link, created_at)
    VALUES (${randomUUID2()}, ${userId}, ${n.category}, ${n.title.slice(0, 120)}, ${n.message.slice(0, 500)},
            ${n.link ?? null}, ${/* @__PURE__ */ new Date()})`;
}
async function listNotifications(user, opts, dbArg) {
  const db = dbArg ?? await getDb();
  const category = opts.category && NOTIFICATION_CATEGORIES.includes(opts.category) ? opts.category : null;
  if (opts.category && !category) throw new NotificationError(400, "validation", "Unknown notification category.");
  const rows = await db`
    SELECT id, category, title, message, link, created_at, read_at
    FROM notifications
    WHERE user_id = ${user.id} ${category ? db`AND category = ${category}` : db``}
    ORDER BY created_at DESC, id
    LIMIT ${opts.limit} OFFSET ${opts.offset}`;
  const [counts] = await db`
    SELECT count(*) FILTER (WHERE ${category ? db`category = ${category}` : db`TRUE`}) AS total,
           count(*) FILTER (WHERE read_at IS NULL) AS unread
    FROM notifications WHERE user_id = ${user.id}`;
  return { items: rows.map(toView), total: Number(counts?.total ?? 0), unread: Number(counts?.unread ?? 0) };
}
async function unreadCount(user, dbArg) {
  const db = dbArg ?? await getDb();
  const [r] = await db`SELECT count(*) AS n FROM notifications WHERE user_id = ${user.id} AND read_at IS NULL`;
  return Number(r?.n ?? 0);
}
async function markRead(user, id, dbArg) {
  const db = dbArg ?? await getDb();
  const rows = await db`
    UPDATE notifications SET read_at = COALESCE(read_at, ${/* @__PURE__ */ new Date()})
    WHERE id = ${id} AND user_id = ${user.id}
    RETURNING id, category, title, message, link, created_at, read_at`;
  const row = rows[0];
  if (!row) throw new NotificationError(404, "not_found", "Notification not found.");
  return toView(row);
}
async function markAllRead(user, dbArg) {
  const db = dbArg ?? await getDb();
  const rows = await db`UPDATE notifications SET read_at = ${/* @__PURE__ */ new Date()} WHERE user_id = ${user.id} AND read_at IS NULL RETURNING id`;
  return rows.length;
}

// server/connections.server.ts
var COACH_ROLE = "coach";
var ATHLETE_ROLE = "student_athlete";
var COACH_VERIFIED_PERMISSION = "sessions:verify";
var PAGE_DEFAULT = 50;
var PAGE_MAX = 100;
var SEARCH_MIN_CHARS = 2;
var SEARCH_MAX_CHARS = 80;
var SEARCH_LIMIT_DEFAULT = 10;
var SEARCH_LIMIT_MAX = 20;
var ConnectionError = class extends Error {
  httpStatus;
  code;
  extra;
  constructor(httpStatus, code, message, extra) {
    super(message);
    this.httpStatus = httpStatus;
    this.code = code;
    this.extra = extra;
  }
};
var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var now3 = () => /* @__PURE__ */ new Date();
function hasRole(user, role) {
  return user.roles.includes(role);
}
function requireConnectionRole(user) {
  if (!hasRole(user, COACH_ROLE) && !hasRole(user, ATHLETE_ROLE))
    throw new ConnectionError(403, "role_not_allowed", "Only coaches and student-athletes can use connections.");
}
function requireId(id) {
  if (!UUID_RE.test(id)) throw new ConnectionError(404, "connection_not_found", "Connection not found.");
}
async function isVerifiedCoach(db, coachId) {
  const [row] = await db`
    SELECT EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN role_permissions rp ON rp.role_id = ur.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE ur.user_id = ${coachId} AND p.name = ${COACH_VERIFIED_PERMISSION}
    ) AS ok`;
  return row?.ok === true;
}
async function assertCoachVerified(db, coachId, actorIsCoach) {
  if (await isVerifiedCoach(db, coachId)) return;
  throw new ConnectionError(
    403,
    "coach_not_verified",
    actorIsCoach ? "Your coach account has not been verified yet." : "This coach has not been verified yet."
  );
}
async function findById(db, id) {
  const [row] = await db`SELECT * FROM coach_athlete_connections WHERE id = ${id}`;
  return row;
}
async function findPair(db, coachId, athleteId) {
  const [row] = await db`
    SELECT * FROM coach_athlete_connections WHERE coach_id = ${coachId} AND athlete_id = ${athleteId}`;
  return row;
}
async function loadForActor(db, id, actor) {
  requireId(id);
  const [row] = await db`
    SELECT * FROM coach_athlete_connections
    WHERE id = ${id} AND (coach_id = ${actor.id} OR athlete_id = ${actor.id})`;
  if (!row) throw new ConnectionError(404, "connection_not_found", "Connection not found.");
  const side = row.coach_id === actor.id ? "coach" : "athlete";
  if (!hasRole(actor, side === "coach" ? COACH_ROLE : ATHLETE_ROLE))
    throw new ConnectionError(403, "role_not_allowed", "Your account can't manage this connection.");
  return { row, side };
}
function baseSelect(db, me) {
  return db`
    SELECT c.id, c.coach_id, c.athlete_id, c.requested_by, c.status, c.requested_at, c.responded_at, c.updated_at,
           u.id AS other_id, u.display_name AS other_name,
           up.first_name, up.last_name,
           cp.organization, cp.coaching_position, cp.sport_specialization,
           EXISTS (
             SELECT 1 FROM user_roles ur
             JOIN role_permissions rp ON rp.role_id = ur.role_id
             JOIN permissions p ON p.id = rp.permission_id
             WHERE ur.user_id = c.coach_id AND p.name = ${COACH_VERIFIED_PERMISSION}
           ) AS coach_verified
    FROM coach_athlete_connections c
    JOIN users u ON u.id = CASE WHEN c.coach_id = ${me} THEN c.athlete_id ELSE c.coach_id END
    LEFT JOIN user_profiles up ON up.user_id = u.id
    LEFT JOIN coach_profiles cp ON cp.user_id = c.coach_id`;
}
function toView2(row, me) {
  const otherIsCoach = row.coach_id !== me;
  const counterpart = {
    id: row.other_id,
    displayName: row.other_name,
    ...row.first_name?.trim() ? { firstName: row.first_name.trim() } : {},
    ...row.last_name?.trim() ? { lastName: row.last_name.trim() } : {},
    role: otherIsCoach ? COACH_ROLE : ATHLETE_ROLE,
    ...otherIsCoach ? {
      coach: {
        organization: row.organization ?? "",
        position: row.coaching_position ?? "",
        sport: row.sport_specialization ?? "",
        verified: row.coach_verified
      }
    } : {}
  };
  return {
    id: row.id,
    status: row.status,
    requestedByMe: row.requested_by === me,
    requestedAt: row.requested_at.toISOString(),
    respondedAt: row.responded_at ? row.responded_at.toISOString() : null,
    updatedAt: row.updated_at.toISOString(),
    counterpart
  };
}
async function viewById(db, id, me) {
  const [row] = await db`${baseSelect(db, me)} WHERE c.id = ${id}`;
  if (!row) throw new ConnectionError(404, "connection_not_found", "Connection not found.");
  return toView2(row, me);
}
async function listConnections(actor, kind, paging = {}, dbArg) {
  requireConnectionRole(actor);
  const db = dbArg ?? await getDb();
  const me = actor.id;
  const limit3 = Math.min(Math.max(Math.trunc(paging.limit ?? PAGE_DEFAULT), 1), PAGE_MAX);
  const offset = Math.max(Math.trunc(paging.offset ?? 0), 0);
  const filter = kind === "incoming" ? db`c.status = 'pending' AND c.requested_by <> ${me}` : kind === "outgoing" ? db`c.status = 'pending' AND c.requested_by = ${me}` : db`c.status = 'accepted'`;
  const where = db`
    WHERE (c.coach_id = ${me} OR c.athlete_id = ${me}) AND ${filter}
      AND u.is_active = TRUE AND u.deleted_at IS NULL`;
  const order = kind === "accepted" ? db`ORDER BY c.responded_at DESC, c.id` : db`ORDER BY c.requested_at DESC, c.id`;
  const rows = await db`${baseSelect(db, me)} ${where} ${order} LIMIT ${limit3} OFFSET ${offset}`;
  const [count] = await db`
    SELECT COUNT(*)::int AS n
    FROM coach_athlete_connections c
    JOIN users u ON u.id = CASE WHEN c.coach_id = ${me} THEN c.athlete_id ELSE c.coach_id END
    ${where}`;
  return { items: rows.map((r) => toView2(r, me)), total: count?.n ?? 0, limit: limit3, offset };
}
function likeLiteral(text3) {
  return text3.replace(/[\\%_]/g, (c2) => `\\${c2}`);
}
async function searchAthletes(actor, rawQuery, rawLimit = SEARCH_LIMIT_DEFAULT, meta = {}, dbArg) {
  if (!hasRole(actor, COACH_ROLE))
    throw new ConnectionError(403, "role_not_allowed", "Only coaches can search for athletes.");
  const db = dbArg ?? await getDb();
  await assertCoachVerified(db, actor.id, true);
  const words = rawQuery.trim().slice(0, SEARCH_MAX_CHARS).split(/\s+/).filter(Boolean).slice(0, 4);
  if (words.join(" ").length < SEARCH_MIN_CHARS) return { items: [] };
  const limit3 = Math.min(Math.max(Math.trunc(Number.isFinite(rawLimit) ? rawLimit : SEARCH_LIMIT_DEFAULT), 1), SEARCH_LIMIT_MAX);
  let nameMatch = db`TRUE`;
  for (const w of words) {
    const prefix = `${likeLiteral(w)}%`;
    const inner = `% ${likeLiteral(w)}%`;
    nameMatch = db`${nameMatch} AND (
      u.display_name ILIKE ${prefix} OR u.display_name ILIKE ${inner}
      OR up.first_name ILIKE ${prefix} OR up.last_name ILIKE ${prefix})`;
  }
  const rows = await db`
    SELECT u.id, u.display_name, up.first_name, up.last_name
    FROM users u
    LEFT JOIN user_profiles up ON up.user_id = u.id
    WHERE u.is_active = TRUE AND u.deleted_at IS NULL AND u.id <> ${actor.id}
      AND EXISTS (
        SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = u.id AND r.name = ${ATHLETE_ROLE})
      AND ${nameMatch}
    ORDER BY u.display_name, u.id
    LIMIT ${limit3}`;
  await audit("athlete.searched", { userId: actor.id, ...meta, detail: { queryLength: words.join(" ").length, results: rows.length } }, db);
  return {
    items: rows.map((r) => ({
      id: r.id,
      displayName: r.display_name,
      ...r.first_name?.trim() ? { firstName: r.first_name.trim() } : {},
      ...r.last_name?.trim() ? { lastName: r.last_name.trim() } : {}
    }))
  };
}
function conflictFor(row, actorId) {
  if (row.status === "accepted")
    return new ConnectionError(409, "already_connected", "You are already connected.", { connectionId: row.id });
  if (row.status === "pending" && row.requested_by === actorId)
    return new ConnectionError(409, "request_already_sent", "You already sent a request to this person.", {
      connectionId: row.id
    });
  if (row.status === "pending")
    return new ConnectionError(
      409,
      "request_already_received",
      "This person already sent you a request. Accept or decline it instead.",
      { connectionId: row.id }
    );
  return new ConnectionError(409, "request_conflict", "This connection changed. Reload and try again.", {
    connectionId: row.id
  });
}
async function sendRequest(actor, targetUserId, meta = {}, dbArg) {
  requireConnectionRole(actor);
  const db = dbArg ?? await getDb();
  if (targetUserId === actor.id)
    throw new ConnectionError(422, "cannot_connect_to_self", "You can't send a connection request to yourself.");
  const [target] = await db`
    SELECT id FROM users WHERE id = ${targetUserId} AND is_active = TRUE AND deleted_at IS NULL`;
  if (!target) throw new ConnectionError(404, "user_not_found", "That user could not be found.");
  const targetRoles = (await db`
      SELECT r.name FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ${targetUserId}`).map((r) => r.name);
  let coachId;
  let athleteId;
  if (hasRole(actor, COACH_ROLE) && targetRoles.includes(ATHLETE_ROLE)) {
    coachId = actor.id;
    athleteId = targetUserId;
  } else if (hasRole(actor, ATHLETE_ROLE) && targetRoles.includes(COACH_ROLE)) {
    coachId = targetUserId;
    athleteId = actor.id;
  } else {
    throw new ConnectionError(
      422,
      "invalid_pair",
      hasRole(actor, COACH_ROLE) ? "Coaches can only send requests to student-athletes." : "Student-athletes can only send requests to coaches."
    );
  }
  await assertCoachVerified(db, coachId, coachId === actor.id);
  const ts = now3();
  let row = await findPair(db, coachId, athleteId);
  let created = false;
  if (!row) {
    const [inserted] = await db`
      INSERT INTO coach_athlete_connections
        (id, coach_id, athlete_id, requested_by, status, requested_at, created_at, updated_at)
      VALUES (${randomUUID3()}, ${coachId}, ${athleteId}, ${actor.id}, 'pending', ${ts}, ${ts}, ${ts})
      ON CONFLICT (coach_id, athlete_id) DO NOTHING
      RETURNING *`;
    if (inserted) {
      row = inserted;
      created = true;
    } else {
      row = await findPair(db, coachId, athleteId);
    }
  }
  if (!row) throw new ConnectionError(409, "request_conflict", "This connection changed. Try again.");
  if (!created) {
    if (row.status === "pending" || row.status === "accepted") throw conflictFor(row, actor.id);
    const [reopened] = await db`
      UPDATE coach_athlete_connections
      SET status = 'pending', requested_by = ${actor.id}, requested_at = ${ts}, responded_at = NULL, updated_at = ${ts}
      WHERE id = ${row.id} AND status IN ('declined', 'cancelled', 'disconnected')
      RETURNING *`;
    if (!reopened) {
      const current = await findById(db, row.id);
      throw current ? conflictFor(current, actor.id) : new ConnectionError(409, "request_conflict", "Try again.");
    }
    row = reopened;
  }
  await audit(
    "connection.requested",
    { userId: actor.id, ...meta, detail: { connectionId: row.id, coachId, athleteId, reopened: !created } },
    db
  );
  const otherId = actor.id === coachId ? athleteId : coachId;
  await notify(otherId, { category: "connection", title: "New connection request", message: `${actor.displayName} wants to connect with you.` }, db);
  return { connection: await viewById(db, row.id, actor.id), created };
}
async function respondToRequest(actor, connectionId, decision, meta = {}, dbArg) {
  requireConnectionRole(actor);
  const db = dbArg ?? await getDb();
  const { row, side } = await loadForActor(db, connectionId, actor);
  if (row.requested_by === actor.id)
    throw new ConnectionError(403, "not_recipient", "Only the person who received a request can answer it.");
  if (row.status !== "pending")
    throw new ConnectionError(409, "not_pending", "This request is no longer pending.");
  if (decision === "accepted") {
    await assertCoachVerified(db, row.coach_id, side === "coach");
    const otherId = side === "coach" ? row.athlete_id : row.coach_id;
    const [other] = await db`SELECT 1 AS x FROM users WHERE id = ${otherId} AND is_active = TRUE AND deleted_at IS NULL`;
    if (!other) throw new ConnectionError(409, "user_unavailable", "The other person's account is no longer available.");
  }
  const ts = now3();
  const [updated] = await db`
    UPDATE coach_athlete_connections
    SET status = ${decision}, responded_at = GREATEST(${ts}::timestamptz, requested_at), updated_at = ${ts}
    WHERE id = ${row.id} AND status = 'pending' AND requested_by <> ${actor.id}
    RETURNING *`;
  if (!updated) throw new ConnectionError(409, "not_pending", "This request is no longer pending.");
  await audit(
    decision === "accepted" ? "connection.accepted" : "connection.declined",
    { userId: actor.id, ...meta, detail: { connectionId: row.id, coachId: row.coach_id, athleteId: row.athlete_id } },
    db
  );
  await notify(
    row.requested_by,
    {
      category: "connection",
      title: decision === "accepted" ? "Connection accepted" : "Connection declined",
      message: decision === "accepted" ? `${actor.displayName} accepted your connection request.` : `${actor.displayName} declined your connection request.`
    },
    db
  );
  return viewById(db, row.id, actor.id);
}
async function cancelRequest(actor, connectionId, meta = {}, dbArg) {
  requireConnectionRole(actor);
  const db = dbArg ?? await getDb();
  const { row } = await loadForActor(db, connectionId, actor);
  if (row.requested_by !== actor.id)
    throw new ConnectionError(403, "not_requester", "Only the person who sent a request can cancel it.");
  if (row.status !== "pending")
    throw new ConnectionError(409, "not_pending", "This request is no longer pending.");
  const ts = now3();
  const [updated] = await db`
    UPDATE coach_athlete_connections
    SET status = 'cancelled', updated_at = ${ts}
    WHERE id = ${row.id} AND status = 'pending' AND requested_by = ${actor.id}
    RETURNING *`;
  if (!updated) throw new ConnectionError(409, "not_pending", "This request is no longer pending.");
  await audit(
    "connection.cancelled",
    { userId: actor.id, ...meta, detail: { connectionId: row.id, coachId: row.coach_id, athleteId: row.athlete_id } },
    db
  );
  return viewById(db, row.id, actor.id);
}
async function disconnect(actor, connectionId, meta = {}, dbArg) {
  requireConnectionRole(actor);
  const db = dbArg ?? await getDb();
  const { row } = await loadForActor(db, connectionId, actor);
  if (row.status !== "accepted")
    throw new ConnectionError(409, "not_connected", "You are not connected to this person.");
  const ts = now3();
  const [updated] = await db`
    UPDATE coach_athlete_connections
    SET status = 'disconnected', updated_at = ${ts}
    WHERE id = ${row.id} AND status = 'accepted'
    RETURNING *`;
  if (!updated) throw new ConnectionError(409, "not_connected", "You are not connected to this person.");
  await audit(
    "connection.disconnected",
    { userId: actor.id, ...meta, detail: { connectionId: row.id, coachId: row.coach_id, athleteId: row.athlete_id } },
    db
  );
  return viewById(db, row.id, actor.id);
}

// src/lib/skills.ts
var skills = [
  { id: "shooting", name: "Shooting", sport: "Basketball", emoji: "\u{1F3C0}", primaryLabel: "Accuracy", aiReady: true, unit: "%", min: 0, max: 100, assessment: "10-Shot Challenge", howTo: "Take 10 shots from the free-throw line or mid-range spot. Sportal counts makes and misses." },
  { id: "dribbling", name: "Dribbling", sport: "Basketball", emoji: "\u{1F3C0}", primaryLabel: "Consistency", aiReady: false, unit: "%", min: 0, max: 100, assessment: "Cone Weave Drill", howTo: "Standard drill used to measure this skill across sessions." },
  { id: "passing", name: "Passing", sport: "Basketball", emoji: "\u{1F3C0}", primaryLabel: "Accuracy", aiReady: false, unit: "%", min: 0, max: 100, assessment: "Target Passing Drill", howTo: "Standard drill used to measure this skill across sessions." },
  { id: "layups", name: "Layups", sport: "Basketball", emoji: "\u{1F3C0}", primaryLabel: "Success Rate", aiReady: false, unit: "%", min: 0, max: 100, assessment: "Alternating Layup Drill", howTo: "Standard drill used to measure this skill across sessions." },
  { id: "agility", name: "Agility / Footwork", sport: "Basketball", emoji: "\u26A1", primaryLabel: "Consistency", aiReady: false, unit: "%", min: 0, max: 100, assessment: "Lane Agility Test", howTo: "Standard drill used to measure this skill across sessions." },
  { id: "vertical", name: "Vertical Jump", sport: "Basketball", emoji: "\u{1F998}", primaryLabel: "Height", aiReady: false, unit: "cm", min: 0, max: 300, assessment: "Standing Vertical Test", howTo: "Standard drill used to measure this skill across sessions." },
  { id: "spiking", name: "Spiking", sport: "Volleyball", emoji: "\u{1F3D0}", primaryLabel: "Accuracy", aiReady: false, unit: "%", min: 0, max: 100, assessment: "10-Spike Accuracy Drill", howTo: "Take 10 spikes at a marked target zone. Your result is the share that land in the zone (7 of 10 = 70%)." },
  { id: "serving", name: "Serving", sport: "Volleyball", emoji: "\u{1F3D0}", primaryLabel: "Accuracy", aiReady: false, unit: "%", min: 0, max: 100, assessment: "10-Serve Accuracy Drill", howTo: "Take 10 serves at a marked target zone. Your result is the share that land in the zone (8 of 10 = 80%)." },
  { id: "fbpassing", name: "Passing", sport: "Football", emoji: "\u{1F3C8}", primaryLabel: "Accuracy", aiReady: false, unit: "%", min: 0, max: 100, assessment: "10-Pass Accuracy Drill", howTo: "Throw 10 passes at a marked target. Your result is the share that hit the target (7 of 10 = 70%)." },
  { id: "fbkicking", name: "Kicking", sport: "Football", emoji: "\u{1F3C8}", primaryLabel: "Accuracy", aiReady: false, unit: "%", min: 0, max: 100, assessment: "10-Kick Accuracy Drill", howTo: "Take 10 kicks at the goal from a marked spot. Your result is the share that go through (8 of 10 = 80%)." },
  { id: "sprint100", name: "100m Sprint", sport: "Track & Field", emoji: "\u{1F3C3}", primaryLabel: "Time", aiReady: false, unit: "s", min: 5, max: 60, assessment: "100m Timed Sprint", howTo: "Run 100 metres on a measured track, timed by a coach or a stopwatch. Enter your time in seconds (a lower time is better)." }
];
var skillById = (id) => skills.find((s) => s.id === id);
function formatResult(id, value2) {
  const unit = skillById(id)?.unit ?? "%";
  return unit === "%" ? `${value2}%` : `${value2} ${unit}`;
}

// src/lib/sports.ts
var sports = [
  { id: "basketball", name: "Basketball", aiSupported: true },
  { id: "volleyball", name: "Volleyball", aiSupported: false },
  { id: "athletics", name: "Track & Field", aiSupported: false },
  { id: "football", name: "Football", aiSupported: false }
];

// src/lib/athleteProfileRules.ts
var TEAM_STATUSES = [
  "Varsity",
  "Junior Varsity",
  "Reserve",
  "Club / Community",
  "Not on a team"
];
var PROVINCE = "Surigao del Norte";
var MUNICIPALITIES = [
  "Alegria",
  "Bacuag",
  "Burgos",
  "Claver",
  "Dapa",
  "Del Carmen",
  "General Luna",
  "Gigaquit",
  "Mainit",
  "Malimono",
  "Pilar",
  "Placer",
  "San Benito",
  "San Francisco",
  "San Isidro",
  "Santa Monica",
  "Sison",
  "Socorro",
  "Tagana-an",
  "Tubod"
];
var CATEGORIES = ["Men's Collegiate", "Women's Collegiate", "Juniors"];
var LIMITS = {
  name: 40,
  position: 40,
  school: 100,
  year: 60,
  teamName: 60,
  bio: 300,
  achievementTitle: 80,
  achievements: 10,
  heightCm: { min: 120, max: 230 },
  weightKg: { min: 30, max: 200 },
  firstAchievementYear: 1990
};
function formatHeight(cm) {
  const totalIn = Math.round(cm / 2.54);
  return `${Math.floor(totalIn / 12)}'${totalIn % 12}" (${Math.round(cm)} cm)`;
}
function parseNumber(s) {
  const t = s.trim();
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  return Number(t);
}
function validateProfile(d2, now6 = /* @__PURE__ */ new Date(), partial = true) {
  const e = {};
  const req = (key2, label, max2) => {
    const v = d2[key2].trim();
    if (!v) {
      if (!partial) e[key2] = `${label} is required.`;
    } else if (v.length > max2) e[key2] = `${label} must be ${max2} characters or fewer.`;
  };
  req("firstName", "First name", LIMITS.name);
  req("lastName", "Last name", LIMITS.name);
  req("school", "School", LIMITS.school);
  req("sport", "Sport", 60);
  if (!e.sport && !(partial && !d2.sport.trim()) && !sports.some((s) => s.name === d2.sport))
    e.sport = "Choose a sport from the list.";
  if (d2.municipality.trim() && !MUNICIPALITIES.includes(d2.municipality))
    e.municipality = "Choose a municipality from the list.";
  if (d2.category.trim() && !CATEGORIES.includes(d2.category))
    e.category = "Choose a category from the list.";
  if (d2.position.trim().length > LIMITS.position)
    e.position = `Position must be ${LIMITS.position} characters or fewer.`;
  if (d2.year.trim().length > LIMITS.year)
    e.year = `Year level must be ${LIMITS.year} characters or fewer.`;
  if (d2.bio.length > LIMITS.bio)
    e.bio = `Bio must be ${LIMITS.bio} characters or fewer (${d2.bio.length} now).`;
  const h = parseNumber(d2.heightCm);
  if (!(partial && !d2.heightCm.trim()) && (h === null || h < LIMITS.heightCm.min || h > LIMITS.heightCm.max))
    e.heightCm = `Enter a height between ${LIMITS.heightCm.min} and ${LIMITS.heightCm.max} cm.`;
  const w = parseNumber(d2.weightKg);
  if (!(partial && !d2.weightKg.trim()) && (w === null || w < LIMITS.weightKg.min || w > LIMITS.weightKg.max))
    e.weightKg = `Enter a weight between ${LIMITS.weightKg.min} and ${LIMITS.weightKg.max} kg.`;
  if (!(partial && !d2.teamStatus) && !TEAM_STATUSES.includes(d2.teamStatus)) e.teamStatus = "Choose a team status.";
  if (d2.teamStatus !== "Not on a team" && d2.teamName.trim().length > LIMITS.teamName)
    e.teamName = `Team name must be ${LIMITS.teamName} characters or fewer.`;
  if (d2.achievements.length > LIMITS.achievements)
    e.achievementsTotal = `You can list up to ${LIMITS.achievements} achievements.`;
  const maxYear = now6.getFullYear() + 1;
  const rows = d2.achievements.map((a) => {
    const title = a.title.trim();
    if (!title) return "Give this achievement a title.";
    if (title.length > LIMITS.achievementTitle)
      return `Title must be ${LIMITS.achievementTitle} characters or fewer.`;
    const y = a.year.trim();
    if (!/^\d{4}$/.test(y) || Number(y) < LIMITS.firstAchievementYear || Number(y) > maxYear)
      return `Year must be between ${LIMITS.firstAchievementYear} and ${maxYear}.`;
    return "";
  });
  if (rows.some(Boolean)) e.achievements = rows;
  return e;
}

// src/lib/rankings.ts
var MIN_COUNTED_SESSIONS = 3;
var COUNTED_STATUSES = ["Coach-Verified", "AI-Assessed"];
var SPORT_METRICS = {
  Basketball: ["Shooting Accuracy", "Overall Performance", "Consistency"],
  Volleyball: ["Spike Accuracy", "Serve Accuracy"],
  "Track & Field": ["100m Sprint (s)"],
  Football: ["Passing Accuracy", "Kick Accuracy"]
};
var PRIMARY_METRIC = {
  Basketball: "Overall Performance",
  Volleyball: "Spike Accuracy",
  "Track & Field": "100m Sprint (s)",
  Football: "Passing Accuracy"
};
var ALL = "All";
var lowerIsBetter = (metric) => metric.includes("(s)");
var SKILL_METRIC = {
  spiking: "Spike Accuracy",
  serving: "Serve Accuracy",
  sprint100: "100m Sprint (s)",
  fbpassing: "Passing Accuracy",
  fbkicking: "Kick Accuracy"
};
function resultsFromSessions(sessions) {
  const out = [];
  for (const s of sessions) {
    const own3 = SKILL_METRIC[s.skill];
    if (own3) out.push({ metric: own3, value: s.result, status: s.status });
    const def = skillById(s.skill);
    if (def?.sport !== "Basketball") continue;
    if (s.skill === "shooting")
      out.push({ metric: "Shooting Accuracy", value: s.result, status: s.status });
    if (def.unit === "%")
      out.push({ metric: "Overall Performance", value: s.result, status: s.status });
    if (s.consistency !== null)
      out.push({ metric: "Consistency", value: s.consistency, status: s.status });
  }
  return out;
}
var round1 = (n) => Math.round(n * 10) / 10;
function matches(v, wanted) {
  return !wanted || wanted === ALL || v === wanted;
}
function poolFor(candidates, f2) {
  return candidates.filter(
    (c2) => c2.sport === f2.sport && matches(c2.province, f2.province) && matches(c2.municipality, f2.municipality) && matches(c2.school, f2.school) && matches(c2.category, f2.category)
  );
}
function computeRankings(candidates, f2) {
  const pool = poolFor(candidates, f2);
  const scored = [];
  let notEnough = 0;
  let me;
  for (const c2 of pool) {
    const counted = c2.results.filter(
      (r) => r.metric === f2.metric && COUNTED_STATUSES.includes(r.status)
    );
    if (c2.isCurrentUser) me = { row: void 0, counted: counted.length, total: 0 };
    if (counted.length < MIN_COUNTED_SESSIONS) {
      notEnough += 1;
      continue;
    }
    const value2 = round1(counted.reduce((a, r) => a + r.value, 0) / counted.length);
    scored.push({
      c: c2,
      value: value2,
      counted: counted.length,
      verified: counted.filter((r) => r.status === "Coach-Verified").length
    });
  }
  const dir = lowerIsBetter(f2.metric) ? 1 : -1;
  scored.sort((a, b) => dir * (a.value - b.value) || a.c.name.localeCompare(b.c.name));
  const rows = [];
  scored.forEach((s, i) => {
    const prev = rows[i - 1];
    const position = prev && prev.value === s.value ? prev.position : i + 1;
    rows.push({
      position,
      athleteId: s.c.id,
      athleteName: s.c.name,
      school: s.c.school,
      municipality: s.c.municipality,
      province: s.c.province,
      value: s.value,
      ...s.c.isCurrentUser ? { isCurrentUser: true } : {},
      verifiedSessions: s.verified,
      totalSessions: s.counted
    });
  });
  if (me) me = { row: rows.find((r) => r.isCurrentUser), counted: me.counted, total: rows.length };
  return { rows, notEnoughSessions: notEnough, ...me ? { me } : {} };
}
function filterOptions(candidates, f2) {
  const inSport = poolFor(candidates, { sport: f2.sport });
  const distinct2 = (xs) => [...new Set(xs)].sort((a, b) => a.localeCompare(b));
  return {
    provinces: distinct2(inSport.map((c2) => c2.province)),
    municipalities: distinct2(
      poolFor(candidates, { sport: f2.sport, province: f2.province }).map((c2) => c2.municipality)
    ),
    schools: distinct2(
      poolFor(candidates, {
        sport: f2.sport,
        province: f2.province,
        municipality: f2.municipality
      }).map((c2) => c2.school)
    )
  };
}
function headlineRanks(candidates) {
  const out = /* @__PURE__ */ new Map();
  for (const sport of new Set(candidates.map((c2) => c2.sport))) {
    const metric = PRIMARY_METRIC[sport];
    if (!metric) continue;
    for (const r of computeRankings(candidates, { sport, metric }).rows)
      if (r.athleteId) out.set(r.athleteId, r.position);
  }
  return out;
}

// server/rankings.server.ts
var RANKINGS_LIMIT_DEFAULT = 100;
var RANKINGS_LIMIT_MAX = 200;
var HEADLINE_IDS_MAX = 100;
var RankingError = class extends Error {
  httpStatus;
  code;
  constructor(httpStatus, code, message) {
    super(message);
    this.httpStatus = httpStatus;
    this.code = code;
  }
};
var LABEL = {
  ai_assessed: "AI-Assessed",
  coach_verified: "Coach-Verified"
};
async function loadCandidates(db, viewerId) {
  const athletes = await db`
    SELECT u.id,
           COALESCE(NULLIF(btrim(concat_ws(' ', up.first_name, up.last_name)), ''), u.display_name) AS name,
           ap.sport, ap.school, ap.municipality, ap.province, ap.category
    FROM athlete_profiles ap
    JOIN users u ON u.id = ap.user_id
    LEFT JOIN user_profiles up ON up.user_id = u.id
    WHERE u.is_active = TRUE AND u.deleted_at IS NULL AND ap.sport <> ''
      AND (ap.showcase_visible = TRUE OR ap.user_id = ${viewerId})`;
  if (athletes.length === 0) return [];
  const sessions = await db`
    SELECT athlete_id, skill, result::float8 AS result, consistency::float8 AS consistency, status
    FROM practice_sessions
    WHERE status IN ('ai_assessed', 'coach_verified')`;
  const byAthlete = /* @__PURE__ */ new Map();
  for (const s of sessions) {
    const list = byAthlete.get(s.athlete_id);
    if (list) list.push(s);
    else byAthlete.set(s.athlete_id, [s]);
  }
  return athletes.map((a) => ({
    id: a.id,
    name: a.name,
    sport: a.sport,
    school: a.school,
    municipality: a.municipality,
    province: a.province,
    category: a.category,
    ...a.id === viewerId ? { isCurrentUser: true } : {},
    // Each skill feeds a metric of its own sport, so one athlete's sessions can never leak into another sport's ranking.
    results: resultsFromSessions(
      (byAthlete.get(a.id) ?? []).map((s) => ({
        skill: s.skill,
        result: s.result,
        consistency: s.consistency,
        status: LABEL[s.status]
      }))
    )
  }));
}
var clean = (v, name2) => {
  if (v === void 0 || v === "" || v === ALL) return void 0;
  if (v.length > 120) throw new RankingError(400, "validation", `${name2} is too long.`);
  return v;
};
async function getRankings(user, q, dbArg) {
  const metrics = SPORT_METRICS[q.sport];
  if (!metrics) throw new RankingError(400, "validation", "Unknown sport.");
  const metric = q.metric ?? metrics[0] ?? "";
  if (!metrics.includes(metric)) throw new RankingError(400, "validation", "Unknown metric for this sport.");
  const province = clean(q.province, "Province");
  const municipality = clean(q.municipality, "Municipality");
  const school = clean(q.school, "School");
  const category = clean(q.category, "Category");
  if (category && !CATEGORIES.includes(category)) throw new RankingError(400, "validation", "Unknown category.");
  const db = dbArg ?? await getDb();
  const candidates = await loadCandidates(db, user.id);
  const outcome = computeRankings(candidates, { sport: q.sport, metric, province, municipality, school, category });
  const isAthlete = user.roles.includes(ATHLETE_ROLE);
  return {
    sport: q.sport,
    metric,
    minCountedSessions: MIN_COUNTED_SESSIONS,
    rows: outcome.rows.slice(0, q.limit),
    total: outcome.rows.length,
    notEnoughSessions: outcome.notEnoughSessions,
    ...isAthlete && outcome.me ? { me: { row: outcome.me.row ?? null, counted: outcome.me.counted, total: outcome.me.total } } : {},
    options: filterOptions(candidates, { sport: q.sport, province, municipality })
  };
}
async function getHeadline(user, ids2, dbArg) {
  if (ids2.length > HEADLINE_IDS_MAX) throw new RankingError(400, "validation", `Ask about at most ${HEADLINE_IDS_MAX} athletes at a time.`);
  const db = dbArg ?? await getDb();
  const candidates = await loadCandidates(db, user.id);
  const positions = headlineRanks(candidates);
  const ranks = {};
  for (const id of ids2) {
    const p2 = positions.get(id);
    if (p2 !== void 0) ranks[id] = p2;
  }
  const mine = candidates.find((c2) => c2.isCurrentUser);
  let me = null;
  if (mine) {
    const metric = PRIMARY_METRIC[mine.sport];
    if (metric) {
      const counted = computeRankings(candidates, { sport: mine.sport, metric }).me?.counted ?? 0;
      me = { position: positions.get(mine.id) ?? null, sport: mine.sport, metric, counted };
    }
  }
  return { me, ranks };
}
function requireAthlete(user) {
  if (!user.roles.includes(ATHLETE_ROLE)) throw new RankingError(403, "role_not_allowed", "Only student-athletes can use this.");
}
async function getShowcaseVisible(user, dbArg) {
  requireAthlete(user);
  const db = dbArg ?? await getDb();
  const [r] = await db`SELECT showcase_visible AS v FROM athlete_profiles WHERE user_id = ${user.id}`;
  return r?.v ?? true;
}
async function setShowcaseVisible(user, visible, dbArg) {
  requireAthlete(user);
  const db = dbArg ?? await getDb();
  const ts = /* @__PURE__ */ new Date();
  await db`
    INSERT INTO athlete_profiles (user_id, showcase_visible, created_at, updated_at)
    VALUES (${user.id}, ${visible}, ${ts}, ${ts})
    ON CONFLICT (user_id) DO UPDATE SET showcase_visible = EXCLUDED.showcase_visible, updated_at = EXCLUDED.updated_at`;
  return visible;
}
async function headlinePositions(db, viewerId) {
  return headlineRanks(await loadCandidates(db, viewerId));
}
var round12 = (n) => Math.round(n * 10) / 10;
async function standingFor(db, athleteIds, viewerId) {
  const out = /* @__PURE__ */ new Map();
  if (athleteIds.length === 0) return out;
  const positions = await headlinePositions(db, viewerId);
  const rows = await db`
    SELECT athlete_id, skill, count(*)::int AS n, sum(result)::float8 AS total,
           count(consistency)::int AS cn, COALESCE(sum(consistency), 0)::float8 AS ctotal
    FROM practice_sessions
    WHERE status IN ('ai_assessed', 'coach_verified') AND athlete_id = ANY(${athleteIds}::text[])
    GROUP BY athlete_id, skill`;
  const acc = /* @__PURE__ */ new Map();
  for (const r of rows) {
    const def = skillById(r.skill);
    const a = acc.get(r.athlete_id) ?? { pn: 0, pt: 0, cn: 0, ct: 0 };
    if (def?.unit === "%") {
      a.pn += r.n;
      a.pt += r.total;
    }
    if (def?.sport === "Basketball") {
      a.cn += r.cn;
      a.ct += r.ctotal;
    }
    acc.set(r.athlete_id, a);
  }
  for (const id of athleteIds) {
    const a = acc.get(id);
    out.set(id, {
      rank: positions.get(id) ?? null,
      performance: a && a.pn ? round12(a.pt / a.pn) : null,
      consistency: a && a.cn ? round12(a.ct / a.cn) : null
    });
  }
  return out;
}

// server/coach-athletes.server.ts
var skillNames = new Map(skills.map((k) => [k.id, k.name]));
var UUID_RE2 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var now4 = () => /* @__PURE__ */ new Date();
var DAY_MS = 24 * 60 * 60 * 1e3;
var isoDay = (d2) => d2.toISOString().slice(0, 10);
var RECORDS_PER_ATHLETE = 5;
var PERFORMANCE_WINDOW_DAYS = 30;
function requireCoach(actor) {
  if (!actor.roles.includes(COACH_ROLE))
    throw new ConnectionError(403, "role_not_allowed", "Only coach accounts can use this.");
}
function clampPaging(paging) {
  const limit3 = Math.min(Math.max(Math.trunc(paging.limit ?? PAGE_DEFAULT), 1), PAGE_MAX);
  const offset = Math.max(Math.trunc(paging.offset ?? 0), 0);
  return { limit: limit3, offset };
}
function splitName(displayName) {
  const parts2 = displayName.trim().split(/\s+/);
  return { firstName: parts2[0] ?? "", lastName: parts2.slice(1).join(" ") };
}
async function listMyAthletes(actor, paging = {}, dbArg) {
  requireCoach(actor);
  const db = dbArg ?? await getDb();
  const me = actor.id;
  const { limit: limit3, offset } = clampPaging(paging);
  const rows = await db`
    SELECT u.id, u.display_name, up.first_name, up.last_name, up.avatar_url,
           ap.sport, ap.playing_position, ap.school, ap.bio
    FROM coach_athlete_connections c
    JOIN users u ON u.id = c.athlete_id
    LEFT JOIN user_profiles up ON up.user_id = u.id
    LEFT JOIN athlete_profiles ap ON ap.user_id = u.id
    WHERE c.coach_id = ${me} AND c.status = 'accepted' AND u.is_active = TRUE AND u.deleted_at IS NULL
    ORDER BY lower(u.display_name), u.id
    LIMIT ${limit3} OFFSET ${offset}`;
  const [count] = await db`
    SELECT COUNT(*)::int AS n
    FROM coach_athlete_connections c
    JOIN users u ON u.id = c.athlete_id
    WHERE c.coach_id = ${me} AND c.status = 'accepted' AND u.is_active = TRUE AND u.deleted_at IS NULL`;
  if (rows.length === 0) return { items: [], total: count?.n ?? 0, limit: limit3, offset };
  const ids2 = rows.map((r) => r.id);
  const [skills2, achievements, records] = await Promise.all([
    db`
      SELECT athlete_id, name FROM athlete_skills WHERE athlete_id IN ${db(ids2)} ORDER BY athlete_id, position`,
    db`
      SELECT athlete_id, title, year FROM athlete_achievements WHERE athlete_id IN ${db(ids2)} ORDER BY athlete_id, position`,
    db`
      SELECT athlete_id, label, value, recorded_on::text AS recorded_on
      FROM (
        SELECT r.athlete_id, r.label, r.value, r.recorded_on, r.created_at,
               ROW_NUMBER() OVER (PARTITION BY r.athlete_id ORDER BY r.recorded_on DESC, r.created_at DESC) AS rn
        FROM athlete_records r WHERE r.athlete_id IN ${db(ids2)}
      ) t
      WHERE rn <= ${RECORDS_PER_ATHLETE}
      ORDER BY athlete_id, rn`
  ]);
  const group = (list) => {
    const m = /* @__PURE__ */ new Map();
    for (const item of list) (m.get(item.athlete_id) ?? m.set(item.athlete_id, []).get(item.athlete_id)).push(item);
    return m;
  };
  const skillsBy = group(skills2);
  const standings = await standingFor(db, ids2, me);
  const achievementsBy = group(achievements);
  const recordsBy = group(records);
  const items = rows.map((r) => {
    const fallback = splitName(r.display_name);
    const first = r.first_name?.trim() || fallback.firstName;
    const last = r.last_name?.trim() || (r.first_name?.trim() ? "" : fallback.lastName);
    return {
      id: r.id,
      displayName: r.display_name,
      firstName: first,
      lastName: last,
      photo: r.avatar_url,
      sport: r.sport ?? "",
      position: r.playing_position ?? "",
      school: r.school ?? "",
      rank: standings.get(r.id)?.rank ?? null,
      performance: standings.get(r.id)?.performance ?? null,
      consistency: standings.get(r.id)?.consistency ?? null,
      bio: r.bio ?? "",
      skills: (skillsBy.get(r.id) ?? []).map((s) => s.name),
      achievements: (achievementsBy.get(r.id) ?? []).map((a) => ({ title: a.title, year: a.year })),
      records: (recordsBy.get(r.id) ?? []).map((x) => ({ label: x.label, value: x.value, recordedOn: x.recorded_on }))
    };
  });
  return { items, total: count?.n ?? 0, limit: limit3, offset };
}
function toPerson(r) {
  const fallback = splitName(r.display_name);
  return {
    id: r.id,
    displayName: r.display_name,
    firstName: r.first_name?.trim() || fallback.firstName,
    lastName: r.last_name?.trim() || (r.first_name?.trim() ? "" : fallback.lastName),
    photo: r.avatar_url
  };
}
var SKILLS_SHOWN = 6;
var CONVERSATIONS_SHOWN = 5;
var SHORTLIST_SHOWN = 12;
async function getCoachDashboard(actor, dbArg) {
  requireCoach(actor);
  const db = dbArg ?? await getDb();
  const me = actor.id;
  const today = now4();
  const since = isoDay(new Date(today.getTime() - PERFORMANCE_WINDOW_DAYS * DAY_MS));
  const before = isoDay(new Date(today.getTime() - 2 * PERFORMANCE_WINDOW_DAYS * DAY_MS));
  const [
    incoming,
    inquiryRows,
    unread,
    applications,
    shortlistRows,
    conversationRows,
    roster,
    updated,
    skillRows
  ] = await Promise.all([
    db`
      SELECT COUNT(*)::int AS n
      FROM coach_athlete_connections c JOIN users u ON u.id = c.athlete_id
      WHERE c.coach_id = ${me} AND c.status = 'pending' AND c.requested_by <> ${me}
        AND u.is_active = TRUE AND u.deleted_at IS NULL`,
    db`
      SELECT i.status, COUNT(*)::int AS n
      FROM recruitment_inquiries i JOIN users u ON u.id = i.athlete_id
      WHERE i.coach_id = ${me} AND u.is_active = TRUE AND u.deleted_at IS NULL
      GROUP BY i.status`,
    db`
      SELECT COUNT(*)::int AS n
      FROM coach_messages m JOIN users u ON u.id = m.athlete_id
      WHERE m.coach_id = ${me} AND m.sender_id <> ${me} AND m.read_at IS NULL
        AND u.is_active = TRUE AND u.deleted_at IS NULL`,
    db`
      SELECT COUNT(*)::int AS n
      FROM athlete_applications a JOIN users u ON u.id = a.athlete_id
      WHERE a.coach_id = ${me} AND a.status = 'new' AND u.is_active = TRUE AND u.deleted_at IS NULL`,
    db`
      SELECT u.id, u.display_name, up.first_name, up.last_name, up.avatar_url
      FROM coach_shortlist s
      JOIN users u ON u.id = s.athlete_id
      LEFT JOIN user_profiles up ON up.user_id = u.id
      WHERE s.coach_id = ${me} AND u.is_active = TRUE AND u.deleted_at IS NULL
      ORDER BY s.created_at DESC, u.id
      LIMIT ${SHORTLIST_SHOWN}`,
    db`
      SELECT u.id, u.display_name, up.first_name, up.last_name, up.avatar_url, t.body, t.created_at
      FROM (
        SELECT DISTINCT ON (m.athlete_id) m.athlete_id, m.body, m.created_at
        FROM coach_messages m
        WHERE m.coach_id = ${me}
        ORDER BY m.athlete_id, m.created_at DESC
      ) t
      JOIN users u ON u.id = t.athlete_id
      LEFT JOIN user_profiles up ON up.user_id = u.id
      WHERE u.is_active = TRUE AND u.deleted_at IS NULL
      ORDER BY t.created_at DESC
      LIMIT ${CONVERSATIONS_SHOWN}`,
    db`
      SELECT COUNT(*)::int AS n
      FROM coach_athlete_connections c JOIN users u ON u.id = c.athlete_id
      WHERE c.coach_id = ${me} AND c.status = 'accepted' AND u.is_active = TRUE AND u.deleted_at IS NULL`,
    db`
      SELECT COUNT(DISTINCT s.athlete_id)::int AS n
      FROM practice_sessions s
      JOIN coach_athlete_connections c ON c.athlete_id = s.athlete_id AND c.coach_id = ${me} AND c.status = 'accepted'
      JOIN users u ON u.id = s.athlete_id
      WHERE s.session_date >= ${since}::date AND u.is_active = TRUE AND u.deleted_at IS NULL`,
    // Only sessions that count toward rankings (coach-verified or AI-assessed), and only skills measured
    // in percent: vertical jump is in centimetres, so it can't be averaged with the rest.
    db`
      SELECT s.skill AS id,
             AVG(s.result) FILTER (WHERE s.session_date >= ${since}::date)::float8 AS cur,
             AVG(s.result) FILTER (WHERE s.session_date < ${since}::date)::float8 AS prev
      FROM practice_sessions s
      JOIN coach_athlete_connections c ON c.athlete_id = s.athlete_id AND c.coach_id = ${me} AND c.status = 'accepted'
      JOIN users u ON u.id = s.athlete_id
      WHERE s.status IN ('ai_assessed', 'coach_verified') AND s.skill <> 'vertical'
        AND s.session_date >= ${before}::date AND u.is_active = TRUE AND u.deleted_at IS NULL
      GROUP BY s.skill
      HAVING AVG(s.result) FILTER (WHERE s.session_date >= ${since}::date) IS NOT NULL
      ORDER BY s.skill
      LIMIT ${SKILLS_SHOWN}`
  ]);
  const statuses = { awaiting: 0, replied: 0, accepted: 0, declined: 0 };
  for (const row of inquiryRows) if (row.status in statuses) statuses[row.status] = row.n;
  return {
    pendingActions: {
      connectionRequests: incoming[0]?.n ?? 0,
      unansweredInquiries: statuses.awaiting,
      unreadMessages: unread[0]?.n ?? 0,
      newApplications: applications[0]?.n ?? 0
    },
    recruitment: {
      shortlist: shortlistRows.map(toPerson),
      conversations: conversationRows.map((r) => ({ athlete: toPerson(r), last: r.body, at: r.created_at.toISOString() })),
      inquiryStatuses: statuses
    },
    performance: {
      athletesTotal: roster[0]?.n ?? 0,
      athletesUpdated: updated[0]?.n ?? 0,
      skills: skillRows.map((s) => ({
        name: skillNames.get(s.id) ?? s.id,
        avg: Math.round(s.cur),
        change: s.prev === null ? 0 : Math.round(s.cur) - Math.round(s.prev)
      }))
    }
  };
}
async function setShortlisted(actor, athleteId, on, dbArg) {
  requireCoach(actor);
  if (!UUID_RE2.test(athleteId)) throw new ConnectionError(404, "athlete_not_found", "Athlete not found.");
  const db = dbArg ?? await getDb();
  if (on) {
    const [athlete] = await db`
      SELECT u.id FROM users u
      JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id
      WHERE u.id = ${athleteId} AND r.name = ${ATHLETE_ROLE} AND u.is_active = TRUE AND u.deleted_at IS NULL`;
    if (!athlete) throw new ConnectionError(404, "athlete_not_found", "Athlete not found.");
    await db`
      INSERT INTO coach_shortlist (coach_id, athlete_id, created_at) VALUES (${actor.id}, ${athleteId}, ${now4()})
      ON CONFLICT (coach_id, athlete_id) DO NOTHING`;
  } else {
    await db`DELETE FROM coach_shortlist WHERE coach_id = ${actor.id} AND athlete_id = ${athleteId}`;
  }
  return { athleteId, shortlisted: on };
}

// server/athlete-profile.server.ts
import { randomUUID as randomUUID4 } from "node:crypto";

// src/lib/athleteExtrasRules.ts
var COVERAGE_OPTIONS = ["Full tuition", "Partial tuition", "Stipend / allowance", "Open to any"];
var UNIVERSITY_NAME_MAX = 120;
var EXTRAS_LIMITS = {
  course: 80,
  photoDataUrl: 4e5,
  // characters; a 512px JPEG is far below this
  photoUploadBytes: 5 * 1024 * 1024,
  videoUrl: 300
};
var EMPTY_EXTRAS = {
  scholarship: { universities: [], coverage: "", course: "" },
  photo: null,
  video: null
};
function validateScholarship(s) {
  const e = {};
  if (s.universities.some((u) => typeof u !== "string" || !u.trim() || u.length > UNIVERSITY_NAME_MAX) || new Set(s.universities).size !== s.universities.length)
    e.universities = "Choose universities from the list.";
  if (s.coverage !== "" && !COVERAGE_OPTIONS.includes(s.coverage))
    e.coverage = "Choose a coverage preference from the list.";
  if (s.course.trim().length > EXTRAS_LIMITS.course)
    e.course = `Course must be ${EXTRAS_LIMITS.course} characters or fewer.`;
  return e;
}
var VIDEO_HOSTS = ["youtube.com", "youtu.be", "vimeo.com", "facebook.com", "fb.watch"];
function validateVideoUrl(raw) {
  const t = raw.trim();
  if (t.length > EXTRAS_LIMITS.videoUrl) return "That link is too long.";
  let u;
  try {
    u = new URL(t);
  } catch {
    return "Enter a full link starting with https://";
  }
  if (u.protocol !== "https:") return "Enter a full link starting with https://";
  const host = u.hostname.toLowerCase().replace(/^(www|m)\./, "");
  if (!VIDEO_HOSTS.some((h) => host === h || host.endsWith(`.${h}`)))
    return "Use a YouTube, Vimeo or Facebook video link.";
  if (u.pathname.replace(/\/+$/, "") === "" && !u.search) return "Link to the video itself, not the site's home page.";
  return null;
}
var PHOTO_DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
function validatePhotoDataUrl(v) {
  if (!PHOTO_DATA_URL.test(v)) return "That doesn't look like a valid image.";
  if (v.length > EXTRAS_LIMITS.photoDataUrl) return "That image is too large after resizing.";
  return null;
}

// server/athlete-profile.server.ts
var now5 = () => /* @__PURE__ */ new Date();
function requireAthlete2(actor) {
  if (!actor.roles.includes(ATHLETE_ROLE))
    throw new ConnectionError(403, "role_not_allowed", "Only student-athlete accounts can use this.");
}
function fail(fieldErrors, message = "Please fix the highlighted fields.") {
  return new ConnectionError(400, "validation", message, { fieldErrors });
}
async function getMyProfile(actor, dbArg) {
  requireAthlete2(actor);
  const db = dbArg ?? await getDb();
  const [r] = await db`
    SELECT up.first_name, up.last_name, u.display_name,
           ap.sport, ap.playing_position, ap.school, ap.year_level,
           ap.height_cm::float8 AS height_cm, ap.weight_kg::float8 AS weight_kg,
           ap.team_status, ap.team_name, ap.bio,
           ap.municipality, ap.province, ap.category
    FROM users u
    LEFT JOIN user_profiles up ON up.user_id = u.id
    LEFT JOIN athlete_profiles ap ON ap.user_id = u.id
    WHERE u.id = ${actor.id}`;
  if (!r) throw new ConnectionError(404, "profile_not_found", "Profile not found.");
  const achievements = await db`
    SELECT title, year FROM athlete_achievements WHERE athlete_id = ${actor.id} ORDER BY position`;
  const [first, ...rest] = r.display_name.trim().split(/\s+/);
  const standing = (await standingFor(db, [actor.id], actor.id)).get(actor.id);
  return {
    id: actor.id,
    firstName: r.first_name?.trim() || first || "",
    lastName: r.last_name?.trim() || (r.first_name?.trim() ? "" : rest.join(" ")),
    sport: r.sport ?? "",
    position: r.playing_position ?? "",
    school: r.school ?? "",
    year: r.year_level ?? "",
    heightCm: r.height_cm,
    weightKg: r.weight_kg,
    teamStatus: r.team_status ?? "",
    teamName: r.team_name ?? "",
    bio: r.bio ?? "",
    achievements,
    rank: standing?.rank ?? null,
    performanceScore: standing?.performance ?? null,
    consistency: standing?.consistency ?? null,
    municipality: r.municipality ?? "",
    province: r.province ?? "",
    category: r.category ?? ""
  };
}
function readDraft(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw fail({}, "Send the profile as an object.");
  const r = raw;
  const bad = {};
  const text3 = (k) => {
    const v = r[k];
    if (v === void 0 || v === null) return "";
    if (typeof v !== "string") {
      bad[k] = "Must be text.";
      return "";
    }
    return v;
  };
  const numText = (k) => {
    const v = r[k];
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
    return text3(k);
  };
  const ach = r["achievements"];
  let achievements = [];
  if (ach !== void 0) {
    if (!Array.isArray(ach)) bad["achievements"] = "Must be a list.";
    else
      achievements = ach.slice(0, LIMITS.achievements + 1).map((x) => {
        const o = x && typeof x === "object" ? x : {};
        return { title: typeof o["title"] === "string" ? o["title"] : "", year: typeof o["year"] === "string" ? o["year"] : "" };
      });
  }
  const draft = {
    firstName: text3("firstName"),
    lastName: text3("lastName"),
    sport: text3("sport"),
    position: text3("position"),
    school: text3("school"),
    municipality: text3("municipality"),
    category: text3("category"),
    year: text3("year"),
    heightCm: numText("heightCm"),
    weightKg: numText("weightKg"),
    teamStatus: text3("teamStatus"),
    teamName: text3("teamName"),
    bio: text3("bio"),
    achievements
  };
  if (Object.keys(bad).length > 0) throw fail(bad);
  return draft;
}
function flatten(errors) {
  const out = {};
  for (const [k, v] of Object.entries(errors)) {
    if (k === "achievements" && Array.isArray(v)) v.forEach((m, i) => {
      if (m) out[`achievements.${i}`] = m;
    });
    else if (typeof v === "string") out[k] = v;
  }
  return out;
}
async function saveMyProfile(actor, raw, dbArg) {
  requireAthlete2(actor);
  const d2 = readDraft(raw);
  const errors = validateProfile(d2, now5(), true);
  if (Object.keys(errors).length > 0) throw fail(flatten(errors));
  const db = dbArg ?? await getDb();
  const ts = now5();
  const first = d2.firstName.trim();
  const last = d2.lastName.trim();
  const teamName = d2.teamStatus === "Not on a team" ? "" : d2.teamName.trim();
  const status = TEAM_STATUSES.includes(d2.teamStatus) ? d2.teamStatus : "";
  const sentMunicipality = Object.hasOwn(raw, "municipality");
  const municipality = d2.municipality.trim();
  const province = municipality ? PROVINCE : "";
  const sentCategory = Object.hasOwn(raw, "category");
  const category = d2.category.trim();
  await db.begin(async (tx) => {
    await tx`
      UPDATE user_profiles SET first_name = ${first || null}, last_name = ${last || null}, updated_at = ${ts}
      WHERE user_id = ${actor.id}`;
    const display = `${first} ${last}`.trim();
    if (display) await tx`UPDATE users SET display_name = ${display.slice(0, 80)}, updated_at = ${ts} WHERE id = ${actor.id}`;
    await tx`
      INSERT INTO athlete_profiles
        (user_id, sport, playing_position, school, municipality, province, category, year_level, height_cm, weight_kg, team_status, team_name, bio, created_at, updated_at)
      VALUES
        (${actor.id}, ${d2.sport}, ${d2.position.trim()}, ${d2.school.trim()}, ${municipality}, ${province}, ${category}, ${d2.year.trim()},
         ${d2.heightCm.trim() ? Number(d2.heightCm) : null}, ${d2.weightKg.trim() ? Number(d2.weightKg) : null},
         ${status}, ${teamName}, ${d2.bio.trim()}, ${ts}, ${ts})
      ON CONFLICT (user_id) DO UPDATE SET
        sport = EXCLUDED.sport, playing_position = EXCLUDED.playing_position, school = EXCLUDED.school,
        municipality = CASE WHEN ${sentMunicipality}::boolean THEN EXCLUDED.municipality ELSE athlete_profiles.municipality END,
        province = CASE WHEN ${sentMunicipality}::boolean THEN EXCLUDED.province ELSE athlete_profiles.province END,
        category = CASE WHEN ${sentCategory}::boolean THEN EXCLUDED.category ELSE athlete_profiles.category END,
        year_level = EXCLUDED.year_level, height_cm = EXCLUDED.height_cm, weight_kg = EXCLUDED.weight_kg,
        team_status = EXCLUDED.team_status, team_name = EXCLUDED.team_name, bio = EXCLUDED.bio,
        updated_at = EXCLUDED.updated_at`;
    await tx`DELETE FROM athlete_achievements WHERE athlete_id = ${actor.id}`;
    for (const [i, a] of d2.achievements.entries())
      await tx`INSERT INTO athlete_achievements (id, athlete_id, position, title, year)
               VALUES (${randomUUID4()}, ${actor.id}, ${i}, ${a.title.trim()}, ${a.year.trim()})`;
  });
  return getMyProfile(actor, db);
}
async function getMyExtras(actor, dbArg) {
  requireAthlete2(actor);
  const db = dbArg ?? await getDb();
  const [r] = await db`
    SELECT universities, coverage, course, photo_data, photo_status, video_url, video_status
    FROM athlete_extras WHERE user_id = ${actor.id}`;
  if (!r) return EMPTY_EXTRAS;
  return {
    scholarship: { universities: r.universities, coverage: r.coverage, course: r.course },
    photo: r.photo_data && r.photo_status ? { value: r.photo_data, status: r.photo_status } : null,
    video: r.video_url && r.video_status ? { value: r.video_url, status: r.video_status } : null
  };
}
async function saveScholarship(actor, raw, dbArg) {
  requireAthlete2(actor);
  const o = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const unis = o["universities"];
  if (unis !== void 0 && !(Array.isArray(unis) && unis.every((u) => typeof u === "string"))) throw fail({ universities: "Choose universities from the list." });
  if (o["coverage"] !== void 0 && typeof o["coverage"] !== "string") throw fail({ coverage: "Choose a coverage preference from the list." });
  if (o["course"] !== void 0 && typeof o["course"] !== "string") throw fail({ course: "Must be text." });
  const s = {
    universities: unis ?? [],
    coverage: o["coverage"] ?? "",
    course: (o["course"] ?? "").trim()
  };
  const errors = validateScholarship(s);
  if (Object.keys(errors).length > 0) throw fail(errors);
  const db = dbArg ?? await getDb();
  if (s.universities.length > 0) {
    const known = await db`SELECT DISTINCT university FROM scholarships WHERE university = ANY(${s.universities}::text[])`;
    if (known.length !== s.universities.length) throw fail({ universities: "Choose universities from the list." });
  }
  await db`
    INSERT INTO athlete_extras (user_id, universities, coverage, course, updated_at)
    VALUES (${actor.id}, ${s.universities}::text[], ${s.coverage}, ${s.course}, ${now5()})
    ON CONFLICT (user_id) DO UPDATE SET universities = EXCLUDED.universities, coverage = EXCLUDED.coverage,
      course = EXCLUDED.course, updated_at = EXCLUDED.updated_at`;
  return getMyExtras(actor, db);
}
async function setPhoto(actor, raw, dbArg) {
  requireAthlete2(actor);
  const v = raw && typeof raw === "object" ? raw["dataUrl"] : void 0;
  if (typeof v !== "string") throw fail({ photo: "Send the photo as an image data URL." });
  const problem = validatePhotoDataUrl(v);
  if (problem) throw fail({ photo: problem });
  const db = dbArg ?? await getDb();
  await db`
    INSERT INTO athlete_extras (user_id, photo_data, photo_status, updated_at) VALUES (${actor.id}, ${v}, 'approved', ${now5()})
    ON CONFLICT (user_id) DO UPDATE SET photo_data = EXCLUDED.photo_data, photo_status = 'approved', updated_at = EXCLUDED.updated_at`;
  return getMyExtras(actor, db);
}
async function removePhoto(actor, dbArg) {
  requireAthlete2(actor);
  const db = dbArg ?? await getDb();
  await db`UPDATE athlete_extras SET photo_data = NULL, photo_status = NULL, updated_at = ${now5()} WHERE user_id = ${actor.id}`;
  return getMyExtras(actor, db);
}
async function setVideo(actor, raw, dbArg) {
  requireAthlete2(actor);
  const v = raw && typeof raw === "object" ? raw["url"] : void 0;
  if (typeof v !== "string") throw fail({ video: "Enter a full link starting with https://" });
  const problem = validateVideoUrl(v);
  if (problem) throw fail({ video: problem });
  const db = dbArg ?? await getDb();
  await db`
    INSERT INTO athlete_extras (user_id, video_url, video_status, updated_at) VALUES (${actor.id}, ${v.trim()}, 'approved', ${now5()})
    ON CONFLICT (user_id) DO UPDATE SET video_url = EXCLUDED.video_url, video_status = 'approved', updated_at = EXCLUDED.updated_at`;
  return getMyExtras(actor, db);
}
async function removeVideo(actor, dbArg) {
  requireAthlete2(actor);
  const db = dbArg ?? await getDb();
  await db`UPDATE athlete_extras SET video_url = NULL, video_status = NULL, updated_at = ${now5()} WHERE user_id = ${actor.id}`;
  return getMyExtras(actor, db);
}
var recordSchema = external_exports.object({
  label: external_exports.string().trim().min(1, "Enter what was measured.").max(80),
  value: external_exports.string().trim().min(1, "Enter the result.").max(40),
  recordedOn: external_exports.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date format YYYY-MM-DD.").optional()
});
var DAY_MS2 = 24 * 60 * 60 * 1e3;
var isoDay2 = (d2) => d2.toISOString().slice(0, 10);
async function addMyRecord(actor, body, dbArg) {
  requireAthlete2(actor);
  const parsed = recordSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key2 = String(issue.path[0] ?? "body");
      if (!fieldErrors[key2]) fieldErrors[key2] = issue.message;
    }
    throw fail(fieldErrors);
  }
  const r = parsed.data;
  const ts = now5();
  const recordedOn = r.recordedOn ?? isoDay2(ts);
  const asDate = /* @__PURE__ */ new Date(`${recordedOn}T00:00:00Z`);
  if (Number.isNaN(asDate.getTime()) || isoDay2(asDate) !== recordedOn) throw fail({ recordedOn: "Enter a real date." });
  if (recordedOn > isoDay2(new Date(ts.getTime() + DAY_MS2))) throw fail({ recordedOn: "A record can't be dated in the future." });
  const db = dbArg ?? await getDb();
  const id = randomUUID4();
  await db`
    INSERT INTO athlete_records (id, athlete_id, label, value, recorded_on, created_at)
    VALUES (${id}, ${actor.id}, ${r.label}, ${r.value}, ${recordedOn}::date, ${ts})`;
  return { id };
}

// server/practice-sessions.server.ts
import { randomUUID as randomUUID5 } from "node:crypto";

// src/lib/verification.ts
function statusForNewSession(opts) {
  if (opts.source === "manual") return opts.requestedReview ? "Pending Review" : "Self-Reported";
  return opts.needsReview || opts.requestedReview ? "Pending Review" : "AI-Assessed";
}

// server/practice-sessions.server.ts
var UUID_RE3 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var SKILL_IDS = skills.map((s) => s.id);
var DAY_MS3 = 24 * 60 * 60 * 1e3;
var isoDay3 = (d2) => d2.toISOString().slice(0, 10);
var MAX_SESSIONS_PER_DAY = 100;
var SESSIONS_LIMIT_MAX = 200;
var LABEL2 = {
  ai_assessed: "AI-Assessed",
  pending_review: "Pending Review",
  self_reported: "Self-Reported",
  coach_verified: "Coach-Verified"
};
var TO_DB = {
  "AI-Assessed": "ai_assessed",
  "Pending Review": "pending_review",
  "Self-Reported": "self_reported",
  "Coach-Verified": "coach_verified"
};
var SELECT = (db) => db`
  s.id, to_char(s.session_date, 'YYYY-MM-DD') AS session_date, s.skill, s.result::float8 AS result,
  s.consistency::float8 AS consistency, s.status, s.simulated, v.display_name AS verifier`;
function toView3(r) {
  return {
    id: r.id,
    date: r.session_date,
    skill: r.skill,
    result: r.result,
    consistency: r.consistency,
    // A "Coach-Verified" row whose coach account is gone can't be trusted, so it reads as pending.
    status: r.status === "coach_verified" && !r.verifier ? "Pending Review" : LABEL2[r.status],
    ...r.status === "coach_verified" && r.verifier ? { verifiedBy: r.verifier } : {},
    ...r.simulated ? { simulated: true } : {}
  };
}
function requireAthlete3(actor) {
  if (!actor.roles.includes(ATHLETE_ROLE))
    throw new ConnectionError(403, "role_not_allowed", "Only student-athlete accounts have practice sessions.");
}
function fail2(fieldErrors) {
  return new ConnectionError(400, "validation", "Please fix the highlighted fields.", { fieldErrors });
}
async function viewById2(db, id, athleteId) {
  const [row] = await db`
    SELECT ${SELECT(db)} FROM practice_sessions s LEFT JOIN users v ON v.id = s.verified_by
    WHERE s.id = ${id} ${athleteId ? db`AND s.athlete_id = ${athleteId}` : db``}`;
  return row ? toView3(row) : null;
}
async function listMySessions(actor, opts = {}, dbArg) {
  requireAthlete3(actor);
  const db = dbArg ?? await getDb();
  const limit3 = Math.min(Math.max(Math.trunc(opts.limit ?? SESSIONS_LIMIT_MAX), 1), SESSIONS_LIMIT_MAX);
  const rows = await db`
    SELECT ${SELECT(db)} FROM practice_sessions s LEFT JOIN users v ON v.id = s.verified_by
    WHERE s.athlete_id = ${actor.id}
    ORDER BY s.session_date DESC, s.created_at DESC, s.id LIMIT ${limit3}`;
  return { items: rows.map(toView3) };
}
var createSchema = external_exports.object({
  skill: external_exports.enum(SKILL_IDS),
  result: external_exports.number().finite(),
  consistency: external_exports.number().finite().min(0, "Consistency must be 0-100.").max(100, "Consistency must be 0-100.").nullable().optional(),
  source: external_exports.enum(["ai", "manual"]),
  needsReview: external_exports.boolean().optional(),
  requestedReview: external_exports.boolean().optional(),
  simulated: external_exports.boolean().optional(),
  date: external_exports.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date format YYYY-MM-DD.").optional()
});
async function createSession2(actor, body, dbArg) {
  requireAthlete3(actor);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key2 = String(issue.path[0] ?? "body");
      if (!fieldErrors[key2]) fieldErrors[key2] = issue.message;
    }
    throw fail2(fieldErrors);
  }
  const b = parsed.data;
  const def = skillById(b.skill);
  if (!def) throw fail2({ skill: "Unknown skill." });
  if (b.result < def.min || b.result > def.max) throw fail2({ result: `Enter a result between ${def.min} and ${def.max}${def.unit === "%" ? "" : ` ${def.unit}`}.` });
  if (b.source === "manual" && b.consistency !== void 0 && b.consistency !== null)
    throw fail2({ consistency: "A self-reported session has no consistency score." });
  const ts = /* @__PURE__ */ new Date();
  const date = b.date ?? isoDay3(ts);
  const asDate = /* @__PURE__ */ new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(asDate.getTime()) || isoDay3(asDate) !== date) throw fail2({ date: "Enter a real date." });
  if (date > isoDay3(new Date(ts.getTime() + DAY_MS3))) throw fail2({ date: "A session can't be dated in the future." });
  const status = TO_DB[statusForNewSession({
    source: b.source,
    ...b.needsReview !== void 0 ? { needsReview: b.needsReview } : {},
    ...b.requestedReview !== void 0 ? { requestedReview: b.requestedReview } : {}
  })];
  if (status === "coach_verified") throw new Error("a new session can never start as coach_verified");
  const db = dbArg ?? await getDb();
  const [mine] = await db`SELECT sport FROM athlete_profiles WHERE user_id = ${actor.id}`;
  if (mine?.sport && mine.sport !== def.sport) throw fail2({ skill: `${def.name} is a ${def.sport} skill. Your sport is ${mine.sport}.` });
  const [today] = await db`
    SELECT COUNT(*)::int AS n FROM practice_sessions WHERE athlete_id = ${actor.id} AND created_at >= ${new Date(ts.getTime() - DAY_MS3)}`;
  if ((today?.n ?? 0) >= MAX_SESSIONS_PER_DAY)
    throw new ConnectionError(429, "too_many_sessions", "That's a lot of sessions for one day. Try again tomorrow.");
  const id = randomUUID5();
  await db`
    INSERT INTO practice_sessions (id, athlete_id, skill, result, consistency, status, simulated, session_date, created_at)
    VALUES (${id}, ${actor.id}, ${b.skill}, ${b.result}, ${b.source === "manual" ? null : b.consistency ?? null}, ${status},
            ${b.simulated === true}, ${date}::date, ${ts})`;
  const view2 = await viewById2(db, id);
  if (!view2) throw new Error("session vanished after insert");
  return view2;
}
async function requestSessionReview(actor, id, dbArg) {
  requireAthlete3(actor);
  const notFound3 = new ConnectionError(404, "session_not_found", "Session not found.");
  if (!UUID_RE3.test(id)) throw notFound3;
  const db = dbArg ?? await getDb();
  const [row] = await db`
    UPDATE practice_sessions SET status = 'pending_review'
    WHERE id = ${id} AND athlete_id = ${actor.id} AND status IN ('ai_assessed', 'self_reported')
    RETURNING id`;
  if (!row) {
    const existing = await viewById2(db, id, actor.id);
    if (!existing) throw notFound3;
    throw new ConnectionError(409, "cannot_request_review", existing.status === "Coach-Verified" ? "A coach has already verified this session." : "This session is already waiting for review.");
  }
  const view2 = await viewById2(db, id, actor.id);
  if (!view2) throw notFound3;
  return view2;
}
function requireVerifiedCoach(actor) {
  if (!actor.roles.includes(COACH_ROLE))
    throw new ConnectionError(403, "role_not_allowed", "Only coaches can review sessions.");
  if (!actor.permissions.includes("sessions:verify"))
    throw new ConnectionError(403, "coach_not_verified", "Your coach account has to be verified before you can review sessions.");
}
async function listSessionsForReview(actor, opts = {}, dbArg) {
  requireVerifiedCoach(actor);
  const db = dbArg ?? await getDb();
  const limit3 = Math.min(Math.max(Math.trunc(opts.limit ?? PAGE_DEFAULT), 1), PAGE_MAX);
  const rows = await db`
    SELECT ${SELECT(db)}, s.athlete_id, a.display_name AS athlete_name
    FROM practice_sessions s
    JOIN coach_athlete_connections c ON c.athlete_id = s.athlete_id AND c.coach_id = ${actor.id} AND c.status = 'accepted'
    JOIN users a ON a.id = s.athlete_id AND a.is_active = TRUE AND a.deleted_at IS NULL
    LEFT JOIN users v ON v.id = s.verified_by
    WHERE s.status = 'pending_review'
    ORDER BY s.session_date, s.created_at, s.id LIMIT ${limit3}`;
  return { items: rows.map((r) => ({ ...toView3(r), athlete: { id: r.athlete_id, displayName: r.athlete_name } })) };
}
async function verifySession(actor, id, meta = {}, dbArg) {
  requireVerifiedCoach(actor);
  const notFound3 = new ConnectionError(404, "session_not_found", "Session not found.");
  if (!UUID_RE3.test(id)) throw notFound3;
  const db = dbArg ?? await getDb();
  const ts = /* @__PURE__ */ new Date();
  let athleteId = "";
  let skillName = "";
  await db.begin(async (tx) => {
    const [row] = await tx`
      SELECT s.status, s.athlete_id, s.skill
      FROM practice_sessions s
      JOIN coach_athlete_connections c ON c.athlete_id = s.athlete_id AND c.coach_id = ${actor.id} AND c.status = 'accepted'
      WHERE s.id = ${id}
      FOR UPDATE OF s`;
    if (!row) throw notFound3;
    if (row.status === "coach_verified") throw new ConnectionError(409, "already_verified", "This session is already verified.");
    await tx`
      UPDATE practice_sessions SET status = 'coach_verified', verified_by = ${actor.id}, verified_at = ${ts}
      WHERE id = ${id}`;
    athleteId = row.athlete_id;
    skillName = skillById(row.skill)?.name ?? row.skill;
  });
  await audit("practice_session.verified", { userId: actor.id, ...meta, detail: { sessionId: id } }, db);
  await notify(athleteId, { category: "verification", title: "Result verified", message: `${actor.displayName} verified your ${skillName} result. It now counts in rankings.`, link: "/performance" }, db);
  const view2 = await viewById2(db, id);
  if (!view2) throw notFound3;
  return view2;
}

// server/training-plans.server.ts
import { randomUUID as randomUUID6 } from "node:crypto";

// src/lib/trainingPlanRules.ts
var SPORTS = ["Basketball", "Volleyball", "Track & Field", "Football"];
var DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
var INTENSITIES = ["Low", "Medium", "High"];
var PLAN_STATUSES = ["DRAFT", "PUBLISHED"];
var LIMITS2 = {
  title: 120,
  description: 1e3,
  skillFocus: 80,
  drillName: 120,
  goal: 200,
  scheduleMax: 21,
  goalsMax: 10,
  athletesMax: 50,
  durationMin: 1,
  durationMax: 600,
  idMax: 64
};
function isRealDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d2] = s.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d2));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d2;
}
var str = (v) => typeof v === "string" ? v.trim() : "";
function num(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}
function sanitizePlanInput(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const list = (v) => Array.isArray(v) ? v.slice(0, 200) : [];
  return {
    title: str(r["title"]),
    description: str(r["description"]),
    sport: str(r["sport"]),
    skillFocus: str(r["skillFocus"]),
    startDate: str(r["startDate"]),
    endDate: str(r["endDate"]),
    schedule: list(r["schedule"]).map((it) => {
      const o = it && typeof it === "object" ? it : {};
      return { day: str(o["day"]), drillName: str(o["drillName"]), durationMinutes: num(o["durationMinutes"]), intensity: str(o["intensity"]) };
    }),
    goals: list(r["goals"]).map(str),
    athleteIds: [...new Set(list(r["athleteIds"]).map(str).filter(Boolean))]
  };
}
function validatePlan(p2, status) {
  const e = {};
  const publish = status === "PUBLISHED";
  if (!p2.title) e["title"] = "Enter a plan title.";
  else if (p2.title.length > LIMITS2.title) e["title"] = `Keep the title under ${LIMITS2.title} characters.`;
  if (p2.description.length > LIMITS2.description) e["description"] = `Keep the description under ${LIMITS2.description} characters.`;
  if (!p2.sport) {
    if (publish) e["sport"] = "Choose a sport.";
  } else if (!SPORTS.includes(p2.sport)) e["sport"] = "Choose a sport from the list.";
  if (!p2.skillFocus) {
    if (publish) e["skillFocus"] = "Enter a skill focus.";
  } else if (p2.skillFocus.length > LIMITS2.skillFocus) e["skillFocus"] = `Keep the skill focus under ${LIMITS2.skillFocus} characters.`;
  for (const key2 of ["startDate", "endDate"]) {
    const label = key2 === "startDate" ? "a start" : "an end";
    if (!p2[key2]) {
      if (publish) e[key2] = `Choose ${label} date.`;
    } else if (!isRealDate(p2[key2])) e[key2] = `Enter a valid ${key2 === "startDate" ? "start" : "end"} date.`;
  }
  if (!e["startDate"] && !e["endDate"] && p2.startDate && p2.endDate && p2.endDate < p2.startDate)
    e["endDate"] = "The end date can't be before the start date.";
  if (p2.schedule.length > LIMITS2.scheduleMax) e["schedule"] = `A plan can have at most ${LIMITS2.scheduleMax} schedule rows.`;
  else if (publish && p2.schedule.length === 0) e["schedule"] = "Add at least one day to the weekly schedule.";
  p2.schedule.slice(0, LIMITS2.scheduleMax).forEach((it, i) => {
    if (!DAYS.includes(it.day)) e[`schedule.${i}.day`] = "Choose a day.";
    if (!it.drillName) e[`schedule.${i}.drillName`] = "Enter a drill name.";
    else if (it.drillName.length > LIMITS2.drillName) e[`schedule.${i}.drillName`] = `Keep it under ${LIMITS2.drillName} characters.`;
    const d2 = it.durationMinutes;
    if (d2 === null || !Number.isInteger(d2) || d2 < LIMITS2.durationMin || d2 > LIMITS2.durationMax)
      e[`schedule.${i}.durationMinutes`] = `Enter whole minutes, ${LIMITS2.durationMin}\u2013${LIMITS2.durationMax}.`;
    if (!INTENSITIES.includes(it.intensity)) e[`schedule.${i}.intensity`] = "Choose an intensity.";
  });
  if (p2.goals.length > LIMITS2.goalsMax) e["goals"] = `A plan can have at most ${LIMITS2.goalsMax} goals.`;
  else if (publish && p2.goals.length === 0) e["goals"] = "Add at least one target goal.";
  p2.goals.slice(0, LIMITS2.goalsMax).forEach((g, i) => {
    if (!g) e[`goals.${i}`] = "Enter the goal or remove it.";
    else if (g.length > LIMITS2.goal) e[`goals.${i}`] = `Keep it under ${LIMITS2.goal} characters.`;
  });
  if (p2.athleteIds.length > LIMITS2.athletesMax) e["athleteIds"] = `Assign at most ${LIMITS2.athletesMax} athletes.`;
  else if (publish && p2.athleteIds.length === 0) e["athleteIds"] = "Assign the plan to at least one athlete.";
  else if (p2.athleteIds.some((id) => id.length > LIMITS2.idMax)) e["athleteIds"] = "One of the selected athletes is not valid.";
  return e;
}
function summarizeErrors(e) {
  const n = Object.keys(e).length;
  return n === 1 ? "Fix 1 field to continue." : `Fix ${n} fields to continue.`;
}

// server/training-plans.server.ts
var COACH_ROLE2 = "coach";
var ATHLETE_ROLE2 = "student_athlete";
var PAGE_DEFAULT2 = 50;
var PAGE_MAX2 = 100;
var UUID_RE4 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var PlanError = class extends Error {
  httpStatus;
  code;
  extra;
  constructor(httpStatus, code, message, extra) {
    super(message);
    this.httpStatus = httpStatus;
    this.code = code;
    this.extra = extra;
  }
};
var PLAN_COLUMNS = (db) => db`
  id, coach_id, title, description, sport, skill_focus,
  to_char(start_date, 'YYYY-MM-DD') AS start_date, to_char(end_date, 'YYYY-MM-DD') AS end_date,
  status, published_at, created_at, updated_at`;
function requireCoach2(user) {
  if (!user.roles.includes(COACH_ROLE2))
    throw new PlanError(403, "role_not_allowed", "Only coaches can manage training plans.");
}
function requireId2(id) {
  if (!UUID_RE4.test(id)) throw new PlanError(404, "plan_not_found", "Training plan not found.");
}
function parseBody(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const status = r["status"];
  if (typeof status !== "string" || !PLAN_STATUSES.includes(status))
    throw new PlanError(400, "validation", "Choose DRAFT or PUBLISHED.", { fieldErrors: { status: "Status must be DRAFT or PUBLISHED." } });
  const input = sanitizePlanInput(raw);
  const fieldErrors = validatePlan(input, status);
  if (Object.keys(fieldErrors).length > 0) throw new PlanError(400, "validation", summarizeErrors(fieldErrors), { fieldErrors });
  return { input, status };
}
async function assertAthletesConnected(tx, coachId, athleteIds) {
  if (athleteIds.length === 0) return;
  const ok = await tx`
    SELECT c.athlete_id
    FROM coach_athlete_connections c
    JOIN users u ON u.id = c.athlete_id AND u.is_active = TRUE AND u.deleted_at IS NULL
    WHERE c.coach_id = ${coachId} AND c.status = 'accepted' AND c.athlete_id IN ${tx(athleteIds)}
    FOR SHARE OF c`;
  const allowed = new Set(ok.map((r) => r.athlete_id));
  const rejected = athleteIds.filter((id) => !allowed.has(id));
  if (rejected.length > 0)
    throw new PlanError(
      403,
      "athlete_not_connected",
      rejected.length === 1 ? "You can only assign plans to athletes you are connected with. Remove the athlete who isn't connected." : "You can only assign plans to athletes you are connected with. Remove the athletes who aren't connected.",
      { athleteIds: rejected, fieldErrors: { athleteIds: "Some selected athletes aren't connected to you." } }
    );
}
async function writeChildren(tx, planId, input, ts) {
  await tx`DELETE FROM training_plan_schedule_items WHERE plan_id = ${planId}`;
  await tx`DELETE FROM training_plan_goals WHERE plan_id = ${planId}`;
  await tx`DELETE FROM training_plan_assignments WHERE plan_id = ${planId}`;
  if (input.schedule.length > 0) {
    const rows = input.schedule.map((it, i) => ({
      id: randomUUID6(),
      plan_id: planId,
      position: i,
      day_of_week: it.day,
      drill_name: it.drillName,
      duration_minutes: it.durationMinutes,
      intensity: it.intensity
    }));
    await tx`INSERT INTO training_plan_schedule_items ${tx(rows)}`;
  }
  if (input.goals.length > 0) {
    const rows = input.goals.map((g, i) => ({ id: randomUUID6(), plan_id: planId, position: i, description: g }));
    await tx`INSERT INTO training_plan_goals ${tx(rows)}`;
  }
  if (input.athleteIds.length > 0) {
    const rows = input.athleteIds.map((a) => ({ plan_id: planId, athlete_id: a, assigned_at: ts }));
    await tx`INSERT INTO training_plan_assignments ${tx(rows)}`;
  }
}
async function viewById3(db, id, coachId) {
  const [row] = await db`SELECT ${PLAN_COLUMNS(db)} FROM training_plans WHERE id = ${id} AND coach_id = ${coachId}`;
  if (!row) throw new PlanError(404, "plan_not_found", "Training plan not found.");
  const [schedule, goals, athletes, [coach]] = await Promise.all([
    db`
      SELECT day_of_week, drill_name, duration_minutes, intensity FROM training_plan_schedule_items WHERE plan_id = ${id} ORDER BY position`,
    db`SELECT description FROM training_plan_goals WHERE plan_id = ${id} ORDER BY position`,
    db`
      SELECT u.id, u.display_name,
             EXISTS (SELECT 1 FROM coach_athlete_connections c
                     WHERE c.coach_id = ${coachId} AND c.athlete_id = u.id AND c.status = 'accepted') AS connected
      FROM training_plan_assignments a JOIN users u ON u.id = a.athlete_id
      WHERE a.plan_id = ${id} ORDER BY u.display_name, u.id`,
    db`SELECT id, display_name FROM users WHERE id = ${coachId}`
  ]);
  return {
    id: row.id,
    status: row.status,
    title: row.title,
    description: row.description,
    sport: row.sport,
    skillFocus: row.skill_focus,
    startDate: row.start_date,
    endDate: row.end_date,
    schedule: schedule.map((s) => ({ day: s.day_of_week, drillName: s.drill_name, durationMinutes: s.duration_minutes, intensity: s.intensity })),
    goals: goals.map((g) => g.description),
    athletes: athletes.map((a) => ({ id: a.id, displayName: a.display_name, connected: a.connected })),
    coach: { id: coachId, displayName: coach?.display_name ?? "" },
    publishedAt: row.published_at ? row.published_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}
async function getPlan(actor, id, dbArg) {
  requireCoach2(actor);
  requireId2(id);
  return viewById3(dbArg ?? await getDb(), id, actor.id);
}
async function listPlans(actor, opts = {}, dbArg) {
  requireCoach2(actor);
  const db = dbArg ?? await getDb();
  const limit3 = Math.min(Math.max(Math.trunc(opts.limit ?? PAGE_DEFAULT2), 1), PAGE_MAX2);
  const offset = Math.max(Math.trunc(opts.offset ?? 0), 0);
  const filter = opts.status ? db`AND p.status = ${opts.status}` : db``;
  const rows = await db`
    SELECT p.id, p.status, p.title, p.sport, p.skill_focus,
           to_char(p.start_date, 'YYYY-MM-DD') AS start_date, to_char(p.end_date, 'YYYY-MM-DD') AS end_date,
           (SELECT COUNT(*)::int FROM training_plan_assignments a WHERE a.plan_id = p.id) AS athlete_count,
           p.updated_at
    FROM training_plans p WHERE p.coach_id = ${actor.id} ${filter}
    ORDER BY p.updated_at DESC, p.id LIMIT ${limit3} OFFSET ${offset}`;
  const [count] = await db`SELECT COUNT(*)::int AS n FROM training_plans p WHERE p.coach_id = ${actor.id} ${filter}`;
  return {
    items: rows.map((r) => ({
      id: r.id,
      status: r.status,
      title: r.title,
      sport: r.sport,
      skillFocus: r.skill_focus,
      startDate: r.start_date,
      endDate: r.end_date,
      athleteCount: r.athlete_count,
      updatedAt: r.updated_at.toISOString()
    })),
    total: count?.n ?? 0,
    limit: limit3,
    offset
  };
}
async function createPlan(actor, raw, meta = {}, dbArg) {
  requireCoach2(actor);
  const { input, status } = parseBody(raw);
  const db = dbArg ?? await getDb();
  const id = randomUUID6();
  const ts = /* @__PURE__ */ new Date();
  await db.begin(async (tx) => {
    await assertAthletesConnected(tx, actor.id, input.athleteIds);
    await tx`
      INSERT INTO training_plans
        (id, coach_id, title, description, sport, skill_focus, start_date, end_date, status, published_at, created_at, updated_at)
      VALUES (${id}, ${actor.id}, ${input.title}, ${input.description}, ${input.sport}, ${input.skillFocus},
              ${input.startDate || null}, ${input.endDate || null}, ${status}, ${status === "PUBLISHED" ? ts : null}, ${ts}, ${ts})`;
    await writeChildren(tx, id, input, ts);
  });
  await audit(
    status === "PUBLISHED" ? "training_plan.published" : "training_plan.created",
    { userId: actor.id, ...meta, detail: { planId: id, status, athletes: input.athleteIds.length } },
    db
  );
  return viewById3(db, id, actor.id);
}
async function updatePlan(actor, id, raw, meta = {}, dbArg) {
  requireCoach2(actor);
  requireId2(id);
  const { input, status } = parseBody(raw);
  const db = dbArg ?? await getDb();
  const ts = /* @__PURE__ */ new Date();
  let publishedNow = false;
  await db.begin(async (tx) => {
    const [row] = await tx`
      SELECT status FROM training_plans WHERE id = ${id} AND coach_id = ${actor.id} FOR UPDATE`;
    if (!row) throw new PlanError(404, "plan_not_found", "Training plan not found.");
    if (row.status === "PUBLISHED" && status === "DRAFT")
      throw new PlanError(409, "cannot_unpublish", "A published plan can't be turned back into a draft.");
    await assertAthletesConnected(tx, actor.id, input.athleteIds);
    publishedNow = row.status === "DRAFT" && status === "PUBLISHED";
    await tx`
      UPDATE training_plans
      SET title = ${input.title}, description = ${input.description}, sport = ${input.sport}, skill_focus = ${input.skillFocus},
          start_date = ${input.startDate || null}, end_date = ${input.endDate || null}, status = ${status},
          published_at = CASE WHEN ${publishedNow} THEN ${ts}::timestamptz ELSE published_at END, updated_at = ${ts}
      WHERE id = ${id}`;
    await writeChildren(tx, id, input, ts);
  });
  await audit(
    publishedNow ? "training_plan.published" : "training_plan.updated",
    { userId: actor.id, ...meta, detail: { planId: id, status, athletes: input.athleteIds.length } },
    db
  );
  return viewById3(db, id, actor.id);
}
function requireAthlete4(user) {
  if (!user.roles.includes(ATHLETE_ROLE2))
    throw new PlanError(403, "role_not_allowed", "Only student-athletes have assigned training plans.");
}
var ASSIGNED_WHERE = (db, me) => db`
  a.athlete_id = ${me} AND p.status = 'PUBLISHED'
  AND EXISTS (SELECT 1 FROM coach_athlete_connections c
              WHERE c.coach_id = p.coach_id AND c.athlete_id = a.athlete_id AND c.status = 'accepted')`;
async function listAssignedPlans(actor, opts = {}, dbArg) {
  requireAthlete4(actor);
  const db = dbArg ?? await getDb();
  const limit3 = Math.min(Math.max(Math.trunc(opts.limit ?? PAGE_DEFAULT2), 1), PAGE_MAX2);
  const offset = Math.max(Math.trunc(opts.offset ?? 0), 0);
  const rows = await db`
    SELECT p.id, p.title, p.sport, p.skill_focus,
           to_char(p.start_date, 'YYYY-MM-DD') AS start_date, to_char(p.end_date, 'YYYY-MM-DD') AS end_date,
           p.coach_id, cu.display_name AS coach_name, a.assigned_at
    FROM training_plan_assignments a
    JOIN training_plans p ON p.id = a.plan_id
    JOIN users cu ON cu.id = p.coach_id
    WHERE ${ASSIGNED_WHERE(db, actor.id)}
    ORDER BY p.start_date DESC NULLS LAST, p.id
    LIMIT ${limit3} OFFSET ${offset}`;
  const [count] = await db`
    SELECT COUNT(*)::int AS n
    FROM training_plan_assignments a JOIN training_plans p ON p.id = a.plan_id
    WHERE ${ASSIGNED_WHERE(db, actor.id)}`;
  return {
    items: rows.map((r) => ({
      id: r.id,
      title: r.title,
      sport: r.sport,
      skillFocus: r.skill_focus,
      startDate: r.start_date,
      endDate: r.end_date,
      coach: { id: r.coach_id, displayName: r.coach_name },
      assignedAt: r.assigned_at.toISOString()
    })),
    total: count?.n ?? 0,
    limit: limit3,
    offset
  };
}
async function getAssignedPlan(actor, id, dbArg) {
  requireAthlete4(actor);
  requireId2(id);
  const db = dbArg ?? await getDb();
  const [row] = await db`
    SELECT p.id, p.title, p.description, p.sport, p.skill_focus,
           to_char(p.start_date, 'YYYY-MM-DD') AS start_date, to_char(p.end_date, 'YYYY-MM-DD') AS end_date,
           p.coach_id, cu.display_name AS coach_name, a.assigned_at, p.published_at
    FROM training_plan_assignments a
    JOIN training_plans p ON p.id = a.plan_id
    JOIN users cu ON cu.id = p.coach_id
    WHERE p.id = ${id} AND ${ASSIGNED_WHERE(db, actor.id)}`;
  if (!row) throw new PlanError(404, "plan_not_found", "Training plan not found.");
  const [schedule, goals] = await Promise.all([
    db`
      SELECT day_of_week, drill_name, duration_minutes, intensity FROM training_plan_schedule_items WHERE plan_id = ${id} ORDER BY position`,
    db`SELECT description FROM training_plan_goals WHERE plan_id = ${id} ORDER BY position`
  ]);
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    sport: row.sport,
    skillFocus: row.skill_focus,
    startDate: row.start_date,
    endDate: row.end_date,
    coach: { id: row.coach_id, displayName: row.coach_name },
    assignedAt: row.assigned_at.toISOString(),
    publishedAt: row.published_at ? row.published_at.toISOString() : null,
    schedule: schedule.map((s) => ({ day: s.day_of_week, drillName: s.drill_name, durationMinutes: s.duration_minutes, intensity: s.intensity })),
    goals: goals.map((g) => g.description)
  };
}

// server/coach-profile.server.ts
import { randomUUID as randomUUID7 } from "node:crypto";

// src/lib/coachProfileRules.ts
var ORGANIZATION_TYPES = ["University", "College", "High school", "Club / Academy", "Other"];
var POSITION_TITLES2 = [
  "Head coach",
  "Assistant coach",
  "Athletic director",
  "Recruiter / Scout",
  "Trainer / Coordinator"
];
var COMPETITION_LEVELS = ["Junior high school", "Senior high school", "Collegiate", "Club / Community", "Professional"];
var CREDENTIAL_TYPES = ["Coaching license", "School / university ID", "Letter from organization"];
var COACH_LIMITS = {
  name: 40,
  organizationName: 100,
  location: 80,
  programName: 80,
  background: { min: 20, max: 500 },
  yearsExperience: { min: 0, max: 60 },
  credentialReference: { min: 4, max: 50 }
};
var EMPTY_COACH = {
  firstName: "",
  lastName: "",
  email: "",
  organizationName: "",
  organizationType: "",
  organizationLocation: "",
  positionTitle: "",
  programName: "",
  primarySport: "",
  competitionLevel: "",
  yearsExperience: "",
  background: "",
  certifications: "",
  officialEmail: "",
  credentialType: "",
  credentialReference: ""
};
var COACH_PROFILE_KEYS = Object.keys(EMPTY_COACH);
var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function validateCoach(c2) {
  const e = {};
  const text3 = (k, label, max2) => {
    if (c2[k].trim().length > max2) e[k] = `${label} must be ${max2} characters or fewer.`;
  };
  const oneOf = (k, list, label) => {
    if (c2[k] !== "" && !list.includes(c2[k])) e[k] = `Choose ${label} from the list.`;
  };
  text3("firstName", "First name", COACH_LIMITS.name);
  text3("lastName", "Last name", COACH_LIMITS.name);
  text3("organizationName", "Organization name", COACH_LIMITS.organizationName);
  text3("organizationLocation", "Location", COACH_LIMITS.location);
  text3("programName", "Team or program", COACH_LIMITS.programName);
  text3("certifications", "Certifications", 200);
  for (const k of ["email", "officialEmail"]) {
    if (c2[k].trim() !== "" && !EMAIL.test(c2[k].trim())) e[k] = "Enter a valid email address.";
  }
  oneOf("organizationType", ORGANIZATION_TYPES, "an organization type");
  oneOf("positionTitle", POSITION_TITLES2, "a position");
  oneOf("primarySport", sports.map((s) => s.name), "a sport");
  oneOf("competitionLevel", COMPETITION_LEVELS, "a level");
  oneOf("credentialType", CREDENTIAL_TYPES, "a credential type");
  const years = c2.yearsExperience.trim();
  if (years !== "") {
    const n = /^\d{1,2}$/.test(years) ? Number(years) : NaN;
    if (!(n >= COACH_LIMITS.yearsExperience.min && n <= COACH_LIMITS.yearsExperience.max))
      e.yearsExperience = `Enter whole years between ${COACH_LIMITS.yearsExperience.min} and ${COACH_LIMITS.yearsExperience.max}.`;
  }
  const bg = c2.background.trim();
  if (bg !== "" && (bg.length < COACH_LIMITS.background.min || bg.length > COACH_LIMITS.background.max))
    e.background = `Describe your background in ${COACH_LIMITS.background.min}\u2013${COACH_LIMITS.background.max} characters.`;
  const ref = c2.credentialReference.trim();
  if (ref !== "" && (ref.length < COACH_LIMITS.credentialReference.min || ref.length > COACH_LIMITS.credentialReference.max))
    e.credentialReference = `Enter ${COACH_LIMITS.credentialReference.min}\u2013${COACH_LIMITS.credentialReference.max} characters.`;
  return e;
}

// server/coach-profile.server.ts
var REVIEW_PERMISSION = "coaches:review";
var VERIFIED_COACH_ROLE = "verified_coach";
var NOTE_MAX = 500;
var UUID_RE5 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function requireCoach3(actor) {
  if (!actor.roles.includes(COACH_ROLE))
    throw new ConnectionError(403, "role_not_allowed", "Only coach accounts have a coach profile.");
}
function requireReviewer(actor) {
  if (!actor.permissions.includes(REVIEW_PERMISSION))
    throw new ConnectionError(403, "not_a_reviewer", "You don't have permission to review coaches.");
}
async function getVerificationState(db, coachId) {
  const [row] = await db`
    SELECT status, submitted_at, reviewed_at, review_note FROM coach_verifications WHERE coach_id = ${coachId}`;
  const verified = await isVerifiedCoach(db, coachId);
  const status = verified ? "Verified" : row?.status === "rejected" ? "Rejected" : "Pending";
  const requested = !verified && row?.status === "pending";
  return {
    status,
    requested,
    canRequest: !verified && !requested,
    submittedAt: row ? row.submitted_at.toISOString() : null,
    reviewedAt: row?.reviewed_at ? row.reviewed_at.toISOString() : null,
    note: row && row.status !== "pending" ? row.review_note : ""
  };
}
async function loadProfile(db, coachId) {
  const [r] = await db`
    SELECT up.first_name, up.last_name, u.email,
           cp.organization, cp.coaching_position, cp.sport_specialization, cp.organization_type, cp.organization_location,
           cp.program_name, cp.competition_level, cp.years_experience, cp.background, cp.certifications,
           cp.official_email, cp.credential_type, cp.credential_reference
    FROM users u
    LEFT JOIN user_profiles up ON up.user_id = u.id
    LEFT JOIN coach_profiles cp ON cp.user_id = u.id
    WHERE u.id = ${coachId}`;
  if (!r) throw new ConnectionError(404, "profile_not_found", "Profile not found.");
  return {
    firstName: r.first_name?.trim() ?? "",
    lastName: r.last_name?.trim() ?? "",
    email: r.email,
    organizationName: r.organization ?? "",
    organizationType: r.organization_type ?? "",
    organizationLocation: r.organization_location ?? "",
    positionTitle: r.coaching_position ?? "",
    programName: r.program_name ?? "",
    primarySport: r.sport_specialization ?? "",
    competitionLevel: r.competition_level ?? "",
    yearsExperience: r.years_experience ?? "",
    background: r.background ?? "",
    certifications: r.certifications ?? "",
    officialEmail: r.official_email ?? "",
    credentialType: r.credential_type ?? "",
    credentialReference: r.credential_reference ?? ""
  };
}
async function getCoachProfile(actor, dbArg) {
  requireCoach3(actor);
  const db = dbArg ?? await getDb();
  const [profile, verification] = await Promise.all([loadProfile(db, actor.id), getVerificationState(db, actor.id)]);
  return { profile, verification };
}
function fail3(fieldErrors, message = "Please fix the highlighted fields.") {
  return new ConnectionError(400, "validation", message, { fieldErrors });
}
function readBody(raw, accountEmail) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw fail3({}, "Send the profile as an object.");
  const r = raw;
  const out = { ...EMPTY_COACH };
  const bad = {};
  for (const k of COACH_PROFILE_KEYS) {
    const v = r[k];
    if (v === void 0) continue;
    if (typeof v !== "string") bad[k] = "Must be text.";
    else out[k] = v.trim();
  }
  if (Object.keys(bad).length > 0) throw fail3(bad);
  out.email = accountEmail;
  return out;
}
async function saveCoachProfile(actor, raw, meta = {}, dbArg) {
  requireCoach3(actor);
  const p2 = readBody(raw, actor.email);
  const errors = validateCoach(p2);
  if (Object.keys(errors).length > 0) throw fail3(errors);
  const db = dbArg ?? await getDb();
  const ts = /* @__PURE__ */ new Date();
  await db.begin(async (tx) => {
    await tx`
      UPDATE user_profiles SET first_name = ${p2.firstName || null}, last_name = ${p2.lastName || null}, updated_at = ${ts}
      WHERE user_id = ${actor.id}`;
    const display = `${p2.firstName} ${p2.lastName}`.trim();
    if (display) await tx`UPDATE users SET display_name = ${display.slice(0, 80)}, updated_at = ${ts} WHERE id = ${actor.id}`;
    await tx`
      INSERT INTO coach_profiles
        (user_id, organization, coaching_position, sport_specialization, organization_type, organization_location,
         program_name, competition_level, years_experience, background, certifications,
         official_email, credential_type, credential_reference, created_at, updated_at)
      VALUES
        (${actor.id}, ${p2.organizationName}, ${p2.positionTitle}, ${p2.primarySport}, ${p2.organizationType}, ${p2.organizationLocation},
         ${p2.programName}, ${p2.competitionLevel}, ${p2.yearsExperience}, ${p2.background}, ${p2.certifications},
         ${p2.officialEmail}, ${p2.credentialType}, ${p2.credentialReference}, ${ts}, ${ts})
      ON CONFLICT (user_id) DO UPDATE SET
        organization = EXCLUDED.organization, coaching_position = EXCLUDED.coaching_position,
        sport_specialization = EXCLUDED.sport_specialization, organization_type = EXCLUDED.organization_type,
        organization_location = EXCLUDED.organization_location, program_name = EXCLUDED.program_name,
        competition_level = EXCLUDED.competition_level, years_experience = EXCLUDED.years_experience,
        background = EXCLUDED.background, certifications = EXCLUDED.certifications,
        official_email = EXCLUDED.official_email, credential_type = EXCLUDED.credential_type,
        credential_reference = EXCLUDED.credential_reference, updated_at = EXCLUDED.updated_at`;
  });
  await audit("coach_profile.updated", { userId: actor.id, ...meta }, db);
  return getCoachProfile(actor, db);
}
async function requestVerification(actor, meta = {}, dbArg) {
  requireCoach3(actor);
  const db = dbArg ?? await getDb();
  const profile = await loadProfile(db, actor.id);
  const errors = validateCoach(profile);
  const missing = {};
  if (!profile.organizationName) missing["organizationName"] = "Enter your organization name.";
  if (!profile.officialEmail) missing["officialEmail"] = "Enter your official organization email.";
  if (!profile.credentialType) missing["credentialType"] = "Choose a credential type.";
  if (!profile.credentialReference) missing["credentialReference"] = "Enter your credential or ID reference.";
  const fieldErrors = { ...errors, ...missing };
  if (Object.keys(missing).length > 0 || errors.officialEmail || errors.credentialReference || errors.credentialType)
    throw fail3(fieldErrors, "Complete the Verification Information before requesting verification.");
  if (await isVerifiedCoach(db, actor.id))
    throw new ConnectionError(409, "already_verified", "Your account is already verified.");
  const ts = /* @__PURE__ */ new Date();
  const [row] = await db`
    INSERT INTO coach_verifications
      (coach_id, status, organization, official_email, credential_type, credential_reference, submitted_at, updated_at)
    VALUES (${actor.id}, 'pending', ${profile.organizationName}, ${profile.officialEmail}, ${profile.credentialType},
            ${profile.credentialReference}, ${ts}, ${ts})
    ON CONFLICT (coach_id) DO UPDATE SET
      status = 'pending', organization = EXCLUDED.organization, official_email = EXCLUDED.official_email,
      credential_type = EXCLUDED.credential_type, credential_reference = EXCLUDED.credential_reference,
      submitted_at = EXCLUDED.submitted_at, reviewed_at = NULL, reviewed_by = NULL, review_note = '', updated_at = EXCLUDED.updated_at
    WHERE coach_verifications.status = 'rejected'
    RETURNING coach_id`;
  if (!row) throw new ConnectionError(409, "already_requested", "Your verification request is already waiting for review.");
  await audit("coach_verification.requested", { userId: actor.id, ...meta }, db);
  return getVerificationState(db, actor.id);
}
async function listVerificationRequests(actor, opts = {}, dbArg) {
  requireReviewer(actor);
  const db = dbArg ?? await getDb();
  const limit3 = Math.min(Math.max(Math.trunc(opts.limit ?? PAGE_DEFAULT), 1), PAGE_MAX);
  const offset = Math.max(Math.trunc(opts.offset ?? 0), 0);
  const filter = opts.status ? db`AND v.status = ${opts.status}` : db``;
  const rows = await db`
    SELECT v.coach_id, u.display_name, u.email, v.status, v.organization, cp.organization_type, cp.coaching_position,
           cp.sport_specialization, v.official_email, v.credential_type, v.credential_reference,
           v.submitted_at, v.reviewed_at, v.review_note
    FROM coach_verifications v
    JOIN users u ON u.id = v.coach_id
    LEFT JOIN coach_profiles cp ON cp.user_id = v.coach_id
    WHERE u.deleted_at IS NULL ${filter}
    ORDER BY (v.status = 'pending') DESC, v.submitted_at, v.coach_id
    LIMIT ${limit3} OFFSET ${offset}`;
  const [count] = await db`
    SELECT COUNT(*)::int AS n FROM coach_verifications v JOIN users u ON u.id = v.coach_id WHERE u.deleted_at IS NULL ${filter}`;
  return {
    items: rows.map((r) => ({
      coachId: r.coach_id,
      displayName: r.display_name,
      email: r.email,
      status: r.status,
      organization: r.organization,
      organizationType: r.organization_type ?? "",
      position: r.coaching_position ?? "",
      sport: r.sport_specialization ?? "",
      officialEmail: r.official_email,
      credentialType: r.credential_type,
      credentialReference: r.credential_reference,
      submittedAt: r.submitted_at.toISOString(),
      reviewedAt: r.reviewed_at ? r.reviewed_at.toISOString() : null,
      note: r.review_note
    })),
    total: count?.n ?? 0,
    limit: limit3,
    offset
  };
}
async function applyReview(db, input) {
  const note = input.note.trim();
  if (input.decision === "reject" && (note.length < 1 || note.length > NOTE_MAX))
    throw fail3({ note: `Give a reason, up to ${NOTE_MAX} characters.` }, "Rejecting a request needs a reason the coach can read.");
  if (note.length > NOTE_MAX) throw fail3({ note: `Notes can be up to ${NOTE_MAX} characters.` });
  const ts = /* @__PURE__ */ new Date();
  await db.begin(async (tx) => {
    const [row] = await tx`
      SELECT status FROM coach_verifications WHERE coach_id = ${input.coachId} FOR UPDATE`;
    if (!row) throw new ConnectionError(404, "request_not_found", "That coach hasn't requested verification.");
    if (input.decision === "approve" && row.status !== "pending")
      throw new ConnectionError(409, "not_pending", "Only a pending request can be approved.");
    if (input.decision === "reject" && row.status === "rejected")
      throw new ConnectionError(409, "not_pending", "This request was already rejected.");
    const status = input.decision === "approve" ? "verified" : "rejected";
    await tx`
      UPDATE coach_verifications
      SET status = ${status}, reviewed_at = ${ts}, reviewed_by = ${input.reviewerId}, review_note = ${note}, updated_at = ${ts}
      WHERE coach_id = ${input.coachId}`;
    if (input.decision === "approve") {
      await tx`
        INSERT INTO user_roles (user_id, role_id, granted_at)
        SELECT ${input.coachId}, id, ${ts} FROM roles WHERE name = ${VERIFIED_COACH_ROLE}
        ON CONFLICT DO NOTHING`;
      await tx`
        INSERT INTO universities (id, name, name_key, location, created_at, updated_at)
        SELECT ${randomUUID7()}, btrim(v.organization), lower(btrim(v.organization)), left(btrim(cp.organization_location), 200), ${ts}, ${ts}
        FROM coach_verifications v JOIN coach_profiles cp ON cp.user_id = v.coach_id
        WHERE v.coach_id = ${input.coachId} AND cp.organization_type IN ('University', 'College')
          AND length(btrim(v.organization)) BETWEEN 2 AND 120
        ON CONFLICT (name_key) DO NOTHING`;
      await tx`
        UPDATE coach_profiles cp SET university_id = u.id
        FROM coach_verifications v JOIN universities u ON u.name_key = lower(btrim(v.organization))
        WHERE cp.user_id = v.coach_id AND v.coach_id = ${input.coachId} AND cp.organization_type IN ('University', 'College')`;
    } else {
      await tx`
        DELETE FROM user_roles
        WHERE user_id = ${input.coachId} AND role_id IN (SELECT id FROM roles WHERE name = ${VERIFIED_COACH_ROLE})`;
      await tx`UPDATE coach_profiles SET university_id = NULL WHERE user_id = ${input.coachId}`;
    }
  });
  await audit(
    input.decision === "approve" ? "coach_verification.approved" : "coach_verification.rejected",
    { userId: input.reviewerId, ...input.meta, detail: { coachId: input.coachId, via: input.reviewerId ? "api" : "cli" } },
    db
  );
  await notify(
    input.coachId,
    input.decision === "approve" ? { category: "verification", title: "You're verified", message: "Your coach account has been verified. You can now connect with athletes." } : { category: "verification", title: "Verification not approved", message: `Reason: ${note}` },
    db
  );
}
async function reviewVerification(actor, coachId, decision, rawNote, meta = {}, dbArg) {
  requireReviewer(actor);
  if (!UUID_RE5.test(coachId)) throw new ConnectionError(404, "request_not_found", "That coach hasn't requested verification.");
  if (coachId === actor.id) throw new ConnectionError(403, "cannot_review_self", "You can't review your own verification.");
  if (rawNote !== void 0 && typeof rawNote !== "string") throw fail3({ note: "Must be text." });
  const db = dbArg ?? await getDb();
  await applyReview(db, { coachId, decision, note: typeof rawNote === "string" ? rawNote : "", reviewerId: actor.id, meta });
  return { coachId, status: decision === "approve" ? "Verified" : "Rejected" };
}

// server/scholarships.server.ts
import { randomUUID as randomUUID8 } from "node:crypto";
var ATHLETE_ROLE3 = "student_athlete";
var UNIVERSITY_ROLE = "university_representative";
var ADMIN_ROLE = "admin";
var SCHOLARSHIP_PAGE_DEFAULT = 30;
var SCHOLARSHIP_PAGE_MAX = 100;
var ScholarshipError = class extends Error {
  httpStatus;
  code;
  constructor(httpStatus, code, message) {
    super(message);
    this.httpStatus = httpStatus;
    this.code = code;
  }
};
var toView4 = (r) => ({
  id: r.id,
  name: r.name,
  university: r.university,
  sport: r.sport,
  coverage: r.coverage,
  details: r.details,
  eligibility: Array.isArray(r.eligibility) ? r.eligibility : [],
  deadline: r.deadline,
  isOpen: r.is_open,
  postedByMe: r.posted_by_me,
  myApplication: r.app_id && r.app_status ? { id: r.app_id, status: r.app_status } : null
});
var hasRole2 = (u, role) => u.roles.includes(role);
var likeLiteral2 = (t) => t.replace(/[\\%_]/g, (c2) => `\\${c2}`);
var todayIso = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
function clean2(input) {
  const name2 = input.name.trim();
  if (name2.length < 3 || name2.length > 120) throw new ScholarshipError(400, "validation", "Name must be 3-120 characters.");
  if (!input.sport.trim()) throw new ScholarshipError(400, "validation", "Choose a sport.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.deadline) || Number.isNaN(Date.parse(input.deadline)))
    throw new ScholarshipError(400, "validation", "Deadline must be a date (YYYY-MM-DD).");
  if (input.deadline < todayIso()) throw new ScholarshipError(400, "validation", "Deadline cannot be in the past.");
  if (input.details.length > 2e3) throw new ScholarshipError(400, "validation", "Details are too long.");
  const eligibility = input.eligibility.map((e) => e.trim()).filter(Boolean).slice(0, 10).map((e) => e.slice(0, 120));
  return { ...input, name: name2, sport: input.sport.trim(), coverage: input.coverage.trim().slice(0, 120), eligibility };
}
var SELECT2 = (db, viewerId) => db`
  SELECT s.id, s.university, s.name, s.sport, s.coverage, s.details, s.eligibility,
         to_char(s.deadline, 'YYYY-MM-DD') AS deadline, s.is_open,
         (s.posted_by IS NOT NULL AND s.posted_by = ${viewerId}) AS posted_by_me,
         a.id AS app_id, a.status AS app_status
  FROM scholarships s
  LEFT JOIN scholarship_applications a ON a.scholarship_id = s.id AND a.athlete_id = ${viewerId}`;
async function listScholarships(user, opts, dbArg) {
  const db = dbArg ?? await getDb();
  const sport = opts.sport?.trim();
  const q = opts.q?.trim().slice(0, 80);
  const where = db`
    WHERE TRUE
    ${opts.includeClosed ? hasRole2(user, ADMIN_ROLE) ? db`` : db`AND ((s.is_open = TRUE AND s.deadline >= CURRENT_DATE) OR s.posted_by = ${user.id})` : db`AND s.is_open = TRUE AND s.deadline >= CURRENT_DATE`}
    ${sport ? db`AND lower(s.sport) = lower(${sport})` : db``}
    ${q ? db`AND (s.name ILIKE ${`%${likeLiteral2(q)}%`} OR s.university ILIKE ${`%${likeLiteral2(q)}%`})` : db``}`;
  const rows = await db`${SELECT2(db, user.id)} ${where} ORDER BY s.deadline, s.id LIMIT ${opts.limit} OFFSET ${opts.offset}`;
  const [c2] = await db`SELECT count(*) AS n FROM scholarships s ${where}`;
  return { items: rows.map(toView4), total: Number(c2?.n ?? 0) };
}
async function createScholarship(user, input, meta = {}, dbArg) {
  if (!hasRole2(user, UNIVERSITY_ROLE) && !hasRole2(user, ADMIN_ROLE))
    throw new ScholarshipError(403, "role_not_allowed", "Only university representatives can post scholarships.");
  const db = dbArg ?? await getDb();
  const c2 = clean2(input);
  let university = c2.university?.trim();
  if (hasRole2(user, UNIVERSITY_ROLE)) {
    const [p2] = await db`SELECT university_name FROM university_representative_profiles WHERE user_id = ${user.id}`;
    if (p2) university = p2.university_name;
  }
  if (!university || university.length < 2) throw new ScholarshipError(400, "validation", "University is required.");
  const id = randomUUID8();
  const now6 = /* @__PURE__ */ new Date();
  await db`
    INSERT INTO scholarships (id, posted_by, university, name, sport, coverage, details, eligibility, deadline, created_at, updated_at)
    VALUES (${id}, ${user.id}, ${university.slice(0, 120)}, ${c2.name}, ${c2.sport}, ${c2.coverage}, ${c2.details},
            ${db.json(c2.eligibility)}, ${c2.deadline}::date, ${now6}, ${now6})`;
  await audit("scholarship.created", { userId: user.id, ...meta, detail: { scholarshipId: id } }, db);
  const [row] = await db`${SELECT2(db, user.id)} WHERE s.id = ${id}`;
  return toView4(row);
}
async function setScholarshipOpen(user, id, open2, meta = {}, dbArg) {
  const db = dbArg ?? await getDb();
  const admin = hasRole2(user, ADMIN_ROLE);
  const updated = await db`
    UPDATE scholarships SET is_open = ${open2}, updated_at = ${/* @__PURE__ */ new Date()}
    WHERE id = ${id} AND (${admin} OR posted_by = ${user.id}) RETURNING id`;
  if (!updated.length) throw new ScholarshipError(404, "not_found", "Scholarship not found.");
  await audit(open2 ? "scholarship.opened" : "scholarship.closed", { userId: user.id, ...meta, detail: { scholarshipId: id } }, db);
  const [row] = await db`${SELECT2(db, user.id)} WHERE s.id = ${id}`;
  return toView4(row);
}
async function applyToScholarship(user, scholarshipId, meta = {}, dbArg) {
  if (!hasRole2(user, ATHLETE_ROLE3)) throw new ScholarshipError(403, "role_not_allowed", "Only student-athletes can apply.");
  const db = dbArg ?? await getDb();
  const [s] = await db`
    SELECT id, name, posted_by, (is_open AND deadline >= CURRENT_DATE) AS open FROM scholarships WHERE id = ${scholarshipId}`;
  if (!s) throw new ScholarshipError(404, "not_found", "Scholarship not found.");
  if (!s.open) throw new ScholarshipError(409, "closed", "This scholarship is no longer accepting applications.");
  const id = randomUUID8();
  const now6 = /* @__PURE__ */ new Date();
  const rows = await db`
    INSERT INTO scholarship_applications (id, scholarship_id, athlete_id, status, created_at, updated_at)
    VALUES (${id}, ${scholarshipId}, ${user.id}, 'submitted', ${now6}, ${now6})
    ON CONFLICT (scholarship_id, athlete_id) DO UPDATE SET status = 'submitted', updated_at = ${now6}
      WHERE scholarship_applications.status = 'withdrawn'
    RETURNING id, status`;
  const app = rows[0];
  if (!app) throw new ScholarshipError(409, "already_applied", "You have already applied to this scholarship.");
  await audit("scholarship.applied", { userId: user.id, ...meta, detail: { scholarshipId } }, db);
  await notify(user.id, { category: "application", title: "Application received", message: `Your application to ${s.name} was submitted.`, link: "/scholarships" }, db);
  if (s.posted_by)
    await notify(s.posted_by, { category: "application", title: "New applicant", message: `${user.displayName} applied to ${s.name}.` }, db);
  return app;
}
async function withdrawApplication(user, scholarshipId, meta = {}, dbArg) {
  const db = dbArg ?? await getDb();
  const rows = await db`
    UPDATE scholarship_applications SET status = 'withdrawn', updated_at = ${/* @__PURE__ */ new Date()}
    WHERE scholarship_id = ${scholarshipId} AND athlete_id = ${user.id} AND status IN ('submitted', 'under_review')
    RETURNING id, status`;
  const app = rows[0];
  if (!app) throw new ScholarshipError(404, "not_found", "No active application to withdraw.");
  await audit("scholarship.withdrawn", { userId: user.id, ...meta, detail: { scholarshipId } }, db);
  return app;
}
async function listMyApplications(user, limit3, offset, dbArg) {
  const db = dbArg ?? await getDb();
  const rows = await db`
    SELECT a.id, a.status, a.created_at, s.id AS scholarship_id, s.name, s.university
    FROM scholarship_applications a JOIN scholarships s ON s.id = a.scholarship_id
    WHERE a.athlete_id = ${user.id} ORDER BY a.created_at DESC LIMIT ${limit3} OFFSET ${offset}`;
  const [c2] = await db`SELECT count(*) AS n FROM scholarship_applications WHERE athlete_id = ${user.id}`;
  return {
    items: rows.map((r) => ({ id: r.id, status: r.status, appliedAt: r.created_at.toISOString(), scholarship: { id: r.scholarship_id, name: r.name, university: r.university } })),
    total: Number(c2?.n ?? 0)
  };
}
async function listUniversities(dbArg) {
  const db = dbArg ?? await getDb();
  const rows = await db`
    SELECT DISTINCT university FROM scholarships WHERE is_open = TRUE AND deadline >= CURRENT_DATE ORDER BY university`;
  return rows.map((r) => r.university);
}
async function ownedScholarship(db, user, scholarshipId) {
  const admin = hasRole2(user, ADMIN_ROLE);
  const [s] = await db`
    SELECT id, name FROM scholarships WHERE id = ${scholarshipId} AND (${admin} OR posted_by = ${user.id})`;
  if (!s) throw new ScholarshipError(404, "not_found", "Scholarship not found.");
  return s;
}
async function listApplicants(user, scholarshipId, dbArg) {
  const db = dbArg ?? await getDb();
  await ownedScholarship(db, user, scholarshipId);
  const rows = await db`
    SELECT a.id, a.status, a.created_at, a.updated_at, u.id AS athlete_id,
           COALESCE(NULLIF(btrim(concat_ws(' ', up.first_name, up.last_name)), ''), u.display_name) AS name,
           COALESCE(ap.sport, '') AS sport, COALESCE(ap.school, '') AS school
    FROM scholarship_applications a
    JOIN users u ON u.id = a.athlete_id
    LEFT JOIN user_profiles up ON up.user_id = u.id
    LEFT JOIN athlete_profiles ap ON ap.user_id = u.id
    WHERE a.scholarship_id = ${scholarshipId}
    ORDER BY (a.status = 'withdrawn'), a.created_at DESC, a.id`;
  return {
    items: rows.map((r) => ({
      id: r.id,
      status: r.status,
      appliedAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
      athlete: { id: r.athlete_id, displayName: r.name, sport: r.sport, school: r.school }
    }))
  };
}
var STATUS_PHRASE = {
  under_review: "is now under review",
  accepted: "was accepted",
  rejected: "was not selected"
};
async function setApplicationStatus(user, applicationId, status, meta = {}, dbArg) {
  const db = dbArg ?? await getDb();
  const admin = hasRole2(user, ADMIN_ROLE);
  const [a] = await db`
    SELECT a.id, a.status, a.athlete_id, a.scholarship_id, s.name
    FROM scholarship_applications a JOIN scholarships s ON s.id = a.scholarship_id
    WHERE a.id = ${applicationId} AND (${admin} OR s.posted_by = ${user.id})`;
  if (!a) throw new ScholarshipError(404, "not_found", "Application not found.");
  if (a.status === "withdrawn") throw new ScholarshipError(409, "withdrawn", "The athlete withdrew this application.");
  if (a.status === status) return status;
  await db`UPDATE scholarship_applications SET status = ${status}, updated_at = ${/* @__PURE__ */ new Date()} WHERE id = ${applicationId}`;
  await audit("scholarship.application_status", { userId: user.id, ...meta, detail: { applicationId, status } }, db);
  await notify(a.athlete_id, { category: "scholarship", title: "Application update", message: `Your application to ${a.name} ${STATUS_PHRASE[status]}.`, link: "/scholarships" }, db);
  return status;
}

// server/search.server.ts
var GLOBAL_SEARCH_MIN_CHARS = 2;
var GLOBAL_SEARCH_MAX_CHARS = 80;
var likeLiteral3 = (t) => t.replace(/[\\%_]/g, (c2) => `\\${c2}`);
async function searchAthletesForCoach(db, coach, q, limit3) {
  if (!coach.roles.includes(COACH_ROLE) || !await isVerifiedCoach(db, coach.id)) return [];
  const words = q.split(/\s+/).filter(Boolean).slice(0, 4);
  let nameMatch = db`TRUE`;
  for (const w of words) {
    const prefix = `${likeLiteral3(w)}%`;
    const inner = `% ${likeLiteral3(w)}%`;
    nameMatch = db`${nameMatch} AND (
      u.display_name ILIKE ${prefix} OR u.display_name ILIKE ${inner}
      OR up.first_name ILIKE ${prefix} OR up.last_name ILIKE ${prefix})`;
  }
  const rows = await db`
    SELECT u.id, u.display_name, up.first_name, up.last_name,
           COALESCE(ap.sport, '') AS sport, COALESCE(ap.school, '') AS school,
           COALESCE(ap.showcase_visible, TRUE) AS visible, c.status AS conn_status, c.requested_by
    FROM users u
    LEFT JOIN user_profiles up ON up.user_id = u.id
    LEFT JOIN athlete_profiles ap ON ap.user_id = u.id
    LEFT JOIN coach_athlete_connections c ON c.coach_id = ${coach.id} AND c.athlete_id = u.id
    WHERE u.is_active = TRUE AND u.deleted_at IS NULL AND u.id <> ${coach.id}
      AND EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id AND r.name = ${ATHLETE_ROLE})
      AND (COALESCE(ap.showcase_visible, TRUE) = TRUE OR c.status = 'accepted')
      AND ${nameMatch}
    ORDER BY (c.status = 'accepted') DESC NULLS LAST, u.display_name, u.id
    LIMIT ${limit3}`;
  return rows.map((r) => ({
    id: r.id,
    displayName: r.display_name,
    ...r.first_name?.trim() ? { firstName: r.first_name.trim() } : {},
    ...r.last_name?.trim() ? { lastName: r.last_name.trim() } : {},
    sport: r.sport,
    school: r.school,
    relationship: r.conn_status === "accepted" ? "connected" : r.conn_status === "pending" ? r.requested_by === coach.id ? "request_sent" : "request_received" : "none",
    hasShowcase: r.sport !== "" && r.visible
  }));
}
async function searchCoachesForAthlete(db, athlete, q, limit3) {
  if (!athlete.roles.includes(ATHLETE_ROLE)) return [];
  const words = q.split(/\s+/).filter(Boolean).slice(0, 4);
  let match = db`TRUE`;
  for (const w of words) {
    const prefix = `${likeLiteral3(w)}%`;
    const inner = `% ${likeLiteral3(w)}%`;
    match = db`${match} AND (u.display_name ILIKE ${prefix} OR u.display_name ILIKE ${inner} OR cp.organization ILIKE ${prefix} OR cp.organization ILIKE ${inner})`;
  }
  const rows = await db`
    SELECT u.id, u.display_name, cp.organization, cp.sport_specialization AS sport, a.status AS app_status, c.status AS conn_status
    FROM users u
    JOIN coach_profiles cp ON cp.user_id = u.id
    LEFT JOIN athlete_applications a ON a.coach_id = u.id AND a.athlete_id = ${athlete.id}
    LEFT JOIN coach_athlete_connections c ON c.coach_id = u.id AND c.athlete_id = ${athlete.id}
    WHERE u.is_active = TRUE AND u.deleted_at IS NULL
      AND EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id AND r.name = 'verified_coach')
      AND ${match}
    ORDER BY u.display_name, u.id LIMIT ${limit3}`;
  return rows.map((r) => ({
    id: r.id,
    displayName: r.display_name,
    organization: r.organization ?? "",
    sport: r.sport ?? "",
    relationship: r.conn_status === "accepted" ? "connected" : r.app_status ? "applied" : "none"
  }));
}
async function globalSearch(user, rawQuery, rawLimit = 5, dbArg) {
  const q = rawQuery.trim().slice(0, GLOBAL_SEARCH_MAX_CHARS);
  if (q.length < GLOBAL_SEARCH_MIN_CHARS) return { athletes: [], scholarships: [], coaches: [] };
  const limit3 = Math.min(Math.max(Math.trunc(Number.isFinite(rawLimit) ? rawLimit : 5), 1), 10);
  const db = dbArg ?? await getDb();
  const [scholarships, athletes, coaches] = await Promise.all([
    listScholarships(user, { q, limit: limit3, offset: 0 }, db).then((r) => r.items),
    searchAthletesForCoach(db, user, q, limit3),
    searchCoachesForAthlete(db, user, q, limit3)
  ]);
  return { athletes, scholarships, coaches };
}

// server/admin-account.server.ts
import { randomUUID as randomUUID9 } from "node:crypto";
var ADMIN_LOCK_ID = 727274002;
async function provisionAdminAccount(dbArg, env = process.env) {
  const cfgResult = readAdminConfig(env);
  if (cfgResult.state === "not_configured") return { state: "disabled", reason: "ADMIN_EMAIL and ADMIN_PASSWORD are not set." };
  if (cfgResult.state === "invalid") return { state: "disabled", reason: cfgResult.problem };
  const cfg = cfgResult.config;
  const db = dbArg ?? await getDb();
  return db.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(${ADMIN_LOCK_ID})`;
    const ts = /* @__PURE__ */ new Date();
    const [role] = await tx`SELECT id FROM roles WHERE name = 'admin'`;
    if (!role) return { state: "disabled", reason: "The admin role does not exist in the database." };
    const [existing] = await tx`
      SELECT id, username, password_hash FROM users WHERE lower(email) = ${cfg.email} AND deleted_at IS NULL`;
    let adminId;
    let created = false;
    let passwordChanged = false;
    if (!existing) {
      const [nameTaken] = await tx`SELECT 1 AS x FROM users WHERE lower(username) = ${cfg.username.toLowerCase()}`;
      if (nameTaken) return { state: "disabled", reason: `ADMIN_USERNAME "${cfg.username}" is already used by another account. Choose a different one.` };
      adminId = randomUUID9();
      const hash = await hashPassword(cfg.password);
      await tx`
        INSERT INTO users (id, email, username, password_hash, display_name, password_changed_at, created_at, updated_at)
        VALUES (${adminId}, ${cfg.email}, ${cfg.username}, ${hash}, ${cfg.displayName}, ${ts}, ${ts}, ${ts})`;
      await tx`INSERT INTO user_profiles (user_id, first_name, last_name, updated_at) VALUES (${adminId}, NULL, NULL, ${ts})`;
      await tx`INSERT INTO user_roles (user_id, role_id, granted_at) VALUES (${adminId}, ${role.id}, ${ts})`;
      await audit("admin.provisioned", { userId: adminId }, tx);
      created = true;
    } else {
      adminId = existing.id;
      const [holdsRole] = await tx`SELECT 1 AS x FROM user_roles WHERE user_id = ${adminId} AND role_id = ${role.id}`;
      if (!holdsRole)
        return { state: "disabled", reason: "ADMIN_EMAIL belongs to an existing non-administrator account. Use an email address that nobody has registered with." };
      if (!await verifyPassword(cfg.password, existing.password_hash)) {
        await tx`UPDATE users SET password_hash = ${await hashPassword(cfg.password)}, password_changed_at = ${ts}, updated_at = ${ts} WHERE id = ${adminId}`;
        await tx`DELETE FROM sessions WHERE user_id = ${adminId}`;
        await audit("admin.password_rotated", { userId: adminId }, tx);
        passwordChanged = true;
      }
      if (existing.username.toLowerCase() !== cfg.username.toLowerCase()) {
        const [nameTaken] = await tx`SELECT 1 AS x FROM users WHERE lower(username) = ${cfg.username.toLowerCase()} AND id <> ${adminId}`;
        if (!nameTaken) await tx`UPDATE users SET username = ${cfg.username}, updated_at = ${ts} WHERE id = ${adminId}`;
      }
    }
    const others = await tx`
      DELETE FROM user_roles WHERE role_id = ${role.id} AND user_id <> ${adminId} RETURNING user_id`;
    for (const o of others) {
      await tx`DELETE FROM sessions WHERE user_id = ${o.user_id}`;
      await audit("admin.role_revoked", { userId: o.user_id, detail: { reason: "not the configured administrator" } }, tx);
    }
    return { state: "ready", created, passwordChanged, revokedOthers: others.length };
  });
}
var started;
function ensureAdminAccount() {
  started ??= (async () => {
    const result = await provisionAdminAccount();
    if (result.state === "disabled") {
      console.warn(`[admin] administrator sign-in is disabled: ${result.reason}`);
    } else if (result.created) {
      console.log("[admin] administrator account created from ADMIN_EMAIL.");
    } else if (result.passwordChanged) {
      console.log("[admin] administrator password updated from ADMIN_PASSWORD.");
    }
    if (result.state === "ready" && result.revokedOthers > 0)
      console.warn(`[admin] removed the administrator role from ${result.revokedOthers} other account(s).`);
  })().catch((err) => {
    started = void 0;
    throw err;
  });
  return started;
}

// server/admin.server.ts
function requireAdmin(actor) {
  if (!actor.roles.includes("admin"))
    throw new ConnectionError(403, "not_an_admin", "Administrator access is required.");
}
var ACTIVITY_EVENTS = [
  "admin.login.success",
  "admin.login.failed",
  "admin.login.blocked",
  "login.success",
  "login.failed",
  "user.created",
  "logout",
  "admin.provisioned",
  "admin.password_rotated",
  "admin.role_revoked"
];
function rolesFromDetail(detail) {
  if (!detail) return null;
  try {
    const roles = JSON.parse(detail).roles;
    return Array.isArray(roles) ? roles.filter((r) => typeof r === "string") : null;
  } catch {
    return null;
  }
}
async function getAdminOverview(actor) {
  requireAdmin(actor);
  const db = await getDb();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1e3);
  const roleCounts = await db`
    SELECT r.name, COUNT(DISTINCT u.id)::int AS n
    FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN users u ON u.id = ur.user_id
    WHERE u.deleted_at IS NULL AND u.is_active = TRUE GROUP BY r.name`;
  const count = (name2) => roleCounts.find((r) => r.name === name2)?.n ?? 0;
  const [inactive] = await db`SELECT COUNT(*)::int AS n FROM users WHERE is_active = FALSE AND deleted_at IS NULL`;
  const [pending] = await db`SELECT COUNT(*)::int AS n FROM coach_verifications WHERE status = 'pending'`;
  const [ok] = await db`
    SELECT COUNT(*)::int AS n FROM audit_log WHERE event IN ('login.success', 'admin.login.success') AND created_at > ${since}`;
  const [bad] = await db`
    SELECT COUNT(*)::int AS n FROM audit_log WHERE event IN ('login.failed', 'admin.login.failed') AND created_at > ${since}`;
  const recent = await db`
    SELECT event, identifier, detail, created_at FROM audit_log WHERE event IN ${db(ACTIVITY_EVENTS)}
    ORDER BY created_at DESC, id DESC LIMIT 10`;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3);
  const [totals] = await db`
    SELECT
      COUNT(*) FILTER (WHERE NOT is_admin)::int AS users,
      COUNT(*) FILTER (WHERE is_athlete)::int AS athletes,
      COUNT(*) FILTER (WHERE NOT is_admin AND created_at > ${weekAgo})::int AS users_week,
      COUNT(*) FILTER (WHERE is_athlete AND created_at > ${weekAgo})::int AS athletes_week
    FROM (
      SELECT u.created_at,
             EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id AND r.name = 'admin') AS is_admin,
             EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id AND r.name = 'student_athlete') AS is_athlete
      FROM users u WHERE u.deleted_at IS NULL
    ) x`;
  const [schools] = await db`SELECT COUNT(*)::int AS n FROM universities`;
  const months = await db`
    SELECT to_char(m, 'Mon') AS month,
           COUNT(DISTINCT u.id) FILTER (WHERE r.name = 'student_athlete')::int AS athletes,
           COUNT(DISTINCT u.id) FILTER (WHERE r.name = 'coach')::int AS coaches,
           COUNT(DISTINCT u.id) FILTER (WHERE r.name = 'university_representative')::int AS school_reps
    FROM generate_series(date_trunc('month', now()) - interval '5 months', date_trunc('month', now()), interval '1 month') AS m
    LEFT JOIN users u ON date_trunc('month', u.created_at) = m AND u.deleted_at IS NULL
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
    GROUP BY m ORDER BY m`;
  return {
    totals: {
      users: totals?.users ?? 0,
      athletes: totals?.athletes ?? 0,
      schools: schools?.n ?? 0,
      pending: pending?.n ?? 0,
      usersThisWeek: totals?.users_week ?? 0,
      athletesThisWeek: totals?.athletes_week ?? 0
    },
    registrations: months.map((m) => ({ month: m.month, athletes: m.athletes, coaches: m.coaches, schoolReps: m.school_reps })),
    users: {
      students: count("student_athlete"),
      coaches: count("coach"),
      verifiedCoaches: count("verified_coach"),
      universityReps: count("university_representative"),
      inactive: inactive?.n ?? 0
    },
    pendingVerifications: pending?.n ?? 0,
    signIns24h: { succeeded: ok?.n ?? 0, failed: bad?.n ?? 0 },
    recentActivity: recent.map((r) => ({ event: r.event, identifier: r.identifier, roles: rolesFromDetail(r.detail), at: r.created_at.toISOString() }))
  };
}

// server/university.server.ts
var UNIVERSITY_PAGE_DEFAULT = 50;
var UNIVERSITY_PAGE_MAX = 100;
var SEARCH_MAX = 80;
var UniversityError = class extends Error {
  httpStatus;
  code;
  constructor(httpStatus, code, message) {
    super(message);
    this.httpStatus = httpStatus;
    this.code = code;
  }
};
var likeLiteral4 = (t) => t.replace(/[\\%_]/g, (c2) => `\\${c2}`);
function requireCoach4(user) {
  if (!user.roles.includes(COACH_ROLE)) throw new UniversityError(403, "role_not_allowed", "Only coaches can open My University.");
}
async function resolve(db, user) {
  requireCoach4(user);
  if (!await isVerifiedCoach(db, user.id)) return { affiliated: false, reason: "not_verified" };
  const [row] = await db`SELECT university_id FROM coach_profiles WHERE user_id = ${user.id}`;
  if (!row?.university_id) return { affiliated: false, reason: "no_university" };
  return { affiliated: true, universityId: row.university_id };
}
var VERIFIED_AND_ACTIVE = (db, coachAlias) => db`
  EXISTS (SELECT 1 FROM user_roles vr JOIN roles r ON r.id = vr.role_id WHERE vr.user_id = ${db(coachAlias)}.id AND r.name = 'verified_coach')
  AND EXISTS (SELECT 1 FROM coach_verifications cv WHERE cv.coach_id = ${db(coachAlias)}.id AND cv.status = 'verified')
  AND ${db(coachAlias)}.is_active = TRUE AND ${db(coachAlias)}.deleted_at IS NULL`;
function searchPattern(q) {
  const needle = q?.trim().slice(0, SEARCH_MAX);
  return needle ? `%${likeLiteral4(needle)}%` : null;
}
async function getMyUniversity(user, dbArg) {
  const db = dbArg ?? await getDb();
  const me = await resolve(db, user);
  if (!me.affiliated) return me;
  const [u] = await db`
    SELECT id, name, logo_url, location, description, website FROM universities WHERE id = ${me.universityId}`;
  if (!u) return { affiliated: false, reason: "no_university" };
  return { affiliated: true, university: { id: u.id, name: u.name, logoUrl: u.logo_url, location: u.location, description: u.description, website: u.website } };
}
async function listUniversityCoaches(user, page, dbArg) {
  const db = dbArg ?? await getDb();
  const me = await resolve(db, user);
  if (!me.affiliated) return { affiliated: false, reason: me.reason, items: [], total: 0 };
  const pattern = searchPattern(page.q);
  const name2 = db`COALESCE(NULLIF(btrim(concat_ws(' ', up.first_name, up.last_name)), ''), u.display_name)`;
  const rows = await db`
    SELECT u.id, ${name2} AS name, cp.sport_specialization AS sport, cp.coaching_position AS position, cp.program_name,
           count(*) OVER ()::int AS total
    FROM coach_profiles cp
    JOIN users u ON u.id = cp.user_id
    LEFT JOIN user_profiles up ON up.user_id = u.id
    WHERE cp.university_id = ${me.universityId} AND ${VERIFIED_AND_ACTIVE(db, "u")}
      ${pattern ? db`AND ${name2} ILIKE ${pattern}` : db``}
    ORDER BY ${name2}, u.id
    LIMIT ${page.limit} OFFSET ${page.offset}`;
  return {
    affiliated: true,
    total: rows[0]?.total ?? 0,
    items: rows.map((r) => ({
      id: r.id,
      name: r.name,
      sport: r.sport,
      position: r.position,
      programName: r.program_name,
      status: "verified",
      accountStatus: "active",
      isYou: r.id === user.id
    }))
  };
}
async function listUniversityAthletes(user, page, dbArg) {
  const db = dbArg ?? await getDb();
  const me = await resolve(db, user);
  if (!me.affiliated) return { affiliated: false, reason: me.reason, items: [], total: 0 };
  const pattern = searchPattern(page.q);
  const name2 = db`COALESCE(NULLIF(btrim(concat_ws(' ', up.first_name, up.last_name)), ''), a.display_name)`;
  const rows = await db`
    WITH affiliated AS (
      -- accepted connections with a verified coach of THIS university; one row per athlete
      SELECT c.athlete_id, min(COALESCE(c.responded_at, c.updated_at)) AS since, bool_or(c.coach_id = ${user.id}) AS mine
      FROM coach_athlete_connections c
      JOIN coach_profiles cp ON cp.user_id = c.coach_id AND cp.university_id = ${me.universityId}
      JOIN users u ON u.id = c.coach_id
      WHERE c.status = 'accepted' AND ${VERIFIED_AND_ACTIVE(db, "u")}
      GROUP BY c.athlete_id
    )
    SELECT a.id, ${name2} AS name, COALESCE(ap.sport, '') AS sport, COALESCE(ap.playing_position, '') AS position,
           af.since, count(*) OVER ()::int AS total
    FROM affiliated af
    JOIN users a ON a.id = af.athlete_id
    LEFT JOIN user_profiles up ON up.user_id = a.id
    LEFT JOIN athlete_profiles ap ON ap.user_id = a.id
    WHERE a.is_active = TRUE AND a.deleted_at IS NULL
      AND (af.mine OR COALESCE(ap.showcase_visible, TRUE) = TRUE)
      ${pattern ? db`AND ${name2} ILIKE ${pattern}` : db``}
    ORDER BY ${name2}, a.id
    LIMIT ${page.limit} OFFSET ${page.offset}`;
  return {
    affiliated: true,
    total: rows[0]?.total ?? 0,
    items: rows.map((r) => ({ id: r.id, name: r.name, sport: r.sport, position: r.position, affiliationStatus: "approved", affiliatedSince: r.since.toISOString() }))
  };
}

// server/coach-applications.server.ts
import { randomUUID as randomUUID10 } from "node:crypto";
var APPLICATIONS_PER_DAY = 10;
var CoachApplicationError = class extends Error {
  httpStatus;
  code;
  constructor(httpStatus, code, message) {
    super(message);
    this.httpStatus = httpStatus;
    this.code = code;
  }
};
var notFound = () => new CoachApplicationError(404, "not_found", "Not found.");
async function applyToCoach(user, coachId, meta = {}, dbArg) {
  if (!user.roles.includes(ATHLETE_ROLE)) throw new CoachApplicationError(403, "role_not_allowed", "Only student-athletes can show interest in a coach.");
  const db = dbArg ?? await getDb();
  const [coach] = await db`
    SELECT u.id, u.display_name, cp.organization
    FROM users u
    LEFT JOIN coach_profiles cp ON cp.user_id = u.id
    WHERE u.id = ${coachId} AND u.is_active = TRUE AND u.deleted_at IS NULL`;
  if (!coach || !user.id || coachId === user.id || !await isVerifiedCoach(db, coachId)) throw notFound();
  const [connected] = await db`SELECT 1 FROM coach_athlete_connections WHERE coach_id = ${coachId} AND athlete_id = ${user.id} AND status = 'accepted'`;
  if (connected) throw new CoachApplicationError(409, "already_connected", "You are already connected to this coach.");
  const id = randomUUID10();
  const now6 = /* @__PURE__ */ new Date();
  const [today] = await db`
    SELECT count(*)::int AS n FROM athlete_applications WHERE athlete_id = ${user.id} AND created_at > ${new Date(now6.getTime() - 24 * 60 * 60 * 1e3)}`;
  if ((today?.n ?? 0) >= APPLICATIONS_PER_DAY) throw new CoachApplicationError(429, "rate_limited", "You have applied to a lot of coaches today. Please try again tomorrow.");
  const rows = await db`
    INSERT INTO athlete_applications (id, coach_id, athlete_id, status, created_at, updated_at)
    VALUES (${id}, ${coachId}, ${user.id}, 'new', ${now6}, ${now6})
    ON CONFLICT (coach_id, athlete_id) DO NOTHING RETURNING id`;
  if (rows.length === 0) throw new CoachApplicationError(409, "already_applied", "You have already shown interest in this coach.");
  await audit("coach_application.sent", { userId: user.id, ...meta, detail: { applicationId: id, coachId } }, db);
  await notify(coachId, { category: "application", title: "New athlete application", message: `${user.displayName} is interested in your program.`, link: "/coach/applications" }, db);
  return { id, status: "new", createdAt: now6.toISOString(), coach: { id: coach.id, displayName: coach.display_name, organization: coach.organization ?? "" } };
}
async function listApplications(user, dbArg) {
  const db = dbArg ?? await getDb();
  if (user.roles.includes(COACH_ROLE)) {
    if (!await isVerifiedCoach(db, user.id)) throw new CoachApplicationError(403, "coach_not_verified", "Your coach account must be verified first.");
    const rows = await db`
      SELECT a.id, a.status, a.created_at, u.id AS athlete_id,
             COALESCE(NULLIF(btrim(concat_ws(' ', up.first_name, up.last_name)), ''), u.display_name) AS name,
             COALESCE(ap.sport, '') AS sport, COALESCE(ap.school, '') AS school, COALESCE(ap.showcase_visible, TRUE) AS visible,
             c.status AS conn_status, c.requested_by
      FROM athlete_applications a
      JOIN users u ON u.id = a.athlete_id
      LEFT JOIN user_profiles up ON up.user_id = u.id
      LEFT JOIN athlete_profiles ap ON ap.user_id = u.id
      LEFT JOIN coach_athlete_connections c ON c.coach_id = a.coach_id AND c.athlete_id = a.athlete_id
      WHERE a.coach_id = ${user.id} AND u.is_active = TRUE AND u.deleted_at IS NULL
      ORDER BY (a.status = 'new') DESC, a.created_at DESC, a.id`;
    return {
      received: rows.map((r) => ({
        id: r.id,
        status: r.status,
        createdAt: r.created_at.toISOString(),
        athlete: { id: r.athlete_id, displayName: r.name, sport: r.sport, school: r.school },
        hasShowcase: r.sport !== "" && r.visible,
        relationship: r.conn_status === "accepted" ? "connected" : r.conn_status === "pending" ? r.requested_by === user.id ? "request_sent" : "request_received" : "none"
      }))
    };
  }
  if (user.roles.includes(ATHLETE_ROLE)) {
    const rows = await db`
      SELECT a.id, a.status, a.created_at, u.id AS coach_id, u.display_name AS name, cp.organization
      FROM athlete_applications a
      JOIN users u ON u.id = a.coach_id
      LEFT JOIN coach_profiles cp ON cp.user_id = u.id
      WHERE a.athlete_id = ${user.id} ORDER BY a.created_at DESC, a.id`;
    return { sent: rows.map((r) => ({ id: r.id, status: r.status, createdAt: r.created_at.toISOString(), coach: { id: r.coach_id, displayName: r.name, organization: r.organization ?? "" } })) };
  }
  throw new CoachApplicationError(403, "role_not_allowed", "Only coaches and student-athletes have applications.");
}
async function setApplicationStatus2(user, applicationId, status, dbArg) {
  const db = dbArg ?? await getDb();
  if (!user.roles.includes(COACH_ROLE)) throw new CoachApplicationError(403, "role_not_allowed", "Only coaches can do this.");
  if (!await isVerifiedCoach(db, user.id)) throw new CoachApplicationError(403, "coach_not_verified", "Your coach account must be verified first.");
  const rows = await db`UPDATE athlete_applications SET status = ${status}, updated_at = ${/* @__PURE__ */ new Date()} WHERE id = ${applicationId} AND coach_id = ${user.id} RETURNING id`;
  if (rows.length === 0) throw notFound();
  return status;
}

// server/recruiting.server.ts
import { randomUUID as randomUUID11 } from "node:crypto";
var DIRECTORY_LIMIT_DEFAULT = 60;
var DIRECTORY_LIMIT_MAX = 100;
var INQUIRIES_PER_DAY = 25;
var NOTE_MAX2 = 500;
var MESSAGE_MAX = 2e3;
var INQUIRY_MESSAGE_MAX = 1e3;
var ORGANIZATION_MAX = 120;
var UUID_RE6 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var RecruitingError = class extends Error {
  httpStatus;
  code;
  constructor(httpStatus, code, message) {
    super(message);
    this.httpStatus = httpStatus;
    this.code = code;
  }
};
var STATUS = { awaiting: "Pending", replied: "Accepted", accepted: "Accepted", declined: "Declined" };
var round13 = (n) => Math.round(n * 10) / 10;
async function requireVerifiedCoach2(db, user) {
  if (!user.roles.includes(COACH_ROLE)) throw new RecruitingError(403, "role_not_allowed", "Only coaches can recruit.");
  if (!await isVerifiedCoach(db, user.id))
    throw new RecruitingError(403, "coach_not_verified", "Your coach account must be verified before you can recruit athletes.");
}
function requireAthlete5(user) {
  if (!user.roles.includes(ATHLETE_ROLE)) throw new RecruitingError(403, "role_not_allowed", "Only student-athletes can do this.");
}
var isUuid = (id) => UUID_RE6.test(id);
var notFound2 = () => new RecruitingError(404, "not_found", "Not found.");
async function loadDirectory(db, opts = {}) {
  const rows = await db`
    SELECT u.id, up.first_name, up.last_name, u.display_name,
           ap.sport, ap.playing_position AS position, ap.school, ap.year_level AS year, ap.height_cm::float8 AS height_cm,
           ap.bio, ap.team_status, ap.team_name, ap.municipality, ap.province, ap.showcase_visible AS visible
    FROM athlete_profiles ap
    JOIN users u ON u.id = ap.user_id
    LEFT JOIN user_profiles up ON up.user_id = u.id
    WHERE u.is_active = TRUE AND u.deleted_at IS NULL AND ap.sport <> ''
      ${opts.includeHidden ? db`` : db`AND ap.showcase_visible = TRUE`}
      ${opts.onlyId ? db`AND u.id = ${opts.onlyId}` : db``}`;
  if (rows.length === 0) return [];
  const sessionRows = await db`
    SELECT athlete_id, skill, count(*)::int AS n, sum(result)::float8 AS total,
           (count(*) FILTER (WHERE status = 'coach_verified'))::int AS verified
    FROM practice_sessions
    WHERE status IN ('ai_assessed', 'coach_verified') ${opts.onlyId ? db`AND athlete_id = ${opts.onlyId}` : db``}
    GROUP BY athlete_id, skill`;
  const bySkill = /* @__PURE__ */ new Map();
  for (const r of sessionRows) {
    const list = bySkill.get(r.athlete_id);
    if (list) list.push(r);
    else bySkill.set(r.athlete_id, [r]);
  }
  const achievements = await db`
    SELECT athlete_id, title, year FROM athlete_achievements
    WHERE ${opts.onlyId ? db`athlete_id = ${opts.onlyId}` : db`TRUE`} ORDER BY athlete_id, position`;
  const achBy = /* @__PURE__ */ new Map();
  for (const a of achievements) {
    const list = achBy.get(a.athlete_id);
    if (list) list.push({ title: a.title, year: a.year });
    else achBy.set(a.athlete_id, [{ title: a.title, year: a.year }]);
  }
  const ranks = await headlinePositions(db, "");
  return rows.map((r) => {
    const mine = (bySkill.get(r.id) ?? []).filter((s) => skillById(s.skill)?.sport === r.sport);
    const total = mine.reduce((a, s) => a + s.n, 0);
    const verified = mine.reduce((a, s) => a + s.verified, 0);
    const rated = mine.filter((s) => skillById(s.skill)?.unit === "%");
    const ratedN = rated.reduce((a, s) => a + s.n, 0);
    const score = ratedN ? round13(rated.reduce((a, s) => a + s.total, 0) / ratedN) : 0;
    const skillList = mine.map((s) => ({ id: s.skill, avg: s.total / s.n, pct: skillById(s.skill)?.unit === "%" })).sort((x, y) => Number(y.pct) - Number(x.pct) || (x.pct ? y.avg - x.avg : x.avg - y.avg)).slice(0, 3).map((s) => ({ name: skillById(s.id)?.name ?? s.id, value: formatResult(s.id, Math.round(s.avg * 10) / 10) }));
    const first = r.first_name ?? r.display_name.trim().split(/\s+/)[0] ?? "";
    const last = r.last_name ?? r.display_name.trim().split(/\s+/).slice(1).join(" ");
    return {
      id: r.id,
      firstName: first,
      lastName: last,
      sport: r.sport,
      position: r.position,
      school: r.school,
      year: r.year,
      height: r.height_cm === null ? "" : formatHeight(r.height_cm),
      bio: r.bio,
      teamStatus: r.team_status,
      ...r.team_name ? { teamName: r.team_name } : {},
      municipality: r.municipality,
      province: r.province,
      performanceScore: score,
      rank: ranks.get(r.id) ?? 0,
      verifiedSessions: verified,
      totalSessions: total,
      skills: skillList,
      achievements: achBy.get(r.id) ?? [],
      visible: r.visible
    };
  });
}
var distinct = (xs) => [...new Set(xs.filter(Boolean))].sort((a, b) => a.localeCompare(b));
var verifiedShare = (a) => a.totalSessions ? a.verifiedSessions / a.totalSessions : 0;
async function listAthletes(user, q, dbArg) {
  const db = dbArg ?? await getDb();
  await requireVerifiedCoach2(db, user);
  const all = await loadDirectory(db);
  const inSport = all.filter((a) => !q.sport || a.sport === q.sport);
  const needle = q.q?.trim().toLowerCase().slice(0, 80);
  const matches2 = inSport.filter((a) => !q.position || a.position === q.position).filter((a) => !q.school || a.school === q.school).filter((a) => !q.skill || a.skills.some((s) => s.name === q.skill)).filter((a) => !q.verifiedOnly || a.verifiedSessions > 0).filter((a) => !needle || [a.firstName, a.lastName, a.school, a.position, a.bio, ...a.skills.map((s) => s.name)].some((x) => x.toLowerCase().includes(needle))).sort((x, y) => q.sort === "verified" ? verifiedShare(y) - verifiedShare(x) || x.lastName.localeCompare(y.lastName) : q.sort === "name" ? `${x.firstName} ${x.lastName}`.localeCompare(`${y.firstName} ${y.lastName}`) : y.performanceScore - x.performanceScore || `${x.firstName} ${x.lastName}`.localeCompare(`${y.firstName} ${y.lastName}`));
  const watch = await db`SELECT athlete_id FROM coach_shortlist WHERE coach_id = ${user.id}`;
  return {
    items: matches2.slice(q.offset, q.offset + q.limit),
    total: matches2.length,
    watchlist: watch.map((w) => w.athlete_id),
    options: {
      sports: distinct(all.map((a) => a.sport)),
      positions: distinct(inSport.map((a) => a.position)),
      schools: distinct(all.map((a) => a.school)),
      skills: distinct(inSport.flatMap((a) => a.skills.map((s) => s.name)))
    }
  };
}
async function getAthlete(user, athleteId, dbArg) {
  if (!isUuid(athleteId)) throw notFound2();
  const db = dbArg ?? await getDb();
  const own3 = user.roles.includes(ATHLETE_ROLE) && user.id === athleteId;
  let applicant = false;
  if (!own3 && (user.roles.includes("university_representative") || user.roles.includes("admin"))) {
    const admin = user.roles.includes("admin");
    const [hit] = await db`
      SELECT 1 FROM scholarship_applications a JOIN scholarships s ON s.id = a.scholarship_id
      WHERE a.athlete_id = ${athleteId} AND a.status <> 'withdrawn' AND (${admin} OR s.posted_by = ${user.id}) LIMIT 1`;
    applicant = !!hit;
  }
  if (!own3 && !applicant) await requireVerifiedCoach2(db, user);
  const [athlete] = await loadDirectory(db, { onlyId: athleteId, includeHidden: own3 || applicant });
  if (!athlete) throw notFound2();
  if (own3 || applicant) return { athlete, own: own3, applicant, watched: false, note: "", inquiry: null };
  const [w] = await db`SELECT note FROM coach_shortlist WHERE coach_id = ${user.id} AND athlete_id = ${athleteId}`;
  const [inq] = await db`
    SELECT id, status FROM recruitment_inquiries
    WHERE coach_id = ${user.id} AND athlete_id = ${athleteId} AND status <> 'declined' ORDER BY created_at DESC LIMIT 1`;
  return { athlete, own: false, applicant: false, watched: !!w, note: w?.note ?? "", inquiry: inq ? { id: inq.id, status: STATUS[inq.status] ?? "Pending" } : null };
}
async function listWatchlist(user, dbArg) {
  const db = dbArg ?? await getDb();
  await requireVerifiedCoach2(db, user);
  const rows = await db`
    SELECT athlete_id, note FROM coach_shortlist WHERE coach_id = ${user.id} ORDER BY created_at DESC`;
  if (rows.length === 0) return { items: [] };
  const all = new Map((await loadDirectory(db)).map((a) => [a.id, a]));
  return { items: rows.flatMap((r) => {
    const a = all.get(r.athlete_id);
    return a ? [{ ...a, note: r.note }] : [];
  }) };
}
async function setNote(user, athleteId, rawNote, dbArg) {
  const db = dbArg ?? await getDb();
  await requireVerifiedCoach2(db, user);
  const note = rawNote.trim();
  if (note.length > NOTE_MAX2) throw new RecruitingError(400, "validation", `Notes are limited to ${NOTE_MAX2} characters.`);
  if (!isUuid(athleteId)) throw notFound2();
  const rows = await db`UPDATE coach_shortlist SET note = ${note} WHERE coach_id = ${user.id} AND athlete_id = ${athleteId} RETURNING athlete_id`;
  if (rows.length === 0) throw new RecruitingError(409, "not_saved", "Save the athlete to your watchlist before adding a note.");
  return { note };
}
var toInquiry = (r) => ({
  id: r.id,
  athleteId: r.athlete_id,
  athleteName: r.athlete_name,
  recruiterId: r.coach_id,
  recruiterName: r.coach_name,
  organization: r.organization,
  message: r.message,
  status: STATUS[r.status] ?? "Pending",
  createdAt: r.created_at.toISOString(),
  updatedAt: r.updated_at.toISOString(),
  unread: r.unread
});
var SELECT_INQUIRY = (db, viewerId) => db`
  SELECT i.id, i.coach_id, i.athlete_id, i.status, i.organization, i.message, i.created_at, i.updated_at,
         au.display_name AS athlete_name, cu.display_name AS coach_name,
         (SELECT count(*)::int FROM coach_messages m WHERE m.inquiry_id = i.id AND m.sender_id <> ${viewerId} AND m.read_at IS NULL) AS unread
  FROM recruitment_inquiries i
  JOIN users au ON au.id = i.athlete_id
  JOIN users cu ON cu.id = i.coach_id`;
async function listInquiries(user, dbArg) {
  const db = dbArg ?? await getDb();
  const isCoach = user.roles.includes(COACH_ROLE);
  if (!isCoach && !user.roles.includes(ATHLETE_ROLE)) throw new RecruitingError(403, "role_not_allowed", "Only coaches and student-athletes have inquiries.");
  const rows = await db`
    ${SELECT_INQUIRY(db, user.id)}
    WHERE ${isCoach ? db`i.coach_id = ${user.id}` : db`i.athlete_id = ${user.id}`}
    ORDER BY i.updated_at DESC, i.id`;
  return { items: rows.map(toInquiry) };
}
async function sendInquiry(user, input, meta = {}, dbArg) {
  const db = dbArg ?? await getDb();
  await requireVerifiedCoach2(db, user);
  const organization = input.organization.trim();
  const message = input.message.trim();
  if (organization.length < 2 || organization.length > ORGANIZATION_MAX) throw new RecruitingError(400, "validation", "Name your organization or program (2-120 characters).");
  if (!message || message.length > INQUIRY_MESSAGE_MAX) throw new RecruitingError(400, "validation", `Write a message of up to ${INQUIRY_MESSAGE_MAX} characters.`);
  if (!isUuid(input.athleteId)) throw notFound2();
  const [athlete] = await db`
    SELECT u.id, COALESCE(ap.showcase_visible, TRUE) AS visible
    FROM users u
    JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id
    LEFT JOIN athlete_profiles ap ON ap.user_id = u.id
    WHERE u.id = ${input.athleteId} AND r.name = ${ATHLETE_ROLE} AND u.is_active = TRUE AND u.deleted_at IS NULL`;
  if (!athlete) throw notFound2();
  if (!athlete.visible) throw new RecruitingError(409, "showcase_hidden", "This athlete has hidden their showcase, so new inquiries are closed.");
  const id = randomUUID11();
  const now6 = /* @__PURE__ */ new Date();
  await db.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(hashtext(${`inq:${user.id}:${input.athleteId}`}))`;
    const [open2] = await tx`SELECT 1 FROM recruitment_inquiries WHERE coach_id = ${user.id} AND athlete_id = ${input.athleteId} AND status <> 'declined'`;
    if (open2) throw new RecruitingError(409, "already_open", "You already have an open inquiry with this athlete.");
    const [today] = await tx`
      SELECT count(*)::int AS n FROM recruitment_inquiries WHERE coach_id = ${user.id} AND created_at > ${new Date(now6.getTime() - 24 * 60 * 60 * 1e3)}`;
    if ((today?.n ?? 0) >= INQUIRIES_PER_DAY) throw new RecruitingError(429, "rate_limited", "You have sent a lot of inquiries today. Please try again tomorrow.");
    await tx`
      INSERT INTO recruitment_inquiries (id, coach_id, athlete_id, status, organization, message, created_at, updated_at)
      VALUES (${id}, ${user.id}, ${input.athleteId}, 'awaiting', ${organization}, ${message}, ${now6}, ${now6})`;
  });
  await audit("recruiting.inquiry_sent", { userId: user.id, ...meta, detail: { inquiryId: id, athleteId: input.athleteId } }, db);
  await notify(input.athleteId, { category: "recruitment", title: "New recruitment inquiry", message: `${user.displayName} (${organization}) sent you an inquiry.`, link: "/recruiting" }, db);
  const [row] = await db`${SELECT_INQUIRY(db, user.id)} WHERE i.id = ${id}`;
  return toInquiry(row);
}
async function respondToInquiry(user, inquiryId, decision, meta = {}, dbArg) {
  requireAthlete5(user);
  if (!isUuid(inquiryId)) throw notFound2();
  const db = dbArg ?? await getDb();
  const now6 = /* @__PURE__ */ new Date();
  const updated = await db`
    UPDATE recruitment_inquiries SET status = ${decision}, responded_at = ${now6}, updated_at = ${now6}
    WHERE id = ${inquiryId} AND athlete_id = ${user.id} AND status = 'awaiting' RETURNING coach_id`;
  const hit = updated[0];
  if (!hit) {
    const [exists] = await db`SELECT 1 FROM recruitment_inquiries WHERE id = ${inquiryId} AND athlete_id = ${user.id}`;
    if (!exists) throw notFound2();
    throw new RecruitingError(409, "already_answered", "This inquiry has already been answered.");
  }
  await audit(`recruiting.inquiry_${decision}`, { userId: user.id, ...meta, detail: { inquiryId } }, db);
  await notify(
    hit.coach_id,
    decision === "accepted" ? { category: "recruitment", title: "Inquiry accepted", message: `${user.displayName} accepted your inquiry. You can message each other now.`, link: `/recruiting?tab=messages&thread=${inquiryId}` } : { category: "recruitment", title: "Inquiry declined", message: `${user.displayName} declined your inquiry.` },
    db
  );
  const [row] = await db`${SELECT_INQUIRY(db, user.id)} WHERE i.id = ${inquiryId}`;
  return toInquiry(row);
}
async function loadParticipantInquiry(db, user, inquiryId) {
  if (!isUuid(inquiryId)) throw notFound2();
  const [r] = await db`
    SELECT coach_id, athlete_id, status FROM recruitment_inquiries
    WHERE id = ${inquiryId} AND (coach_id = ${user.id} OR athlete_id = ${user.id})`;
  if (!r) throw notFound2();
  return r;
}
async function listMessages(user, inquiryId, dbArg) {
  const db = dbArg ?? await getDb();
  const inq = await loadParticipantInquiry(db, user, inquiryId);
  const rows = await db`
    SELECT id, sender_id, body, created_at FROM coach_messages WHERE inquiry_id = ${inquiryId} ORDER BY created_at, id`;
  await db`UPDATE coach_messages SET read_at = ${/* @__PURE__ */ new Date()} WHERE inquiry_id = ${inquiryId} AND sender_id <> ${user.id} AND read_at IS NULL`;
  return {
    items: rows.map((m) => ({
      id: m.id,
      inquiryId,
      from: m.sender_id === inq.coach_id ? "recruiter" : "athlete",
      body: m.body,
      createdAt: m.created_at.toISOString()
    }))
  };
}
async function sendMessage(user, inquiryId, rawBody, dbArg) {
  const db = dbArg ?? await getDb();
  const inq = await loadParticipantInquiry(db, user, inquiryId);
  const body = rawBody.trim();
  if (!body) throw new RecruitingError(400, "validation", "A message cannot be empty.");
  if (body.length > MESSAGE_MAX) throw new RecruitingError(400, "validation", `Messages are limited to ${MESSAGE_MAX} characters.`);
  if (inq.status !== "accepted" && inq.status !== "replied")
    throw new RecruitingError(409, "not_accepted", "Messaging unlocks only after the athlete accepts the inquiry.");
  const id = randomUUID11();
  const now6 = /* @__PURE__ */ new Date();
  await db.begin(async (tx) => {
    await tx`
      INSERT INTO coach_messages (id, coach_id, athlete_id, sender_id, body, created_at, inquiry_id)
      VALUES (${id}, ${inq.coach_id}, ${inq.athlete_id}, ${user.id}, ${body}, ${now6}, ${inquiryId})`;
    await tx`UPDATE recruitment_inquiries SET updated_at = ${now6} WHERE id = ${inquiryId}`;
  });
  const other = user.id === inq.coach_id ? inq.athlete_id : inq.coach_id;
  await notify(other, { category: "recruitment", title: "New message", message: `${user.displayName}: ${body.length > 80 ? `${body.slice(0, 80)}\u2026` : body}`, link: `/recruiting?tab=${user.id === inq.coach_id ? "inbox" : "messages"}&thread=${inquiryId}` }, db);
  return { id, inquiryId, from: user.id === inq.coach_id ? "recruiter" : "athlete", body, createdAt: now6.toISOString() };
}

// server/handler.ts
var TRUST_PROXY = process.env["TRUST_PROXY"] === "true" || !!process.env["VERCEL"];
var MAX_BODY_BYTES = 16 * 1024;
var ALLOWED_ORIGINS = /* @__PURE__ */ new Set([
  "capacitor://localhost",
  "ionic://localhost",
  "http://localhost",
  "https://localhost",
  "http://localhost:5173",
  "http://localhost:8100",
  ...(process.env["CORS_ORIGINS"] ?? "").split(",").map((s) => s.trim()).filter(Boolean)
]);
var SOCKET_IP_HEADER = "x-sportal-socket-ip";
var loginSchema = external_exports.object({
  identifier: external_exports.string().trim().min(1, "Enter your username or email.").max(254),
  password: external_exports.string().min(1, "Enter your password.").max(128),
  remember: external_exports.boolean().default(false)
});
function requestMeta(req) {
  let ip;
  if (TRUST_PROXY) {
    const first = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    ip = first ?? req.headers.get("x-real-ip");
  } else {
    ip = req.headers.get(SOCKET_IP_HEADER);
  }
  return { ip: ip || null, userAgent: req.headers.get("user-agent") };
}
function bearer(req) {
  const h = req.headers.get("authorization");
  return (h ? /^Bearer\s+(\S+)$/i.exec(h) : null)?.[1];
}
function send(req, status, body) {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    vary: "Origin"
  });
  const origin = req.headers.get("origin");
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set("access-control-allow-origin", origin);
    headers.set("access-control-allow-headers", "authorization, content-type");
    headers.set("access-control-allow-methods", "GET, POST, PUT, DELETE, OPTIONS");
    headers.set("access-control-max-age", "600");
  }
  return new Response(status === 204 ? null : JSON.stringify(body), { status, headers });
}
var PHOTO_BODY_BYTES = 450 * 1024;
async function readJson(req, maxBytes = MAX_BODY_BYTES) {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > maxBytes) throw new Error("too_large");
  const text3 = await req.text();
  if (text3.length > maxBytes) throw new Error("too_large");
  if (!text3) return {};
  try {
    return JSON.parse(text3);
  } catch {
    throw new Error("bad_json");
  }
}
async function handleLogin(req) {
  const parsed = loginSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return send(req, 200, {
      ok: false,
      code: "validation",
      message: "Please fix the highlighted fields.",
      fieldErrors: {
        ...flat.identifier?.[0] ? { identifier: flat.identifier[0] } : {},
        ...flat.password?.[0] ? { password: flat.password[0] } : {}
      }
    });
  }
  try {
    const result = await authenticate(parsed.data, requestMeta(req));
    if (!result.ok) {
      if (result.code === "rate_limited") {
        const mins = Math.ceil((result.retryAfterSec ?? 60) / 60);
        return send(req, 200, {
          ok: false,
          code: "rate_limited",
          message: `Too many failed attempts. Try again in about ${mins} minute${mins === 1 ? "" : "s"}.`,
          retryAfterSec: result.retryAfterSec ?? 60
        });
      }
      if (result.code === "inactive")
        return send(req, 200, { ok: false, code: "inactive", message: "This account has been deactivated. Contact your administrator." });
      return send(req, 200, { ok: false, code: "invalid_credentials", message: "Incorrect username/email or password." });
    }
    return send(req, 200, { ok: true, user: result.user, token: result.token, expiresAt: result.expiresAt.toISOString() });
  } catch (err) {
    console.error("[api] login failed unexpectedly:", err instanceof Error ? err.message : "unknown error");
    return send(req, 200, { ok: false, code: "server_error", message: "Something went wrong. Please try again." });
  }
}
var adminLoginSchema = external_exports.object({
  identifier: external_exports.string().trim().min(1, "Enter the administrator email or username.").max(254),
  password: external_exports.string().min(1, "Enter your password.").max(128)
});
async function handleAdminLogin(req) {
  const parsed = adminLoginSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return send(req, 200, {
      ok: false,
      code: "validation",
      message: "Please fix the highlighted fields.",
      fieldErrors: {
        ...flat.identifier?.[0] ? { identifier: flat.identifier[0] } : {},
        ...flat.password?.[0] ? { password: flat.password[0] } : {}
      }
    });
  }
  try {
    const result = await authenticate({ ...parsed.data, remember: false, scope: "admin" }, requestMeta(req));
    if (!result.ok) {
      if (result.code === "rate_limited") {
        const mins = Math.ceil((result.retryAfterSec ?? 60) / 60);
        return send(req, 200, {
          ok: false,
          code: "rate_limited",
          message: `Too many failed attempts. Try again in about ${mins} minute${mins === 1 ? "" : "s"}.`,
          retryAfterSec: result.retryAfterSec ?? 60
        });
      }
      return send(req, 200, { ok: false, code: "invalid_credentials", message: "Incorrect administrator credentials." });
    }
    return send(req, 200, { ok: true, user: result.user, token: result.token, expiresAt: result.expiresAt.toISOString() });
  } catch (err) {
    console.error("[api] admin login failed unexpectedly:", err instanceof Error ? err.message : "unknown error");
    return send(req, 200, { ok: false, code: "server_error", message: "Something went wrong. Please try again." });
  }
}
async function handleAdminOverview(req) {
  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  try {
    return send(req, 200, { ok: true, overview: await getAdminOverview(user) });
  } catch (err) {
    if (err instanceof ConnectionError) return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message });
    throw err;
  }
}
async function handleRegister(req) {
  const parsed = parseRegistration(await readJson(req));
  if (!parsed.ok) return send(req, 200, { ok: false, code: "validation", message: parsed.message, fieldErrors: parsed.fieldErrors });
  const input = parsed.data;
  const meta = requestMeta(req);
  let username = "";
  try {
    if (!await signupAllowed(meta.ip))
      return send(req, 200, { ok: false, code: "rate_limited", message: "Too many sign ups from this connection. Try again in an hour." });
    username = await deriveUsername(input.email);
    await createUser({
      email: input.email,
      username,
      password: input.password,
      displayName: `${input.firstName} ${input.lastName}`,
      firstName: input.firstName,
      lastName: input.lastName,
      roles: [input.accountType],
      details: parsed.details
    });
  } catch (err) {
    if (err instanceof UserInputError) {
      const field2 = err.field === "email" || err.field === "password" ? err.field : "email";
      if (err.field === "email" && /already registered/i.test(err.message))
        return send(req, 200, { ok: false, code: "taken", message: err.message, fieldErrors: { email: err.message } });
      return send(req, 200, { ok: false, code: "validation", message: err.message, fieldErrors: { [field2]: err.message } });
    }
    console.error("[api] sign up failed unexpectedly:", err instanceof Error ? err.message : "unknown error");
    return send(req, 200, { ok: false, code: "server_error", message: "Something went wrong. Please try again." });
  }
  try {
    const result = await authenticate({ identifier: username, password: input.password, remember: false }, meta);
    if (!result.ok) return send(req, 200, { ok: false, code: "server_error", message: "Your account was created. Sign in to continue." });
    return send(req, 200, {
      ok: true,
      user: result.user,
      role: input.accountType,
      token: result.token,
      expiresAt: result.expiresAt.toISOString()
    });
  } catch (err) {
    console.error("[api] sign in after sign up failed:", err instanceof Error ? err.message : "unknown error");
    return send(req, 200, { ok: false, code: "server_error", message: "Your account was created. Sign in to continue." });
  }
}
var sendRequestSchema = external_exports.object({
  userId: external_exports.string({ required_error: "Choose who to connect with." }).trim().uuid("Choose who to connect with.")
});
function pagingFrom(req) {
  const params = new URL(req.url).searchParams;
  const limit3 = Number(params.get("limit") ?? PAGE_DEFAULT);
  const offset = Number(params.get("offset") ?? 0);
  return {
    limit: Number.isInteger(limit3) && limit3 >= 1 ? Math.min(limit3, PAGE_MAX) : PAGE_DEFAULT,
    offset: Number.isInteger(offset) && offset >= 0 ? offset : 0
  };
}
async function handleConnections(req, path) {
  if (path !== "/api/connections" && !path.startsWith("/api/connections/")) return null;
  const get = req.method === "GET";
  const post = req.method === "POST";
  const listKind = get && path === "/api/connections" ? "accepted" : get && path === "/api/connections/requests/incoming" ? "incoming" : get && path === "/api/connections/requests/outgoing" ? "outgoing" : null;
  const isSend = post && path === "/api/connections/requests";
  const answer = post ? /^\/api\/connections\/requests\/([^/]+)\/(accept|decline|cancel)$/.exec(path) : null;
  const leave = post ? /^\/api\/connections\/([^/]+)\/disconnect$/.exec(path) : null;
  if (!listKind && !isSend && !answer && !leave) return null;
  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  const meta = requestMeta(req);
  try {
    if (listKind) return send(req, 200, { ok: true, ...await listConnections(user, listKind, pagingFrom(req)) });
    if (isSend) {
      const parsed = sendRequestSchema.safeParse(await readJson(req));
      if (!parsed.success)
        return send(req, 400, {
          ok: false,
          code: "validation",
          message: "Please fix the highlighted fields.",
          fieldErrors: { userId: parsed.error.flatten().fieldErrors.userId?.[0] ?? "Choose who to connect with." }
        });
      const result = await sendRequest(user, parsed.data.userId, meta);
      return send(req, 201, { ok: true, connection: result.connection });
    }
    if (answer) {
      const id = answer[1] ?? "";
      const action = answer[2];
      const connection2 = action === "accept" ? await respondToRequest(user, id, "accepted", meta) : action === "decline" ? await respondToRequest(user, id, "declined", meta) : await cancelRequest(user, id, meta);
      return send(req, 200, { ok: true, connection: connection2 });
    }
    return send(req, 200, { ok: true, connection: await disconnect(user, leave?.[1] ?? "", meta) });
  } catch (err) {
    if (err instanceof ConnectionError)
      return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message, ...err.extra });
    throw err;
  }
}
async function handleAthleteSearch(req, path) {
  if (req.method !== "GET" || path !== "/api/athletes/search") return null;
  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  const params = new URL(req.url).searchParams;
  const q = params.get("q") ?? "";
  if (q.length > SEARCH_MAX_CHARS * 2)
    return send(req, 400, { ok: false, code: "validation", message: "Search text is too long." });
  const limit3 = Number(params.get("limit") ?? SEARCH_LIMIT_DEFAULT);
  try {
    return send(req, 200, { ok: true, ...await searchAthletes(user, q, limit3, requestMeta(req)) });
  } catch (err) {
    if (err instanceof ConnectionError)
      return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message, ...err.extra });
    throw err;
  }
}
var scholarshipSchema = external_exports.object({
  name: external_exports.string().trim().min(3).max(120),
  university: external_exports.string().trim().min(2).max(120).optional(),
  sport: external_exports.string().trim().min(1).max(40),
  coverage: external_exports.string().trim().max(120).default(""),
  details: external_exports.string().max(2e3).default(""),
  eligibility: external_exports.array(external_exports.string().max(120)).max(10).default([]),
  deadline: external_exports.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});
function pageFrom(req, def, max2) {
  const params = new URL(req.url).searchParams;
  const limit3 = Number(params.get("limit") ?? def);
  const offset = Number(params.get("offset") ?? 0);
  return {
    limit: Number.isInteger(limit3) && limit3 >= 1 ? Math.min(limit3, max2) : def,
    offset: Number.isInteger(offset) && offset >= 0 ? offset : 0
  };
}
async function handleScholarships(req, path) {
  const isList = path === "/api/scholarships";
  const action = /^\/api\/scholarships\/([^/]+)\/(open|close|apply|withdraw)$/.exec(path);
  const isMine = path === "/api/athletes/me/applications";
  const isUnis = path === "/api/scholarships/universities";
  const applicants = /^\/api\/scholarships\/([^/]+)\/applications$/.exec(path);
  const setStatus = /^\/api\/scholarships\/applications\/([^/]+)\/status$/.exec(path);
  if (!isList && !action && !isMine && !isUnis && !applicants && !setStatus) return null;
  const get = req.method === "GET";
  const post = req.method === "POST";
  if (!(isList && (get || post) || action && post || (isMine || isUnis || applicants) && get || setStatus && post)) return null;
  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  const meta = requestMeta(req);
  try {
    if (isList && get) {
      const params = new URL(req.url).searchParams;
      return send(req, 200, {
        ok: true,
        ...await listScholarships(user, {
          sport: params.get("sport") ?? void 0,
          q: params.get("q") ?? void 0,
          includeClosed: params.get("includeClosed") === "true",
          ...pageFrom(req, SCHOLARSHIP_PAGE_DEFAULT, SCHOLARSHIP_PAGE_MAX)
        })
      });
    }
    if (isUnis) return send(req, 200, { ok: true, items: await listUniversities() });
    if (applicants) return send(req, 200, { ok: true, ...await listApplicants(user, applicants[1] ?? "") });
    if (setStatus) {
      const parsed = external_exports.object({ status: external_exports.enum(["under_review", "accepted", "rejected"]) }).safeParse(await readJson(req));
      if (!parsed.success) return send(req, 400, { ok: false, code: "validation", message: 'Send { status: "under_review" | "accepted" | "rejected" }.' });
      return send(req, 200, { ok: true, status: await setApplicationStatus(user, setStatus[1] ?? "", parsed.data.status, meta) });
    }
    if (isMine) {
      const { limit: limit3, offset } = pageFrom(req, SCHOLARSHIP_PAGE_DEFAULT, SCHOLARSHIP_PAGE_MAX);
      return send(req, 200, { ok: true, ...await listMyApplications(user, limit3, offset) });
    }
    if (isList && post) {
      const parsed = scholarshipSchema.safeParse(await readJson(req));
      if (!parsed.success)
        return send(req, 400, { ok: false, code: "validation", message: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors });
      return send(req, 201, { ok: true, scholarship: await createScholarship(user, parsed.data, meta) });
    }
    const [, id, verb] = action;
    if (verb === "open" || verb === "close")
      return send(req, 200, { ok: true, scholarship: await setScholarshipOpen(user, id, verb === "open", meta) });
    if (verb === "apply") return send(req, 201, { ok: true, application: await applyToScholarship(user, id, meta) });
    return send(req, 200, { ok: true, application: await withdrawApplication(user, id, meta) });
  } catch (err) {
    if (err instanceof ScholarshipError) return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message });
    throw err;
  }
}
async function handleNotifications(req, path) {
  const one2 = /^\/api\/notifications\/([^/]+)\/read$/.exec(path);
  const isList = req.method === "GET" && path === "/api/notifications";
  const isCount = req.method === "GET" && path === "/api/notifications/unread-count";
  const isAll = req.method === "POST" && path === "/api/notifications/read-all";
  const isOne = req.method === "POST" && !!one2 && one2[1] !== "read-all";
  if (!isList && !isCount && !isAll && !isOne) return null;
  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  try {
    if (isList)
      return send(req, 200, {
        ok: true,
        ...await listNotifications(user, { category: new URL(req.url).searchParams.get("category") ?? void 0, ...pageFrom(req, NOTIF_PAGE_DEFAULT, NOTIF_PAGE_MAX) })
      });
    if (isCount) return send(req, 200, { ok: true, unread: await unreadCount(user) });
    if (isAll) return send(req, 200, { ok: true, updated: await markAllRead(user) });
    return send(req, 200, { ok: true, notification: await markRead(user, one2[1]) });
  } catch (err) {
    if (err instanceof NotificationError) return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message });
    throw err;
  }
}
async function handleGlobalSearch(req, path) {
  if (req.method !== "GET" || path !== "/api/search") return null;
  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  const params = new URL(req.url).searchParams;
  const q = params.get("q") ?? "";
  if (q.length > 160) return send(req, 400, { ok: false, code: "validation", message: "Search text is too long." });
  return send(req, 200, { ok: true, ...await globalSearch(user, q, Number(params.get("limit") ?? 5)) });
}
async function handleRankings(req, path) {
  const isList = req.method === "GET" && path === "/api/rankings";
  const isHeadline = req.method === "GET" && path === "/api/rankings/headline";
  const isVisibility = (req.method === "GET" || req.method === "PUT") && path === "/api/athletes/me/visibility";
  if (!isList && !isHeadline && !isVisibility) return null;
  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  const params = new URL(req.url).searchParams;
  try {
    if (isList) {
      const limit3 = Number(params.get("limit") ?? RANKINGS_LIMIT_DEFAULT);
      return send(req, 200, {
        ok: true,
        ...await getRankings(user, {
          sport: params.get("sport") ?? "Basketball",
          metric: params.get("metric") ?? void 0,
          province: params.get("province") ?? void 0,
          municipality: params.get("municipality") ?? void 0,
          school: params.get("school") ?? void 0,
          category: params.get("category") ?? void 0,
          limit: Number.isInteger(limit3) && limit3 >= 1 ? Math.min(limit3, RANKINGS_LIMIT_MAX) : RANKINGS_LIMIT_DEFAULT
        })
      });
    }
    if (isHeadline) {
      const ids2 = (params.get("ids") ?? "").split(",").map((x) => x.trim()).filter(Boolean);
      return send(req, 200, { ok: true, ...await getHeadline(user, ids2) });
    }
    if (req.method === "GET") return send(req, 200, { ok: true, visible: await getShowcaseVisible(user) });
    const parsed = external_exports.object({ visible: external_exports.boolean() }).safeParse(await readJson(req));
    if (!parsed.success) return send(req, 400, { ok: false, code: "validation", message: "Send { visible: true | false }." });
    return send(req, 200, { ok: true, visible: await setShowcaseVisible(user, parsed.data.visible) });
  } catch (err) {
    if (err instanceof RankingError) return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message });
    throw err;
  }
}
async function handleUniversity(req, path) {
  if (req.method !== "GET") return null;
  const isInfo = path === "/api/coach/university";
  const isCoaches = path === "/api/coach/university/coaches";
  const isAthletes = path === "/api/coach/university/athletes";
  if (!isInfo && !isCoaches && !isAthletes) return null;
  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  const params = new URL(req.url).searchParams;
  const limit3 = Number(params.get("limit") ?? UNIVERSITY_PAGE_DEFAULT);
  const offset = Number(params.get("offset") ?? 0);
  const page = {
    limit: Number.isInteger(limit3) && limit3 >= 1 ? Math.min(limit3, UNIVERSITY_PAGE_MAX) : UNIVERSITY_PAGE_DEFAULT,
    offset: Number.isInteger(offset) && offset >= 0 ? offset : 0,
    q: params.get("q") ?? void 0
  };
  try {
    if (isInfo) return send(req, 200, { ok: true, ...await getMyUniversity(user) });
    if (isCoaches) return send(req, 200, { ok: true, ...await listUniversityCoaches(user, page) });
    return send(req, 200, { ok: true, ...await listUniversityAthletes(user, page) });
  } catch (err) {
    if (err instanceof UniversityError) return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message });
    throw err;
  }
}
async function handleCoachApplications(req, path) {
  const statusRoute = /^\/api\/coach-applications\/([^/]+)\/status$/.exec(path);
  const isRoot = path === "/api/coach-applications";
  if (!(isRoot && (req.method === "GET" || req.method === "POST")) && !(statusRoute && req.method === "POST")) return null;
  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  try {
    if (isRoot && req.method === "GET") return send(req, 200, { ok: true, ...await listApplications(user) });
    if (isRoot) {
      const parsed2 = external_exports.object({ coachId: external_exports.string() }).safeParse(await readJson(req));
      if (!parsed2.success) return send(req, 400, { ok: false, code: "validation", message: "Send { coachId }." });
      return send(req, 201, { ok: true, application: await applyToCoach(user, parsed2.data.coachId, requestMeta(req)) });
    }
    const parsed = external_exports.object({ status: external_exports.enum(["reviewed", "dismissed"]) }).safeParse(await readJson(req));
    if (!parsed.success) return send(req, 400, { ok: false, code: "validation", message: 'Send { status: "reviewed" | "dismissed" }.' });
    return send(req, 200, { ok: true, status: await setApplicationStatus2(user, statusRoute[1] ?? "", parsed.data.status) });
  } catch (err) {
    if (err instanceof CoachApplicationError) return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message });
    throw err;
  }
}
async function handleRecruiting(req, path) {
  if (!path.startsWith("/api/recruiting/")) return null;
  const m = req.method;
  const athleteOne = /^\/api\/recruiting\/athletes\/([^/]+)$/.exec(path);
  const noteRoute = /^\/api\/recruiting\/watchlist\/([^/]+)\/note$/.exec(path);
  const respondRoute = /^\/api\/recruiting\/inquiries\/([^/]+)\/respond$/.exec(path);
  const messagesRoute = /^\/api\/recruiting\/inquiries\/([^/]+)\/messages$/.exec(path);
  const known = m === "GET" && (path === "/api/recruiting/athletes" || !!athleteOne || path === "/api/recruiting/watchlist" || path === "/api/recruiting/inquiries" || !!messagesRoute) || m === "PUT" && !!noteRoute || m === "POST" && (path === "/api/recruiting/inquiries" || !!respondRoute || !!messagesRoute);
  if (!known) return null;
  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  const meta = requestMeta(req);
  const params = new URL(req.url).searchParams;
  const bad = (message) => send(req, 400, { ok: false, code: "validation", message });
  try {
    if (m === "GET" && path === "/api/recruiting/athletes") {
      const limit3 = Number(params.get("limit") ?? DIRECTORY_LIMIT_DEFAULT);
      const offset = Number(params.get("offset") ?? 0);
      const sort = params.get("sort");
      return send(req, 200, {
        ok: true,
        ...await listAthletes(user, {
          q: params.get("q") ?? void 0,
          sport: params.get("sport") || void 0,
          position: params.get("position") || void 0,
          school: params.get("school") || void 0,
          skill: params.get("skill") || void 0,
          verifiedOnly: params.get("verifiedOnly") === "true",
          sort: sort === "verified" || sort === "name" || sort === "score" ? sort : void 0,
          limit: Number.isInteger(limit3) && limit3 >= 1 ? Math.min(limit3, DIRECTORY_LIMIT_MAX) : DIRECTORY_LIMIT_DEFAULT,
          offset: Number.isInteger(offset) && offset >= 0 ? offset : 0
        })
      });
    }
    if (athleteOne) return send(req, 200, { ok: true, ...await getAthlete(user, athleteOne[1] ?? "") });
    if (m === "GET" && path === "/api/recruiting/watchlist") return send(req, 200, { ok: true, ...await listWatchlist(user) });
    if (noteRoute) {
      const parsed2 = external_exports.object({ note: external_exports.string() }).safeParse(await readJson(req));
      if (!parsed2.success) return bad("Send { note: text }.");
      return send(req, 200, { ok: true, ...await setNote(user, noteRoute[1] ?? "", parsed2.data.note) });
    }
    if (m === "GET" && path === "/api/recruiting/inquiries") return send(req, 200, { ok: true, ...await listInquiries(user) });
    if (m === "POST" && path === "/api/recruiting/inquiries") {
      const parsed2 = external_exports.object({ athleteId: external_exports.string(), organization: external_exports.string(), message: external_exports.string() }).safeParse(await readJson(req));
      if (!parsed2.success) return bad("Send { athleteId, organization, message }.");
      return send(req, 201, { ok: true, inquiry: await sendInquiry(user, parsed2.data, meta) });
    }
    if (respondRoute) {
      const parsed2 = external_exports.object({ decision: external_exports.enum(["accepted", "declined"]) }).safeParse(await readJson(req));
      if (!parsed2.success) return bad('Send { decision: "accepted" | "declined" }.');
      return send(req, 200, { ok: true, inquiry: await respondToInquiry(user, respondRoute[1] ?? "", parsed2.data.decision, meta) });
    }
    if (m === "GET") return send(req, 200, { ok: true, ...await listMessages(user, messagesRoute[1] ?? "") });
    const parsed = external_exports.object({ body: external_exports.string() }).safeParse(await readJson(req));
    if (!parsed.success) return bad("Send { body: text }.");
    return send(req, 201, { ok: true, message: await sendMessage(user, messagesRoute[1] ?? "", parsed.data.body) });
  } catch (err) {
    if (err instanceof RecruitingError) return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message });
    throw err;
  }
}
async function handleTrainingPlans(req, path) {
  if (path !== "/api/training-plans" && !path.startsWith("/api/training-plans/")) return null;
  const m = /^\/api\/training-plans(?:\/([^/]+))?$/.exec(path);
  if (!m) return null;
  const id = m[1];
  const isList = req.method === "GET" && !id;
  const isGet = req.method === "GET" && !!id;
  const isCreate = req.method === "POST" && !id;
  const isUpdate = req.method === "PUT" && !!id;
  if (!isList && !isGet && !isCreate && !isUpdate) return null;
  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  const meta = requestMeta(req);
  try {
    if (isList) {
      const status = new URL(req.url).searchParams.get("status");
      if (status !== null && !PLAN_STATUSES.includes(status))
        return send(req, 400, { ok: false, code: "validation", message: "status must be DRAFT or PUBLISHED." });
      const paging = pagingFrom(req);
      return send(req, 200, { ok: true, ...await listPlans(user, { ...paging, ...status ? { status } : {} }) });
    }
    if (isGet) return send(req, 200, { ok: true, plan: await getPlan(user, id ?? "") });
    const body = await readJson(req);
    if (isCreate) return send(req, 201, { ok: true, plan: await createPlan(user, body, meta) });
    return send(req, 200, { ok: true, plan: await updatePlan(user, id ?? "", body, meta) });
  } catch (err) {
    if (err instanceof PlanError) return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message, ...err.extra });
    throw err;
  }
}
async function handleCoachAndProfile(req, path) {
  const m = req.method;
  const isCoachAthletes = m === "GET" && path === "/api/coach/athletes";
  const isDashboard = m === "GET" && path === "/api/coach/dashboard";
  const shortlist = m === "PUT" || m === "DELETE" ? /^\/api\/coach\/shortlist\/([^/]+)$/.exec(path) : null;
  if (!isCoachAthletes && !isDashboard && !shortlist) return null;
  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  try {
    if (isCoachAthletes) return send(req, 200, { ok: true, ...await listMyAthletes(user, pagingFrom(req)) });
    if (isDashboard) return send(req, 200, { ok: true, ...await getCoachDashboard(user) });
    if (shortlist) return send(req, 200, { ok: true, ...await setShortlisted(user, shortlist[1] ?? "", m === "PUT") });
    return null;
  } catch (err) {
    if (err instanceof ConnectionError)
      return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message, ...err.extra });
    throw err;
  }
}
async function handleCoachProfileAndReview(req, path) {
  const m = req.method;
  const isGet = m === "GET" && path === "/api/coach/profile";
  const isPut = m === "PUT" && path === "/api/coach/profile";
  const isRequest = m === "POST" && path === "/api/coach/verification/request";
  const isList = m === "GET" && path === "/api/admin/coach-verifications";
  const decide = m === "POST" ? /^\/api\/admin\/coach-verifications\/([^/]+)\/(approve|reject)$/.exec(path) : null;
  if (!isGet && !isPut && !isRequest && !isList && !decide) return null;
  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  const meta = requestMeta(req);
  try {
    if (isGet) return send(req, 200, { ok: true, ...await getCoachProfile(user) });
    if (isPut) return send(req, 200, { ok: true, ...await saveCoachProfile(user, await readJson(req), meta) });
    if (isRequest) return send(req, 200, { ok: true, verification: await requestVerification(user, meta) });
    if (isList) {
      const status = new URL(req.url).searchParams.get("status");
      if (status !== null && !["pending", "verified", "rejected"].includes(status))
        return send(req, 400, { ok: false, code: "validation", message: "status must be pending, verified or rejected." });
      const paging = pagingFrom(req);
      return send(req, 200, { ok: true, ...await listVerificationRequests(user, { ...paging, ...status ? { status } : {} }) });
    }
    const body = await readJson(req);
    const result = await reviewVerification(user, decide?.[1] ?? "", decide?.[2] === "approve" ? "approve" : "reject", body && typeof body === "object" ? body["note"] : void 0, meta);
    return send(req, 200, { ok: true, ...result });
  } catch (err) {
    if (err instanceof ConnectionError)
      return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message, ...err.extra });
    throw err;
  }
}
async function handleAssignedPlans(req, path) {
  if (req.method !== "GET") return null;
  const m = /^\/api\/athletes\/me\/training-plans(?:\/([^/]+))?$/.exec(path);
  if (!m) return null;
  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  try {
    if (m[1]) return send(req, 200, { ok: true, plan: await getAssignedPlan(user, m[1]) });
    return send(req, 200, { ok: true, ...await listAssignedPlans(user, pagingFrom(req)) });
  } catch (err) {
    if (err instanceof PlanError) return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message, ...err.extra });
    throw err;
  }
}
async function handleAthleteSelfService(req, path) {
  const m = req.method;
  const extras = /^\/api\/athletes\/me\/extras(?:\/(scholarship|photo|video))?$/.exec(path);
  const sessions = /^\/api\/athletes\/me\/sessions(?:\/([^/]+)\/request-review)?$/.exec(path);
  const verify = m === "POST" ? /^\/api\/coach\/sessions\/([^/]+)\/verify$/.exec(path) : null;
  const routes = {
    getProfile: m === "GET" && path === "/api/athletes/me/profile",
    putProfile: m === "PUT" && path === "/api/athletes/me/profile",
    addRecord: m === "POST" && path === "/api/athletes/me/records",
    getExtras: m === "GET" && !!extras && !extras[1],
    putScholarship: m === "PUT" && extras?.[1] === "scholarship",
    putPhoto: m === "PUT" && extras?.[1] === "photo",
    delPhoto: m === "DELETE" && extras?.[1] === "photo",
    putVideo: m === "PUT" && extras?.[1] === "video",
    delVideo: m === "DELETE" && extras?.[1] === "video",
    listSessions: m === "GET" && !!sessions && !sessions[1],
    addSession: m === "POST" && !!sessions && !sessions[1],
    requestReview: m === "POST" && !!sessions?.[1],
    pendingSessions: m === "GET" && path === "/api/coach/sessions",
    verify: !!verify
  };
  if (!Object.values(routes).some(Boolean)) return null;
  const user = await getUserBySessionToken(bearer(req));
  if (!user) return send(req, 401, { ok: false, code: "unauthenticated", message: "Sign in to continue." });
  const meta = requestMeta(req);
  try {
    if (routes.getProfile) return send(req, 200, { ok: true, profile: await getMyProfile(user) });
    if (routes.putProfile) return send(req, 200, { ok: true, profile: await saveMyProfile(user, await readJson(req)) });
    if (routes.addRecord) return send(req, 201, { ok: true, ...await addMyRecord(user, await readJson(req)) });
    if (routes.getExtras) return send(req, 200, { ok: true, extras: await getMyExtras(user) });
    if (routes.putScholarship) return send(req, 200, { ok: true, extras: await saveScholarship(user, await readJson(req)) });
    if (routes.putPhoto) return send(req, 200, { ok: true, extras: await setPhoto(user, await readJson(req, PHOTO_BODY_BYTES)) });
    if (routes.delPhoto) return send(req, 200, { ok: true, extras: await removePhoto(user) });
    if (routes.putVideo) return send(req, 200, { ok: true, extras: await setVideo(user, await readJson(req)) });
    if (routes.delVideo) return send(req, 200, { ok: true, extras: await removeVideo(user) });
    if (routes.listSessions) {
      const limit3 = Number(new URL(req.url).searchParams.get("limit") ?? "");
      return send(req, 200, { ok: true, ...await listMySessions(user, Number.isFinite(limit3) && limit3 > 0 ? { limit: limit3 } : {}) });
    }
    if (routes.addSession) return send(req, 201, { ok: true, session: await createSession2(user, await readJson(req)) });
    if (routes.requestReview) return send(req, 200, { ok: true, session: await requestSessionReview(user, sessions?.[1] ?? "") });
    if (routes.pendingSessions) return send(req, 200, { ok: true, ...await listSessionsForReview(user) });
    return send(req, 200, { ok: true, session: await verifySession(user, verify?.[1] ?? "", meta) });
  } catch (err) {
    if (err instanceof ConnectionError)
      return send(req, err.httpStatus, { ok: false, code: err.code, message: err.message, ...err.extra });
    throw err;
  }
}
async function handle(req) {
  try {
    const path = new URL(req.url).pathname.replace(/\/+$/, "") || "/";
    if (req.method === "OPTIONS") return send(req, 204, null);
    if (req.method === "GET" && path === "/api/health") return send(req, 200, { ok: true });
    await ensureAdminAccount();
    if (req.method === "POST" && path === "/api/admin/auth/login") return await handleAdminLogin(req);
    if (req.method === "GET" && path === "/api/admin/overview") return await handleAdminOverview(req);
    if (req.method === "POST" && path === "/api/auth/login") return await handleLogin(req);
    if (req.method === "POST" && path === "/api/auth/register") return await handleRegister(req);
    if (req.method === "GET" && path === "/api/auth/me") {
      const user = await getUserBySessionToken(bearer(req));
      return send(req, user ? 200 : 401, { user });
    }
    if (req.method === "POST" && path === "/api/auth/logout") {
      await destroySession(bearer(req), requestMeta(req));
      return send(req, 200, { ok: true });
    }
    const connections = await handleConnections(req, path);
    if (connections) return connections;
    const athletes = await handleAthleteSearch(req, path);
    if (athletes) return athletes;
    const plans = await handleTrainingPlans(req, path);
    if (plans) return plans;
    const coachAndProfile = await handleCoachAndProfile(req, path);
    if (coachAndProfile) return coachAndProfile;
    const coachReview = await handleCoachProfileAndReview(req, path);
    if (coachReview) return coachReview;
    const assigned = await handleAssignedPlans(req, path);
    if (assigned) return assigned;
    const selfService = await handleAthleteSelfService(req, path);
    if (selfService) return selfService;
    const scholarships = await handleScholarships(req, path);
    if (scholarships) return scholarships;
    const notifications = await handleNotifications(req, path);
    if (notifications) return notifications;
    const search = await handleGlobalSearch(req, path);
    if (search) return search;
    const rankings = await handleRankings(req, path);
    if (rankings) return rankings;
    const recruiting = await handleRecruiting(req, path);
    if (recruiting) return recruiting;
    const coachApps = await handleCoachApplications(req, path);
    if (coachApps) return coachApps;
    const university = await handleUniversity(req, path);
    if (university) return university;
    return send(req, 404, { error: "not_found" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "too_large") return send(req, 413, { error: "too_large" });
    if (msg === "bad_json") return send(req, 400, { error: "bad_json" });
    console.error("[api] unhandled error:", msg || "unknown error");
    return send(req, 500, { error: "server_error" });
  }
}

// server/vercel-entry.ts
var vercel_entry_default = { fetch: handle };
export {
  vercel_entry_default as default
};
