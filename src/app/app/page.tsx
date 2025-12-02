import { Metadata } from "next";

export const metadata: Metadata = {
  title: "App",
  description: "Main application page",
};

export default function AppPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome to the App
          </h1>
          <p className="text-sm text-muted-foreground">
            This is the main application page
          </p>
        </div>
      </div>
    </div>
  );
}
