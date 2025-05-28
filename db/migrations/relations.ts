import { relations } from "drizzle-orm/relations";
import { searches, pois } from "./schema";

export const poisRelations = relations(pois, ({one}) => ({
	search: one(searches, {
		fields: [pois.searchId],
		references: [searches.id]
	}),
}));

export const searchesRelations = relations(searches, ({many}) => ({
	pois: many(pois),
}));