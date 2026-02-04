import { Metadata } from "next";
import Image from "next/image";
import { supabaseAdmin } from "@/app/lib/supabase";
import { KitClientSection } from "./kit-client-section";

function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

async function getArtist(handle: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = (await (supabaseAdmin.from("router_artists") as any)
    .select("id, handle, name, enabled")
    .eq("handle", handle)
    .eq("enabled", true)
    .single()) as {
    data: { id: string; handle: string; name: string; enabled: boolean } | null;
  };
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const artist = await getArtist(handle);

  if (!artist) {
    return { title: "AMPLIFY Starter Kit" };
  }

  return {
    title: `${artist.name} | AMPLIFY Starter Kit`,
    description: `${artist.name}'s AMPLIFY link — directing fans to climate action.`,
  };
}

export default async function KitPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const artist = await getArtist(handle);

  if (!artist) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-8">
        <Image
          src="/logo.png"
          alt="AMPLIFY"
          width={500}
          height={396}
          className="w-20 h-auto mb-4"
        />
        <p className="text-sm text-muted-foreground mb-8">Starter Kit</p>

        <h1 className="text-2xl font-bold mb-4">Page not found</h1>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          We couldn&apos;t find a page for this link. If you received it from
          Music Declares Emergency, please check the details with them.
        </p>
        <a
          href="https://www.musicdeclares.net/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground text-muted-foreground"
        >
          Visit musicdeclares.net
        </a>
      </main>
    );
  }

  const amplifyUrl = `${getSiteUrl()}/a/${artist.handle}`;

  return (
    <main className="flex min-h-screen flex-col items-center p-6 sm:p-8 print:p-0 print:min-h-0">
      <div className="w-full max-w-2xl space-y-10 print:space-y-4">
        {/* Header */}
        <div className="flex flex-col items-center text-center pt-8 print:pt-2">
          <Image
            src="/logo.png"
            alt="AMPLIFY"
            width={500}
            height={396}
            className="w-20 h-auto mb-4 print:w-12 print:mb-2"
          />
          <p className="text-sm text-muted-foreground mb-6 print:mb-2">
            Starter Kit
          </p>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2 print:text-2xl print:mb-1">
            {artist.name}&apos;s AMPLIFY Link
          </h1>
          <p className="text-muted-foreground max-w-lg print:text-sm">
            A single link that directs fans to vetted climate action
            organizations, wherever they are.
          </p>
        </div>

        {/* Interactive section: link + QR */}
        <KitClientSection
          amplifyUrl={amplifyUrl}
          artistHandle={artist.handle}
          artistName={artist.name}
        />

        {/* Where to use it */}
        <section className="space-y-4 print:space-y-2">
          <h2 className="text-xl font-semibold print:text-base">
            Where to use it
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 print:gap-1.5 print:grid-cols-2">
            {[
              {
                title: "Social bios",
                description:
                  "Add the link to Instagram, TikTok, Linktree, or any bio page.",
              },
              {
                title: "Stage visuals",
                description:
                  "Display the QR code on screens during shows so fans can scan it live.",
              },
              {
                title: "Posters, flyers, and merch",
                description:
                  "Print the QR code on physical materials. It scans reliably at any size.",
              },
              {
                title: "Email newsletters",
                description:
                  "Include the link in fan newsletters and mailing list updates.",
              },
              {
                title: "Social media posts",
                description:
                  "Share the link directly in posts, stories, or video descriptions.",
              },
            ].map((item) => (
              <li
                key={item.title}
                className="border rounded-lg p-4 space-y-1 print:p-2 print:space-y-0"
              >
                <p className="font-medium print:text-sm">{item.title}</p>
                <p className="text-sm text-muted-foreground print:text-xs">
                  {item.description}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* How it works */}
        <section className="space-y-4 print:space-y-1">
          <h2 className="text-xl font-semibold print:text-base">
            How it works
          </h2>
          <p className="text-muted-foreground leading-relaxed print:text-xs print:leading-normal">
            When fans visit this link, they&apos;re directed to a vetted,
            grassroots climate action organization based on their location and{" "}
            {artist.name}&apos;s current tour schedule. The link is evergreen:
            it never breaks, even between tours. Outside of tour dates, fans are
            shown a general AMPLIFY page.
          </p>
        </section>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground pb-8 print:pb-0 print:text-xs">
          Part of the{" "}
          <a
            href="https://www.musicdeclares.net/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Music Declares Emergency
          </a>{" "}
          initiative
        </footer>
      </div>
    </main>
  );
}
