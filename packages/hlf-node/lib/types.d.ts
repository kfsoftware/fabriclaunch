declare module "asn1.js" {
	type DerNode = unknown;
	interface This {
		seq(): {
			obj(int1: DerNode, int2: DerNode): unknown;
		};
		key(param: "p" | "g"): {
			int(): DerNode;
		};
	}
	function define(
		name: string,
		body: (this: This) => void
	): {
		encode(
			body: {
				p: Buffer;
				g: number;
			},
			type: string,
			opts: { label: string }
		);
	};
}
