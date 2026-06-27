import App from "@/src/hirevify-app/App";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const screen = Array.isArray(params?.screen) ? params?.screen[0] : params?.screen;
  return <App initialScreen={screen} />;
}
