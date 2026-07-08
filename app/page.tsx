import { Suspense } from "react";
import App from "@/src/hirevify-app/App";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pickParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function Home({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const screen = pickParam(params.screen);
  const candidateId = pickParam(params.candidateId);
  return (
    <Suspense fallback={null}>
      <App initialScreen={screen} initialCandidateId={candidateId} />
    </Suspense>
  );
}
