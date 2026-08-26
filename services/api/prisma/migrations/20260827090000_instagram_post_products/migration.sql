-- Link Instagram/community posts to one or more products.
CREATE TABLE "_InstagramPostProducts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX "_InstagramPostProducts_AB_unique" ON "_InstagramPostProducts"("A", "B");
CREATE INDEX "_InstagramPostProducts_B_index" ON "_InstagramPostProducts"("B");

ALTER TABLE "_InstagramPostProducts" ADD CONSTRAINT "_InstagramPostProducts_A_fkey" FOREIGN KEY ("A") REFERENCES "InstagramPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_InstagramPostProducts" ADD CONSTRAINT "_InstagramPostProducts_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
