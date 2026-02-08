import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center gap-2 justify-center text-2xl font-bold">
            <Image
              src="/logo.png"
              alt="AMPLIFY"
              width={500}
              height={396}
              className="w-10 h-auto"
            />
            <span>AMPLIFY</span>
          </CardTitle>
          <CardDescription>Page not found</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or may have been
            moved.
          </p>
          <p className="text-sm text-muted-foreground">
            If you followed a link from an artist, check that the URL is
            correct.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Link href="/directory" className="w-full">
            <Button variant="default" className="w-full">
              Browse Climate Organizations
            </Button>
          </Link>
          <a
            href="https://www.musicdeclares.net/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Visit musicdeclares.net
          </a>
        </CardFooter>
      </Card>
    </div>
  );
}
