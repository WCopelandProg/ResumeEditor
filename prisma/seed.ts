import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { demoStructuredResume, DEMO_RESUME_NAME, DEMO_TARGET_ROLE } from "../src/lib/resume/demoResume";
import { defaultResumeStyle } from "../src/lib/resume/types";

const prisma = new PrismaClient();

async function main() {
  const email = "dev@example.com";
  const password = "password123";

  const existing = await prisma.user.findUnique({ where: { email } });
  const user =
    existing ??
    (await prisma.user.create({
      data: { email, name: "Dev User", passwordHash: await bcrypt.hash(password, 12) },
    }));

  const hasDemoResume = await prisma.resume.findFirst({ where: { userId: user.id, name: DEMO_RESUME_NAME } });
  if (!hasDemoResume) {
    const style = defaultResumeStyle("modern");
    await prisma.resume.create({
      data: {
        userId: user.id,
        name: DEMO_RESUME_NAME,
        targetRole: DEMO_TARGET_ROLE,
        templateId: "modern",
        content: demoStructuredResume(),
        style: {
          create: {
            templateId: style.templateId,
            fontFamily: style.fontFamily,
            fontSizePt: style.fontSizePt,
            headingScale: style.headingScale,
            lineSpacing: style.lineSpacing,
            marginTopIn: style.marginTopIn,
            marginRightIn: style.marginRightIn,
            marginBottomIn: style.marginBottomIn,
            marginLeftIn: style.marginLeftIn,
            bulletSpacingPt: style.bulletSpacingPt,
            sectionSpacingPt: style.sectionSpacingPt,
            alignment: style.alignment,
            accentColor: style.accentColor,
            showDividers: style.showDividers,
            columns: style.columns,
          },
        },
      },
    });
  }

  console.log(`Seed complete. Sign in with ${email} / ${password}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
