/* eslint-disable @typescript-eslint/no-var-requires, import/no-extraneous-dependencies */
const resolver = require("metro-resolver");
const { mergeConfig } = require("metro-config");
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const expoMetroConfig = getDefaultConfig(__dirname);
const blacklistedModules = ["@react-aria/interactions"];
// const exclusionList = require("metro-config/src/defaults/exclusionList");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const newConfig = {
  watchFolders: [workspaceRoot],
  resolver: {
    disableHierarchicalLookup: true,
    nodeModulesPaths: [
      path.resolve(projectRoot, "node_modules"),
      path.resolve(workspaceRoot, "node_modules"),
    ],
    resolveRequest: (context, realModuleName, platform) => {
      if (blacklistedModules.includes(realModuleName)) {
        return {
          filePath: path.resolve(path.join(__dirname, "/src/shim-module.js")),
          type: "sourceFile",
        };
      }
      const routesRegex = /\.\/routes/;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { resolveRequest, ...restContext } = context;
      const module =
        routesRegex.test(realModuleName) &&
        process.env.REACT_NATIVE_APPLICATION_NAME === "hub-br"
          ? realModuleName.replace(
              routesRegex,
              `./routes.${process.env.REACT_NATIVE_APPLICATION_NAME.slice(-2)}`
            )
          : realModuleName;
      return resolver.resolve(restContext, module, platform);
    },
    sourceExts: ["js", "jsx", "ts", "tsx", "json", "cjs"],
  },
};

module.exports = mergeConfig(expoMetroConfig, newConfig);
