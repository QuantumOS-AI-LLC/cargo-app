import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Home({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const session = await auth();
  
  const resolvedParams = await searchParams;
  const urlParams = new URLSearchParams();
  for (const [key, value] of Object.entries(resolvedParams)) {
    if (value) urlParams.append(key, String(value));
  }
  const queryString = urlParams.toString() ? `?${urlParams.toString()}` : "";

  if (session) {
    redirect(`/get-coverage${queryString}`);
  } else {
    redirect(`/login${queryString}`);
  }
}
