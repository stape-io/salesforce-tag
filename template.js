const encodeUriComponent = require('encodeUriComponent');
const getAllEventData = require('getAllEventData');
const getType = require('getType');
const getRequestHeader = require('getRequestHeader');
const JSON = require('JSON');
const makeString = require('makeString');
const makeTableMap = require('makeTableMap');
const sendHttpRequest = require('sendHttpRequest');

/*==============================================================================
==============================================================================*/

const eventData = getAllEventData();

if (shouldExitEarly(data, eventData)) return;

const operation = data.operation || 'lead';
const requestUrl = getRequestUrl(operation);
const postBody = getPostBody(data, operation);

sendHttpRequest(
  requestUrl,
  (statusCode, headers, body) => {
    return statusCode >= 200 && statusCode < 303 ? data.gtmOnSuccess() : data.gtmOnFailure();
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

function getRequestUrl(operation) {
  const API_VERSION = 'v67.0';
  const sObject = operation === 'contact' ? 'Contact' : 'Lead';
  return (
    'https://' +
    enc(data.instanceDomain) +
    '/services/data/' +
    API_VERSION +
    '/sobjects/' +
    sObject +
    '/'
  );
}

function getPostBody(data, operation) {
  const recordData = operation === 'contact' ? data.contactData : data.leadData;
  return makeTableMap(recordData || [], 'field', 'value') || {};
}

/*==============================================================================
Helpers
==============================================================================*/

function getUrl(eventData) {
  return eventData.page_location || getRequestHeader('referer') || eventData.page_referrer;
}

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

function shouldExitEarly(data, eventData) {
  if (!isConsentGivenOrNotRequired(data, eventData)) {
    data.gtmOnSuccess();
    return true;
  }

  const url = getUrl(eventData);
  if (url && url.lastIndexOf('https://gtm-msr.appspot.com/', 0) === 0) {
    data.gtmOnSuccess();
    return true;
  }

  return false;
}
