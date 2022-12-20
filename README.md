# Expo Yarn Workspaces Minimal Reproduction

This repo creates a minimal reproduction of a problem we're having with building the native version of our Expo application, after an Expo 45 upgrade.

Our yarn workspaces v1 monorepo contains:

- multiple Expo applications
- multiple front-end packages
- multiple back-end micro services

This repo was created via:
`npx create-react-native-app --template with-yarn-workspaces`

Which is built from this template:
https://github.com/expo/examples/tree/master/with-yarn-workspaces

We downgraded the app in the `apps/mobile` folder to use Expo 45 since that's the version we're currently on.

## How to use this Repo

_Since there are possibly multiple layers to the problem, we'll keep this section of the README up-to-date with the most current problem._

### Current State

Since the problem seems related to metro configuration, we modified this repo's metro configuration to be closer to what we have within our monorepo.

The first step is setting the following property, [per the recommended setup](https://docs.expo.dev/guides/monorepos/):

```
config.resolver.disableHierarchicalLookup = true;
```

Next, we added two packages with conflicting transitive dependences:

- `apollo-server-testing@2.25.3` in `packages/expo-custom`
- `@apollo/client@3.6.4` in `apps/mobile`

This causes the following error upon build:

```
error Unable to resolve module ts-invariant/process from /monorepo-build-debug/node_modules/@apollo/client/utilities/globals/globals.cjs.native.js: ts-invariant/process could not be found within the project or in these directories:
  node_modules
  ../../node_modules

Error: Unable to resolve module ts-invariant/process from /monorepo-build-debug/node_modules/@apollo/client/utilities/globals/globals.cjs.native.js: ts-invariant/process could not be found within the project or in these directories:
  4 |
  node_modules
  5 | var tsInvariant = require('ts-invariant');
  ../../node_modules
> 6 | var process$1 = require('ts-invariant/process');
    |                          ^
  4 |
  7 | var graphql = require('graphql');
  8 |
  9 | function maybe(thunk) {.
  5 | var tsInvariant = require('ts-invariant');
> 6 | var process$1 = require('ts-invariant/process');
    |                          ^
  7 | var graphql = require('graphql');
```

### How to Reproduce

1. install depedencies via `yarn`
2. create builds of each package via `yarn workspaces run build`
3. build and run the Android app via `expo run:android --variant release`
4. note that it fails with the error noted above
5. remove/uncomment `config.resolver.disableHierarchicalLookup = true;` in `apps/mobile/metro.config.js`
6. build and run the Android app via `expo run:android --variant release`
7. note that it succeeds

## Problem

Some back-end and front-end packages share transitive dependencies, but of different version numbers. While debugging, we were noticing that some transitive dependencies were resolving to the incorrect package versions.

### Example

We've had multiple packages with similar issues, but below is one including `ts-invariant`.

`ts-invariant` is a dependency of both `apollo-server-testing`, used within a back-end micro service setup as a package in yarn workspaces, and `@apollo-client`, used within a front-end package.

Output of `yarn why ts-invariant` showing different version numbers:

```
Found "ts-invariant@0.4.4"
  info Has been hoisted to "ts-invariant"
  info Reasons this module exists
    - "workspace-aggregator-284b876a-59b2-4fd6-aff3-6d11ef55213d" depends on it
    - Hoisted from "_project_#@some-package-scope#some-back-end-package#apollo-server-testing#apollo-server-core#graphql-tools#apollo-link#ts-invariant"
    - Hoisted from "_project_#@some-package-scope#some-back-end-package#apollo-server-testing#apollo-server-core#graphql-tools#apollo-utilities#ts-invariant"
  info Disk size without dependencies: "144KB"
  info Disk size with unique dependencies: "232KB"
  info Disk size with transitive dependencies: "232KB"
  info Number of shared dependencies: 1
  => Found "@apollo/client#ts-invariant@0.10.3"
  info This module exists because "_project_#@some-package-scope#some-front-end-package#@apollo#client" depends on it.
  info Disk size without dependencies: "80KB"
  info Disk size with unique dependencies: "168KB"
  info Disk size with transitive dependencies: "168KB"
  info Number of shared dependencies: 1
```

Our hunch with transitive dependencies is based on this similar issue logged in the metro repository:
https://github.com/facebook/metro/issues/737

We did confirm we should have the [version of metro that includes a fix for this issue](https://github.com/facebook/metro/commit/9bbe219809c2bdfdb949e825817e2522e099ff9f), v0.67.0

output of `yarn why metro`:

```
=> Found "metro@0.67.0"
info Has been hoisted to "metro"
info Reasons this module exists
   - "workspace-aggregator-32fb1799-f438-49ae-8fc2-f9e3021fe501" depends on it
   - Hoisted from "_project_#metro#metro-config#metro"
   - Hoisted from "_project_#metro#metro-transform-worker#metro"
   - Hoisted from "_project_#@some-package-scope#some-monorepo-app#react-native#@react-native-community#cli#@react-native-community#cli-plugin-metro#metro"
   - Hoisted from "_project_#@some-package-scope#some-monorepo-app#react-native#@react-native-community#cli#@react-native-community#cli-plugin-metro#metro-config#metro"
info Disk size without dependencies: "5.25MB"
info Disk size with unique dependencies: "33.33MB"
info Disk size with transitive dependencies: "74.79MB"
info Number of shared dependencies: 291
=> Found "metro-config#metro@0.71.3"
info Reasons this module exists
   - "_project_#metro-config" depends on it
   - Hoisted from "_project_#metro-config#metro#metro-transform-worker#metro"
info Disk size without dependencies: "1.46MB"
info Disk size with unique dependencies: "30.3MB"
info Disk size with transitive dependencies: "72.36MB"
info Number of shared dependencies: 294
✨  Done in 3.61s.
```
