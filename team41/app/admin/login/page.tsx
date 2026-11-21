import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import PageShell, { CARD, H1, LABEL } from "@/components/page-shell";
import LoginForm from "@/components/admin/login-form";
import { getUser } from "@/lib/auth";
import { say } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";

export const metadata = { title: "Officer login · Follow the Rupee" };

// Already signed in? Go straight to the dashboard.
async function AlreadyIn() {
  await connection();
  if (await getUser()) redirect("/admin");
  return null;
}

// Heading in the visitor's language (?lang= or saved cookie).
async function Heading({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const L = say(await getLang((await searchParams).lang));
  return (
    <>
      <div className={LABEL}>{L("For ward officers and BMC officials", "वार्ड अधिकारियों और BMC अधिकारियों के लिए", "वॉर्ड अधिकारी आणि BMC अधिकाऱ्यांसाठी")}</div>
      <h1 className={`${H1} mt-2`}>{L("Officer login", "अधिकारी लॉगिन", "अधिकारी लॉगिन")}</h1>
    </>
  );
}

export default function LoginPage(props: PageProps<"/admin/login">) {
  return (
    <PageShell>
      <Suspense fallback={null}><AlreadyIn /></Suspense>
      <div className="mx-auto max-w-[440px]">
        <Suspense fallback={<><div className={LABEL}>For ward officers and BMC officials</div><h1 className={`${H1} mt-2`}>Officer login</h1></>}>
          <Heading searchParams={props.searchParams} />
        </Suspense>
        <div className={`${CARD} mt-6`}>
          <LoginForm />
        </div>
      </div>
    </PageShell>
  );
}
