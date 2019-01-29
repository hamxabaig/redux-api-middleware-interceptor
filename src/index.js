import { CALL_API } from 'redux-api-middleware';

const isFunction = func => (typeof func === "function");
const isObject = obj => (typeof obj === 'object');
const throwError = (name, expected) => {throw `Expected '${name}' to be ${expected}`};

const getHeaders = (headerParams, origHeaders = {}, state) => {
  const headers = isFunction(headerParams) ? headerParams(origHeaders, state) : headerParams;
  return isObject(headers) ? headers : origHeaders;
};

const getCustomURL = (url, config, state) => {
  if (
    !/^((http|https|ftp):\/\/)/i.test(url) &&
    config.getURL &&
    (isFunction(config.getURL) || throwError('getURL', 'Function'))
  ) {
    const customURL = config.getURL(url, state);
    if (!customURL) throwError('return value of getURL', 'String')
    return customURL;
  }
  return url;
}

/**
 * configObj = {
 *  headers: Object|Function,
 *  getURL: Function,
 *  onRequestInit: Function,
 *  onRequestSuccess: Function,
 *  onRequestError: Function
 * }
 */
export default (configObj = {}) => ({ getState }) => next => action => {
  const callApi = action[CALL_API];
  // Check if this action is a redux-api-middleware action.
  if (callApi) {
    const state = getState();

    // Set headers
    callApi.headers = getHeaders(configObj.headers, callApi.headers, state);

    // GET CUSTOM API URL if getURL func exist in config obj
    callApi.endpoint = getCustomURL(callApi.endpoint, configObj, state);

    // add response interceptor to watch on request calls
    if (configObj.onRequestInit && (isFunction(configObj.onRequestInit) ? true : throwError('onRequestInit', 'Function'))) {
      const type = callApi.types[0];
      callApi.types[0] = {
        type,
        payload: (dispatchedAction, _state, res) => {
          configObj.onRequestInit(_state);
          return res;
        }
      };
    }

    // add response interceptor to watch on success calls
    if (configObj.onRequestSuccess && (isFunction(configObj.onRequestSuccess) ? true : throwError('onRequestSuccess', 'Function'))) {
      const type = callApi.types[1];
      callApi.types[1] = {
        type,
        payload: (dispatchedAction, _state, res) => {
          const promise = res.json()
          promise.then((json) => {
            configObj.onRequestSuccess(_state, Object.assign({}, json));
          });
          return promise;
        }
      };
    }

    // add response interceptor to watch on error calls
    if (configObj.onRequestError && (isFunction(configObj.onRequestError) ? true : throwError('onRequestError', 'Function'))) {
      const type = callApi.types[2];
      callApi.types[2] = {
        type,
        payload: (dispatchedAction, _state, res) => {
          const promise = res.json()
          promise.then((json = {}) => {
            configObj.onRequestError(_state, Object.assign({ status_code: res.status }, json));
          });
          return promise;
        }
      };
    }
  }

  // Pass the FSA to the next action.
  return next(action);
};
