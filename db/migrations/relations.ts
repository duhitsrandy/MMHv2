import { relations } from "drizzle-orm/relations";
import { searches, pois, searchOrigins } from "./schema";

export const poisRelations = relations(pois, ({one}) => ({
	search: one(searches, {
		fields: [pois.searchId],
		references: [searches.id]
	}),
}));

export const searchesRelations = relations(searches, ({many}) => ({
	pois: many(pois),
	searchOrigins: many(searchOrigins),
}));

export const searchOriginsRelations = relations(searchOrigins, ({one}) => ({
	search: one(searches, {
		fields: [searchOrigins.searchId],
		references: [searches.id]
	}),
}));