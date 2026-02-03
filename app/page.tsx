import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
        AMPLIFY Router
      </h1>
      <p className="text-lg text-center max-w-xl mb-10 leading-relaxed">
        Climate action routing service for musical artists. Routes fans to
        vetted grassroots organizations based on tour context and location.
      </p>

      <Link
        href="/admin/login"
        className="inline-block px-3 py-2 bg-mde-yellow text-mde-body text-2xl uppercase tracking-wide shadow-[8px_8px_0_#000] transition-all duration-250 ease-out hover:shadow-[8px_8px_0_#000] active:shadow-[4px_4px_0_#000] active:translate-x-1 active:translate-y-1"
      >
        Admin Login
      </Link>

      <p className="mt-16 text-sm text-muted-foreground">
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
      </p>
    </main>
  );
}
