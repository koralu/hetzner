import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import au from "./au";
import ca from "./ca";
import de from "./de";
import es from "./es";
import fr from "./fr";
import it from "./it";
import mx from "./mx";
import nl from "./nl";
import se from "./se";
import uk from "./uk";
import us from "./us";

async function main() {
  // await au();
  // await ca();
  // await de();
  // await es();
  // await fr();
  // await it();
  // await mx();
  // await nl();
  // await se();
  // await uk();
  await us();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
