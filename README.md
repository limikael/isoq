# isoq
Isomorphic javascript middleware generator.

Isoq is a tiny framework for isomorphic javascript apps. It tries to do one thing and one thing only and be agnostic about other things.
The basic way it works is by generating a middleware to be included in your app.

The basic premise is to have one single application entry point that is run both on the server and the client.
There exists a set of primitives as hooks so that data can flow seamlessly between the server and client.

## Getting started

To get started, run `npx create-isoq <project name>` or `yarn create isoq <project name>` to create a starter-project.

## API

### useIsoMemo
### useIsoRef
### useIsoBarrier
### useIsoContext
### Route
### Head
