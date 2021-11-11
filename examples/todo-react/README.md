# React Todo MVC example

This example demonstrates how you can use SyncedStore to build a collaborative version of the [Todo MVC](http://todomvc.com) app.

The code that sets up our store is defined in [src/store.ts](src/store.ts). By using the `useReactive` hook, our React components (starting at [src/App.tsx](src/App.tsx)) are easy to read and update automatically.

# Live demo

- [Open live demo](https://sm8tt.csb.app/) (Of course, open multiple times to test multiplayer)
- [Open source on Codesandbox](https://codesandbox.io/s/todo-react-sm8tt)

# Running

    npm install
    npm start

🔥 Make sure to open multiple browsers to see the app syncing automatically.

## Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).
