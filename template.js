const encodeUriComponent = require('encodeUriComponent');
const getAllEventData = require('getAllEventData');
const getType = require('getType');
const JSON = require('JSON');
const makeString = require('makeString');
const makeTableMap = require('makeTableMap');
const sendHttpRequest = require('sendHttpRequest');

/*==============================================================================
==============================================================================*/

const eventData = getAllEventData();

if (!isConsentGivenOrNotRequired(data, eventData)) {
  return data.gtmOnSuccess();
}

const requestUrl = getRequestUrl();
const postBody = getPostBody();

sendHttpRequest(
  requestUrl,
  (statusCode, headers, body) => {
    if (statusCode >= 200 && statusCode < 303) {
      data.gtmOnSuccess();
    } else {
      data.gtmOnFailure();
    }
  },
  {
    headers: {
      Authorization: 'Bearer ' + data.accessToken,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    method: 'POST'
  },
  JSON.stringify(postBody)
);

/*==============================================================================
Vendor related functions
==============================================================================*/

function getRequestUrl() {
  return 'https://' + enc(data.instanceDomain) + '/services/data/v57.0/sobjects/Lead/';
}

function getPostBody() {
  return makeTableMap(data.leadData || [], 'field', 'value') || {};
}

/*==============================================================================
Helpers
==============================================================================*/

function enc(data) {
  if (['null', 'undefined'].indexOf(getType(data)) !== -1) data = '';
  return encodeUriComponent(makeString(data));
}

function isConsentGivenOrNotRequired(data, eventData) {
  if (data.adStorageConsent !== 'required') return true;
  if (eventData.consent_state) return !!eventData.consent_state.ad_storage;
  const xGaGcs = eventData['x-ga-gcs'] || ''; // x-ga-gcs is a string like "G110"
  return xGaGcs[2] === '1';
}
