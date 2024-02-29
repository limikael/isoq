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
Now, run:
```bash
isoq index.jsx
```
And you will get a file called `isoq-request-handler.js`. The generated file exports a single function which takes a `Request` and turns it into a `Response`. 
We can now easily use e.g. the [Hono](https://hono.dev/) framework to let this file do its job on each request. We can create a file called `server.js` like this:
```js
import isoqRequestHandler from "isoq-request-handler.js";
import {Hono} from 'hono';
import {serve} from '@hono/node-server';

const app=new Hono();
app.get("*",c=>isoqRequestHandler(c.req.raw));

serve(app,(info)=>{
    console.log(`Listening on http://localhost:${info.port}`)
})
```
Run the server with:
```bash
node server.js
```
Btw, you can change the name of the generated file using the `--out` option.
## Command line options
Type `isoq` to see a list of accepted options
```
isoq -- Isomorphic javascript middleware generator.

Positionals:
  entry point  Source file (required).

Options:
  --help          Show help                                            [boolean]
  --version       Show version.                                        [boolean]
  --contentdir    Generate content in this directory. Will require your own
                  middleware to serve the content.
  --splitting     Split code for dynamic client side import. Requires
                  contentdir.                                          [boolean]
  --minify        Minify client assets.                [boolean] [default: true]
  --sourcemap     Generate sourcemaps and show proper files and line numbers on
                  errors. Works only in a Node.js env.[boolean] [default: false]
  --purge-old-js  Remove all .js files from contentdir before building. Beware!
                                                                       [boolean]
  --out           Output filename.          [default: "isoq-request-handler.js"]
  --quiet         Suppress output.
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
* [IsoSuspense](#IsoSuspense)
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
* `iso.redirect(url)` - Redirect to the specified url. When run on the server, this will generate a 302 response. When run on the client, `window.location` will be set.

### Head
```jsx
import {Head} from "isoq";
// ...
<Head>
    /*...*/
</Head>
```
Can be used anywhere in the flow of the page, and will cause the children of the `Head` component to be rendered in the `<head>` element 
of the page.

### IsoSuspense
```jsx
import {IsoSuspense} from "isoq";
function MySuspendingComponent() {
  let barrier=useIsoBarrier();
  // Load data or something... Then call barrier() to unsuspend the component.
}
// ...
<IsoSuspense fallback={/*...*/}>
  <MySuspendingComponent>
</IsoSuspense>
```
A suspense mechanism that works both on the server and client. On the client, the fallback content will be redered while the component is suspended.
### useIsLoading
Returns `true` if there are any unresolved barriers registered using `useIsoBarrier`.
