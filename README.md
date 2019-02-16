# Intercepting APIs with redux-api-middleware made easy

Building single page applications and utilising some kind of API ? Probably you'd want to 
include some kind of `JWT` or you'd want to preppend base URL to all of your http requests ?
Well `redux-api-middleware-interceptor` does that kind of stuff for you automatically.

## 1.1 Installation
npm: `npm install redux-api-middleware-interceptor --save`

*OR*

yarn: `yarn add redux-api-middleware-interceptor`

Note: You must have [redux-api-middleware](https://github.com/agraboso/redux-api-middleware) ^2.0.0 installed as peer dependency.

## 1.2 Usage
```js
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import interceptor from 'redux-api-middleware-interceptor';
import { CALL_API, apiMiddleware } from 'redux-api-middleware';

const apiMiddlewareInterceptor = interceptor(configObj);

const store = createStore(
  reducer,
  applyMiddleware(apiMiddlewareInterceptor, apiMiddleware, thunk) <-- the interceptor must be before apiMiddleware
);
```


## 1.3 API

`redux-api-middleware-interceptor` exports a function that when called with config object returns you a middleware that acts as an interceptor:

```js
interceptor(configObj) <-- returns a redux middleware
```
### 1.3.1 configObj.headers (object|function)

Usefull when you want to add additional headers to all of your routes.

> Note: If you pass headers that were already provided, then its gonna override original headers.

You can either pass an Object:

```js
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import interceptor from 'redux-api-middleware-interceptor';

const store = createStore(
  reducer,
  applyMiddleware(interceptor({ headers: {'content-type': 'application/json'}), thunk)
);
```

or if you want more customised solution like adding JWT then you can pass a `function` instead of `object`. The first parameter of it will be the already present headers and second will be redux `state` like so:

> Note: It should return an object otherwise it'll default to original headers

```js
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import interceptor from 'redux-api-middleware-interceptor';

const store = createStore(
  reducer,
  applyMiddleware(
    interceptor({
      headers: (origHeaders, state) => {
        // auth being a reducer
        const headers = Object.assign({}, origHeaders);
        if (state.auth.jwt) {
          headers['Authorization'] = `Bearer ${state.auth.jwt}`;
        }
        return headers;
      }
    ),
    thunk
  )
);
```


There are some Useful functions which you can use when you want to do something like when request fails (e.g showing a `toastr` automatically or logging out User automatically if `statusCode` is 401 :D), when request is success or when request is initiated (e.g showing a Youtube like loader and hiding when request resolves)

## 1.3.2 configObj.getURL(passedUrl: string, state: object): string

Usefull when you don't want to include base URL to all of your http requests. e.g on `production` API url can be different than `development` environment.

> Note: 
>  - If getURL is not defined, then interceptor is not gonna do anything.
>  - Its gonna throw an error if `getURL` is not a function.
>  - It'll only call this function, when `passedUrl` is not complete (e.g `/foo/1`)
>  - It should return a string


```js
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import interceptor from 'redux-api-middleware-interceptor';

const store = createStore(
  reducer,
  applyMiddleware(interceptor({
    getURL: (passedURL, state) => `http://abc.com${passedUrl}`
  }), thunk)
);
```

## 1.3.3 onRequestInit(state: object)

Usefull when you don't want to show a Youtube like loader when a request is initiated.

> Note: 
> - If onRequestInit provided is not a function, it'll throw an Error.

```js
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import interceptor from 'redux-api-middleware-interceptor';

const store = createStore(
  reducer,
  applyMiddleware(interceptor({
    onRequestInit: (state) => {
      // show a loader Loader.show()
   	  console.log('Do something');
    }
  }), thunk)
);
```

### 1.3.4 onRequestSuccess(state: object, response: object)

Usefull when you want to do something when request has a success response. E.g hiding the Youtube like loader.

> Note: 
> - If onRequestSuccess provided is not a function, it'll throw an Error.

```js
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import interceptor from 'redux-api-middleware-interceptor';

const store = createStore(
  reducer,
  applyMiddleware(interceptor({
    onRequestSuccess: (state, response) => {
      // show a loader Loader.hide()
   	  console.log('Do something');
    }
  }), thunk)
);
```

### 1.3.5 onRequestError(state: object, response: object)

Usefull when you want to do something when request has an error response. E.g Logging out of the app if endpoint returns a 401 code.

> Note: 
> - If onRequestSuccess provided is not a function, it'll throw an Error.
> - If the response is not JSON, the library will return the ressult as `raw_res` with `is_json=false`.

```js
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import interceptor from 'redux-api-middleware-interceptor';

const store = createStore(
  reducer,
  applyMiddleware(interceptor({
    onRequestError: (state, response) => {
      // logout the user if 401 response
      if (response.status_code === 401) {
        // logout user
      }
    }
  }), thunk)
);
```

## I Like it

Please share and don't forget to ⭐️ this repo :)

## License

MIT © Hamza Baig
