import assert from "node:assert/strict";
import { moderationDecision, websiteDomain } from "../lib/marketplace-moderation.js";

const product = overrides => ({
  type:"product",title:"Used oak bookshelf",description:"Good condition, clean and ready for collection.",category:"Furniture",
  sellerDisplayName:"Private seller",sellerCountry:"Italy",traderType:"private",sellerDeclaration:true,ownershipDeclaration:true,
  imageUrl:"",...overrides
});
const job = overrides => ({
  type:"job",title:"Customer Support Specialist",description:"Full-time role supporting customers. Applicants never pay a fee to apply.",
  company:"Example Company",companyWebsite:"https://example.com",contactEmail:"careers@example.com",
  salaryText:"€2,000–€2,400 gross per month",...overrides
});

assert.equal(websiteDomain("https://www.example.com/careers"),"example.com");
assert.equal(websiteDomain("http://example.com"),"");
assert.equal(websiteDomain("https://user:pass@example.com"),"");

assert.equal(moderationDecision(product()).action,"auto_approved");
assert.equal(moderationDecision(product({category:"Automotive"})).action,"manual_review");
assert.equal(moderationDecision(product({traderType:"business"})).action,"manual_review");
assert.equal(moderationDecision(product({imageUrl:"https://images.example/item.jpg"})).action,"manual_review");
assert.equal(moderationDecision(product({title:"Handgun for sale"})).action,"auto_rejected");
assert.equal(moderationDecision(product({title:"Fireworks for private use"})).action,"auto_rejected");
assert.equal(moderationDecision(product({title:"Spyware keylogger"})).action,"auto_rejected");
assert.equal(moderationDecision(product({title:"Sex doll"})).action,"auto_rejected");

assert.equal(moderationDecision(job()).action,"auto_approved");
assert.equal(moderationDecision(job({contactEmail:"recruitment@gmail.com"})).action,"manual_review");
assert.equal(moderationDecision(job({description:"Only men may apply for this position."})).action,"manual_review");
assert.equal(moderationDecision(job({salaryText:"Guaranteed $9000 per day"})).action,"manual_review");
assert.equal(moderationDecision(job({description:"Pay a deposit to get this job."})).action,"auto_rejected");
assert.equal(moderationDecision(job({description:"Applicants never pay a fee to apply."})).action,"auto_approved");

console.log("Marketplace moderation policy tests passed (16 checks).");
