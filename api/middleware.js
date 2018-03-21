const models     = require('../models');
const config     = require('../config');
const jwt        = require('jsonwebtoken');
const format     = require('util').format;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const log        = require('../logging');
const { check, header, validationResult, query } = require('express-validator/check');

/*
 * Authenticate a JWT in the 'Authorization' header of the given type
 */
const authenticate = function(type) {
  return header('Authorization').custom(async (value, {req}) => {
    const token = ExtractJwt.fromAuthHeader()(req);
    if (token == null) {
      throw new Error('could not find JWT token');
    }
    var jwtDecoded;
    try {
      jwtDecoded = jwt.verify(token, config.server.passportSecret);
    } catch(e) {
      throw new Error('failed to verify JWT');
    }
    if (jwtDecoded._type != type) {
      throw new Error(format('invalid type of JWT. need a %s for this request', type));
    }
    var result;
    switch(type) {
    case 'user':
      result = await models.User.findById(jwtDecoded.id);
      break;
    case 'device':
      result = await models.Device.findById(jwtDecoded.id);
      break;
    case 'fileDownload':
      result = jwtDecoded;
      break;
    }
    if (result == null) {
      throw new Error(format('could not find a %s from the JWT', type));
    }
    req[type] = result;
    return true;
  });
};

const authenticateUser         = authenticate('user');
const authenticateDevice       = authenticate('device');

const signedUrl = query('jwt').custom((value, {req}) => {
  if (value == null) {
    throw new Error('could not find JWT token');
  }
  var jwtDecoded;
  try {
    jwtDecoded = jwt.verify(value, config.server.passportSecret);
  } catch(e) {
    throw new Error('failed to verify JWT');
  }
  req.jwtDecoded = jwtDecoded;
  return true;
});


const getModelById = function(modelType, fieldName, checkFunc=check) {
  return checkFunc(fieldName).custom(async (val, { req }) => {
    const model = await modelType.getFromId(val);
    if (model === null) {
      throw new Error(format('could not find %s of %s', fieldName, val));
    }
    req.body[modelTypeName(modelType)] = model;
    return true;
  });
};

const getModelByName = function(modelType, fieldName, checkFunc=check) {
  return checkFunc(fieldName).custom(async (val, { req }) => {
    const model = await modelType.getFromName(val);
    if (model === null) {
      throw new Error(format('could not find %s of %s', fieldName, val));
    }
    req.body[modelTypeName(modelType)] = model;
    return true;
  });
};

function modelTypeName(modelType) {
  return modelType.options.name.singular.toLowerCase();
}

const getUserById = getModelById(models.User, 'userId');
const getUserByName = getModelByName(models.User, 'username');

const getGroupById = getModelById(models.Group, 'groupId');
const getGroupByName = getModelByName(models.Group, 'group');

const getDeviceById = getModelById(models.Device, 'deviceId');
const getDeviceByName = getModelByName(models.Device, 'devicename');

const checkNewName = function(field) {
  return check(field, 'invalid name')
    .isLength({ min: 3 })
    .matches(/^[a-zA-Z0-9]+(?:[_ -]?[a-zA-Z0-9])*$/);
};

const checkNewPassword = function(field) {
  return check(field, 'invalid password')
    .isLength({ min: 8 });
};

const parseJSON = function(field) {
  return check(field).custom((value, {req, location, path}) => {
    try {
      req[location][path] = JSON.parse(value);
      return true;
    } catch(e) {
      throw new Error(format('could not parse field %s to a json', path));
    }
  });
};

const parseArray = function(field) {
  return check(field).custom((value, {req, location, path}) => {
    var arr;
    try {
      arr = JSON.parse(value);
    } catch(e) {
      throw new Error(format('could not parse field %s to a json', path));
    }
    if (Array.isArray(arr)) {
      req[location][path] = arr;
      return true;
    } else if (arr === null) {
      req[location][path] = [];
      return true;
    } else {
      throw new Error(format('%s was not an array', path));
    }
  });
};

const requestWrapper = fn => (request, response, next) => {
  log.info(format('%s Request: %s', request.method, request.url));
  const errors = validationResult(request);
  if (!errors.isEmpty()) {
    response.status(422).json({ errors: errors.mapped() });
  } else {
    Promise.resolve(fn(request, response, next))
      .catch(next);
  }
};


exports.authenticateUser   = authenticateUser;
exports.authenticateDevice = authenticateDevice;
exports.signedUrl          = signedUrl;
exports.getUserById        = getUserById;
exports.getUserByName      = getUserByName;
exports.getGroupById       = getGroupById;
exports.getGroupByName     = getGroupByName;
exports.getDeviceById      = getDeviceById;
exports.getDeviceByName    = getDeviceByName;
exports.checkNewName       = checkNewName;
exports.checkNewPassword   = checkNewPassword;
exports.parseJSON          = parseJSON;
exports.parseArray         = parseArray;
exports.requestWrapper     = requestWrapper;