
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
	overwrite: true,
	// schema: "http://localhost:3000/api/graphql",
	schema: "https://fabriclaunch.com/api/graphql",
	documents: "src/graphql/operations/**/*.graphql",
	generates: {
		"src/graphql/client/": {
			preset: "client",
			plugins: [],
			config: {
				documentMode: "string",
			}
		}
	}
};

export default config;
