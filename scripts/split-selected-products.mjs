import fs from "node:fs/promises";

const source = JSON.parse(await fs.readFile("data/selected-products.json","utf8"));
const products = Array.isArray(source.products) ? source.products : [];
const BATCH_SIZE = 8;
const BATCH_COUNT = 3;

if (products.length < BATCH_SIZE * BATCH_COUNT) {
  throw new Error("Three SHOP videos require 24 selected products; found " + products.length + ".");
}

await fs.mkdir(".zovaro-shop-batches",{recursive:true});
await fs.mkdir("zovaro-shop-videos",{recursive:true});
const captions=[];
for (let index=0; index<BATCH_COUNT; index++) {
  const batch = products.slice(index*BATCH_SIZE,(index+1)*BATCH_SIZE);
  if (batch.length !== BATCH_SIZE) throw new Error("Incomplete SHOP product batch " + (index+1));
  await fs.writeFile(".zovaro-shop-batches/products-"+(index+1)+".json",JSON.stringify({products:batch},null,2)+"\n","utf8");
  const titles=batch.map(product=>product.englishTitle||product.title||"Product discovery").slice(0,3);
  captions.push({
    video:"tiktok-video-"+(index+1)+".mp4",
    caption:"Discover these product finds on ZOVARO: "+titles.join(" | ")+". Explore more details at https://zovaro.vercel.app/ #ZOVARO #Shopping #ProductDiscovery",
    products:batch.map(product=>({title:product.englishTitle||product.title||"Product",advertiser:product.advertiserName||product.advertiser||"Retailer"}))
  });
  console.log("Prepared SHOP video batch "+(index+1)+": "+batch.length+" unique products.");
}
await fs.writeFile("zovaro-shop-videos/captions.json",JSON.stringify({createdAt:new Date().toISOString(),videos:captions},null,2)+"\n","utf8");
