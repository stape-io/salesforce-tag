const sendHttpRequest = require('sendHttpRequest');
const JSON = require('JSON');
const getRequestHeader = require('getRequestHeader');
const encodeUriComponent = require('encodeUriComponent');
const logToConsole = require('logToConsole');
const getContainerVersion = require('getContainerVersion');
const makeString = require('makeString');
const makeTableMap = require('makeTableMap');

const containerVersion = getContainerVersion();
const isDebug = containerVersion.debugMode;
const isLoggingEnabled = determinateIsLoggingEnabled();
const traceId = getRequestHeader('trace-id');


const requestUrl = getRequestUrl();
const postBody = getPostBody();

if (isLoggingEnabled) {
  logToConsole(
    JSON.stringify({
      Name: 'Salesforce',
      Type: 'Request',
      TraceId: traceId,
      EventName: 'Lead',
      RequestMethod: 'POST',
      RequestUrl: requestUrl,
      RequestBody: postBody
    })
  );
}

sendHttpRequest(
  requestUrl,
  (statusCode, headers, body) => {
    if (isLoggingEnabled) {
      logToConsole(
        JSON.stringify({
          Name: 'Salesforce',
          Type: 'Response',
          TraceId: traceId,
          EventName: 'Lead',
          ResponseStatusCode: statusCode,
          ResponseHeaders: headers,
          ResponseBody: body
        })
      );
    }

    if (statusCode >= 200 && statusCode < 303) {
      data.gtmOnSuccess();
    } else {
      data.gtmOnFailure();
    }
  },
  {
    headers: {
      'Authorization': 'Bearer '+ data.accessToken,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    method: 'POST'
  },
  JSON.stringify(postBody)
);

function getRequestUrl() {
  return 'https://'+enc(data.instanceDomain)+'/services/data/v57.0/sobjects/Lead/';
}

function getPostBody() {
  return makeTableMap(data.leadData || [], 'field', 'value');
}

function enc(data) {
  data = data || '';
  return encodeUriComponent(makeString(data));
}

function determinateIsLoggingEnabled() {
  if (!data.logType) {
    return isDebug;
  }

  if (data.logType === 'no') {
    return false;
  }

  if (data.logType === 'debug') {
    return isDebug;
  }

  return data.logType === 'always';
}
