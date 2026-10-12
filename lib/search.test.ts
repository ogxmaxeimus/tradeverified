import assert from "node:assert/strict";
import { createSeedState } from "./seed";
import { filterJobs, filterProfessionals, paginate } from "./search";

const { professionals, jobs } = createSeedState();

const hvac = filterProfessionals(professionals, { trades: ["HVAC"] });
assert.ok(hvac.length >= 3);
assert.ok(hvac.every((pro) => pro.trade === "HVAC"));
assert.equal(hvac[0]?.featured, true);

const sanDiego = filterProfessionals(professionals, { location: "san diego", sort: "name" });
assert.ok(sanDiego.length > 0);
assert.ok(sanDiego.every((pro) => pro.city === "San Diego"));
const featuredCutoff = sanDiego.findIndex((pro) => !pro.featured);
if (featuredCutoff !== -1) {
  assert.ok(sanDiego.slice(featuredCutoff).every((pro) => !pro.featured));
}

const licensedOnly = filterProfessionals(professionals, { licensed: true });
assert.ok(licensedOnly.every((pro) => pro.licensed));
assert.ok(licensedOnly.length < professionals.length);

const veterans = filterProfessionals(professionals, { minYears: 15, maxYears: 40 });
assert.ok(veterans.every((pro) => pro.years >= 15));

const byName = filterProfessionals(professionals, { q: "nate" });
assert.ok(byName.some((pro) => pro.slug === "marcus-rivera"));

const none = filterProfessionals(professionals, { q: "underwater basket weaving" });
assert.equal(none.length, 0);

const austinJobs = filterJobs(jobs, { location: "Austin", trade: "HVAC" });
assert.equal(austinJobs.length, 1);
assert.equal(austinJobs[0]?.title, "HVAC Install Lead");

const page = paginate(professionals, 2, 8);
assert.equal(page.current, 2);
assert.equal(page.items.length, 8);
assert.ok(page.pages >= 2);

const emptyPage = paginate([], 4, 8);
assert.equal(emptyPage.current, 1);
assert.equal(emptyPage.items.length, 0);

console.log("search tests passed");
