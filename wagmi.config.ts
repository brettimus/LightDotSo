import { defineConfig } from "@wagmi/cli";
import { foundry, react } from "@wagmi/cli/plugins";

export default defineConfig({
  out: "packages/wagmi/src/generated.ts",
  plugins: [
    foundry({
      artifacts: "out-wagmi/",
    }),
    react({
      useContractRead: true,
      useContractFunctionRead: true,
    }),
  ],
});
