import { CALL_API } from 'redux-api-middleware';

const isFunction = func => (typeof func === "function");
const isObject = obj => (typeof obj === 'object');
const throwError = (name, expected) => {throw `Expected '${name}' to be ${expected}`};

const getHeaders = (headerParams, origHeaders) => {
  const headers = isFunction(headerParams) ? opHeaders(getState(), origHeaders) : headerParams;
  return isObject(headers) ? headers : {};
};

export default (opHeaders, funcs = {}) => ({ getState }) => next => action => {
  const callApi = action[CALL_API];
  // Check if this action is a redux-api-middleware action.
  if (callApi) {
    const state = getState();
    const headers = getHeaders(opHeaders, callApi.headers);
    // Prepend API base URL to endpoint if it does not already contain a valid base URL.
    if (!/^((http|https|ftp):\/\/)/i.test(callApi.endpoint) && funcs.getBaseURL) {
      if (isFunction(funcs.getBaseURL)) {
        const baseUrl = funcs.getURL(state, callApi.endpoint) || '';
        callApi.endpoint = baseUrl || callApi.endpoint;
      } else {
        throwError('getBaseURL', 'Function');
      }
    }

    // Set headers to empty object if undefined.
    if (!Object.keys(callApi.headers || {}).length) {
      callApi.headers = {};
    }

    // Extend the headers with given headers
    if (Object.keys(headers).length > 0) {
      callApi.headers = Object.assign({}, callApi.headers, headers);
    }

    // add response interceptor to watch on 401 unauthorized calls
    if (funcs.onRequestInit && (isFunction(funcs.onRequestInit) ? true : throwError('onRequestInit', 'Function'))) {
      const type = callApi.types[0];
      callApi.types[0] = {
        type,
        payload: (dispatchedAction, state, res) => {
          funcs.onRequestInit(state);
          return res;
        }
      };
    }

    if (funcs.onRequestSuccess && (isFunction(funcs.onRequestSuccess) ? true : throwError('onRequestSuccess', 'Function'))) {
      const type = callApi.types[1];
      callApi.types[1] = {
        type,
        payload: (dispatchedAction, state, res) => {
          const json = res.json();
          funcs.onRequestSuccess(state, json);
          return json;
        }
      };
    }

    if (funcs.onRequestError && (isFunction(funcs.onRequestError) ? true : throwError('onRequestError', 'Function'))) {
      const type = callApi.types[2];
      callApi.types[2] = {
        type,
        payload: (dispatchedAction, state, res) => {
          const json = res.json();
          funcs.onRequestError(state, json);
          return json;
        }
      };
    }
    
  }

  // Pass the FSA to the next action.
  return next(action);
};
