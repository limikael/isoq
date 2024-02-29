# isoq
Isoq is a minimalistic framework for isomorphic javascript apps using preact. 

The basic premise is to have one single application entry point that is run both on the server and the client.
The code in this entry point will then be first be run on the server so that rendered HTML is delvered to the client and
to search engines. The code will then be run again on the client, and the DOM tree will be rehydrated. You can see the
execution of the app as being started on the server and do an initial render of the tree. Then, the client will take over
and handler interactivity.
There exists a set of primitives as hooks so that data can flow seamlessly between the server and client, notably [useIsoRef](#useIsoRef)
which makes it possible to create refs on the server that the client later can access.

Isoq is a build tool, and the generated artifact from the build process is a *request handler* to be loaded into
a server framework. This request handler is a function that takes a [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request)
and returns a [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response).

## Getting started

To get started, first create an application entry point, e.g. called `index.jsx`:

```jsx
export default function() {
    return (<>
        <h1>Hello</h1>
        <p>Hello World...</p>
    </>);
}
```

## Examples

Also, see the [examples](https://github.com/limikael/isoq/tree/master/examples). The examples are individual packages, so in order to run them,
clone this repository, cd into an example dir, and run:

```
    yarn install
    yarn start
```

## API

* [useIsoMemo](#useIsoMemo)
* [useIsoRef](#useIsoRef)
* [useIsoBarrier](#useIsoBarrier)
* [useIsoContext](#useIsoContext)
* [Head](#Head)
* [Route](#Route)
* [Link](#Link)
* [useRouteUrl](#useRouteUrl)
* [useLoaderData](#useLoaderData)
* [useIsLoading](#useIsLoading)

### useIsoMemo
```js
import {useIsoMemo} from "isoq";
let value=useIsoMemo(async()=>{/*...*/},deps);
```
Similar to the react function `useMemo` in the sense that it uses a function to compute a value. For components that are part of the initial server side
rendering, the function will be run on the server. If any of the dependencies change, the function will be re-run on the client.

### useIsoRef
```js
import {useIsoRef} from "isoq";
let ref=useIsoRef();
ref.current=/*...*/;
```
Conceptually similar to the `useRef` hook in react. However, the `ref.current` value can be set on the server during server side rendering, 
and the data placed there will be made available on the client side.

### useIsoBarrier
```js
import {useIsoBarrier} from "isoq";
let resolver=useIsoBarrier();
/*...*/
resolver();
```
Creates a [barrier](https://en.wikipedia.org/wiki/Barrier_(computer_science)) during server side rendering. 
The delivery of the page to the client will be blocked until the resolver function is called. This is useful if you want to do
some asyncronous work on the server. The resolver function has no effect on the client.

### useIsoContext
```js
import {useIsoContext} from "isoq";
let iso=useIsoContext();
```
Get a context with information related to the current rendering process. The returned object contains the following methods:

* `iso.isSsr()` - Returns `true` or `false` depending on if the current render is happening on the server or the client.
* `iso.getUrl()` - Get the current url being rendered.

### Head
```jsx
<Head>
    /*...*/
</Head>
```
Can be used anywhere in the flow of the page, and will cause the children of the `Head` component to be rendered in the `<head>` element 
of the page. 
### Route
```jsx
<Route path="/some/path/*" loader={/*...*/}>
    /*...*/
</Route>
```
The child content will be conditionally rendered if the current path matches the specified path. The `loader` property is a function that
should return a promise containing data for the page. This data will be made available to the page via the `useLoaderData` hook.
### Link
```jsx
<Link href="/some/path">my link</Link>
```
Similar to the html `a` tag, but will not cause the page to reload. Instead the browser url will change, and the route will be re-matched.

### useRouteUrl
Similar to `iso.getUrl()` but will also cause a re-render of the component where it is used if the current url changes.

### useLoaderData
Get the current data that has been made available to the current route via its loader function.

### useIsLoading
Returns `true` if data is currently being loaded for a route, `false` otherwise.
